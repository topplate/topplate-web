let
  mongoose = require('mongoose'),
  dotenv = require('dotenv').load();

module.exports.connect = () => mongoose.connect(process.env.MONGODB_URI);

module.exports.disconnect = () => mongoose.disconnect();
