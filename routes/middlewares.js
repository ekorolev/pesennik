module.exports = function (opts) {
	var app = opts.app;
	var Users = opts.models.users;

	app.use( function(req, res, next) {
		if (!req.session) req.session = {};
		next()
	});
	
	app.use( function (req, res, next) {
		var userId = req.session.userId;
		if (!userId) {
			req.user = false;
			next();
		} else {
			Users.findById(userId, function (err, user) {
				if (err) res.send('error #001'); else {
					req.user = user;
					var now = new Date();
					if (!user.lastActivity) user.lastActivity = new Date();
					var lA = new Date(user.lastActivity);
					if ( (now.getTime() - lA.getTime()) > 5 * 60 * 1000 ) {
						user.lastActivity = now;
					}
					user.save();
					next();
				}
			});
		}
	});

	app.use( function (req, res, next) {
		if (req.user) {
			req.app.locals.user = req.user.secureInfo();
			req.app.locals.owner = false;
			next();
		} else {
			req.app.locals.user = false;
			next();
		}
	});

	//app.use(function (req, res, next) {setTimeout(function () {next()}, 300);});


}
