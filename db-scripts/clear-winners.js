let
  moment = require('moment'),
  db = require('./db-connection');

db.getCollection('winners')
  .then(collection => {

    collection.remove({week: '2018_1_1'})
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
    //   {$set: {week: '2018_1_1'}}
    // )
    //   .then(res => db.disconnect())
    //   .catch(err => db.disconnect());
  })
  .catch(err => console.log(err));
