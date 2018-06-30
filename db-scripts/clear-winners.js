let
  moment = require('moment'),
  db = require('./db-connection');

db.getCollection('winners')
  .then(collection => {

    collection.updateMany(
      {},
      {$set: {week: '2018_1_1'}}
    )
      .then(res => console.log(res))
      .catch(err => console.log(err));



  })
  .catch(err => console.log(err));
