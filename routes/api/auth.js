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
	
	app.post('/api/signin', function (req, res) {
		Users.findOne({login: {$regex: req.body.login, $options: 'i'}}, function( err, user ) {
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
							res.send({
								success: true,
								redirect: 'addinfo'
							})
						}
					});
				} else {
					user.compare(req.body.password, function (err, isMatch) {
						if (err) res.send('error #019'); else {
							if (!isMatch) {
								res.send({
									success: false,
									error: "invalid_password"
								})
							} else {
								req.session.userId = user._id.toString();
								res.send({
									success: true,
									result: {
										user: {
											login: user.login
										}
									}
								});
							}
						}
					})

				}
			}
		});
	});

	app.get('/api/signin/check', function (req, res) {
		var user = req.user;
		if (user) {
			res.send({
				auth: true,
				user: {
					login: user.login
				}
			});
		} else {
			res.send({
				auth: false
			});
		}
	});

	app.get('/api/signout', function (req, res) {
		req.session.userId = false;
		res.send({
			success: true
		});
	});
}