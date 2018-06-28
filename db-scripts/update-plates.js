let db = require('./db-connection');

db.getCollection('plates')
  .then(collection => {

    collection.find({imageBinaryData: {$exists: true}})
      .toArray((err, res) => {
        if (err) {
          console.log(err);
          db.disconnect();
        } else cleanUp(res.map(plate => plate._id));

      });
  })
  .catch(err => console.log(err));

function cleanUp (ids) {
  console.log(ids);
}

