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
	var LoginToken = opts.models.logintoken;

	var userDelete = prepareUserDelete(opts);
	
	app.post('/api/signin', function (req, res) {
		console.log('try signin');
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
								result: {
									user: {
										login: user.login,
										id: user._id.toString()
									}
								},
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

								if (req.body.remember_me) {
									var logintoken = new LoginToken({email: user.login});
									logintoken.save(function () {
										req.session.userId = user._id.toString();
										res.send({
											success: true,
											result: {
												user: {
													login: user.login,
													id: user._id.toString()
												}
											},
											cookie: {
												email: logintoken.email,
												token: logintoken.token,
												series: logintoken.series
											}
										});										
									})
								} else {
									req.session.userId = user._id.toString();
									res.send({
										success: true,
										result: {
											user: {
												login: user.login,
												id: user._id.toString()
											}
										}
									});			
								}

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
					login: user.login,
					id: user._id.toString()
				}
			});
		} else {
			res.send({
				auth: false
			});
		}
	});

	app.post('/api/signin/remember', function (req, res) {
		var logintoken_email = req.body.logintoken_email;
		var logintoken_token = req.body.logintoken_token;
		var logintoken_series = req.body.logintoken_series;
		LoginToken.findOne({
			email: logintoken_email,
			token: logintoken_token,
			series: logintoken_series
		}, function (err, logintoken) {
			if (err) res.send({error: err}); else {
				if (!logintoken) res.send({error: 'logintoken_404'}); else {
					Users.findOne({
						login: logintoken_email
					}, function (err, user) {
						if (err || !user) {
							res.send({
								error: err ? err : 'user_404'
							});
						} else {
							logintoken.save(function () {
								req.session.userId = user._id.toString();
								res.send({
									success: true,
									result: {
										user: {
											login: user.login,
											id: user._id.toString()
										}
									},
									cookie: {
										email: logintoken.email,
										token: logintoken.token,
										series: logintoken.series
									}
								});										
							})
						}
					})
				}
			}
		});
	});

	app.get('/api/signout', function (req, res) {
		req.session.userId = false;
		if (req.user) {
			LoginToken.remove({email: req.user.login}, function (error) {
				console.log('error remove token: ', error);
			});
		}
		res.send({
			success: true
		});
	});

	app.post('/api/password/change', function (req, res) {
		if (!req.user) {
			res.send({
				error: "auth_error"
			});
		} else {
			Users.findById(req.user._id, function (err, user) {
				if (err) {
					res.send({
						error: "db_error"
					});
				} else {
					if (!user) {
						res.send({
							error: 'auth_error && user is not found'
						});
					} else {
						user.compare(req.body.old_password, function (err, isMatch) {
							if (err) {
								console.log('change password bcrypt error: ', err);
								console.log(req.body);
								res.send({
									error: 'bcrypt_error',
									message: err
								});
							} else {
								if (!isMatch) {
									res.send({
										error: "invalid_error"
									});
								} else {

									user.cryptNow = true;
									user.password = req.body.new_password1;
									user.save( function (err, user) {
										if (err) {
											res.send({
												error: 'save_user_error'
											});
										} else {
											res.send({
												success: true
											});
										}
									})
								}
							}
						});
					}
				}
			})
		}
	});
}