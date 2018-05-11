const

  winston = require('winston');

module.exports.getLogger = getLogger;

function getLogger () {

  let consoleTransport = new winston.transports.Console({

      colorize: true,

      level: 'debug',

      label: 'asdasd'

    });

  return new winston.Logger({

    transports: [consoleTransport]

  });

}



