let
  mongoose = require('mongoose'),
  Q = require('q'),
  dotenv = require('dotenv').load();

module.exports.connect = dbConnect;

module.exports.disconnect = dbDisconnect;

module.exports.getCollection = getCollection;

function dbConnect () {
  return mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/top-plate-db');
}

function dbDisconnect () {
  return mongoose.disconnect();
}

function getCollection (name) {
  let deferred = Q.defer();

  dbConnect().then(() => {
    mongoose.connection.db.collection(name, (err, collection) => {
      if (err) {
        mongoose.disconnect();
        deferred.reject(err);
      } else deferred.resolve(collection);
    });
  });

  return deferred.promise;
}
