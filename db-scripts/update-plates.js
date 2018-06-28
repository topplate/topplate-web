let db = require('./db-connection');

db.getCollection('plates')
  .then(collection => {

    collection.find({imageBinaryData: {$exists: true}})
      .toArray((err, res) => {
        if (err) {
          console.log(err);
          db.disconnect();
        } else cleanUp(collection, res.map(plate => plate._id));

      });
  })
  .catch(err => console.log(err));

function cleanUp (collection, ids) {

  collection.updateMany(
    {_id: {$in: ids}},
    {$unset: {imageBinaryData: ''}},
    (err, res) => {
      console.log(err, res);
      db.disconnect();
    }
  );
}

