module.exports = function (mongoose) {
	
	var users = require('./users');
	var authors = require('./authors');
	var sings = require('./sings');
	var comments = require('./comments');

	return {
		users: users(mongoose),
		authors: authors(mongoose),
		sings: sings(mongoose),
		comments: comments(mongoose)
	}

}