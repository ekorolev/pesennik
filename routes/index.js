module.exports = function (opts) {
	
	var app = opts.app;
	var Users = opts.models.users;
	var Authors = opts.models.authors;
	var Sings = opts.models.sings;

	var middlewares = require('./middlewares');
	var users = require('./users');
	var catalog = require('./catalog');
	middlewares(opts);
	users(opts);
	catalog(opts);
}