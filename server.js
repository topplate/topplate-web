const
  CONSTANTS = require('./app-constants.json'),
  express = require('express'),
  favicon = require('express-favicon'),
  bodyParser = require('body-parser'),
  cookieParser = require('cookie-parser'),
  morgan = require('morgan'),
  session = require('express-session'),
  passport = require('passport'),
  request = require('request'),
  connectFlash = require('connect-flash'),
  https = require('https'),
  fs = require('fs'),
  app = express();

app.set('dbHost', 'localhost');
app.set('dbPort', '27017');
app.set('dbPath', 'mongodb://' + app.get('dbHost') + ':' + app.get('dbPort'));
app.set('dbName', 'top-plate-db');
app.set('pathToConfig', 'app-config.json');
app.set('defaultLanguage', 'en');
app.set('indexPage', __dirname + '/dist/index.html');
// app.use(morgan('dev'));
app.use(cookieParser());
app.use(favicon(__dirname + '/dist/assets/favicon.ico'));
app.use(session({
  secret: 'somebigsecret',
  saveUninitialized: true,
  resave: true
}));
app.use(bodyParser.json({
  parameterLimit: 500000,
  limit: '50mb',
  extended: true
}));
app.use(bodyParser.urlencoded({
  parameterLimit: 1000000,
  limit: '100mb',
  extended: true
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(connectFlash());
app.use(express.static(getRelatedPath('/dist')));
app.use(express.static(getRelatedPath('/src/uploaded')));

refreshModules();

runServer(true);

function refreshModules () {
  global.getApp = () => app;
  global.authModule = require('./backend/auth.module');
  global.dbModule = require('./backend/db.module');
  global.logModule = require('./backend/log.module');
  global.apiModule = require('./backend/api.module');
  global.botsModule = require('./backend/bots.module');
  global.awsModule = require('./backend/aws.module');

}

function runServer (refreshPlates) {

  let
    logger = global.logModule.getLogger(),
    port = process.env.PORT || 8081,
    indexPage = app.get('indexPage'),
    dbModule = global.dbModule,
    botsModule = global.botsModule,
    certOptions = {
      key: fs.readFileSync(__dirname + '/cert/privatekey.key'),
      cert: fs.readFileSync(__dirname + '/cert/certificate.crt'),
      requestCert: false,
      rejectUnauthorized: false
    },
    isRealServer = process.env.GOOGLE_CLIENT_ID && process.env.FACEBOOK_CLIENT_ID,
    server;

  app.get(CONSTANTS.REST_API.INDEX, (req, res) => {

    res.sendFile(indexPage);
  });

  dbModule.connect()
    .then(connection => {
      console.log('db connection established');

      dbModule.refreshSchemas();
      refreshPlates && dbModule.refreshPlates()
        .then(refreshResult => console.log('all plates were checked'))
        .catch(err => console.log(err));
      console.log('now running server...');
      server = isRealServer ?
        app.listen(port, () => onServerRun(server)) :
        https.createServer(certOptions, app).listen(port, () => onServerRun(server));
    })
    .catch(err => console.log(err));

  process.on('SIGINT', () => global.dbModule.disconnect()
    .then(() => console.log('db connection closed'))
    .catch((err) => console.log(err))
  );

  process.on('SIGTERM', () => {
    refreshModules();
    runServer();
  });
}

function getRelatedPath (destination) {
  return __dirname + destination;
}

function onServerRun (server) {
  let host = server.address().address;
  if (host === '::') {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    host = 'localhost';
  }
  app.set('host', host);
  app.set('port', server.address().port);
  global.apiModule.refreshRoutes();
  global.authModule.refreshAuthorization();
  global.awsModule.refreshAWS();
  global.botsModule.refreshBots()
    .then(refreshResult => console.log(refreshResult))
    .catch(err => console.log(err));

  setInterval(() => {
    request.get('https://' + app.get('host') + ':' + app.get('port') + '/test-api', function (err, resp, body) {
      console.log('wake up, please');
    });
  }, 1000 * 20); /** Call self api every ten minutes to avoid server down with 431 err code */

  console.log('Server is listening on port ' + app.get('port'));
}


