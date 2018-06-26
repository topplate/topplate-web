const
  passport = require('passport'),
  PassportGoogleStrategy = require('passport-google-oauth2').Strategy,
  PassportFacebookStrategy = require('passport-facebook').Strategy,
  bCrypt = require('bcrypt'),
  Q = require('q'),
  authEmails = {},
  authTokens = {},
  adminTokens = {};

module.exports.refreshAuthorization = refreshAuthorization;

module.exports.saveAuthToken = saveAuthToken;

module.exports.clearAuthToken = clearAuthToken;

module.exports.getAuthorizedUser = getAuthorizedUser;

module.exports.getAuthorizedUsers = () => {
  return {
    authEmails: authEmails,
    authTokens: authTokens
  };
};

module.exports.authorizeAsAdmin = (login, pswrd) => {
  let deferred = Q.defer();

  if (login === process.env.ADMIN_LOGIN && pswrd === process.env.ADMIN_PASSWORD) getLocalToken()
    .then(token => {
      adminTokens[token] = { login: login, pswrd: pswrd };
      deferred.resolve({'admin-access-token': token});
    })
    .catch(err => deferred.reject(err));

  else deferred.reject({message: 'unauthorized', status: 401});

  return deferred.promise;
};

module.exports.checkAdminAuthorization = (token) => {
  let deferred = Q.defer();

  if (adminTokens[token]) deferred.resolve({message: 'Authorized admin'});
  else deferred.reject({message: 'Unauthorized', status: 401});

  return deferred.promise;
};

module.exports.getHashedPassword = (str) => {
  let
    deferred = Q.defer(),
    saltLen = 10;

  bCrypt.hash(str, saltLen, (err, hashedPassword) => {
    if (err) deferred.reject(err);
    else deferred.resolve(hashedPassword);
  });

  return deferred.promise;
};

module.exports.comparePasswords = (str, hash) => {
  let deferred = Q.defer();

  bCrypt.compare(str, hash, (err, res) => {
    if (err) deferred.reject(err);
    else deferred.resolve(res);
  });

  return deferred.promise;
};

module.exports.getLocalToken = getLocalToken;

function saveAuthToken (userData, token) {
  clearAuthToken(userData.email);
  authEmails[userData.email] = token;
  authTokens[token] = userData;
}

function clearAuthToken (userEmail, userToken) {
  let
    email = userEmail || (authTokens[userToken] && authTokens[userToken].email),
    token = userToken || authEmails[email];

  delete authEmails[email];
  delete authTokens[token];
}

function getAuthorizedUser (token) {
  let
    userData = authTokens[token],
    registeredToken = userData && userData.email && authEmails[userData.email];
  return token && registeredToken === token && userData;
}

function refreshAuthorization () {

  let
    app = global.getApp(),
    apiModule = global.apiModule,
    facebookCredentials = apiModule.getFacebookCredentials(),
    googleCredentials = apiModule.getGoogleCredentials(),
    baseUrl = process.env.HOST || 'localhost' + ':' + process.env.PORT || '8081';

  passport.use(
    new PassportGoogleStrategy({
      clientID: googleCredentials.client_id,
      clientSecret: googleCredentials.client_secret,
      callbackURL: 'https://' + baseUrl + '/google_auth_callback'
    }, function (accessToken, refreshToken, profile, cb) {
      console.log(accessToken, refreshToken, profile, cb);
      cb({'message': accessToken});
    })
  );

  passport.use(
    new PassportFacebookStrategy({
      clientID: facebookCredentials.client_id,
      clientSecret: facebookCredentials.client_secret,
      callbackURL: 'https://' + baseUrl + '/facebook_auth_callback'
    }, function (accessToken, refreshToken, profile, cb) {
      console.log(accessToken, refreshToken, profile, cb);
      cb({'message': accessToken});
    })
  );

  passport.serializeUser(function(user, cb) {
    cb(null, user);
  });

  passport.deserializeUser(function(obj, cb) {
    cb(null, obj);
  });

  app.use(passport.initialize());
  app.use(passport.session());


}

function getLocalToken () {
  let deferred = Q.defer();

  bCrypt.genSalt(10, false, (err, token) => {
    if (err) deferred.reject(err);
    else deferred.resolve(token);
  });

  return deferred.promise;
}




//
// module.exports.getToken = getToken;
// module.exports.clearToken = clearToken;
// module.exports.getEncrypted = getEncrypted;
// module.exports.getSalt = getSalt;
// module.exports.getHashedPassword = getHashedPassword;
// module.exports.compareHashes = compareHashes;
// module.exports.checkStatus = checkStatus;
//
// function getToken (userData) {
//
//   let deferred = Q.defer();
//
//   global.dbModule.getUser({ email: userData.email })
//     .then(user => {
//       if (!user) deferred.reject({ message: 'User is not ready for getting token' });
//       else {
//         if (user.checkPassword(userData.password)) {
//           let token = jwt.sign({
//             id: user._id,
//             login: user.login,
//             email: user.email
//           }, theGreatSecret);
//           tokens[token] = user;
//           deferred.resolve(token);
//         } else deferred.reject({ status: 401, message: 'Bad credentials' });
//       }
//     })
//     .catch(err => deferred.reject(err));
//
//   return deferred.promise;
// }
//
// function clearToken (header) {
//   let
//     deferred = Q.defer(),
//     authToken = header[CONSTANTS.AUTH_TOKEN];
//
//   tokens.hasOwnProperty(authToken) && delete tokens[authToken];
//   deferred.resolve();
//
//   return deferred.promise;
// }
//
// function getEncrypted (
//   c,
//   r,
//   y = 1,
//   p = 128,
//   t = 'sha1',
//   o = 'hex'
// ) { return crypto.pbkdf2Sync(c, r, y, p, t).toString(o); }
//
// function getSalt (bytes = 128, outputFormat = 'base64') {
//   return crypto.randomBytes(bytes).toString(outputFormat);
// }
//
// function getHashedPassword (password) {
//   let
//     context = this,
//     salt = context.salt || getSalt(),
//     hashedPassword = getEncrypted.call(context, password, salt);
//
//   context.salt = context.salt || salt;
//
//   return hashedPassword;
// }
//
// function compareHashes (password) {
//   let
//     context = this,
//     salt = context.salt || getSalt();
//   context.salt = context.salt || salt;
//   return getEncrypted.call(context, password, salt) === context.passwordHash;
// }
//
// function checkStatus (token, justCheck) {
//   let user = tokens[token];
//   return justCheck ? !!user : (user || false);
// }
//
