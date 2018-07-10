const
  Q = require('q'),
  fs = require('fs'),
  jimp = require('jimp'),
  moment = require('moment'),
  mongoose = require('mongoose'),
  ObjectId = require('mongodb').ObjectID,
  isBuffer = require('is-buffer'),
  models = {},
  methods = {
    connect: (dbPath, dbName) => {
      let
        app = global.getApp(),
        path = [dbPath || app.get('dbPath'), dbName || app.get('dbName')].join('/') ;

      return mongoose.connect(process.env.MONGODB_URI || path);
    },

    disconnect: () => mongoose.disconnect()

  };

/** Connect, Disconnect */
/** User, Dish, Restaurant, Comment, Admin; */

module.exports.refreshSchemas = () => {
  refreshMongoose();
  refreshBaseSchema();
  refreshUserSchema();
  refreshPlateSchema();
  refreshCharitySchema();
  refreshWinnerSchema();
  refreshRequestsSchema();
  refreshAdvertisementSchema();
};

module.exports.createUser = userData => {

  let
    User = models.User,
    initialData = userData || {},
    deferred = Q.defer();

  if (!userData) deferred.reject({ message: 'Bad initial data', status: 500 });
  else User.findOne({email: initialData.email})
    .then(user => {
      if (user) deferred.reject({ message: 'User with same email already registered', status: 409 });
      else {
        let
          creationData = {},
          usePassword = initialData.provider === 'local';

        creationData.email = initialData.email;
        creationData.isRobot = initialData.isRobot;

        creationData[initialData.provider] = {
          name: initialData.name,
          image: initialData.image
        };

        if (usePassword) creationData[initialData.provider] = {
          name: initialData.firstName + ' ' + initialData.lastName,
          firstName: initialData.firstName,
          lastName: initialData.lastName,
          gender: initialData.gender,
          image: initialData.image,
          hashedPassword: initialData.password
        };

        else creationData[initialData.provider] = {
          name: initialData.name,
          image: initialData.image,
          id:  initialData.id
        };

        let newUser = new User(creationData);

        newUser.save(err => {
          if (err) deferred.reject(err);
          else User.findOne({email: initialData.email})
            .then(() => deferred.resolve({message: 'user created'}))
            .catch(err => deferred.reject(err));
        });
      }
    }).catch(err => deferred.reject(err));

  return deferred.promise;
};

module.exports.getUser = (query, fields = {}) => {
  let deferred = Q.defer();

  models.User.findOne(query, fields)
    .then(user => deferred.resolve(user))
    .catch(err => deferred.reject(err));

  return deferred.promise;
};

module.exports.getUsers = (queryParams) =>  {
  let
    deferred = Q.defer(),
    query = {};

  if (queryParams.filter !== 'all') query['isSuspended'] = queryParams.filter === 'suspended';

  models.User.find(query)
    .then(users => getUsersResponse(users))
    .catch(err => deferred.reject(err));

  return deferred.promise;

  function getUsersResponse (users) {
    let
      normalizedResponse = users.map(user => user.getNormalizedForAdmin()),
      sortBy = queryParams.name;

    if (!sortBy) deferred.resolve(normalizedResponse);
    else {
      let
        isReversed = queryParams.isReversed === 'true',
        sortedItems = normalizedResponse.sort((a, b) => {
          let propA = a[sortBy], propB = b[sortBy];

          if (queryParams.type === 'string') {
            propA = (propA + '').toLowerCase();
            propB = (propB + '').toLowerCase();
          }

          return propA < propB ? 1 : (propA > propB ? -1 : 0);
        });

      return deferred.resolve(isReversed ? sortedItems.reverse() : sortedItems);
    }
  }
};

module.exports.updateUserData = (id, data) => {
  let deferred = Q.defer();

  models.User.update(id, data)
    .then(updateRes => deferred.resolve('updated'))
    .catch(err => deferred.reject(err));

  return deferred.promise;
};

module.exports.addWarning = (userId, warning) => {
  let deferred = Q.defer();

  models.User.findOne({_id: userId})
    .then(user => {
      user.warnings.push(warning);
      user.save(err => {
        if (err) deferred.reject(err);
        else deferred.resolve(user.getNormalizedForAdmin());
      });
    })
    .catch(err => deferred.reject(err));

  return deferred.promise;
};

module.exports.toggleUserStatus = (userId, status) => {

  let deferred = Q.defer();

  models.User.findOne({_id: userId})
    .then(user => {

      user.isSuspended = status;
      user.save(err => {
        if (err) deferred.reject(err);
        else deferred.resolve(user.getNormalizedForAdmin());
      });
    })
    .catch(err => deferred.reject(err));

  return deferred.promise;

};

module.exports.createPlate = (plateData, authorId) => {

  let
    Plate = models.Plate,
    deferred = Q.defer(),
    imageBinaryData = isBuffer(plateData.image) ? plateData.image : new Buffer(plateData.image, 'binary'),
    creationData = {
      name: plateData.name,
      week: getWeekName(),
      environment: plateData.environment,
      email: plateData.email,
      imageSource: 'plate' + (new Date()).getTime(),
      imageExtension: plateData.extension || getFileExtension(plateData.contentType),
      imageContentType: plateData.contentType,
      geo: plateData.geo,
      country: plateData.country,
      city: plateData.city,
      address: plateData.address,
      recipe: plateData.recipe,
      likes: [],
      ingredients: plateData.ingredients || [],
      restaurantName: plateData.restaurantName || 'none',
      isReady: true,
      canLike: true,
      isTest: plateData.isTest || false
    };

  models.User.findOne({'_id': authorId})
    .then(plateAuthor => {

      let
        plateAuthorData = plateAuthor.getNormalized().user,
        newPlate = new Plate(creationData);

      newPlate.author = {
        id: authorId,
        name: plateAuthorData.name,
        image: plateAuthorData.image
      };

      newPlate.save(err => {
        if (err) deferred.reject(err);
        else newPlate.refreshFiles(imageBinaryData, ' by ' + newPlate.author.name)
          .then(res => {
            plateAuthor.uploadedPlates.push(newPlate._id);
            plateAuthor.save(err => {
              if (err) deferred.reject(err);
              else deferred.resolve({message: 'new plate was created'});
            });
          })
          .catch(err => deferred.reject(err));
      });
    })
    .catch(err => deferred.reject(err));

  return deferred.promise;
};

module.exports.updatePlate = (userId, plateId, fields) => {
  let deferred = Q.defer();

  models.User.findOne({'_id': userId})
    .then(user => user.updatePlate(plateId, fields)
      .then(updateRes => deferred.resolve(updateRes))
      .catch(err => deferred.reject(err))
    )
    .catch(err => deferred.reject(err));

  return deferred.promise;
};

module.exports.getPlatesByEnvironments = () => {

  let
    deferred = Q.defer(),
    numberOfRestaurantPlates = 0,
    numberOfHomemadePlates = 0;

  models.Plate.find({})
    .then(res => {
      res.forEach(plate => {
        if (plate.environment === 'restaurant') numberOfRestaurantPlates = numberOfRestaurantPlates + 1;
        else numberOfHomemadePlates = numberOfHomemadePlates + 1;
      });
      deferred.resolve({
        restaurant: numberOfRestaurantPlates,
        homemade: numberOfHomemadePlates
      });
    })
    .catch(err => deferred.reject(err));

  return deferred.promise;
};

module.exports.getPlates = (env, lastId, lim = 11, size = 'medium', loadAdvBanners = false) => {
  let
    deferred = Q.defer(),
    platesModel = models.Plate,
    query = {isReady: true};

  if (env) query['environment'] = env;

  if (lastId) platesModel.findOne({_id: lastId})
    .then(lastOne => {
      query['createdAt'] = {$lt: lastOne.createdAt};
      _getPlates();
    })
    .catch(err => deferred.reject(err));

  else _getPlates();

  return deferred.promise;

  function _getPlates () {

    models.Plate.find(query)
      .limit(lim)
      .sort({createdAt: -1})
      .then(plates => {
        let normalizedPlates = plates.map(plate => plate.getNormalized(size));
        if (!loadAdvBanners) deferred.resolve(normalizedPlates);
        else mergeWithAdvBanners(normalizedPlates)
          .then(mergedResponse => deferred.resolve(mergedResponse))
          .catch(err => deferred.reject(err))
      })
      .catch(err => deferred.reject(err));
  }
};

module.exports.getNewPlates = (env, firstId, lim = 11, size = 'medium', loadAdvBanners = false) => {
  let
    deferred = Q.defer(),
    platesModel = models.Plate,
    query = {isReady: true};

  if (env) query['environment'] = env;

  if (firstId) platesModel.findOne({_id: firstId})
    .then(lastOne => {
      query['createdAt'] = {$gt: lastOne.createdAt};
      _getPlates();
    })
    .catch(err => deferred.reject(err));

  else _getPlates();

  return deferred.promise;

  function _getPlates () {
    models.Plate.find(query)
      .limit(lim)
      .sort({createdAt: -1})
      .then(plates => {
        let normalizedPlates = plates.map(plate => plate.getNormalized(size));
        if (!loadAdvBanners) deferred.resolve(normalizedPlates);
        else mergeWithAdvBanners(normalizedPlates)
          .then(mergedResponse => deferred.resolve(mergedResponse))
          .catch(err => deferred.reject(err))
      })
      .catch(err => deferred.reject(err));
  }
};

module.exports.getPlatesByAuthor = (userId, env, skip = 0, lim = 11, size = 'medium') => {
  let deferred = Q.defer();

  models.User.findOne({_id: userId})
    .then(user => {

      let
        relatedPlates = user.uploadedPlates.map(plateId => mongoose.Types.ObjectId(plateId)),
        query = {_id: {$in: relatedPlates}, isReady: true};
      if (env) query['environment'] = env;

      models.Plate.find(query).limit(lim).skip(skip)
        .then(plates => deferred.resolve(plates.map(plate => plate.getNormalized(size))))
        .catch(err => deferred.reject(err));
    })
    .catch(err => deferred.reject(err));

  return deferred.promise;
};

module.exports.getPlatesAdmin = (statusFilter, periodFilter, envFilter, colName, colType, colReversed) => {
  let
    deferred = Q.defer(),
    query = {};

  if (statusFilter !== 'all') query['isReady'] = statusFilter === 'approved';
  if (periodFilter !== 'all') query['canLike'] = periodFilter !== 'old';
  if (envFilter !== 'all') query['environment'] = envFilter;

  models.Plate.find(query)
    .sort({createdAt: -1})
    .then(plates => getPlatesAdminResponse(plates))
    .catch(err => deferred.reject(err));

  return deferred.promise;

  function getPlatesAdminResponse (plates) {
    let normalizedItems = plates.map(plate => plate.getNormalized());

    if (!colName) deferred.resolve(normalizedItems);
    else {
      let
        isReversed = colReversed === 'true',
        sortedItems = normalizedItems.sort((a, b) => {
          let propA = a[colName], propB = b[colName];
          if (colType === 'string') {
            propA = (propA + '').toLowerCase();
            propB = (propB + '').toLowerCase();
          }
          return propA < propB ? 1 : (propA > propB ? -1 : 0);
        });

      return deferred.resolve(isReversed ? sortedItems.reverse() : sortedItems);
    }
  }
};

module.exports.togglePlateStatus = (plateId, nesStatus) => {
  let deferred = Q.defer();

  models.Plate.findOne({_id: plateId})
    .then(plate => {
      plate.isReady = nesStatus;
      plate.save(err => {
        if (err) deferred.reject(err);
        else deferred.resolve(plate.getNormalized());
      });
    })
    .catch(err => deferred.reject(err));

  return deferred.promise;
};

module.exports.getPlate = (id, lim = 3) => {
  let deferred = Q.defer();

  models.Plate.findOne({_id: id})
    .then(selectedPlate => {
      models.User.findOne({_id: selectedPlate.author.id})
        .then(plateAuthor => {
          let relatedPlates = plateAuthor.uploadedPlates
            .filter(plateId => plateId !== id)
            .map(plateId => mongoose.Types.ObjectId(plateId));

          models.Plate.find({
            _id: {$in: relatedPlates},
            environment: selectedPlate.environment,
            isReady: true
          })
            .limit(lim)
            .sort({createdAt: -1})
            .then(plates => {
              let response = selectedPlate.getNormalized();
              response['relatedPlates'] = plates.map(plate => plate.getNormalized());
              deferred.resolve(response);
            })
            .catch(err => deferred.reject(err));
        })
        .catch(err => deferred.reject(err));
    })
    .catch(err => deferred.reject(err));

    return deferred.promise;
};

module.exports.getLikedPlates = (id) => {

  let deferred = Q.defer();

  models.User.findOne({_id: id})
    .then(user => deferred.resolve(user.getLikedPlates()))
    .catch(err => deferred.reject(err));

  return deferred.promise;
};

module.exports.searchPlates = (property = 'name', string = null, env, size = 'medium') => {

  let
    deferred = Q.defer(),
    query = {
      environment: env,
      isReady: true
    };

  if (string === null) models.Plate.find(query)
    .limit(20)
    .sort({createdAt: -1})
    .then(plates => deferred.resolve(plates.map(plate => plate.getNormalized())))
    .catch(err => deferred.reject(err));

  else {
    query[property] = new RegExp(string, 'ig');
    models.Plate.find(query)
      .sort({createdAt: -1})
      .then(plates => deferred.resolve(plates.map(plate => plate.getNormalized())))
      .catch(err => deferred.reject(err));

      // .then(res => deferred.resolve(res.sort((a, b) => {
      //   let propA = a.createdAt, propB = b.createdAt;
      //   return propA > propB ? -1 : (propB > propA ? 1 : 0);
      // }).map(item => item.getNormalized())))

  }

  return deferred.promise;
};

module.exports.refreshPlates = () => {
  let
    deferred = Q.defer(),
    len = 0,
    plates;

  models.Plate.find({})
    .then(res => {
      plates = res;
      len = plates.length;
      refreshPlate(0);
    })
    .catch(err => deferred.reject(err));

  return deferred.promise;

  function refreshPlate (i) {
    let plateToCheck = plates[i];
    if (!plateToCheck) deferred.resolve({message: 'all plates were checked'});
    else plateToCheck.refreshFiles(' (' + (i + 1) + ' of ' + len + ')')
      .then(res => refreshPlate(i + 1))
      .catch(err => deferred.reject(err))
  }
};

module.exports.getCharityItems = (activeOnly = true, sortByQuery) => {
  let
    deferred = Q.defer(),
    query = {};

  if (activeOnly) query['status'] = true;

  models.Charity.find(query)
    .then(items => getSortedResponse(items))
    .catch(err => deferred.reject(err));

  return deferred.promise;

  function getSortedResponse (items) {
    let normalizedItems = items.map(item => item.getNormalized());

    if (!sortByQuery) deferred.resolve(normalizedItems);
    else {
      let
        sortingProperty = sortByQuery.name,
        isReversed = sortByQuery.isReversed === 'true',
        sortedItems = normalizedItems.sort((a, b) => {
          let propA = a[sortingProperty], propB = b[sortingProperty];

          if (sortByQuery.type === 'string') {
            propA = (propA + '').toLowerCase();
            propB = (propB + '').toLowerCase();
          }

          return propA < propB ? 1 : (propA > propB ? -1 : 0);
        });

      return deferred.resolve(isReversed ? sortedItems.reverse() : sortedItems);
    }
  }
};

module.exports.voteForCharityItem = (userId, itemId) => {
  let
    deferred = Q.defer();

  models.Charity.findOne({_id: itemId})
    .then(item => item.vote(userId)
      .then(res => deferred.resolve(res))
      .catch(err => deferred.reject(err))
    )
    .catch(err => deferred.reject(err));

  return deferred.promise;
};

module.exports.updateCharityItem = (reqBody) => {
  let deferred = Q.defer();

  models.Charity.findOne({_id: reqBody._id})
    .then(charityItem => {
      if (!charityItem) deferred.reject({message: 'Can not find ' + reqBody._id, status: 418});
      else {
        ['name', 'description', 'link'].forEach(key => charityItem[key] = reqBody.hasOwnProperty(key) ?
          reqBody[key] : charityItem[key]);

        charityItem.save(err => {
          if (err) deferred.reject(err);
          else deferred.resolve({message: reqBody._id + ' was updated!'});
        });
      }
    })
    .catch(err => deferred.reject(err));

  return deferred.promise;
};

module.exports.addCharityItem = (reqBody) => {

  let
    deferred = Q.defer(),
    rootDir = './src/uploaded',
    imageName = 'charity' + (new Date()).getTime() + '.' + getFileExtension(reqBody.contentType),
    imageBinaryData = isBuffer(reqBody.image) ? reqBody.image : new Buffer(reqBody.image, 'binary');

  if (!fs.existsSync(rootDir)) fs.mkdirSync(rootDir);

  jimp.read(imageBinaryData)
    .then(jimpFile => jimpFile.write(rootDir + '/' + imageName, (err) => {
      if (err) deferred.reject(err);
      else {

        models.Charity.collection.insertOne({
          name: reqBody.name,
          description: reqBody.description,
          image: imageName,
          link: reqBody.link,
          votes: {},
          status: true
        })
          .then((insertRes) => models.Charity.findOne({_id: insertRes.insertedId})
            .then(newItem => deferred.resolve(newItem.getNormalized()))
            .catch(err => deferred.reject(err)))
          .catch(err => deferred.reject(err));
      }
    }))
    .catch(err => deferred.reject(err));

  return deferred.promise;
};

module.exports.getContactsData = () => {

  let deferred = Q.defer();

  models.Base.findOne()
    .then(res => deferred.resolve({
      phone: res.phone,
      address: res.address,
      fax: res.fax
    }))
    .catch(err => deferred.reject(err));

  return deferred.promise;
};

module.exports.getWinners = (env) => {
  let
    deferred = Q.defer(),
    query = {};

  if (env) query['environment'] = env;

  models.Winner.find(query)
    .then(winnersList => {
      let
        lenA = winnersList.length,
        lenB = 0,
        plates = [];

      if (!lenA) deferred.resolve([]);
      else winnersList.forEach(item => {
        models.Plate.findOne({_id: item.plate})
          .then(plate => {
            let normalizedPlate = plate.getNormalized('big');
            normalizedPlate['prizeWeek'] = moment(plate.createdAt)
              .add(1, 'week').startOf('isoWeek')
              .format('YYYY-MM-DD HH:mm:ss');

            plates.push(normalizedPlate);

            lenB += 1;
            lenA === lenB && deferred.resolve(plates.sort((a, b) => {
              let propA = a.createdAt, propB = b.createdAt;
              return propA > propB ? -1 : (propB > propA ? 1 : 0);
            }));
          })
          .catch(err => deferred.reject(err));
      });
    })
    .catch(err => deferred.reject(err));

  return deferred.promise;
};

module.exports.createRequest = (requestData) => {
  let
    deferred = Q.defer(),
    requestEntity = new models.Request(requestData);

  requestEntity.save(err => {
    if (err) deferred.reject(err);
    else deferred.resolve({message: 'Thank you for your request'});
  });

  return deferred.promise;
};

module.exports.closeRequest = (requestId, message) => {
  let deferred = Q.defer();

  models.Request.findOne({_id: requestId})
    .then(requestEntity => {
      requestEntity.response = message;
      requestEntity.isClosed = true;
      requestEntity.save(err => {
        if (err) deferred.reject(err);
        else deferred.resolve(requestEntity);
      });
    })
    .catch(err => deferred.reject(err));

  return deferred.promise;
};

module.exports.getUserRequests = (filter) => {
  let
    deferred = Q.defer(),
    query = {};

  if (filter !== 'all') query['isClosed'] = filter === 'old';

  models.Request.find(query)
    .then(requests => deferred.resolve(requests))
    .catch(err => deferred.reject(err));

  return deferred.promise;
};

module.exports.connect = () => methods.connect();

module.exports.disconnect = () => methods.disconnect();

module.exports.getModels = () => models;

module.exports.getFileExtension = getFileExtension;

/** Schemas */
function refreshMongoose () {
  mongoose.Promise = Promise;
  mongoose.set('debug', false);
}

function refreshBaseSchema () {
  const baseSchema = new mongoose.Schema({
    name: String,
    description: String,
    logo: String,
    phone: String,
    fax: String,
    address: String,
    email: String,
    hasWinners: Boolean,
    platesRestored: Boolean
  }, {
    collection: 'base'
  });

  models.Base = mongoose.model('Base', baseSchema);

  models.Base.find({})
    .then(res => !res.length && models.Base.collection.insert([{
      name: 'Top Plate',
      description: 'An Awesome Web & Mobile Application',
      logo: 'assets/top_plate_approved.png',
      phone: '1-646-419-4452',
      fax: '1-347-402-0710',
      address: `US OFFICE (HEADQUARTERS)
      TOP PLATE, INC.
      EMPIRE STATE BUILDING,
      350 FIFTH AVENUE, 20ST FLOOR
      NEW YORK, NY 10118 USA
      `,
      email: 'some.email@gmail.com'
    }]))
    .catch(err => console.log(err));
}

function refreshUserSchema () {
  const userSchema = new mongoose.Schema({
    email: {
      type: String,
      unique: true,
      required: true
    },
    customProfile: {
      image: String,
      name: String,
      lastName: String,
      firstName: String,
      gender: String,
    },
    local: {
      image: String,
      name: String,
      lastName: String,
      firstName: String,
      gender: String,
      hashedPassword: String
    },
    google: {
      id: String,
      image: String,
      name: String
    },
    facebook: {
      id: String,
      image: String,
      name: String
    },
    lastLogged: {
      provider: String,
      token: String
    },
    currentToken: String,
    uploadedPlates: [String],
    likedPlates: [String],
    charityVotes: {
      type: Object,
      default: {}
    },
    warnings: [String],
    isRobot: {
      type: Boolean,
      default: false
    },
    isSuspended: {
      type: Boolean,
      default: false
    }
  }, {
    collection: 'registered-users',
    timestamps: true
  });

  userSchema.methods.checkToken = function (token) {
    return this.currentToken === token;
  };

  userSchema.methods.likePlate = function (plateId) {
    let
      user = this,
      deferred = Q.defer();

    models.Plate.findOne({_id: plateId})
      .then(plate => {

        if (!plate.canLike) deferred.resolve({message: 'can not like ' + plateId, status: 406});
        else {
          plate.likes = plate.likes || [];
          plate.likes.indexOf(user._id) < 0 && plate.likes.push(user._id);
          user.likedPlates.indexOf(plateId) < 0 && user.likedPlates.push(plateId);
          user.save(err => {
            if (err) deferred.reject(err);
            else plate.save(err => {
              if (err) deferred.reject(err);
              else {
                let normalizedResponse = plate.getNormalized();
                normalizedResponse.liked = true;
                deferred.resolve(normalizedResponse);
              }
            });
          });
        }
      })
      .catch(err => deferred.reject(err));

    return deferred.promise;
  };

  userSchema.methods.dislikePlate = function (plateId) {
    let
      user = this,
      deferred = Q.defer(),
      indexInList = user.likedPlates.indexOf(plateId);

    models.Plate.findOne({_id: plateId})
      .then(plate => {
        let indexOfUserId = plate.likes.indexOf(user._id);
        indexInList >= 0 && user.likedPlates.splice(indexInList, 1);
        indexOfUserId >= 0 && plate.likes.splice(indexOfUserId, 1);
        user.save(err => {
          if (err) deferred.reject(err);
          else plate.save(err => {
            if (err) deferred.reject(err);
            else {
              let normalizedResponse = plate.getNormalized();
              normalizedResponse.liked = false;
              deferred.resolve(normalizedResponse);
            }
          });
        });
      })
      .catch(err => deferred.reject(err));

    return deferred.promise;
  };

  userSchema.methods.updatePlate = function (plateId, fields) {

    let
      user = this,
      deferred = Q.defer(),
      fieldsThatCouldBeUpdated = {
        recipe: true,
        ingredients: true
      },
      isOwnRecipe = user.uploadedPlates.indexOf(plateId) > -1;

    if (!isOwnRecipe) deferred.reject({message: 'this plate is not owned by ' + user.name, status: 401});
    else models.Plate.findOne({'_id': plateId})
      .then(plate => {
        Object.keys(fieldsThatCouldBeUpdated).forEach(key => fields.hasOwnProperty(key) && (plate[key] = fields[key]));
        plate.save(err => {
          if (err) deferred.reject(err);
          else deferred.resolve({message: 'plate was updated'});
        });
      })
      .catch(err => deferred.reject(err));

    return deferred.promise;
  };

  userSchema.methods.login = function (userData) {
    let
      user = this,
      plates = {},
      provider = userData.provider,
      deferred = Q.defer();

    user.likedPlates.forEach(key => plates[key] = true);
    user.currentToken = userData.token;
    user.lastLogged.token = user.currentToken;
    user.lastLogged.provider = provider;

    if (provider === 'local') {
      if (!user[provider]) user[provider] = {
        name: userData.firstName + ' ' + userData.lastName,
        firstName: userData.firstName,
        lastName: userData.lastName,
        image: userData.image,
        gender: userData.gender,
        hashedPassword: userData.hashedPassword
      };
    } else {
      if (!user[provider] || !user[provider].id) user[provider] = {
        id: userData.id,
        name: userData.name,
        image: userData.image
      };
    }

    user.save(err => {
      if (err) deferred.reject(err);
      else deferred.resolve(user.getNormalized());
    });

    return deferred.promise;
  };

  userSchema.methods.logout = function (token) {
    let
      user = this,
      deferred = Q.defer();

    user.currentToken = null;

    user.save(err => {
      if (err) deferred.reject(err);
      else deferred.resolve({message: 'user logged out'});
    });

    return deferred.promise;

  };

  userSchema.methods.checkPassword = function (password) {
    if (!password || !this.passwordHash) return false;
    return global.authModule.compareHashes.call(this, password);
  };

  userSchema.methods.changePassword = function (reqParams) {
    let
      user = this,
      deferred = Q.defer(),
      localProfile = user.local;

    if (!localProfile) deferred.reject({message: 'Can not get local profile', status: 500});

    else global.authModule.comparePasswords(reqParams['password'], localProfile.hashedPassword)
      .then(checkResult => {
        if (checkResult) global.authModule.getHashedPassword(reqParams['newPassword'])
          .then(hashedPassword => {
            localProfile['hashedPassword'] = hashedPassword;
            models.User.collection.updateOne({_id: user._id}, {$set: {local: localProfile}})
              .then(() => deferred.resolve({message: 'User password updated'}))
              .catch(err => deferred.reject(err));
          })
          .catch(err => deferred.reject(err));
        else deferred.reject({message: 'Wrong password', status: 401});
      })
      .catch(err => deferred.reject(err));

    return deferred.promise;
  };

  userSchema.methods.getNormalized = function () {
    let
      user = this,
      plates = {},
      lastLoggedProvider = (user.lastLogged && user.lastLogged.provider) || 'google',
      providerData = user[lastLoggedProvider],
      userData = {};

    if (user.hasCustomProfile()) userData = user.customProfile;
    else {
      if (lastLoggedProvider === 'local') {
        userData['name'] = providerData.firstName + ' ' + providerData.lastName;
        userData['firstName'] = providerData.firstName;
        userData['lastName'] = providerData.lastName;
        userData['image'] = providerData.image;
        userData['gender'] = providerData.gender;
      } else userData = providerData;
    }

    user.likedPlates.forEach(key => plates[key] = true);
    userData['email'] = user.email;
    userData['image'] = userData['image'] || 'assets/icons/default_user_icon.png';

    return {
      _id: user._id,
      user: userData,
      likedPlates: plates,
      warning: user.warnings,
      email: user.email,
      canVote: !user.charityVotes[getMonthName()]
    };
  };

  userSchema.methods.getNormalizedForAdmin = function () {
    let
      user = this,
      provider = user.lastLogged.provider;

    return {
      _id: user._id,
      email: user.email,
      name: user[provider].name,
      image: user[provider].image,
      likedPlates: user.likedPlates,
      uploadedPlates: user.uploadedPlates,
      status: user.isSuspended ? 'Suspended' : 'Active',
      warnings: user.warnings
    };
  };

  userSchema.methods.getLikedPlates = function () {
    let
      user = this,
      plates = {};

    user.likedPlates.forEach(key => plates[key] = true);

    return plates;
  };

  userSchema.methods.updateProfile = function (profileUpdateData) {
    let
      user = this,
      deferred = Q.defer(),
      provider = user.lastLogged.provider,
      userData = user[provider],
      profile = user.customProfile || {},
      updatePlates = false;

    ['firstName', 'lastName', 'image', 'gender'].forEach(key => {
      if (key !== 'gender') updatePlates = updatePlates || profileUpdateData.hasOwnProperty(key);
      profile[key] = profileUpdateData.hasOwnProperty(key) && profileUpdateData[key] !== null ?
        profileUpdateData[key] : (profile.hasOwnProperty(key) && profile[key] !== null ?
          profile[key] : (userData[key] || ''));
    });

    profile['name'] = profile['firstName'] + ' ' + profile['lastName'];

    models.User.collection.updateOne({_id: user._id}, {$set: {customProfile: profile}})
      .then(() => models.User.findOne({_id: user._id})
        .then(updatedUser => {
          let normalized = updatedUser.getNormalized();
          normalized['provider'] = provider;
          normalized['token'] = updatedUser.lastLogged.token;

          if (updatePlates) {

            let plateAuthor = {
              name: profile.name,
              id: user._id.toString(),
              image: profile.image
            };

            models.Plate.collection.updateMany(
              {_id: {$in: user.uploadedPlates.map(id => mongoose.Types.ObjectId(id))}},
              {$set: {author: plateAuthor}}
            )
              .then(updateRes => deferred.resolve(normalized))
              .catch(err => deferred.reject(err));
          }
          else deferred.resolve(normalized);
        })
        .catch(err => deferred.reject(err))
      )
      .catch(err => deferred.reject(err));

    return deferred.promise;
  };

  userSchema.methods.hasCustomProfile = function () {
    return this.customProfile && ['name', 'firstName', 'lastName', 'gender', 'image'].every(key => {
      return this.customProfile[key] !== null && this.customProfile[key] !== undefined;
    });
  };

  models.User = mongoose.model('User', userSchema);

  // models.User.findOne({email: 'michael.myers@gmail.com'})
  //   .then(testUser => {
  //     if (testUser) console.log('special user already created');
  //     else authModule.getHashedPassword('test')
  //       .then(hashedPassword => {
  //
  //         let newUser = new models.User({
  //           email: 'michael.myers@gmail.com',
  //           isRobot: true,
  //           local: {
  //             name: 'Michael Myers',
  //             firstName: 'Michael',
  //             lastName: 'Myers',
  //             gender: 'male',
  //             image: 'assets/user_icons/michael_myers.png',
  //             hashedPassword: hashedPassword
  //           }
  //         });
  //
  //         newUser.save(err => {
  //           if (err) console.log(err);
  //           else console.log('special user created');
  //         });
  //       })
  //       .catch(err => console.log(err));
  //   })
  //   .catch(err => console.log(err));

  // models.User.collection.updateMany({}, {$set: {charityVotes: {}}})
  //   .then(() => console.log('users were updated'))
  //   .catch(err => console.log(err));
}

function refreshPlateSchema () {

  const plateSchema = new mongoose.Schema({
    name: {
      type: String,
      required: true
    },
    environment: {
      type: String,
      required: true
    },
    email: String,
    imageSource: {
      type: String,
      required: true
    },
    imageExtension: {
      type: String,
      required: true
    },
    imageContentType: {
      type: String,
      required: true
    },
    week: String,
    geo: [Number], /** long lat double */
    country: String,
    city: String,
    address: String,
    recipe: String,
    ingredients: [String],
    restaurantName: {
      type: String,
      required: true
    },
    likes: [String],
    author: {
      id: String,
      name: String,
      image: String
    },
    isReady: Boolean,
    canLike: Boolean,
    isFixed: Boolean,
    isTest: Boolean
  }, {
    collection: 'plates',
    timestamps: true
  });



  plateSchema.index({createdAt: 1});
  plateSchema.index({week: 1});

  plateSchema.methods.likeIt = function (userId) {

    let
      plate = this,
      deferred = Q.defer(),
      alreadyDone = plate.likes.indexOf(userId) > -1;

    if (alreadyDone) deferred.resolve(null);
    else {
      plate.likes.push(userId);
      plate.save(err => {
        if (err) deferred.reject(err);
        else deferred.resolve({message: 'you liked it'});
      });
    }

    return deferred.promise;
  };

  plateSchema.methods.refreshFiles = function (imageBinaryData, additionalMessage) {

    let
      thisOne = this,
      deferred = Q.defer(),
      rootDir = './src/uploaded',
      plateDir = rootDir + '/' + thisOne.imageSource,
      originalImageName = plateDir + '/original.' + thisOne.imageExtension,
      sizes = [
        {
          name: 'original',
          scale: 1
        },
        {
          name: 'big',
          scale: .8
        },
        {
          name: 'medium',
          scale: .6
        },
        {
          name: 'small',
          scale: .4
        }
      ];

    console.log('processing ' + thisOne.imageSource + (additionalMessage || ''));

    if (!fs.existsSync(rootDir)) fs.mkdirSync(rootDir);
    if (!fs.existsSync(plateDir)) fs.mkdirSync(plateDir);
    if (fs.existsSync(originalImageName)) {
      console.log('is up to date');
      deferred.resolve({message: 'up to date'});
    }
    else jimp.read(imageBinaryData)
      .then(res => createSizedFiles(res))
      .catch(err => {
        console.log(err);
        deferred.reject(err);
      });

    return deferred.promise;

    function createSizedFiles (originalImage) {

      let
        i = 0,
        createSizedFile = size => {
          if (!size) deferred.resolve({message: 'all images were created'});
          else originalImage
            .scale(size.scale)
            .write(plateDir + '/' + size.name + '.' + thisOne.imageExtension, function (err) {
              if (err) deferred.reject(err);
              else createSizedFile(sizes[++i]);
            });
        };

      createSizedFile(sizes[i]);
    }
  };

  plateSchema.methods.getNormalized = function (imageSize) {
    let plate = this;
    return {
      _id: plate._id,
      name: plate.name,
      images: [plate.imageSource + '/' + (imageSize || 'medium') + '.' + plate.imageExtension],
      author: plate.author,
      address: plate.address,
      likes: plate.likes.length,
      recipe: plate.recipe,
      ingredients: (plate.ingredients.length && plate.ingredients) || null,
      hasRecipe: !!plate.recipe,
      environment: plate.environment,
      canLike: plate.canLike,
      status: plate.isReady,
      createdAt: moment(plate.createdAt).format('YYYY-MM-DD HH:mm:ss'),
      date: plate.createdAt
    }
  };

  plateSchema.methods.getAuthor = function () {
    let
      plate = this,
      deferred = Q.defer();

    models.User.findOne({_id: plate.author})
      .then(user => deferred.resolve(user))
      .catch(err => deferred.reject(err));

    return deferred.promise;
  };

  models.Plate = mongoose.model('Plate', plateSchema);

}

function refreshCharitySchema () {

  const charitySchema = new mongoose.Schema({
    name: String,
    description: String,
    image: String,
    link: String,
    votes: Object,
    status: {
      type: Boolean,
      default: true
    }
  }, {
    collection: 'charities',
    timestamps: true
  });

  charitySchema.methods.vote = function (votingId) {
    let
      charity = this,
      currentMonthName = getMonthName(),
      deferred = Q.defer();

    models.User.findOne({_id: votingId})
      .then(user => {
        if (user.charityVotes[currentMonthName]) deferred.reject({
          message: 'User can vote only one time during month', status: 418
        });
        else {
          user.charityVotes[currentMonthName] = charity._id;
          charity.votes[currentMonthName] = charity.votes[currentMonthName] || [];
          charity.votes[currentMonthName].push(votingId);

          models.User.collection.updateOne({_id: votingId}, {$set: {charityVotes: user.charityVotes}})
            .then(() => models.Charity.collection.updateOne({_id: charity._id}, {$set: {votes: charity.votes}})
              .then(() => deferred.resolve({message: 'Thank you for your vote!'}))
              .catch(err => deferred.reject(err))
            )
            .catch(err => deferred.reject(err));
        }
      })
      .catch(err => deferred.reject(err));

    return deferred.promise;
  };

  charitySchema.methods.getTotalVotes = function () {
    let
      charity = this,
      totalVotes = 0;

    Object.keys(charity.votes).forEach(key => totalVotes += charity.votes[key].length);

    return totalVotes;
  };

  charitySchema.methods.getMonthlyVotes = function () {
    let
      charity = this,
      currentMonthName = getMonthName(),
      votes = charity.votes[currentMonthName];

    return (votes && votes.length) || 0;
  };

  charitySchema.methods.getNormalized = function () {
    let
      item = this,
      itemReplica = {};

    ['_id', 'createdAt', 'description', 'link', 'image', 'name'].forEach(key => itemReplica[key] = item[key]);
    itemReplica['votes'] = item.getTotalVotes();
    itemReplica['votesMonthly'] = item.getMonthlyVotes();
    itemReplica['status'] = item.status ? 'Active' : 'Inactive';

    return itemReplica;
  };

  models.Charity = mongoose.model('Charity', charitySchema);

  // models.Charity.collection.updateMany({}, {$set: {status: true}})
  //   .then(() => console.log('charities were updated'))
  //   .catch(err => console.log(err));
}

function refreshWinnerSchema () {

  const winnerSchema = new mongoose.Schema({
    environment: String,
    name: String,
    year: Number,
    month: Number,
    week: Number,
    likes: Number,
    plate: String
  }, {
    collection: 'winners',
    timestamp: true
  });

  winnerSchema.index({week: 1});
  winnerSchema.index({plate: 1});

  models.Winner = mongoose.model('Winner', winnerSchema);
}

function refreshRequestsSchema () {

  let requestSchema = new mongoose.Schema({
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    response: {
      type: String,
      default: ''
    },
    isClosed: {
      type: Boolean,
      default: false
    }
  }, {
    collection: 'user-requests',
    timestamp: true
  });

  requestSchema.methods.close = function () {
    let
      deferred = Q.defer(),
      userRequest = this;

    userRequest.isClosed = true;

    userRequest.save(err => {
      if (err) deferred.reject(err);
      else deferred.resolve({message: 'request' + userRequest._id + ' is closed'});
    });

    return deferred.promise;
  };

  models.Request = mongoose.model('Request', requestSchema);
}

function refreshAdvertisementSchema () {

  let advertisementSchema = new mongoose.Schema({
    name: String,
    link: String,
    image: String
  }, {
    collection: 'advertisements',
    timestamp: true
  });

  advertisementSchema.methods.getNormalized = function () {
    let replica = {};
    ['name', 'link', 'image'].forEach(key => replica[key] = this[key]);
    replica['isAdvertisementBanner'] = true;
    return replica;
  };

  models.Advertisement = mongoose.model('Advertisement', advertisementSchema);

  // models.Advertisement.find({})
  //   .then(res => {
  //     if (res.length) console.log('Advertisements banners ready');
  //     else models.Advertisement.collection.insertMany([
  //       {
  //         name: 'Mivina',
  //         link: 'https://www.nestle.ua/brands/culinary/mivina',
  //         image: 'assets/advertising/adv_test_1.jpg'
  //       },
  //       {
  //         name: 'Dimmu Borgir',
  //         link: 'https://www.dimmu-borgir.com/',
  //         image: 'assets/advertising/adv_test_2.jpg'
  //       }
  //     ])
  //       .then(res => console.log('New advertisements banners added'))
  //       .catch(err => console.log(err));
  //   })
  //   .catch(err => console.log(err));
}

function getFileExtension (contentType) {
  return {
    'image/png': 'png',
    'image/gif': 'gif',
    'image/jpeg': 'jpg'
  }[contentType];
}

function getWeekName () {
  let date = moment();
  return date.year() + '_' + date.month() + '_' + date.week();
}

function getMonthName () {
  let date = moment();
  return date.year() + '_' + date.month();
}

function mergeWithAdvBanners (normalizedPlates) {
  let deferred = Q.defer();

  models.Advertisement.find({})
    .then(banners => {
      let
        normalizedBanners = banners.map(banner => banner.getNormalized()),
        response = [],
        bannersLength = normalizedBanners.length,
        bannersIterator = 0;

      if (normalizedPlates.length) normalizedPlates.forEach((plate, i) => {
        if (bannersLength && i && !((i + 1) % 3)) response.push(normalizedBanners[bannersIterator++ % bannersLength]);
        response.push(plate);
      });
      deferred.resolve(response);
    })
    .catch(err => deferred.reject(err));

  return deferred.promise;
}


function getSorted (arr, prop) {
  return arr.sort((a, b) => {
    let propA = a[prop], propB = b[prop];
    return propA < propB ? 1 : (propA > propB ? -1 : 0);
  });
}

