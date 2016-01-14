module.exports = function (app) {
	
	var check = function (req, res, roles, fn) {
		var access = false;
		if (typeof(roles)=='function') {
			fn = roles;
			roles = null;
		}		

		// if roles is empty, then check auth user without role access
		if (!roles) {
			if (req.session.userId) {
				access = true;
			}
		} else {
			if (typeof(roles)==string) roles = [roles];
			if ( roles.indexOf(req.session.role)+1 ) {
				access = true;
			}
		}

		if (!access) {
			res.send('Access error');
		} else {
			fn(req, res);
		}		
	}

	app.aget = function (route, roles, fn) {
		app.get(route, function (req, res) {
			check(req, res, roles, fn);
		});
	}

	app.apost = function (route, roles, fn) {
		app.post(route, function (req, res) {
			check(req, res, roles, fn);
		});
	}

}