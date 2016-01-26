var async = require('async');
var request = require('request');
var jsdom = require('node-jsdom');

function escapeHtml(text) {
  return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
}

function reEscapeHtml(text) {
  return text
      .replace(/\&amp\;/g, "&")
      .replace(/\&lt\;/g, "<")
      .replace(/\&gt\;/g, ">")
      .replace(/\&quot\;/g, '"')
      .replace(/\&#039\;/g, "'");	
}

function isEscapeHtml(text) {
	var b1 = text.indexOf('&lt;')+1;
	var b2 = text.indexOf('&gt;')+1;
	var b3 = text.indexOf('&quot;')+1;
	var b4 = text.indexOf('&amp;')+1;
	var b5 = text.indexOf('&#039;')+1;
	return b1||b2||b3||b4||b5;
}

function deleteScript(text) {
	return text
		.replace(/<script/g, "")
		.replace(/&lt;script/g, "");
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

module.exports = function (opts) {
	var Sings = opts.models.sings;
	var Authors = opts.models.authors;
	var Users = opts.models.users;
	var Comments = opts.models.comments;
	var app = opts.app;

	var createSing = gettingCreateSingFunction(opts);
	var getSingFromAMDM = prepareGetSingFromAMDM(opts);

	// json-requests:
	var json = require('./json');
	json(opts);

	app.get('/sing/new', function (req, res) { res.render('new_sing')});

	// Создание новой песенки
	app.post('/sing/create', function (req, res) {
		if (req.body.copylink && !req.body.text) {
			getSingFromAMDM(req.body.copylink, function (err, data) {
				if (err) res.send('error #070'); else {
					createSing({
						author: req.body.author,
						name: req.body.name,
						text: data.text,
						user: req.user,
						copylink: req.body.copylink
					}, function (err, sing) {
						if (err) res.send('error #050'); else {
							res.redirect('/sing/show/'+sing._id.toString());
						}
					});					
				}
			});
		} else {
			createSing({
				author: req.body.author,
				name: req.body.name,
				text: req.body.text,
				copylink: req.body.copylink,
				user: req.user
			}, function (err, sing) {
				if (err) res.send('error #050'); else {
					res.redirect('/sing/show/'+sing._id.toString());
				}
			});
		}
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
						user: req.user,
						copylink: sing.copylink
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
						Users.findById(sing.user_id, function (err, user) {
							if (user) {
								user.singCount--;
								user.save();
							}
							sing.remove();
							res.redirect('/catalog/'+user._id.toString());
						});
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
						//sing.text = reEscapeHtml(sing.text);
						console.log('edit: ', sing.text);
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
		var status = req.query.status;
		async.parallel({
			sings: function (cb) {
				var query = {
					user_id: user_id
				};
				if (status) query.status=status;

				var exec = Sings.find(query).sort({ author: 1 });

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
			},
			owner: function (cb) {
				Users.findById(user_id, cb);
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
					user_id: user_id,
					owner: results.owner.secureInfo(),
					sings: sings
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
				{ name: { $regex: query, $options: 'i' } },
				{ author: { $regex: query, $options: 'i' } },
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

	app.get('/sing/:sing_id/learn/:type', function (req, res) {
		var type=req.params.type;
		var sing_id = req.params.sing_id;
		Sings.findById(sing_id, function (err, sing) {
			if (err) res.send('error #090'); else {
				if (!sing) res.send('Not found'); else {
					if (sing.user_id != req.user._id.toString()) {
						res.send('You are not owner of song');
					} else {
						var types = ['yes', 'no', 'in'];
						if (type!='yes' && type!='no' && type!='in') {
							res.send('Incorrect type');
						} else {
							sing.status = type;
							sing.save( function (err, sing) {
								if (err) res.send('error #091'); else {
									res.redirect('/sing/show/'+sing._id.toString());
								}
							});
						}
					}
				}
			}
		})
	});
}