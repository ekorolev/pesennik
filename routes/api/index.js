
module.exports = function (opts) {


	var auth = require('./auth');
	var sings = require('./sings');
	auth(opts);
	sings(opts);

	opts.app.get('/api/users', function (req, res) {
		opts.models.users.find({}, function (err, users) {
			res.send({
				error: err ? err : null,
				success: err ? false : true,
				users: users
			});
		})
	});
}