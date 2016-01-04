var dateFormat = require('./lib/dateFormat');
var express = require('express');
var redis = require('redis');
var ejsLocals = require('ejs-locals');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var mongoose = require('mongoose').connect('mongodb://localhost/pesennik');
var models = require('./models')(mongoose);
var routes = require('./routes');

var redisClient = redis.createClient();
var RedisStore = require('connect-redis')(session);

var app = express();
app.engine('ejs', ejsLocals);
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use( bodyParser() );
app.use( cookieParser() );
app.use( express.static( __dirname + '/public' ));
app.use( session({
	store: new RedisStore({
		client: redisClient,
		port: 7992
	}),
	secret: "98**189jdh*!oih"
}));


var opts = {
	app: app,
	models: models
};
routes(opts);

app.get('/', function (req, res) {
	if (req.session.userId) {
		res.redirect('/catalog/'+req.session.userId);
	} else {
		res.render('index');
	}
});



app.listen(7991);