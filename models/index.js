module.exports = function (mongoose) {
	
	var authors = require('./authors');
	var sings = require('./sings');
	var comments = require('./comments');

	return {
		authors: authors(mongoose),
		sings: sings(mongoose),
		comments: comments(mongoose)
	}

}