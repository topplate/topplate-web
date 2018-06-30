let
  moment = require('moment'),
  db = require('./db-connection');

db.getCollection('winners')
  .then(collection => {
    collection.remove({})
      .then(res => console.log(res))
      .catch(err => console.log(err));
  })
  .catch(err => console.log(err));
