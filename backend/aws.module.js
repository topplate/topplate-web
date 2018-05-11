let
  AWS = require('aws-sdk');

module.exports.refreshAWS = refreshAWS;

function refreshAWS () {
  // AWS.config.loadFromPath('aws-config.json');
  // let
  //   s3 = new AWS.S3(),
  //   dbModule = global.dbModule;

  // dbModule.getModels().Plate.findOne({_id: '5af53b2a8feac81d8081b925'})
  //   .then(res => {
  //
  //     s3.putObject({
  //       Bucket: 'test_bucket',
  //       Key: 'myTestFile.' + res.imageExtension,
  //       Body: res.imageBinaryData
  //     }, (err, data) => {
  //       console.log(err, data);
  //     });
  //   })
  //   .catch(err => console.log(err));

  // dbModule.getPlates('restaurant', null, 1)
  //   .then(res => {
  //     let image =
  //       // 5af53b2a8feac81d8081b925
  //
  //   })
  //   .catch(err => console.log(err));
}

