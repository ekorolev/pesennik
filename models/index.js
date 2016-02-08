module.exports = function (mongoose) {
	
	var authors = require('./authors');
	var sings = require('./sings');
	var comments = require('./comments');
	var logintoken = require('./loginToken');

	return {
		authors: authors(mongoose),
		sings: sings(mongoose),
		comments: comments(mongoose),
		logintoken: logintoken(mongoose)
	}

}