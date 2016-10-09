var request = require('request');
var jsdom = require('node-jsdom');
var async = require('async');
var url = require('url');

function deleteScript(text) {
	return text
		.replace(/<script/g, "")
		.replace(/&lt;script/g, "")
		.replace(/<a[^>]*>\"\>/g, "<b>")
		.replace(/<\/a>/g, "</b>");
		//.replace(/<(?:[^"'>]+|(["'])(?:\\[\s\S]|(?!\1)[\s\S])*\1)*>/g, "");
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

var prepareGetSingFromHM6 = function ( opts ) {
	var jquery = opts.jquery;

	return function ( link, callback ) {
		request( link, function (err, response, body) {
			console.log('import hm6:::');
			if (err) {
				callback( new Error(err) );
			} else {
				jsdom.env({
					html: body,
					src: [jquery],
					done: function (errors, window) {
						if (errors) {
							callback(new Error(errors));
						} else {
							var text = window.$('pre').html();
							var nameOfSong = window.$('main h1.b-title').text();
							var arrayOfSong = nameOfSong.split(' - ');
							var artist = arrayOfSong[0];
							artist = window.$.trim(artist);
							var name = arrayOfSong[1];

							console.log('name=', name, '; artist=', artist);
							callback(null, {
								text: text,
								artist: artist,
								name: name
							});							
						}
					} // done function
				}); // jsdom.env
			} 
		}); // request
	} // return

} // prepareGetSingFromHM6

var prepareGetSingFromMUZLAND = function (opts) {
	var jquery = opts.jquery;

	return function ( link, callback ) {
		request( link, function (err, response, body) {
			console.log('import muzland:::');
			if (err) {
				callback( new Error(err) );
			} else {
				//console.log('Prepare envirment');
				//body = body.replace(/(<iframe)(.*)<\/iframe>/g, "");
				//console.log(body);
				jsdom.env({
					html: body,
					src: [jquery],
					done: function (errors, window) {
						if (errors) {
							callback(new Error(errors));
						} else {
							var text = window.$('pre').html();
							var artist = window.$('div[itemprop=byArtist]').text();
							var name =  window.$('div[itemprop=name]').text();

							console.log('name=', name, '; artist=', artist);
							callback(null, {
								text: text,
								artist: artist,
								name: name
							});							
						}
					} // done function
				}); // jsdom.env
			} 
		}); // request
	} // return
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

				
				// Перенес функцию очистки текста на этап редактирования.
				//text = deleteScript(text);
				//console.log(text);

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
	var getSingFromHM6 = prepareGetSingFromHM6(opts);
	var getSingFromMUZLAND = prepareGetSingFromMUZLAND(opts);
	var createSing = gettingCreateSingFunction(opts);


	var list_func = function (req, res) {
		var id = req.params.id || req.user._id;
		if (id) {
			Sings.find({
				user_id: id.toString()
			}, function (err, sings) {
				res.send({
					error: err? err : null,
					success: err? false : true,
					sings: sings,
					owner_id: id
				});
			})		
		} else {
			res.send({
				error: 'auth'
			});
		}		
	}
	app.get('/api/list/:id', list_func);
	app.get('/api/list', list_func);

	app.get('/api/song/:id', function (req, res) {
		var id = req.params.id;
		Sings.findById(id, function (err, sing) {
			res.send({
				error: err? err : null,
				success: err? false: true,
				song: sing
			});
		});
	});

	app.post('/api/import', function (req, res) {
		var link = req.body.link;

		// Унифицируем функцию отправки ответа.
		var successImportAndSendData = function ( err, data ) {
			res.send({
				error: err ? err : null,
				success: err ? false: true,
				text: !err ? deleteScript(data.text) : "", 
				author: data.artist,
				name: data.name
			});
		}

		if (!req.user) {
			res.send({
				error: "auth"
			});
		} else {
			// Определяем принадлежность сайту.
			var URL_Object = url.parse(link);
			var import_host = URL_Object.hostname;
			
			// IMPORT FROM AMDM
			if (import_host == 'amdm.ru') {
				getSingFromAMDM( link, successImportAndSendData);

			// IMPORT FROM HM6
			} else if (import_host == 'hm6.ru') { 
				getSingFromHM6( link, successImportAndSendData);
			
			// IMPORT FROM MUZLAND
			} else if (import_host == 'muzland.ru') {
				getSingFromMUZLAND( link, successImportAndSendData);

			// WRONG IMPORT
			} else {
				res.send({error: 'wrong import'})
			}
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

	app.post('/api/updatesong/:id', function (req, res) {
		var id = req.params.id;
		Sings.findById(id, function (err, sing) {
			if (err) res.send({error:err}); else {
				if (!sing) res.send({error: 'sing is not found'}); else {
					if (sing.user_id!=req.user._id.toString()) {
						res.send({error:'you are not the owner of song'})
					} else {

						sing.name = req.body.name;
						sing.text = req.body.text;

						sing.save(function (err, sing) {
							res.send({
								error: err ? err : null,
								success: err ? false : true,
								song: sing
							});
						})
					}
				}
			}
		})
	});

	// Жалкое копирование
	app.get('/api/copy/:sing_id', function (req, res) {
		var sing_id = req.params.sing_id;
		Sings.findById(sing_id, function (err, sing) {
			if (err) res.send({error: err}); else {
				if (!sing) res.send({error: 'song_404'}); else {
					createSing({
						author: sing.author,
						name: sing.name,
						text: sing.text,
						user: req.user,
						copylink: sing.copylink
					}, function (err, sing) {
						if (err) res.send({error: err}); else {
							res.send({
								success: true,
								song: sing
							});
						}
					})
				}
			}
		})
	})
}