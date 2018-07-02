const
  Q = require('q'),
  https = require('https'),
  fs = require('fs'),
  jimp = require('jimp'),
  cron = require('node-cron'),
  d3 = require('d3'),
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
    charityModel = dbModule.getModels().Charity,
    winnerModel = dbModule.getModels().Winner;

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
    let
      len = bots.length,
      i = 0;

    bots.forEach(bot => {
      bot.lastLogged = {provider: 'google'};
      bot.save(err => {
        if (err) console.log(err);
        else {
          createRandomPlate(bot, true, (message) => {
            console.log(message);
            i += 1;
            if (i === len) likeTestPlates()
              .then(() => defineWinners())
              .catch(err => deferred.reject(err));
          });
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

  function createRandomPlate (bot, skipFirst, callback) {

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
            restaurantName: environment === 'homemade' ? '' : 'some restaurant',
            isTest: true
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
        .then(_bot =>_bot.uploadedPlates.length < 3 ?
          setTimeout(() => createRandomPlate(bot, false, callback), 3000 + Math.floor(Math.random() * 3000)) :
          callback({message: 'bot ' + bot['_id'] + ' is ready'})
        ).catch(err => console.log(err));
    }
  }

  function likeTestPlates () {

    let
      platesDeferred = Q.defer(),
      allPlatesLen = 21;

    plateModel.find({isTest: true})
      .then(plates => {
        //
        // console.log('plates to like');
        //
        // console.log(plates);
        //
        // console.log('***************');

        let
          platesLen = plates.length,
          i = 0;

        if (platesLen < allPlatesLen) platesDeferred.resolve({message: 'likes are done'});
        else plates.forEach(plate => {
          let
            randomNumberOfLikes = Math.floor(Math.random() * 10000),
            ii = 0;

          for (; ii < randomNumberOfLikes; ii++) plate.likes.push(getRandomToken());
          plate.save(err => {
            if (err) platesDeferred.reject(err);
            else {
              i += 1;
              platesLen === i && platesDeferred.resolve({message: 'all pates were liked'});
            }
          });
        });
      })
      .catch(err => platesDeferred.reject(err));

    return platesDeferred.promise;
  }

  function defineWinners () {

    winnerModel.find({})
      .then(winners => !winners.length && _defineWinners())
      .catch(err => console.log(err));

    function _defineWinners () {

      let
        currentWeek = moment().week(),
        itemsToFix = [],
        weeks = {},
        winners = {};

      plateModel.find({isTest: true}, {
        _id: 1,
        createdAt: 1,
        likes: 1,
        environment: 1
      })
        .then(plates => {
          plates.forEach(plate => {
            let
              createdAt = moment().subtract(Math.floor(Math.random() * 4), 'week'),
              year = createdAt.year(),
              month = createdAt.month(),
              week = createdAt.week(),
              name = year + '_' + month + '_' + week + '_' + plate.environment,
              item = {
                environment: plate.environment,
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

          console.log(itemsToFix);

          plateModel.collection
            .updateMany({_id: {$in: itemsToFix}}, {$set: {isFixed: true, canLike: false}})
            .then(updateRes => {
              Object.keys(winners).forEach(key => {
                console.log('preparing ' + key + ' week winner...');
                winners[key].forEach(item => {
                  let newWinner = new winnerModel(item);
                  newWinner.save(err => {
                    if (err) console.log(err);
                    else console.log(newWinner.plate + ' saved as winner of ' + key + 'week');
                  });
                })
              });
            })
            .catch(err => console.log(err));
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
          .then(() => setTimeout(() => likeCharityChoice(bot), 3000 + Math.floor(Math.random() * 3000)))
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
    currentWeekName = getWeekName(),
    cronTask = cron.schedule('0 0 0 * * Monday', () => {
      console.log('***** DEFINING WINNERS *****');
      currentWeekName = getWeekName();
      doTask();
    }, false);

  // let testCronTask = cron.schedule('*/5 * * * * *', () => {
  //   console.log('TICK TACK!!!');
  // }, true);

  doTask();

  cronTask.start();

  function doTask () {
    getPlates()
      .then(plates => defineWinners(plates))
      .catch(err => console.log(err));
  }

  function getPlates () {
    let deferred = Q.defer();

    dbModels.Plate.find({
      isReady: true,
      canLike: true,
      week: {$ne: currentWeekName},
    })
      .then(plates => deferred.resolve(plates))
      .catch(err => deferred.reject(err));

    return deferred.promise;
  }

  function defineWinners (plates) {
    if (!plates || !plates.length) {
      console.log('***** NO NEW WINNERS *****');
      return;
    }
    let
      weeks = {},
      winners = [],
      ids = plates.map(plate => plate._id);

    plates.forEach(plate => {
      let weekName = plate.week + '#' + plate.environment;
      weeks[weekName] = weeks[weekName] || {
        max: 0,
        environment: plate.environment,
        plates: []
      };
      weeks[weekName].plates.push(plate);
    });

    Object.keys(weeks).forEach(key => {
      weeks[key].max = d3.max(
        weeks[key].plates,
        (d) => (d.likes && d.likes.length) || 0
      );

      weeks[key].max && weeks[key].plates
        .filter(plate => plate.likes.length === weeks[key].max)
        .forEach(plate => {
          let date = plate.week.split('_').map(str => +str);
          winners.push({
            environment: plate.environment,
            name: plate._id.toString(),
            year: date[0],
            month: date[1],
            week: plate.week,
            likes: weeks[key].max,
            plate: plate._id.toString()
          });
        });
    });

    if (winners && winners.length) dbModels.Winner.collection.insertMany(winners)
      .then(res => dbModels.Plate.collection.updateMany(
          {_id: {$in: ids}},
          {$set: {canLike: false}}
        )
        .then(platesRes => {
          console.log('***** WE HAVE WINNERS!!! *****');
        })
        .catch(err => console.log(err))
      )
      .catch(err => console.log(err));

    else console.log('***** NOT ENOUGH LIKES TO DEFINE WINNERS *****');
  }
}

function getWeekName () {
  let date = moment();
  return date.year() + '_' + date.month() + '_' + date.week();
}

