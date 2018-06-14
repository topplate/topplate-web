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
          firstName: initialData.firstName,
          lastName: initialData.lastName,
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

module.exports.getUsers = (filter) =>  {
  let
    deferred = Q.defer(),
    query = {};

  if (filter !== 'all') query['isSuspended'] = filter === 'suspended';

  models.User.find(query)
    .then(users => deferred.resolve(users.map(user => user.getNormalizedForAdmin())))
    .catch(err => deferred.reject(err));

  return deferred.promise;
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
        lastLoggedProvider = plateAuthor.lastLogged.provider,
        profileData = plateAuthor[lastLoggedProvider],
        newPlate = new Plate(creationData);

      newPlate.author = {
        id: authorId,
        name: profileData.name,
        image: profileData.image
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

module.exports.getPlates = (env, lastId, lim = 11, size = 'medium') => {
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
      .then(plates => deferred.resolve(plates.map(plate => plate.getNormalized(size))))
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

module.exports.getPlatesAdmin = (statusFilter, periodFilter, envFilter) => {
  let
    deferred = Q.defer(),
    query = {};

  if (statusFilter !== 'all') query['isReady'] = statusFilter === 'approved';
  if (periodFilter !== 'all') query['isFixed'] = periodFilter === 'old';
  if (envFilter !== 'all') query['environment'] = envFilter;

  models.Plate.find(query)
    .then(plates => deferred.resolve(plates.map(plate => plate.getNormalized())))
    .catch(err => deferred.reject(err));

  return deferred.promise;
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

          models.Plate.find({_id: {$in: relatedPlates}, environment: selectedPlate.environment})
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

  if (string === null) deferred.resolve([]);

  else {
    query[property] = new RegExp(string, 'ig');
    models.Plate.find(query)
      .then(res => deferred.resolve(res.sort((a, b) => {
        let propA = a.createdAt, propB = b.createdAt;
        return propA > propB ? -1 : (propB > propA ? 1 : 0);
      }).map(item => item.getNormalized())))
      .catch(err => deferred.reject(err));
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

module.exports.getCharityItems = () => {
  let
    deferred = Q.defer();

  models.Charity.find({})
    .then(items => deferred.resolve(items.map(item => {
        let itemReplica = {};
        ['_id', 'createdAt', 'description', 'image', 'name', 'votes'].forEach(key => itemReplica[key] = item[key]);
        return itemReplica;
    })))
    .catch(err => deferred.reject(err));

  return deferred.promise;
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
            lenB += 1;
            plates.push(plate.getNormalized('big'));
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
    else deferred.resolve({message: 'Thank you for you request'});
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

  if (query !== 'all') query['isClosed'] = filter === 'old';

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
      name: String
    },
    local: {
      image: String,
      lastName: String,
      firstName: String,
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
    charityVotes: [String],
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
          else deferred.resolve({message: 'plate ' + plateId + ' was updated'});
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
        name: userData.name,
        image: userData.image,
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
      else deferred.resolve({
        _id: user._id,
        user: user[provider],
        token: user.currentToken,
        likedPlates: plates,
        email: user.email
      });
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

  userSchema.methods.changePassword = function (newPassword) {
    let
      deferred = Q.defer(),
      context = this;

    if (!newPassword || !context.passwordHash) deferred.reject({ status: 500, message: 'Something went wrong'});
    else {
      methods.connect();
      context.passwordHash = global.authModule.getHashedPassword.call(context, newPassword);
      context.save(err => {
        methods.disconnect();
        if (err) deferred.reject(err);
        else deferred.resolve('password changed');
      });
    }

    return deferred.promise;
  };

  userSchema.methods.getNormalized = function () {
    let
      user = this,
      plates = {},
      lastLoggedProvider = (user.lastLogged && user.lastLogged.provider) || 'google',
      providerData = user[lastLoggedProvider],
      userData = {};

    if (lastLoggedProvider === 'local') {
      userData['name'] = providerData.firstName + ' ' + providerData.lastName;
      userData['firstName'] = providerData.firstName;
      userData['lastName'] = providerData.lastName;
      userData['image'] = providerData.image;
    } else userData = providerData;

    user.likedPlates.forEach(key => plates[key] = true);

    return {
      _id: user._id,
      user: userData,
      likedPlates: plates,
      warning: user.warnings
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

  models.User = mongoose.model('User', userSchema);

  // models.User.find({})
  //   .then(users => {
  //     users.forEach(user => {
  //       user.isSuspended = false;
  //       user.save(err => {
  //         if (err) console.log(err);
  //         else console.log(user._id + ' is updated');
  //       });
  //     })
  //   });
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

  plateSchema.index({environment: 1});
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
      status: plate.isReady
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
    votes: [String]
  }, {
    collection: 'charities',
    timestamps: true
  });

  charitySchema.methods.vote = function (votingId) {
    let
      charity = this,
      deferred = Q.defer();

    if (charity.votes.indexOf(votingId) > -1) deferred.resolve(getNormalizedResponse(null, charity.votes));
    else {
      charity.votes.push(votingId);
      charity.save(err => {
        if (err) deferred.reject(err);
        else models.User.findOne({_id: votingId})
          .then(user => {
            user.charityVotes = user.charityVotes || [];
            user.charityVotes.push(charity._id);
            user.save(err => {
              if (err) deferred.reject(err);
              else deferred.resolve(getNormalizedResponse(user.charityVotes, charity.votes));
            });
          });
      });
    }
    return deferred.promise;

    function getNormalizedResponse (userCharityVotes, charityVotes) {
      return {
        userVotes: userCharityVotes,
        charityVotes: charityVotes
      };
    }
  };

  models.Charity = mongoose.model('Charity', charitySchema);

  models.Charity.find({})
    .then(res => !res.length && models.Charity.collection.insert([
      {
        name: 'Live United',
        description: `LIVE UNITED. It\'s a credo. A mission. A goal. A constant reminder that when we reach out a hand to one, we influence the condition of all.`,
        image: 'assets/charity/live_united.jpg',
        votes: []
      },
      {
        name: 'Task Force for Global Health',
        description: `TASK FORCE FOR GLOBAL HEALTH. We help control and eliminate debilitating infectious diseases and strengthen systems that protect and promote health.`,
        image: 'assets/charity/task_force.jpg',
        votes: []
      },
      {
        name: 'Salvation Army',
        description: `The story of The Salvation Army, a Christian Church working worldwide for more than 150 years.`,
        image: 'assets/charity/salvation_army.jpg',
        votes: []
      },
      {
        name: 'St. Jude Children\'s Research Hospital',
        description: `ST. JUDE CHILDREN'S RESEARCH HOSPITAL. St. Jude is leading the way the world understands, treats and defeats childhood cancer and other life-threatening diseases.`,
        image: 'assets/charity/st_jude.jpg',
        votes: []
      }
    ]))
    .catch(err => console.log(err));
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

function getSorted (arr, prop) {
  return arr.sort((a, b) => {
    let propA = a[prop], propB = b[prop];
    return propA < propB ? 1 : (propA > propB ? -1 : 0);
  });
}

