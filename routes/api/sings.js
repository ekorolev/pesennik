module.exports = function (opts) {
	var app = opts.app;
	var Sings = opts.models.sings;

	app.get('/api/list', function (req, res) {
		var id = req.user._id;
		Sings.find({
			user_id: id.toString()
		}, function (err, sings) {
			res.send({
				error: err? err : null,
				success: err? false : true,
				sings: sings
			});
		})
	});

	app.get('/api/song/:id', function (req, res) {
		var id = req.params.id;
		Sings.findById(id, function (err, sing) {
			res.send({
				error: err? err : null,
				success: err? false: true,
				sing: sing
			});
		});
	})
}