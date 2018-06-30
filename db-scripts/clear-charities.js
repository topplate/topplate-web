let
  db = require('./db-connection'),
  mongoose = require('mongoose');

db.getCollection('registered-users')
  .then(collection => {
    collection.updateOne(
      {_id: mongoose.Types.ObjectId('5b30db87ff3a0d51b2fb7d40')},
      {$set: { charityVotes: {}}}
    )
    .then(res => {
      console.log(res);
      db.disconnect();
    })
    .catch(err => {
      console.log(err);
      db.disconnect();
    });
  })
  .catch(err => {
    console.log(err);
    db.disconnect();
  });

//5af99a7738bc0e179ea03d12

