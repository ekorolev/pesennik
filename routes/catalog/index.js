var async = require('async');

var gettingCreateSingFunction = function (opts) {
	var Authors = opts.models.authors;
	var Users = opts.models.users;
	var Sings = opts.models.sings;
	return function (opts, callback) {
		var user = opts.user;
		var author = opts.author;
		var text = opts.text;
		var name = opts.name;

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
			}
		}, function (err, results) {
			if (err) callback(err); else {
				var sing = new Sings({
					name: name,
					author: results.author.name,
					author_id: results.author._id.toString(),
					user: user.login,
					user_id: user._id.toString(),
					text: text
				});

				sing.save(function (err, sing) {
					callback(err, sing);
				});
			}
		});
	};
}

module.exports = function (opts) {
	var Sings = opts.models.sings;
	var Authors = opts.models.authors;
	var Users = opts.models.users;
	var Comments = opts.models.comments;
	var app = opts.app;

	var createSing = gettingCreateSingFunction(opts);

	app.get('/sing/new', function (req, res) { res.render('new_sing')});

	// Создание новой песенки
	app.post('/sing/create', function (req, res) {
		createSing({
			author: req.body.author,
			name: req.body.name,
			text: req.body.text,
			user: req.user
		}, function (err, sing) {
			if (err) res.send('error #050'); else {
				res.redirect('/sing/show/'+sing._id.toString());
			}
		});
	});
	// Жалкое копирование
	app.get('/sing/copy/:sing_id', function (req, res) {
		var sing_id = req.params.sing_id;
		Sings.findById(sing_id, function (err, sing) {
			if (err) res.send('error #051'); else {
				if (!sing) res.send('sing is not found'); else {
					createSing({
						author: sing.author,
						name: sing.name,
						text: sing.text,
						user: req.user
					}, function (err, sing) {
						if (err) res.send('error #052'); else {
							res.redirect('/sing/show/'+sing._id.toString());
						}
					})
				}
			}
		})
	})

	app.get('/sing/show/:id', function (req, res) {
		var id = req.params.id;
		Sings.findById(id, function (err, sing) {
			if (err) res.send('error #008'); else {
				var query = Comments.find({
					sing_id: id
				}).sort({addTime: -1});
				query.exec(function (err, comments) {
					res.render('show_sing', {
						sing: sing,
						comments: comments
					});					
				})
			}
		})
	});

	app.get('/sing/delete/:id', function (req, res) {
		var id = req.params.id;
		Sings.findById(id, function (err, sing) {
			if (err) res.send('error #010'); else {
				if (!sing) res.send('sing is not found'); else {
					if (sing.user_id!=req.user._id.toString()) {
						res.send('you are not the owner of song')
					} else {
						sing.remove();
						res.redirect('/catalog');
					}
				}
			}
		})
	});

	app.get('/sing/edit/:id', function (req, res) {
		var id = req.params.id;
		Sings.findById(id, function (err, sing) {
			if (err) res.send('error #010'); else {
				if (!sing) res.send('sing is not found'); else {
					if (sing.user_id!=req.user._id.toString()) {
						res.send('you are not the owner of song')
					} else {
						res.render('edit_sing', {
							sing: sing
						});
					}
				}
			}
		})
	});

	app.post('/sing/update/:id', function (req, res) {
		var id = req.params.id;
		Sings.findById(id, function (err, sing) {
			if (err) res.send('error #010'); else {
				if (!sing) res.send('sing is not found'); else {
					if (sing.user_id!=req.user._id.toString()) {
						res.send('you are not the owner of song')
					} else {

						sing.name = req.body.name;
						sing.text = req.body.text;
						sing.save(function (err, sing) {
							if (err) res.send('error #012'); else {
								res.redirect('/sing/show/'+sing._id.toString());
							}
						})
					}
				}
			}
		})
	});

	app.get('/catalog', function (req, res) { res.redirect('/catalog/'+req.user._id.toString()); });
	app.get('/catalog/print', function (req, res) { res.redirect('/catalog/print/'+req.user._id.toString()); });
	app.get('/catalog/search', function (req, res) {
		var query = req.query.q;
		res.redirect('/catalog/'+req.user._id.toString()+'/search&q='+query);
	});
	app.get('/catalog/:user_id', function (req, res) {
		var user_id = req.params.user_id;
		async.parallel({
			sings: function (cb) {
				var exec = Sings.find({
					user_id: user_id
				}).sort({ name: 1 });
				exec.exec(function (err, sings) {
					if (err) cb(new Error(err)); else {
						cb(null, sings);
					}
				});
			},
			authors: function (cb) {
				var exec = Authors.find({
					user_id: user_id
				}).sort({ name: 1 });
				exec.exec(function (err, authors) {
					if (err) cb(new Error(err)); else {
						cb( null, authors);
					}
				});
			}
		}, function (err, results) {
			if (err) res.send('error #009'); else {
				var authorsObj = {};
				var sings = results.sings;
				var authors = results.authors;
				for (var i = 0; i<authors.length; i++) {
					authorsObj[authors[i]._id.toString()] = authors[i];
					authorsObj[authors[i]._id.toString()].sings = [];
				}
				for (var i = 0; i<sings.length; i++) {
					if (authorsObj[sings[i].author_id]) {
						authorsObj[sings[i].author_id].sings.push(sings[i]);
					}
				}
				res.render('catalog',{
					authors: authors,
					user_id: user_id
				});

			}
		})
	});

	app.get('/catalog/print/:user_id', function (req, res) {
		var user_id = req.params.user_id;
		async.parallel({
			sings: function (cb) {
				var exec = Sings.find({
					user_id: user_id
				}).sort({ name: 1 });
				exec.exec(function (err, sings) {
					if (err) cb(new Error(err)); else {
						cb(null, sings);
					}
				});
			},
			authors: function (cb) {
				var exec = Authors.find({
					user_id: user_id
				}).sort({ name: 1 });
				exec.exec(function (err, authors) {
					if (err) cb(new Error(err)); else {
						cb( null, authors);
					}
				});
			}
		}, function (err, results) {
			if (err) res.send('error #009'); else {
				var authorsObj = {};
				var sings = results.sings;
				var authors = results.authors;
				for (var i = 0; i<authors.length; i++) {
					authorsObj[authors[i]._id.toString()] = authors[i];
					authorsObj[authors[i]._id.toString()].sings = [];
				}
				for (var i = 0; i<sings.length; i++) {
					if (authorsObj[sings[i].author_id]) {
						authorsObj[sings[i].author_id].sings.push(sings[i]);
					}
				}
				res.render('catalog_print',{
					authors: authors
				});

			}
		})
	});

	app.get('/catalog/:user_id/search', function(req, res) {
		var query = req.query.q;
		var user_id = req.params.user_id;
		var exec = Sings.find({
			user_id: user_id,
			$or: [
				{ name: { $regex: query } },
				{ author: { $regex: query } },
			]
		});

		exec.exec(function (err, sings) {
			if (err) res.send('error #021'); else {
				res.render('catalog_result', {
					sings: sings
				});
			}
		});
	});

	app.post('/sing/addcomment/:sing_id', function (req, res) {
		var text = req.body.text;
		var user_id = req.user._id.toString();
		var user = req.user.login;
		var sing_id = req.params.sing_id;
		var comment = new Comments({
			user_id: user_id,
			user: user,
			sing_id: sing_id,
			text: text,
			addTime: new Date()
		});
		comment.save(function (err, comment) {
			if (err) res.send('error #053'); else {
				res.redirect('/sing/show/'+sing_id);
			}
		})
	});
}