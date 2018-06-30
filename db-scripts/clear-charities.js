let
  db = require('./db-connection'),
  mongoose = require('mongoose');

db.getCollection('registered-users')
  .then(collection => {
    collection.findOne({_id: mongoose.Types.ObjectId('5b334a0de12b7502685dc933')})
      .then(res => {
        console.log(res);
        db.disconnect();
      })
      .then(err => {
        console.log(err);
        db.disconnect();
      });
  })
  .catch(err => {
    console.log(err);
    db.disconnect();
  });

