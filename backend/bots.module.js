const
  Q = require('q'),
  https = require('https'),
  fs = require('fs'),
  jimp = require('jimp'),
  cron = require('node-cron'),
  moment = require('moment'),
  mongoose = require('mongoose');

module.exports.refreshBots = refreshBots;

module.exports.setAppSchedules = setAppSchedules;

function refreshBots () {

  let
    deferred = Q.defer(),
    dbModule = global.dbModule,
    userModel = dbModule.getModels().User,
    plateModel = dbModule.getModels().Plate,
    charityModel = dbModule.getModels().Charity;

  userModel.find({isRobot: true})
    .then(bots => bots.length ? setBotsSchedules(bots) : createBots())
    .catch(err => deferred.reject(err));

  return deferred.promise;

  function createBots () {
    let
      bots = ['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh'],
      len = bots.length,
      createdBots = 0;

    bots
      .map((botName, i) => {
        return {
          email: 'bot_' + i + '.mail@botmail.com',
          id: 'bot_' + i,
          idToken: getRandomToken(),
          image: 'assets/user_icons/bot_' + i + '.png',
          name: botName + ' Bot',
          provider: 'google',
          token: getRandomToken(),
          isRobot: true
        };
      }).forEach(botData => {
        dbModule.createUser(botData)
          .then(() => {
            createdBots += 1;
            if (createdBots === len) userModel.find({isRobot: true})
              .then(newBots => setBotsSchedules(newBots))
              .catch(err => deferred.reject(err));
          });
      });
  }

  function setBotsSchedules (bots) {
    bots.forEach(bot => {
      bot.lastLogged = {provider: 'google'};
      bot.save(err => {
        if (err) console.log(err);
        else {
          likeRandomPlate(bot);
          createRandomPlate(bot, true);
          likeCharityChoice(bot);
        }
      });
    });

    deferred.resolve('bots scheduled');
  }

  function likeRandomPlate (bot) {

    let twentyMinutes = 1000 * 60 * 20;

    plateModel.find({canLike: true})
      .then(plates => {
        let plateToLike = plates[Math.floor(Math.random() * plates.length)];

        if (plateToLike) bot.likePlate(plateToLike['_id']);

        setTimeout(() => likeRandomPlate(bot), twentyMinutes + Math.floor(Math.random() * twentyMinutes));
      })
      .catch(err => console.log(err));
  }

  function createRandomPlate (bot, skipFirst) {

    let
      oneHour = 1000 * 60 * 60,
      imagesDir = './src/assets/restaurant',
      images = fs.readdirSync(imagesDir);

    if (skipFirst) loopPlateCreation();
    else fs.readFile(imagesDir + '/' + images[Math.floor(Math.random() * images.length)], function (err, res) {
      if (err) console.log(err);
      else {

        let
          binaryString = res.toString('binary'),
          environment = ['restaurant', 'homemade'][Math.floor(Math.random() * 2)],
          randomPlate = {
            name: getRandomPlateName(),
            environment: environment,
            email: bot.email,
            image: binaryString,
            extension: 'jpg',
            contentType: 'image/jpeg',
            address: getRandomAddress(),
            recipe: environment === 'homemade' ? 'Get something, add somewhat, prepare somehow, add salt and pepper, eat' : '',
            ingredients: environment === 'homemade' ? [
              '4 something',
              '2/4 somewhat',
              'salt',
              'pepper'
            ] : [],
            restaurantName: environment === 'homemade' ? '' : 'some restaurant'
          };

        dbModule.createPlate(randomPlate, bot['_id'])
          .then(res => loopPlateCreation())
          .catch(err => {
            console.log(err);
            loopPlateCreation();
          });
      }
    });

    function getRandomPlateName () {
      let
        modes = ['grilled', 'fresh', 'boiled', 'roasted'],
        types = ['pork', 'vegetables', 'fish', 'meat', 'shrimps', 'mushrooms', 'eggs', 'something', 'cat'],
        close = ['wine sauce', 'garlic', 'pepper', 'something yummy', 'sour cream', 'mayonnaise'];

      return modes[Math.floor(Math.random() * modes.length)] + ' ' +
        types[Math.floor(Math.random() * types.length)] + ' with ' +
        close[Math.floor(Math.random() * close.length)];
    }

    function getRandomAddress () {
      let locations = [
        'Niflheimr, North Ginnungagap',
        'Muspelheim, South Ginnungagap',
        'Jötunheimr, East Midgard',
        'Helheim, Gjöll',
        'Svartalfheim'
      ];

      return locations[Math.floor(Math.random() * locations.length)];
    }

    function loopPlateCreation () {
      userModel.findOne({_id: bot['_id']})
        .then(_bot => {
          let
            numberOfCreatedPlates = _bot.uploadedPlates.length,
            delay = numberOfCreatedPlates < 10 ? 50000 : oneHour;

          setTimeout(() => createRandomPlate(bot), delay + Math.floor(Math.random() * delay));
        })
        .catch(err => console.log(err));
    }
  }

  function likeCharityChoice (bot) {

    let oneHour = 1000 * 60 * 60;

    charityModel.find({})
      .then(charityItems => {
        let
          len = charityItems.length,
          charityItem = charityItems[Math.floor(Math.random() * len)];

        charityItem.vote(bot._id)
          .then(() => setTimeout(() => likeCharityChoice(bot), oneHour + Math.floor(Math.random() * oneHour)))
          .catch(err => console.log(err));
      });
  }

  function getRandomToken () {
    let
      symbols = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.&$%'.split(''),
      symbolsLength = symbols.length,
      token = '',
      i = 0, len = 10;

    for (; i < len; i++){ token += Math.floor(Math.random() * symbolsLength); }

    return token;
  }
}

function setAppSchedules () {

  let
    dbModels = global.dbModule.getModels(),
    baseData;

  return;

  dbModels.Base.findOne()
    .then(data => {
      baseData = data;
      if (!baseData['hasWinners']) defineWinners();
      else if (!baseData['platesRestored']) refreshIndexes();
      else console.log('previous weeks winners are ready');
    })
    .catch(err => console.log(err));

  function defineWinners () {

    let
      currentWeek = moment().week(),
      itemsToFix = [],
      weeks = {},
      winners = {};

    dbModels.Plate.find({isReady: true}, {
      _id: 1,
      createdAt: 1,
      likes: 1
    })
      .then(res => {
        res.forEach(plate => {
          let
            date = moment(plate.createdAt),
            year = date.year(),
            month = date.month(),
            week = date.week(),
            name = year + '_' + month + '_' + week,
            item = {
              name: name,
              year: year,
              month: month,
              week: week,
              plate: plate._id,
              likes: plate.likes.length
            };

          if (week < currentWeek) {
            weeks[name] = weeks[name] || [];
            weeks[name].push(item);
            itemsToFix.push(mongoose.Types.ObjectId(item.plate));
          }
        });

        Object.keys(weeks).forEach(key => {
          let
            sorted = weeks[key].sort((a, b) => {
              let wa = a.likes, wb = b.likes;
              return wa < wb ? 1 : (wa > wb ? -1 : 0);
            }),
            weight = (sorted[0] && sorted[0].likes) || 0;

          if (weight > 0) winners[key] = sorted.filter(item => item.likes === weight);
        });

        dbModels.Plate.collection
          .updateMany({_id: {$in: itemsToFix}}, {$set: {isFixed: true, canLike: false}})
          .then(() => {
            let winnersArray = [];
            Object.keys(winners).forEach(weekKey => winnersArray = winnersArray.concat(winners[weekKey]));

            console.log('now preparing winners');

            dbModels.Winner.collection.insertMany(winnersArray)
              .then(() => {
                dbModels.Base.findOne()
                  .then(data => {
                    data.hasWinners = true;
                    data.save(err => {
                      if (err) console.log(err);
                      else console.log('now we have winners');
                    });
                  })
                  .catch(err => console.log(err));
              })
              .catch(err => console.log(err));
          })
          .catch(err => console.log(err));
      })
      .catch(err => console.log(err));
  }
}

function refreshIndexes () {

  let
    authors = {},
    platesToUpdate = [],
    dbModels = global.dbModule.getModels();

  dbModels.User.find({})
    .then(users => {
      users.forEach(user => {
        if (user.isRobot) authors[user['google']['name']] = user['_id'];
        else authors[user[user.lastLogged.provider]['name']] = user['_id'];
      });

      dbModels.Plate.find({})
        .then(plates => {
          let needToBeUpdated = plates.filter(plate => !plate.author.id && authors[plate.author.name]);
          platesToUpdate = platesToUpdate.concat(needToBeUpdated);
          updatePlate(0);
        })
        .catch(err => console.log(err));
    })
    .catch(err => console.log(err));

  function updatePlate (i) {
    let nextPlate = platesToUpdate[i];

    if (!nextPlate) {console.log('plates up to date')}
    else {
      nextPlate.author['id'] = authors[nextPlate.author.name];
      nextPlate.save(err => {
        if (err) console.log(err);
        else updatePlate(i + 1);
      });
    }
  }
}

