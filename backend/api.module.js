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
      // password = reqBody.password,
      userModel = global.dbModule.getModels().User,
      authModule = global.authModule;

    userModel.findOne({email: email})
      .then(user => {
        if (!user) sendError(res, {message: 'wrong email or password!', status: 401});
        else authModule.comparePasswords(reqBody.password, user.local.hashedPassword)
          .then(checkResult => {
            if (checkResult) {
              authModule.getLocalToken()
                .then(localToken => user.login({
                  email: email,
                  token: localToken,
                  provider: 'local'
                })
                  .then(loginRes => {
                    authModule.saveAuthToken(user, localToken);
                    res.send(loginRes);
                  })
                  .catch(err => sendError(res, err))
                )
                .catch(err => sendError(res, err));
            }
            else sendError(res, {message: 'wrong email or password!', status: 401});
          })
          .catch(err => sendError(res, err));
      })
      .catch(err => sendError(res, err));
  });

  app.post('/create_local_user', (req, res) => {

    let
      contentType = req.headers['content-type'],
      reqBody = req.body,
      userModel = global.dbModule.getModels().User,
      authModule = global.authModule,
      isForm = /^multipart\/form-data/.test(contentType),
      firstName, lastName, email, image, password, imageContentType, token;

    prepareUserData()
      .then(message => userModel.findOne({email: email})
        .then(user => user ? updateExistingUser(user) : createNewUser())
        .catch(err => sendError(res, err))
      )
      .catch(err => sendError(res, err));

    function prepareUserData () {
      let deferred = Q.defer();

      if (isForm) getFormData(req)
        .then(formData => {
          firstName = formData.fields.firstName;
          lastName = formData.fields.lastName;
          email = formData.fields.email;
          password = formData.fields.password;
          imageContentType = formData.fields.contentType;
          image = formData.files.image.path;

          deferred.resolve({message: 'user data prepared'});
        })
        .catch(err => deferred.reject(err));
      else {
        firstName = reqBody.firstName;
        lastName = reqBody.lastName;
        email = reqBody.email;
        password = reqBody.password;
        imageContentType = reqBody.contentType;
        image = isBuffer(reqBody.image) ? reqBody.image : new Buffer(reqBody.image, 'binary');

        deferred.resolve({message: 'user data prepared'});
      }
      return deferred.promise;
    }

    function saveImage () {
      let
        deferred = Q.defer(),
        rootDir = './src/uploaded',
        imageName = 'avatar' + (new Date()).getTime() + '.' + global.dbModule.getFileExtension(imageContentType);

      if (!fs.existsSync(rootDir)) fs.mkdirSync(rootDir);

      jimp.read(image)
        .then(jimpFile => jimpFile.write(rootDir + '/' + imageName, (err) => {
          if (err) deferred.reject(err);
          else deferred.resolve(imageName);
        }));

      return deferred.promise;
    }

    function createNewUser () {
      authModule.getHashedPassword(password)
        .then(hashedPassword => authModule.getLocalToken()
          .then(localToken => saveImage()
            .then(imageSource => {
              global.dbModule.createUser({
                name: name,
                email: email,
                image: imageSource,
                token: localToken,
                password: hashedPassword,
                provider: 'local'
              })
                .then(() => userModel.findOne({email: email})
                  .then(newUser => newUser.login({
                    name: name,
                    email: email,
                    image: imageSource,
                    token: localToken,
                    hashedPassword: hashedPassword,
                    provider: 'local',
                  })
                    .then(loginRes => {
                      authModule.saveAuthToken(newUser, localToken);
                      res.send(loginRes);
                    })
                    .catch(err => sendError(res, err))
                  )
                  .catch(err => sendError(res,err))
                )
                .catch(err => sendError(res,err))
            })
            .catch(err => sendError(res,err))
          )
          .catch(err => sendError(res,err))
        )
        .catch(err => sendError(res,err));
    }

    function updateExistingUser (user) {

      if (user.local && user.local.hashedPassword) sendError(res, {
        message: 'User with same email already registered',
        status: 409
      });

      else authModule.getHashedPassword(password)
        .then(hashedPassword => authModule.getLocalToken()
          .then(localToken => saveImage()
            .then(imageSource => {
              user['local'] = user.local || {};
              user.local.firstName = firstName;
              user.local.lastName = lastName;
              user.local.image = imageSource;
              user.local.hashedPassword = hashedPassword;

              user.save(err => {
                if (err) sendError(res, err);
                else user.login({
                  firstName: firstName,
                  lastName: lastName,
                  email: email,
                  token: localToken,
                  hashedPassword: hashedPassword,
                  provider: 'local',
                })
                  .then(loginRes => {
                    authModule.saveAuthToken(user, localToken);
                    res.send(loginRes);
                  })
                  .catch(err => sendError(res, err));
              });
            })
            .catch(err => sendError(err))
          )
          .catch(err => sendError(res, err))
        )
        .catch(err => sendError(res, err));
    }
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
    let authToken = req.headers['access-token'];

    global.authModule.clearAuthToken(null, authToken);
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
    let
      asHtml = req.query['asHtml'] === 'true',
      resp = {icon: 'assets/icons/prize-banner.png',};

    if (asHtml) resp['html'] = `
        <span>this week's prize is </span>
        <b style="color: #f6d44c">$100</b>
        <span>amazon gift card!</span>
      `;

    else resp['text'] = `this week's prize is <%(use_color:#f6d44c)$100%> amazon gift card!`;

    res.send(resp);
  });

  app.get('/get_charity_choice_banners', (req, res) => {
    checkAuthorization(req, true)
      .then(user => {
        let userCharityVotes = {};
        user.charityVotes.forEach(charityId => userCharityVotes[charityId] = true);
        getCharityChoiceBanners(userCharityVotes);
      })
      .catch(err => {
        if (err.status === 401) getCharityChoiceBanners();
        else sendError(res, err);
      });

    function getCharityChoiceBanners (userCharityVotes = {}) {
      global.dbModule.getCharityItems()
        .then(items => {
          items.forEach(item => item['voted'] = userCharityVotes[item._id] || false);
          res.send(items);
        })
        .catch(err => sendError(res, err));
    }
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
    checkAuthorization(req, true)
      .then(user => getPlate(user.getLikedPlates()))
      .catch(err => err.status === 401 ? getPlate() : sendError(res, err));

    function getPlate (likedPlates = {}) {
      let
        query = req.query,
        dbModule = global.dbModule;

      dbModule.getPlate(query.id, query.lim)
        .then(plate => {
          plate.liked = likedPlates[plate._id] || false;
          plate.relatedPlates.forEach(relatedPlate => relatedPlate['liked'] = likedPlates[plate._id] || false);
          res.send(plate);
        })
        .catch(err => sendError(res, err));
    }
  });

  app.get('/get_plates', (req, res) => {
    checkAuthorization(req, true)
      .then(user => getPlates(user.getLikedPlates()))
      .catch(err => err.status === 401 ? getPlates() : sendError(res, err));

    function getPlates (likedPlates = {}) {
      let
        query = req.query,
        dbModule = global.dbModule,
        env = query.environment || 'restaurant',
        lastId = query.lastId,
        lim = +query.lim;

      dbModule.getPlates(env, lastId, isNaN(lim) ? 11 : lim, query.size)
        .then(plates => {
          plates.forEach(plate => {
            plate.liked = likedPlates[plate._id] || false;
          });
          res.send(plates);
        })
        .catch(err => sendError(res, err));
    }
  });

  app.post('/like_plate', (req, res) => checkAuthorization(req)
    .then(user => user.likePlate(req.body.plate)
      .then(updateRes => res.send(updateRes))
      .catch(err => sendError(res, err)))
    .catch(err => sendError(res, err))
  );

  app.get('/get_plates_by_author', (req, res) => {
    checkAuthorization(req, true)
      .then(user => getPlatesByAuthor(user.getLikedPlates()))
      .catch(err => err.status === 401 ? getPlatesByAuthor() : sendError(res, err));

    function getPlatesByAuthor (likedPlates = {}) {
      let
        query = req.query,
        userId = query.id,
        env = query.environment,
        skip = +query.skip,
        lim = +query.lim;

      dbModule.getPlatesByAuthor(userId, env, isNaN(skip) ? 0 : skip, isNaN(lim) ? 11 : lim, query.size)
        .then(plates => {
          plates.forEach(plate => plate.liked = likedPlates[plate._id] || false);
          res.send(plates);
        })
        .catch(err => sendError(res, err));
    }
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
    checkAuthorization(req, true)
      .then(user => searchPlates(user.getLikedPlates()))
      .catch(err => err.status === 401 ? searchPlates() : sendError(res, err));

    function searchPlates (likedPlates = {}) {
      let
        query = req.query,
        term = (typeof query.searchString === 'string' && query.searchString.length && query.searchString) || null;

      global.dbModule.searchPlates('name', term, query.environment)
        .then(plates => {
          plates.forEach(plate => plate.liked = likedPlates[plate._id] || false);
          res.send(plates);
        })
        .catch(err => sendError(res, err));
    }
  });

  app.get('/get_liked_plates', (req, res) => {
    let
      authToken = req.headers['access-token'],
      user = global.authModule.getAuthorizedUser(authToken);

    if (!user) res.send({});
    else global.dbModule.getLikedPlates(user._id)
      .then(plates => res.send(plates))
      .catch(err => sendError(res, err));
  });

  app.get('/get_winners', (req, res) => {
    let env = req.query.environment;
    global.dbModule.getWinners(env)
      .then(winners => res.send(winners))
      .catch(err => sendError(res,err))
    });

  app.post('/create_request', (req, res) => {
    global.dbModule.createRequest(req.body)
      .then(message => res.send(message))
      .catch(err => sendError(res, err));
  });

  /** Admin */
  app.post('/sign_in_admin', (req, res) => {
    let reqBody = req.body;
    global.authModule.authorizeAsAdmin(reqBody.login, reqBody.password)
      .then(authMessage => res.send(authMessage))
      .catch(err => sendError(res, err));
  });

  app.get('/check_admin_authorization', (req, res) => checkAdminAuthorization(req)
    .then(successResult => res.send(successResult))
    .catch(err => sendError(res, err))
  );

  app.get('/get_users_requests', (req, res) => checkAdminAuthorization(req)
    .then(() => global.dbModule.getUserRequests(req.query.filter)
      .then(usersRequests => res.send(usersRequests))
      .catch(err => sendError(res, err))
    )
    .catch(err => sendError(res, err))
  );

  app.get('/get_users', (req, res) => checkAuthorization(req)
    .then(() => global.dbModule.getUsers(req.query.filter)
      .then(users => res.send(users))
      .catch(err => sendError(res, err))
    )
    .catch(err => sendError(res, err))
  );

  /** Default redirect */
  app.get('*', (req, res) => {
    console.log('redirect to index page');
    res.redirect('/');
  });
}

function checkAuthorization (req, reload = false) {
  let
    deferred = Q.defer(),
    authToken = req.headers['access-token'],
    user = global.authModule.getAuthorizedUser(authToken);

  if (!user) deferred.reject({status: 401, message: 'Not authorized'});
  else reload ? global.dbModule.getModels().User.findOne({_id: user._id})
    .then(reloadedUser => deferred.resolve(reloadedUser))
    .catch(err => deferred.reject(err)):  deferred.resolve(user);

  return deferred.promise;
}

function checkAdminAuthorization (req) {
  let
    deferred = Q.defer(),
    reqHeaders = req.headers;

  global.authModule.checkAdminAuthorization(reqHeaders['admin-access-token'])
    .then(successResult => deferred.resolve(successResult))
    .catch(err => deferred.reject(err));

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

function saveUserAvatar (image) {
  let deferred = Q.defer();


}

