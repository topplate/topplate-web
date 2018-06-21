let
  db = require('./db-connection'),
  mongoose = require('mongoose');

db.connect();

mongoose.connection.on('open', ref => {

  console.log(mongoose.connection.db.charities);

});

