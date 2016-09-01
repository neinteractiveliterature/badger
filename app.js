var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var flash = require('express-flash');
var session = require('express-session');
var config = require('config');
var _ = require('underscore');
var moment = require('moment');
var methodOverride = require('method-override')



var models = require('./lib/models');
var permission = require('./lib/permission');
var auditor = require('./lib/auditor');

var routes = require('./routes/index');
var users = require('./routes/users');
var login = require('./routes/login');
var logout = require('./routes/logout');
var events = require('./routes/events');
var attendees = require('./routes/attendees');
var pronouns = require('./routes/pronouns');
var notes = require('./routes/notes');
var preferences = require('./routes/preferences');


var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(methodOverride('_method'))
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride(function(req, res){
  if (req.body && typeof req.body === 'object' && '_method' in req.body) {
    // look in urlencoded POST bodies and delete it
    var method = req.body._method
    delete req.body._method
    return method
  }
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

var sessionConfig = {
    secret: config.get('app.sessionSecret'),
    rolling: true,
    saveUninitialized: true,
    resave: false,
};

if (config.get('app.sessionType') === 'redis'){
    var RedisStore = require('connect-redis')(session);
    if (process.env.REDISTOGO_URL) {
      var redisToGo   = require('url').parse(process.env.REDISTOGO_URL);
      var redisClient = redis.createClient(redisToGo.port, redisToGo.hostname);

      redisClient.auth(rtg.auth.split(":")[1]);

    } else {
      var redisClient = redis.createClient();
    }
    sessionConfig.store = new RedisStore({ client: redisClient });
    sessionConfig.resave = true;
}

app.use(session(sessionConfig));

app.use(flash());
app.use(permission());
app.use(auditor.middleware);

app.use(function(req, res, next){
  req.models = models;
  next();
});

// Set common helpers for the view
app.use(function(req, res, next){
    res.locals.config = config;
    res.locals.session = req.session;
    res.locals.title = config.get('app.name');
    res.locals._ = _;
    res.locals.moment = moment;
    next();
});

// Load list of visible events
app.use(function(req, res, next){
    if (! req.session.user){
        return next();
    }
    models.event.list(function(err, events){
        if (err) { return next(err); }
        if (req.session.user.admin){
            res.locals.visibleEvents = events;
            return next();
        }
        eventsMap = _.indexBy(events, 'id');

        models.event_user.listByUser(req.session.user.id, function(err, event_users){
            if (err) { return next(err); }
            var visibleEvents = [];
            _.each(event_users, function(event_user){
                visibleEvents.push(eventsMap[event_user.event_id]);
            });
            res.locals.visibleEvents = visibleEvents;
            next();
        });
    });
})

app.use('/', routes);
app.use('/login', login);
app.use('/logout', logout);
app.use('/users', users);
app.use('/preferences', preferences);
app.use('/events', events);
app.use('/api/events', events);
app.use('/attendees', attendees);
app.use('/api/attendees', attendees);
app.use('/pronouns', pronouns);
app.use('/api/pronouns', pronouns);
app.use('/notes', notes);
app.use('/api/notes', notes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    console.log('Error: ' + err);
    res.status(err.status || 500);
    if (req.originalUrl.match(/\/api\//)){
      res.json( { success:false, message: err.message, err:err });
    } else {
      res.render('error', {
        message: err.message,
        error: err
      });
    }
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  if (req.originalUrl.match(/\/api\//)){
    res.json( { success:false, message: err.message });
  } else {
    res.render('error', {
      message: err.message,
      error: {}
    });
  }
});

module.exports = app;
