let
  moment = require('moment'),
  db = require('./db-connection');

db.getCollection('winners')
  .then(collection => {

    collection.updateMany(
      {},
      {$set: {name: '2018_1_1_' + (Math.random() * 100)}}
    )
    // collection.remove({week: '2018_1_1'})
      .then(res => {
        console.log(res);
        db.disconnect();
      })
      .catch(err => {
        console.log(err);
        db.disconnect();
      });

    //   .toArray((err, res) => {
    //
    //   console.log(err);
    //
    //   console.log(res);
    //
    //   db.disconnect();
    //
    // });

    // collection.updateMany(
    //   {},
    //   {$set: {name: '2018_1_1'}}
    // )
    //   .then(res => db.disconnect())
    //   .catch(err => db.disconnect());
  })
  .catch(err => console.log(err));
