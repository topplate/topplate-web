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
    checkAuthorization(req, true)
      .then(user => getUserProfile(user._id.toString() === req.query.id))
      .catch(err => {
        if (err.status === 401) getUserProfile(false);
        else sendError(res, err);
      });

    function getUserProfile (selfProfile) {
      let query = req.query;
      global.dbModule.getUser({_id: query.id})
        .then(user => {
          let normalizedData = user.getNormalized();
          if (selfProfile) normalizedData['token'] = user.currentToken;
          res.send(normalizedData);
        })
        .catch(err => sendError(res, err));
    }
  });

  app.post('/login_local', (req, res) => {

    let
      reqBody = req.body,
      email = reqBody.email,
      userModel = global.dbModule.getModels().User,
      authModule = global.authModule,
      provider = 'local';

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
                  provider: provider
                })
                  .then(loginRes => {
                    authModule.saveAuthToken(user, localToken);
                    loginRes['token'] = localToken;
                    loginRes['provider'] = provider;
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
      userModel = global.dbModule.getModels().User,
      authModule = global.authModule,
      keys = ['firstName', 'lastName', 'email', 'password', 'gender', 'contentType', 'image', 'imageSource'],
      provider = 'local',
      parsedUserData;

    prepareUserData(req, keys)
      .then(userData => {
        parsedUserData = userData;
        userModel.findOne({email: userData.email})
          .then(user => user ? sendError(res, {
            message: 'User with same email already registered',
            status: 409
          }) : createNewUser(parsedUserData))
          .catch(err => sendError(res, err))
      })
      .catch(err => sendError(res, err));

    function updateExistingUser (user, userData) {
      if (user.local && user.local.hashedPassword) sendError(res, {
        message: 'User with same email already registered',
        status: 409
      });

      else authModule.getHashedPassword(userData.password)
        .then(hashedPassword => authModule.getLocalToken()
          .then(localToken => saveImage(userData.image, userData.contentType, 'avatar')
            .then(imageSource => {
              user[provider] = user[provider] || {};
              user.local.name = userData.firstName + ' ' + userData.lastName;
              user.local.firstName = userData.firstName;
              user.local.lastName = userData.lastName;
              user.local.gender = userData.gender;
              user.local.image = imageSource || userData['imageSource'];
              user.local.hashedPassword = hashedPassword;
              user.save(err => {
                if (err) sendError(res, err);
                else user.login({
                  firstName: userData.firstName,
                  lastName: userData.lastName,
                  email: userData.email,
                  token: localToken,
                  hashedPassword: hashedPassword,
                  provider: provider,
                })
                  .then(loginRes => {
                    authModule.saveAuthToken(user, localToken);
                    loginRes['token'] = localToken;
                    loginRes['provider'] = provider;
                    res.send(loginRes);
                  })
                  .catch(err => sendError(res, err));
              });
            })
            .catch(err => sendError(res, err))
          )
          .catch(err => sendError(res, err))
        )
        .catch(err => sendError(res, err));
    }

    function createNewUser (userData) {
      authModule.getHashedPassword(userData.password)
        .then(hashedPassword => authModule.getLocalToken()
          .then(localToken => saveImage(userData.image, userData.contentType, 'avatar')
            .then(imageSource => {
              userData.password = hashedPassword;
              userData.token = localToken;
              userData.image = imageSource || userData['imageSource'];
              userData.provider = provider;

              global.dbModule.createUser(userData)
                .then(() => userModel.findOne({email: userData.email})
                  .then(newUser => newUser.login(userData)
                    .then(loginRes => {
                      authModule.saveAuthToken(newUser, localToken);
                      loginRes['token'] = localToken;
                      loginRes['provider'] = provider;
                      res.send(loginRes);
                    })
                    .catch(err => sendError(res, err))
                  )
                  .catch(err => sendError(res, err))
                )
                .catch(err => sendError(res, err));
            })
            .catch(err => sendError(res, err))
          )
          .catch(err => sendError(res, err))
        )
        .catch(err => sendError(res, err));
    }
  });

  app.post('/update_user_profile', (req, res) => checkAuthorization(req, true)
    .then(user => prepareUserData(req, ['firstName', 'lastName', 'gender', 'contentType', 'image', 'imageSource'])
      .then(userData => saveImage(userData.image, userData.contentType, 'avatar')
        .then(imageSource => user.updateProfile({
          image: imageSource || userData.imageSource || null,
          firstName: userData.firstName || null,
          lastName: userData.lastName || null,
          gender: userData.gender || null
        })
          .then(updatedUser => res.send(updatedUser))
          .catch(err => sendError(res, err)))
        .catch(err => sendError(res, err)))
      .catch(err => sendError(res, err)))
    .catch(err => sendError(res, err))
  );

  app.post('/update_password', (req, res) => checkAuthorization(req, true)
    .then(user => user.changePassword(req.body)
      .then(updateRes => res.send(updateRes))
      .catch(err => sendError(res, err))
    )
    .catch(err => sendError(res, err))
  );

  app.post('/restore_local_session', (req, res) => {
    checkAuthorization(req, true)
      .then(user => {
        let normalizedData = user.getNormalized();
        normalizedData['token'] = user.currentToken;
        normalizedData['provider'] = 'local';
        res.send(normalizedData);
      })
      .catch(err => sendError(res, err));
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
    checkAuthorization(req)
      .then(() => getCharityChoiceBanners())
      .catch(err => {
        if (err.status === 401) getCharityChoiceBanners();
        else sendError(res, err);
      });

    function getCharityChoiceBanners () {
      global.dbModule.getCharityItems()
        .then(items => res.send(items))
        .catch(err => sendError(res, err));
    }
  });

  app.post('/vote_for_charity', (req, res) => checkAuthorization(req, true)
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
      form,
      ingredients;

    checkAuthorization(req, true)
      .then(user => {
        registeredUser = user;
        getFormData(req)
          .then(formData => {
            let ingredientRegExp = /^ingredient/;

            image = formData.files && formData.files.image;
            fields = formData.fields;
            form = {};
            ingredients = [];

            if (fields['environment'] === ENVIRONMENTS.HOMEMADE) {
              Object.keys(fields).forEach(key => {
                if ((ingredientRegExp).test(key)){
                  ingredients.push(fields[key]);
                  delete fields[key];
                }
              });
              fields['ingredients'] = ingredients;
            }

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

  app.post('/add_plate', (req, res) => checkAuthorization(req, true)
    .then(user => dbModule.createPlate(req.body, user._id)
      .then(creationRes => res.send(creationRes))
      .catch(err => sendError(res, err)))
    .catch(err => sendError(res, err))
  );

  app.get('/get_plate', (req, res) => {
    checkAuthorization(req)
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
        lim = +query.lim,
        loadAdvBanners = query.loadAdvertisementBanners === 'true';

      dbModule.getPlates(env, lastId, isNaN(lim) ? 11 : lim, query.size, loadAdvBanners)
        .then(plates => {
          plates.forEach(plate => {
            plate.liked = likedPlates[plate._id] || false;
          });
          res.send(plates);
        })
        .catch(err => sendError(res, err));
    }
  });

  app.get('/get_new_plates', (req, res) => {
    checkAuthorization(req, true)
      .then(user => getPlates(user.getLikedPlates()))
      .catch(err => err.status === 401 ? getPlates() : sendError(res, err));

    function getPlates (likedPlates = {}) {
      let
        query = req.query,
        dbModule = global.dbModule,
        env = query.environment || 'restaurant',
        firstId = query.firstId,
        lim = +query.lim,
        loadAdvBanners = query.loadAdvertisementBanners === 'true';

      dbModule.getNewPlates(env, firstId, isNaN(lim) ? 11 : lim, query.size, loadAdvBanners, true)
        .then(plates => {
          plates.forEach(plate => {
            plate.liked = likedPlates[plate._id] || false;
          });
          res.send(plates);
        })
        .catch(err => sendError(res, err));
    }
  });

  app.post('/like_plate', (req, res) => checkAuthorization(req, true)
    .then(user => user.likePlate(req.body.plate)
      .then(updateRes => res.send(updateRes))
      .catch(err => sendError(res, err)))
    .catch(err => sendError(res, err))
  );

  app.post('/dislike_plate', (req, res) => checkAuthorization(req, true)
    .then(user => user.dislikePlate(req.body.plate)
      .then(updateMessage => res.send(updateMessage))
      .catch(err => sendError(res, err)))
    .catch(err => sendError(res, err))
  );

  app.get('/get_plates_by_author', (req, res) => {
    checkAuthorization(req)
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

  app.post('/edit_plate', (req, res) => checkAuthorization(req, true)
    .then(user => user.updatePlate(req.body.plateId, req.body.fields || {})
      .then(updateResult => res.send(updateResult))
      .catch(err => sendError(res, err))
    )
    .catch(err => sendError(res, err)));

  app.get('/search_plates', (req, res) => {
    checkAuthorization(req)
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
    res.send([]); /** No winners for beta version */
    // let env = req.query.environment;
    //
    //
    // global.dbModule.getWinners(env)
    //   .then(winners => res.send(winners))
    //   .catch(err => sendError(res,err))
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

  app.get('/get_users', (req, res) => checkAdminAuthorization(req)
    .then(() => global.dbModule.getUsers(req.query)
      .then(users => res.send(users))
      .catch(err => sendError(res, err))
    )
    .catch(err => sendError(res, err))
  );

  app.get('/get_plates_admin', (req, res) => checkAdminAuthorization(req)
    .then(() => {
        global.dbModule.getPlatesAdmin(
          req.query.statusFilter,
          req.query.periodFilter,
          req.query.environmentFilter,
          req.query.name,
          req.query.type,
          req.query.isReversed
        )
          .then(plates => res.send(plates))
          .catch(err => sendError(res, err))
      })
    .catch(err => sendError(res, err))
  );

  app.post('/add_warning', (req, res) => checkAdminAuthorization(req)
    .then(() => global.dbModule.addWarning(req.body.userId, req.body.warningMessage)
      .then(updatedUser => res.send(updatedUser))
      .catch(err => sendError(res, err))
    )
    .catch(err => sendError(res, err))
  );

  app.post('/toggle_user_status', (req, res) => checkAdminAuthorization(req)
    .then(() => global.dbModule.toggleUserStatus(req.body.userId, req.body.newStatus)
      .then(updatedUser => res.send(updatedUser))
      .catch(err => sendError(res, err))
    )
    .catch(err => sendError(res, err))
  );

  app.post('/toggle_plate_status', (req, res) => checkAdminAuthorization(req)
    .then(() => global.dbModule.togglePlateStatus(req.body.plateId, req.body.newStatus)
      .then(updatedPlate => res.send(updatedPlate))
      .catch(err => sendError(res, err))
    )
    .catch(err => sendError(res, err))
  );

  app.post('/close_request', (req, res) => checkAdminAuthorization(req)
    .then(() => global.dbModule.closeRequest(req.body.requestId, req.body.response)
      .then(updatedRequest => res.send(updatedRequest))
      .catch(err => sendError(res, err))
    )
    .catch(err => sendError(res, err))
  );

  app.get('/get_charities_admin', (req, res) => checkAdminAuthorization(req)
    .then(() => global.dbModule.getCharityItems(false, req.query)
      .then(charityItems => res.send(charityItems))
      .catch(err => sendError(res, err))
    )
    .catch(err => sendError(res, err))
  );

  app.post('/update_charity_item', (req, res) => checkAdminAuthorization(req)
    .then(() => global.dbModule.updateCharityItem(req.body)
      .then(updateRes => res.send(updateRes))
      .catch(err => sendError(res, err))
    )
    .catch(err => sendError(res, err))
  );

  app.post('/add_charity_item', (req, res) => checkAdminAuthorization(req)
    .then(() => global.dbModule.addCharityItem(req.body)
      .then(updateRes => res.send(updateRes))
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

function checkAuthorization (req, checkStatus = false) {
  let
    deferred = Q.defer(),
    authToken = req.headers['access-token'],
    user = global.authModule.getAuthorizedUser(authToken);

  if (!user) deferred.reject({status: 401, message: 'Not authorized'});
  else global.dbModule.getModels().User.findOne({_id: user._id})
    .then(reloadedUser => {
      if (checkStatus && reloadedUser.isSuspended) deferred
        .reject({status: 403, message: 'Your account is suspended. Please contact Administrator'});
      else deferred.resolve(reloadedUser);
    })
    .catch(err => deferred.reject(err));

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
        .then(() => dbModule.getUser({email: userData.email})
          .then(newUser => newUser.login(userData)
            .then(loginRes => {
              authModule.saveAuthToken(newUser, token);
              loginRes['token'] = token;
              loginRes['provider'] = provider;
              res.send(loginRes);
            })
            .catch(err => sendError(res, err))
          )
          .catch(err => sendError(res, err))
        )
        .catch(err => sendError(res, err));
      else user.login(userData)
        .then(loginRes => {
          authModule.saveAuthToken(user, token);
          loginRes['token'] = token;
          loginRes['provider'] = provider;
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

function prepareUserData (req, keys) {
  let
    deferred = Q.defer(),
    userData = {},
    contentType = req.headers['content-type'],
    reqBody = {},
    isForm = /^multipart\/form-data/.test(contentType);

  if (isForm) getFormData(req)
    .then(formData => {
      keys.forEach(key => formData.fields.hasOwnProperty(key) && (userData[key] = formData.fields[key]));
      if (formData.files && formData.files.image && formData.files.image.path) userData['image'] = formData.files.image.path;
      deferred.resolve(userData);
    })
    .catch(err => deferred.reject(err));

  else {
    Object.keys(req.body).forEach(key => reqBody[key] = req.body[key]);
    keys.forEach(key => {
      reqBody.hasOwnProperty(key) && (userData[key] = key === 'image' ?
        isBuffer(reqBody[key]) ? reqBody[key] : new Buffer(reqBody[key], 'binary') :
        reqBody[key]
      );
    });
    deferred.resolve(userData);
  }

  return deferred.promise;
}

function saveImage (image, contentType, prefix) {

  let deferred = Q.defer();

  if (!image || !contentType) deferred.resolve(null);
  else {
    let
      rootDir = './src/uploaded',
      imageName = (prefix || 'image') + (new Date()).getTime() + '.' + global.dbModule.getFileExtension(contentType);

    if (!fs.existsSync(rootDir)) fs.mkdirSync(rootDir);

    jimp.read(image)
      .then(jimpFile => jimpFile.write(rootDir + '/' + imageName, (err) => {
        if (err) deferred.reject(err);
        else deferred.resolve(imageName);
      }));
  }

  return deferred.promise;
}
