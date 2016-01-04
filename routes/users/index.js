module.exports = function (opts) {
	var app = opts.app;
	var Users = opts.models.users;
	
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
					users: users
				});
			}
		});

	});

}