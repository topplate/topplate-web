const
  nodemailer = require('nodemailer'),
  passport = require('passport'),
  fs = require('fs'),
  jimp = require('jimp'),
  Q = require('q'),
  isBuffer = require('is-buffer'),
  formidable = require('formidable'),
  CONSTANTS = require('../app-constants.json'),
  ROUTES = CONSTANTS.REST_API,
  ENVIRONMENTS = {
    RESTAURANT: 'restaurant',
    HOMEMADE: 'homemade'
  },
  GOOGLE_CREDENTIALS = {
    client_id: process.env.GOOGLE_CLIENT_ID || '857812607855-qs3ds1rbi7jsrb6m4evkd6d8dl00n9mq.apps.googleusercontent.com',
    client_secret: process.env.GOOGLE_CLIENT_SECRET || 'Ugju5m1c-y3-kh2Vo6xd-EQA'
  },
  FACEBOOK_CREDENTIALS = {
    client_id: process.env.FACEBOOK_CLIENT_ID || '159048741451095',
    client_secret: process.env.FACEBOOK_CLIENT_SECRET || '2af7d49ec942ba7f7d85c52b0c5c0a63'
  };

module.exports.refreshRoutes = refreshRoutes;

module.exports.getFacebookCredentials = getFacebookCredentials;

module.exports.getGoogleCredentials = getGoogleCredentials;

function refreshRoutes () {

  const
    app = global.getApp(),
    dbModule = global.dbModule;

  app.get('/test-api', (req, res) => {
    // console.log(req.query);
    res.send({'GET': 'passed'});
  });

  app.post('/test-api', (req, res) => {
    console.log(req.headers);
    res.send(req.body || {'POST': 'passed'});
  });

  /** Authorization */
  app.get('/get-auth-credentials', (req, res) => {
    res.send({
      GP: GOOGLE_CREDENTIALS.client_id,
      FB: FACEBOOK_CREDENTIALS.client_id
    });
  });

  app.get('/get-user-profile', (req, res) => {

    let query = req.query;

    global.dbModule.getUser({_id: query.id})
      .then(user => res.send(user.getNormalized()))
      .catch(err => sendError(res, err));
  });

  app.post('/login_local', (req, res) => {

    let
      reqBody = req.body,
      email = reqBody.email,
      password = reqBody.password;




  });

  app.post('/login_google', (req, res) => signIn(req, res, 'google'));

  app.post('/login_facebook', (req, res) => signIn(req, res, 'facebook'));

  app.get('/login_fail', (req, res) => {
    res.status(500).send({'message': 'login failed'});
  });

  app.get('/google_auth_callback', passport.authenticate('google', { failureRedirect: '/login_fail' }), (req, res) => {
    res.send({'message': 'logged in google'});
  });

  app.get('/facebook_auth_callback', passport.authenticate('facebook', { failureRedirect: '/login_fail' }), (req, res) => {
    res.send({'message': 'logged in facebook'});
  });

  app.post('/logout', (req, res) => {

    let
      authToken = req.headers['access-token'],
      user = global.authModule.getAuthorizedUser(authToken);

    global.authModule.clearAuthToken(user && user.email, authToken);
    console.log('logged out');

    res.send({message: 'logged out'});
  });

  app.get('/get_authorized_users', (req, res) => {
    res.send(global.authModule.getAuthorizedUsers());
  });


  /** Misc */
  app.get('/get_environments', (req, res) => {

    let
      env = {},
      dbModule = global.dbModule;

    env[ENVIRONMENTS.RESTAURANT] = {
      name: ENVIRONMENTS.RESTAURANT,
      image: 'assets/restaurant-bg.jpg',
      numberOfPlates: 0
    };

    env[ENVIRONMENTS.HOMEMADE] = {
      name: ENVIRONMENTS.HOMEMADE,
      image: 'assets/homemade-new-bg.jpg',
      numberOfPlates: 0
    };

    dbModule.getPlatesByEnvironments()
      .then(platesInfo => {
        env[ENVIRONMENTS.RESTAURANT].numberOfPlates = platesInfo[ENVIRONMENTS.RESTAURANT];
        env[ENVIRONMENTS.HOMEMADE].numberOfPlates = platesInfo[ENVIRONMENTS.HOMEMADE];
        res.send(env);
      })
      .catch(err => sendError(res, err));
  });

  app.get('/get_banner', (req, res) => {
    res.send({
      icon: 'assets/icons/prize-banner.png',
      text: `
        <span>this week's prize is </span>
        <b style="color: #f6d44c">$100</b>
        <span>amazon gift card!</span>
      `
    });
  });

  app.get('/get_charity_choice_banners', (req, res) => {
    global.dbModule.getCharityItems()
      .then(items => res.send(items))
      .catch(err => sendError(res, err));
  });

  app.post('/vote_for_charity', (req, res) => checkAuthorization(req)
    .then(user => {
      global.dbModule.voteForCharityItem(user._id, req.body.id)
        .then(voteRes => res.send(voteRes))
        .catch(err => sendError(err, res))
    })
    .catch(err => sendError(err, res))
  );

  app.get('/get_advertising_banners', (req, res) => {


  });

  app.get('/get_contacts', (req, res) => global.dbModule.getContactsData()
    .then(contactsData => res.send(contactsData))
    .catch(err => sendError(err, res))
  );

  /** Plates */
  app.post('/add_plate_form', (req, res) => {

    let
      registeredUser,
      image,
      fields,
      form;

    checkAuthorization(req)
      .then(user => {
        registeredUser = user;
        getFormData(req)
          .then(formData => {
            image = formData.files && formData.files.image;
            fields = formData.fields;
            form = {};
            if (!image) sendError(res, {message: 'image should be an ImageFile, BinaryString or Buffer'});
            else if (typeof fields !== 'object') sendError(res, {message: 'bad form data'});
            else {
              Object.keys(fields).forEach(key => form[key] = fields[key]);
              if (isBuffer(image)) addPlate(image);
              else fs.readFile(image.path, (err, result) => {
                if (err) sendError(res, err);
                else addPlate(result);
              });
            }
          })
          .catch(err => sendError(res, err));
      })
      .catch(err => sendError(res, err));

    function addPlate (bufferedImage) {
      form['image'] = bufferedImage;
      dbModule.createPlate(form, registeredUser._id)
        .then(creationRes => res.send(creationRes))
        .catch(err => sendError(res, err));
    }
  });

  app.post('/add_plate', (req, res) => checkAuthorization(req)
    .then(user => dbModule.createPlate(req.body, user._id)
      .then(creationRes => res.send(creationRes))
      .catch(err => sendError(res, err)))
    .catch(err => sendError(res, err))
  );

  app.get('/get_plate', (req, res) => {
    let
      query = req.query,
      dbModule = global.dbModule;

    dbModule.getPlate(query.id, query.lim)
      .then(dbResponse => res.send(dbResponse))
      .catch(err => sendError(res, err));
  });

  app.get('/get_plates', (req, res) => {
    let
      query = req.query,
      dbModule = global.dbModule,
      env = query.environment || 'restaurant',
      lastId = query.lastId,
      skip = parseInt(query.skip),
      lim = parseInt(query.lim);

    dbModule.getPlates(env, lastId, isNaN(lim) ? 11 : lim, query.size)
      .then(plates => res.send(plates))
      .catch(err => sendError(res, err));
  });

  app.post('/like_plate', (req, res) => checkAuthorization(req)
    .then(user => user.likePlate(req.body.plate)
      .then(updateRes => res.send(updateRes))
      .catch(err => sendError(res, err)))
    .catch(err => sendError(res, err))
  );

  app.get('/get_plates_by_author', (req, res) => {

    let
      query = req.query,
      userId = query.id,
      env = query.environment,
      skip = parseInt(query.skip),
      lim = parseInt(query.lim);

    dbModule.getPlatesByAuthor(userId, env, isNaN(skip) ? 0 : skip, isNaN(lim) ? 11 : lim, query.size)
      .then(plates => res.send(plates))
      .catch(err => sendError(res, err));
  });

  app.post('/edit_plate', (req, res) => {
    let
      reqBody = req.body,
      authToken = req.headers['access-token'],
      user = global.authModule.getAuthorizedUser(authToken);

    if (!user) sendError(res, {status: 401, message: 'Not authorized'});
    else global.dbModule
      .updatePlate(user._id, reqBody.plateId, reqBody.fields || {})
      .then(updateResult => res.send(updateResult))
      .catch(err => sendError(res, err));
  });

  app.get('/search_plates', (req, res) => {

    let
      query = req.query,
      term = (typeof query.term === 'string' && query.term.length && query.term) || null;

    global.dbModule.searchPlates('name', term, query.env)
      .then(searchRes => {res.send(searchRes)})
      .catch(err => sendError(res, err));
  });

  app.get('/get_winners', (req, res) => {
    let env = req.query.environment;
    global.dbModule.getWinners(env)
      .then(winners => res.send(winners))
      .catch(err => sendError(res,err))
    }
  );

  app.get('*', (req, res) => {
    console.log('redirect to index page');
    res.redirect('/');
  });
}

function checkAuthorization (req) {
  let
    deferred = Q.defer(),
    authToken = req.headers['access-token'],
    user = global.authModule.getAuthorizedUser(authToken);

  if (!user) deferred.reject({status: 401, message: 'Not authorized'});
  else deferred.resolve(user);

  return deferred.promise;
}

function sendError (res, err) {
  console.log(err);
  return res.status(err.status || 500).send(err);
}

function signIn (req, res, provider) {

  let
    userData = req.body,
    token = userData.token,
    dbModule = global.dbModule,
    authModule = global.authModule;

  userData.provider = provider;

  dbModule.getUser({email: userData.email})
    .then(user => {
      if (!user) dbModule.createUser(userData)
        .then(resMessage => {
          dbModule.getUser({email: userData.email})
            .then(newUser => newUser.login(userData)
              .then(loginRes => {
                authModule.saveAuthToken(newUser, token);
                res.send(loginRes);
              }).catch(err => sendError(res, err))
            ).catch(err => sendError(res, err));
        }).catch(err => {
          sendError(res, err)
        });
      else user.login(userData)
        .then(loginRes => {
          authModule.saveAuthToken(user, token);
          res.send(loginRes)
        })
        .catch(err => sendError(res, err));
    })
    .catch(err => sendError(res, err));
}

function getFacebookCredentials () {
  return FACEBOOK_CREDENTIALS;
}

function getGoogleCredentials () {
  return GOOGLE_CREDENTIALS;
}

function getFormData (req) {

  let
    deferred = Q.defer(),
    form = new formidable.IncomingForm();

  form.once('error', err => deferred.reject(err));
  form.parse(req, (err, fields, files) => {
    if (err) deferred.reject(err);
    else deferred.resolve({
      fields: fields,
      files: files
    });
  });

  return deferred.promise;
}

