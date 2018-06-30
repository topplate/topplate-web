let
  moment = require('moment'),
  db = require('./db-connection');

db.getCollection('plates')
  .then(collection => {

    collection.find({canLike: true})
      .toArray((err, res) => {
        if (err) {
          console.log(err);
          db.disconnect();
        } else {
          cleanUp(collection, res.map(plate => {
            return {
              _id: plate._id,
              week: getWeekName(plate.createdAt)
            };
          }));
        }

      });
  })
  .catch(err => console.log(err));

function cleanUp (collection, itemsToUpdate) {

  let i = 0;

  updateItem();

  function updateItem () {
    let item = itemsToUpdate[i++];
    if (!item) {
      console.log('all plates were updated');
      db.disconnect();
    } else {
      collection.update(
        {_id: item._id},
        {$set: {week: item.week}},
        (err, res) => {
          if (err) {
            console.log(err);
            db.disconnect();
          } else {
            console.log(res);
            updateItem();
          }
        }
      );
    }
  }
}

function getWeekName (dateStr) {
  let date = moment(dateStr);
  return date.year() + '_' + date.month() + '_' + date.week();
}

