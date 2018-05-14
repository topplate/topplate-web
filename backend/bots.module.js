const
  Q = require('q'),
  https = require('https'),
  fs = require('fs'),
  jimp = require('jimp'),
  cron = require('node-cron'),
  moment = require('moment');

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

  // let
  //   currentMoment = moment.utc(),
  //   startOfWeek = moment.utc(currentMoment),
  //   currentYear = currentMoment.year(),
  //   currentMonth = currentMoment.month(),
  //   currentDay = currentMoment.date();
  //
  // console.log(startOfWeek.day());
}

