module.exports = function (mongoose) {
	
	var users = require('./users');
	var authors = require('./authors');
	var sings = require('./sings');

	return {
		users: users(mongoose),
		authors: authors(mongoose),
		sings: sings(mongoose)
	}

}