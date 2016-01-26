var request = require('request');
var jsdom = require('node-jsdom');

var prepareGetSingFromAMDM = function ( opts ) {
	var jquery = opts.jquery;
	return function (link, callback) {
		request(link, function (err, response, body) {
			if (err) {
				callback(new Error(err));
			} else {
				jsdom.env({
					html: body,
					src: [jquery],
					done: function (errors, window) {
						if (errors) {
							callback(new Error(errors));
						} else {
							var text = window.$('pre').text();
							var artist = window.$('span[itemprop=byArtist]').text();
							var name = window.$('span[itemprop=name]').text();
							callback(null, {
								text: text,
								artist: artist,
								name: name
							});
						}
					}
				});				
			}

		})
	}
}

module.exports = function (opts) {
	var app = opts.app;
	var getSingFromAMDM = prepareGetSingFromAMDM(opts);

	app.post('/json/import', function (req, res) {
		var link = req.body.link;
		if (!req.user) {
			res.send({
				error: "auth"
			});
		} else {

			getSingFromAMDM(link, function (err, data) {
				if (err) {
					res.send({
						error: err
					});
				} else {
					res.send({
						success: true,
						text: data.text,
						artist: data.artist,
						name: data.name
					});
				}
			});
		}
	})
}