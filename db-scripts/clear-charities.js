let
  db = require('./db-connection'),
  mongoose = require('mongoose');


db.getCollection('charities')
  .then(collection => {

    collection.findOne({_id: mongoose.Types.ObjectId('5af99a7738bc0e179ea03d12')})
      .then(res => {
        let
          votes = res.votes,
          votesOfJune = votes['2018_5'],
          indexInList = votesOfJune.indexOf(mongoose.Types.ObjectId('5b30db87ff3a0d51b2fb7d40'));

        console.log(indexInList, votesOfJune);

        votesOfJune.splice(indexInList, 1);

        console.log(votesOfJune);



        // votes['2018_5'].splice()

        // { '2018_5':
        //   [ 5b315aaceb91f4546b4127a4,
        //     5afd2a2e7a44913f75075fce,
        //     5b028c0b08a7cb705d24c869,
        //     5b30db87ff3a0d51b2fb7d40,
        //     5b360b43cfbbe80348838541 ] },
        // console.log(res);
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

// db.getCollection('registered-users')
//   .then(collection => {
//     collection.findOne(
//       {_id: mongoose.Types.ObjectId('5b30db87ff3a0d51b2fb7d40')},
//       // {$set: { charityVotes: {}}}
//     )
//     .then(res => {
//       console.log(res);
//       db.disconnect();
//     })
//     .catch(err => {
//       console.log(err);
//       db.disconnect();
//     });
//   })
//   .catch(err => {
//     console.log(err);
//     db.disconnect();
//   });

//5af99a7738bc0e179ea03d12

