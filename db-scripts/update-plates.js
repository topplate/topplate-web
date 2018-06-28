let db = require('./db-connection');

db.getCollection('plates')
  .then(collection => {

    collection.find({imageBinaryData: {$exists: true}})
      .toArray((err, res) => {
        if (err) console.log(err);
        else console.log(res);
        db.disconnect();
      });
  })
  .catch(err => console.log(err));

