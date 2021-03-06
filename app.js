var MONGO_HOST = process.env.MONGO_HOST || 'localhost';
var MONGO_PORT = process.env.MONGO_PORT || '27017';
var REDIS_HOST = process.env.REDIS_HOST || 'localhost';
var REDIS_PORT = process.env.REDIS_PORT || '6379';

var dateFormat = require('./lib/dateFormat');
var express = require('express');
var redis = require('redis');
var ejsLocals = require('ejs-locals');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var mongoose = require('mongoose')
    .connect(`mongodb://${MONGO_HOST}:${MONGO_PORT}/pesennik`);
var models = require('./models')(mongoose);
var routes = require('./routes');
var fs = require('fs');
var jquery = fs.readFileSync('./scripts/jquery.min.js', 'utf-8');
var authsystem = require('./lib/authsystem');

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
        host: REDIS_HOST,
		port: REDIS_PORT
	}),
	secret: "98**189jdh*!oih"
}));

var AuthSystem = authsystem({
	app: app,
	userSchema: require('./models/users')(mongoose),
	mongoose: mongoose
});
models.users = AuthSystem.users;
var opts = {
	app: app,
	models: models,
	jquery: jquery
};
routes(opts);

//app.get('/', function (req, res) { res.sendFile(__dirname+'/public/index.html'); });

app.get('/', function (req, res) {
	res.sendFile(__dirname+'/public/client.html');
});
app.get('/switch_version', function (req, res) {
	res.send({ message: 'Old version has not supported' });
});



app.listen(7991);
