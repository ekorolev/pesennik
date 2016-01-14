
module.exports = function ( options ) {
	var app = options.app;
	var mongoose = options.mongoose;
	var userSchema = options.userSchema;
	var Users = require('./model')(userSchema, mongoose);

	// get authcheck system
	var authcheck = require('./authcheck')(app);
	// get login function
	var login = require('./login')(options);

	var AuthObject = {};

	AuthObject.login = login;
	AuthObject.users = Users;

	return AuthObject;
}