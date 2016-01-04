var async = require('async');
module.exports = function (opts) {
	
	var app = opts.app;
	var Users = opts.models.users;
	var Authors = opts.models.authors;
	var Sings = opts.models.sings;

	app.use( function (req, res, next) {
		var userId = req.session.userId;
		if (!userId) {
			req.user = false;
			next();
		} else {
			Users.findById(userId, function (err, user) {
				if (err) res.send('error #001'); else {
					req.user = user;
					next();
				}
			});
		}
	});

	app.use( function (req, res, next) {
		if (req.user) {
			req.app.locals.user = {};
			req.app.locals.user.login = req.user.login;
			req.app.locals.user.collapseIn = req.user.collapseIn;
			req.app.locals.user.id = req.user._id;
			next();
		} else {
			req.app.locals.user = false;
			next();
		}
	});

	app.post('/user/login', function (req, res) {
		Users.findOne({login: req.body.login}, function( err, user ) {
			if (err) res.send('error #002'); else {

				if (!user) {
					var nUser = new Users({
						login: req.body.login,
						password: req.body.password
					});
					nUser.save(function (err, user) {
						if (err) res.send('error #003'); else {
							req.session.userId = user._id.toString();
							res.redirect('/');
						}
					});
				} else {
					user.compare(req.body.password, function (err, isMatch) {
						if (err) res.send('error #019'); else {
							if (!isMatch) res.send('Invalid password'); else {
								req.session.userId = user._id.toString();
								res.redirect('/');
							}
						}
					})

				}
			}
		});
	});

	app.get('/user/logout', function (req, res) {
		req.session.userId = false;
		res.redirect('/');
	});

	app.get('/user/toggleCollapse', function (req, res) {
		req.user.collapseIn = !req.user.collapseIn;
		req.user.save(function (err, user) {
			if (err) res.send('error #015'); else {
				res.redirect('/catalog');
			}
		});
	})

	app.get('/sing/new', function (req, res) { res.render('new_sing')});

	app.post('/sing/create', function (req, res) {
		async.parallel({
			author: function (cb) {
				Authors.findOne({name: req.body.author, user_id: req.user._id.toString() }, function (err, author) {
					if (err) cb(new Error(err)); else {
						if (author) cb(null, author); else {
							var nAuthor = new Authors({
								name: req.body.author,
								user_id: req.user._id.toString(),
								user: req.user.login
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
			if (err) res.send('error #006'); else {
				var sing = new Sings({
					name: req.body.name,
					author: results.author.name,
					author_id: results.author._id.toString(),
					user: req.user.login,
					user_id: req.user._id.toString(),
					text: req.body.text
				});

				sing.save(function (err, sing) {
					if (err) res.send('error #007'); else {
						res.redirect('/sing/show/'+sing._id.toString());
					}
				})
			}
		});
	});

	app.get('/sing/show/:id', function (req, res) {
		var id = req.params.id;
		Sings.findById(id, function (err, sing) {
			if (err) res.send('error #008'); else {
				res.render('show_sing', {
					sing: sing
				});
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
					authors: authors
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
}