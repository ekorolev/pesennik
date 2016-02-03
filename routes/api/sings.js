var request = require('request');
var jsdom = require('node-jsdom');
var async = require('async');

function deleteScript(text) {
	return text
		.replace(/<script/g, "")
		.replace(/&lt;script/g, "");
}

var prepareGetSingFromAMDM = function ( opts ) {
	var jquery = opts.jquery;
	return function (link, callback) {
		request(link, function (err, response, body) {
			if (err) {
				callback(new Error(err));
			} else {
				jsdom.env({
					html: body,
					src: [jquery],
					done: function (errors, window) {
						if (errors) {
							callback(new Error(errors));
						} else {
							var text = window.$('pre').html();
							var artist = window.$('span[itemprop=byArtist]').text();
							var name = window.$('span[itemprop=name]').text();
							callback(null, {
								text: text,
								artist: artist,
								name: name
							});
						}
					}
				});				
			}

		})
	}
}
var gettingCreateSingFunction = function (opts) {
	var Authors = opts.models.authors;
	var Users = opts.models.users;
	var Sings = opts.models.sings;
	return function (opts, callback) {
		var user = opts.user;
		var author = opts.author;
		var text = opts.text;
		var name = opts.name;
		var copylink = opts.copylink;

		async.parallel({
			author: function (cb) {
				Authors.findOne({name: author, user_id: user._id.toString() }, function (err, author) {
					if (err) cb(new Error(err)); else {
						if (author) cb(null, author); else {
							var nAuthor = new Authors({
								name: opts.author,
								user_id: user._id.toString(),
								user: user.login
							});
							nAuthor.save( function (err, author) {
								if (err) cb(new Error(err)); else {
									cb(null, author);
								}
							})
						}
					}
				})
			},
			user: function (cb) {
				if (!user.singCount) user.singCount = 0;
				user.singCount++;
				user.save(cb);
			}
		}, function (err, results) {
			if (err) callback(err); else {

				text = deleteScript(text);

				var sing = new Sings({
					name: name,
					author: results.author.name,
					author_id: results.author._id.toString(),
					user: user.login,
					user_id: user._id.toString(),
					text: text,
					copylink: copylink,
					createdAt: new Date()
				});

				sing.save(function (err, sing) {
					callback(err, sing);
				});
			}
		});
	};
}

module.exports = function (opts) {
	var app = opts.app;
	var Sings = opts.models.sings;
	var Users = opts.models.users;
	var getSingFromAMDM = prepareGetSingFromAMDM(opts);
	var createSing = gettingCreateSingFunction(opts);


	app.get('/api/list', function (req, res) {
		var id = req.user._id;
		Sings.find({
			user_id: id.toString()
		}, function (err, sings) {
			res.send({
				error: err? err : null,
				success: err? false : true,
				sings: sings
			});
		})
	});

	app.get('/api/song/:id', function (req, res) {
		var id = req.params.id;
		Sings.findById(id, function (err, sing) {
			res.send({
				error: err? err : null,
				success: err? false: true,
				sing: sing
			});
		});
	});

	app.post('/api/import', function (req, res) {
		var link = req.body.link;
		if (!req.user) {
			res.send({
				error: "auth"
			});
		} else {

			getSingFromAMDM(link, function (err, data) {
				res.send({
					error: err ? err : null,
					success: err ? false : true,
					text: data.text,
					author: data.artist,
					name: data.name
				});
			});
		}
	});

	// Создание новой песенки
	app.post('/api/create', function (req, res) {
		createSing({
			author: req.body.author,
			name: req.body.name,
			text: req.body.text,
			copylink: req.body.copylink,
			user: req.user
		}, function (err, sing) {
			res.send({
				error: err ? err : null,
				success: err ? false : true,
				song: sing
			});
		});
	});

	app.get('/api/deletesong/:id', function (req, res) {
		var id = req.params.id;
		Sings.findById(id, function (err, sing) {
			if (err) res.send({error: err}); else {
				if (!sing) res.send({error: 'song_is_not_found'}); else {
					if (sing.user_id!=req.user._id.toString()) {
						res.send({
							error: 'you_are_not_owner_of_song'
						})
					} else {
						Users.findById(sing.user_id, function (err, user) {
							if (user) {
								user.singCount--;
								user.save();
							}
							sing.remove();
							res.send({
								success: true
							})
						});
					}
				}
			}
		})
	});
}