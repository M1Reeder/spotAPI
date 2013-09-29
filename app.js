
/**
 * Module dependencies.
 */

var express = require('express'),
	app = express(),
	http = require('http'),
	path = require('path'),
	passport = require('passport'),
	LocalStrategy = require('passport-local').Strategy,
	bcrypt = require('bcrypt'),
	SALT_WORK_FACTOR = 10,
	mongoose = require('mongoose'),

	db = require('./model/db'),
	auth = require('./model/auth')(passport, LocalStrategy),

	apiController = require('./controller/ApiController')(db),
	userController = require('./controller/UserController')(db);

colors = require('colors');

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.cookieParser());
app.use(express.session({secret: "crumbs"}));
app.use(express.methodOverride());
app.use(passport.initialize());
app.use(passport.session());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
	app.use(express.errorHandler());
}

app.get('/', function(req, res){
	res.render('index', { title: 'Spot Saver' });
});

app.post('/signup', userController.signup);
app.post('/login', auth.authenticate, userController.login);
app.get('/logout', userController.logout);

app.get('/api', auth.ensureAuthenticated, apiController.get);
app.post('/api', auth.ensureAuthenticated, apiController.post);
app.put('/api', auth.ensureAuthenticated, apiController.put);
app.del('/api', auth.ensureAuthenticated, apiController.del);

http.createServer(app).listen(app.get('port'), function(){
	console.log('Express server listening on port ' + app.get('port'));
});
