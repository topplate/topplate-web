let
  db = require('./db-connection'),
  mongoose = require('mongoose');

db.getCollection('advertisements')
  .then(collection => {
    collection.drop()
      .then(() => {
        collection.insertMany([
          {
            name: 'Sun Basket',
            image: 'assets/advertising/sun-basket.png',
            link: 'https://sunbasket.com/'
          },
          {
            name: 'Blue Apron',
            image: 'assets/advertising/blue-apron.png',
            link: 'https://www.blueapron.com/'
          },
          {
            name: 'Home chef',
            image: 'assets/advertising/home-chef.png',
            link: 'https://www.homechef.com/'
          },
          {
            name: 'Hello fresh',
            image: 'assets/advertising/hello-fresh.png',
            link: 'https://www.hellofresh.com/'
          }
        ])
          .then(insertRes => {
            console.log(insertRes);
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
  })
  .catch(err => {
    console.log(err);
    db.disconnect();
  });

