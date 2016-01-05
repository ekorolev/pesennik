var async = require('async');

var prepareUserDelete = function (opts) {
	var Authors = opts.models.authors;
	var Sings = opts.models.sings;
	var Users = opts.models.users;
	var Comments = opts.models.comments;

	return function (user_id, callback) {
		async.parallel({
			authors: function (cb) {
				Authors.remove({user_id: user_id}, function (err) {
					cb();
				});
			},
			sings: function (cb) {
				Sings.remove({user_id: user_id}, function (err) {
					cb();
				});
			},
			comments: function (cb) {
				Comments.remove({user_id: user_id}, function (err) {
					cb();
				})
			}
		}, function (err, results) {
			Users.remove({_id: user_id}, function (err) {
				callback();
			});
		});
	}
}

function guidGenerator() {
    var S4 = function() {
       return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
    };
    return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
}

module.exports = function (opts) {
	var app = opts.app;
	var Users = opts.models.users;

	var userDelete = prepareUserDelete(opts);
	
	app.post('/user/login', function (req, res) {
		Users.findOne({login: req.body.login}, function( err, user ) {
			if (err) res.send('error #002'); else {

				if (!user) {
					var nUser = new Users({
						login: req.body.login,
						password: req.body.password,
						regTime: new Date()
					});
					nUser.save(function (err, user) {
						if (err) res.send('error #003'); else {
							req.session.userId = user._id.toString();
							res.redirect('/user/addinfo?f=true');
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

	app.get('/user/addinfo', function (req, res) {
		res.render('addinfo', { first: req.query.f?true:false });
	});
	app.post('/user/addinfo', function (req, res) {
		var firstname = req.body.firstname;
		var secondname = req.body.secondname;
		var vklink = req.body.vklink;
		var bdate = req.body.bdate;

		req.user.firstname = firstname;
		req.user.secondname = secondname;
		req.user.vklink = vklink;
		req.user.bdate = bdate;

		var d = new Date(bdate);
		console.log( d.format('yyyy-mm-dd'));

		req.user.save(function (err, user) {
			if (err) res.send('error #025 save user info'); else {
				res.redirect('/catalog/'+user._id.toString());
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
	});

	app.get('/user/list', function (req, res) {
		var query = Users.find({}).sort({login: 1});
		query.exec(function (err, users) {
			if (err) res.send('error #027 cannot get users list'); else {
				res.render('users_list', {
					l_users: users
				});
			}
		});

	});

	app.get('/user/newpassword', function (req, res) { res.render('user_newpassword') });
	app.post('/user/newpassword', function (req, res) {
		var user = req.user;
		var oldpassword = req.body.oldpassword;
		var newpassword = req.body.newpassword;
		var newpasswordencore = req.body.newpasswordencore;

		if (newpassword != newpasswordencore) {
			res.send('Новые пароли не совпадают');
		} else {
			user.compare(oldpassword, function (err, isMatch) {
				if (err) res.send('error #062'); else {
					if (!isMatch) {
						res.send('Старый пароль введен неверно'); 
					} else {
						user.password = newpassword;
						user.cryptNow = true;
						user.save( function (err, user) {
							if (err) res.send('error #063'); else {
								res.redirect('/catalog/'+user._id.toString());
							}
						})
					}
				} 
			})
		}
	});

	app.get('/user/:user_id/delete', function (req, res) {
		if (!req.user.admin) res.send('you are not admin'); else {
			var user_id = req.params.user_id;
			userDelete(user_id, function () {
				res.redirect('/user/list');
			});
		}
	});

	app.get('/user/:user_id/passw', function (req, res) {
		if (!req.user.admin) res.send('you are not admin'); else {
			var user_id = req.params.user_id;
			var newPassw = guidGenerator();
			Users.findById(user_id, function (err, user) {
				if (err || !user) res.send('error #060'); else {
					user.password = newPassw;
					user.cryptNow = true;
					user.save( function (err, user) {
						if (err) res.send('error #061'); else {
							res.send('new password: ' + newPassw);
						}
					})
				}
			})
		}
	});

}