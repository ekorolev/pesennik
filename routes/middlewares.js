module.exports = function (opts) {
	var app = opts.app;
	var Users = opts.models.users;

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
			req.app.locals.user = req.user.secureInfo();
			next();
		} else {
			req.app.locals.user = false;
			next();
		}
	});


}