
module.exports = function (opts) {
	var app = opts.app;
	var Sings = opts.models.sings;
	var Comments = opts.models.comments;

	app.post('/signin', function (req, res) {
		var login = req.body.login;
		var password = req.body.password;

		res.send({
			status: 200,
			result: {
				success: true,
				login: login
			}
		});
	});

	app.get('/song/:id', function (req, res) {
		var id = req.params.id;

		Sings.findById(id, function (err, sing) {
			if (err || !sing) {
				res.send({
					status: 404
				});
			} else {
				Comments.find({sing_id: id}, function (err, comments) {
					res.send({
						status: 200,
						result: {
							song: sing,
							comments: comments
						}
					});
				});
			}
		})
	});

	app.get('/songs', function (req, res) {
		Sings.find({}, function (err, sings) {
			res.send({
				status: 200,
				results: sings
			});
		});
	});
}