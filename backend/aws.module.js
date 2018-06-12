let
  s3 = require('s3'),
  Q = require('q'),
  s3Client;

module.exports.refreshAWS = refreshAWS;

module.exports.uploadFileToBucket = uploadFileToBucket;

module.exports.downloadFileFromBucket = downloadFileFromBucket;

function refreshAWS () {
  s3Client = s3.createClient({
    s3Options: {
      accessKeyId: process.env.S3_KEY,
      secretAccessKey: process.env.S3_SECRET
    }
  });

  /** Test */
  // uploadFileToBucket(__dirname + '/../src/assets/restaurant-bg.jpg', 'static-pictures/restaurant-bg.jpg', 'test-bucket')
  //   .then(res => console.log(res))
  //   .catch(err => console.log(err));
}

function uploadFileToBucket (tmpFileName, s3FileName, bucketName) {
  let
    deferred = Q.defer(),
    uploader = s3Client.uploadFile({
      localFile: tmpFileName,
      s3Params: {
        Bucket: bucketName,
        Key: s3FileName
      }
    });

  uploader.on('error', (err) => deferred.reject(err));

  uploader.on('progress', () => console.log(uploader.progressMd5Amount, uploader.progressAmount, uploader.progressTotal));

  uploader.on('end', () => {
    console.log('finished');

    getImageUrlFromBucket(s3FileName, bucketName)
      .then(filePublicUrl => deferred.resolve(filePublicUrl))
      .catch(err => deferred.reject(err))
  });

  return deferred.promise;
}

function getImageUrlFromBucket (fileName, bucketName) {
  let
    deferred = Q.defer(),
    urlGetter = s3Client.getPublicUrl(fileName, bucketName);

  console.log(urlGetter);

  return deferred.promise;
}

function downloadFileFromBucket (file, bucketName) {


}

