var request = require('request');
var async = require('async');
var jsdom = require ('node-jsdom');

module.exports = function ( opts ) {
	var app = opts.app;


	app.get('/api/search', function (req, res) {
		var query = req.query.query;
		var jquery = opts.jquery;

		var getHTMLandJQueryDOOM = function (type, query, callback) {
			var getLink = function (type, query, page) {
				var linktypes = {
					amdm: "http://amdm.ru/search/?q=",
					hm6: "http://hm6.ru/search?q=",
					muzland: "http://muzland.ru/search.html?query="
				};

				return linktypes[type]+query;
			};


			var link = getLink(type, query);
			console.log('Запрос по адресу: ', link);
			request.get({
				"uri": encodeURI(link),
				"encoding": null
			}, function (err, response, body) {
				if (err) {
					callback(err);
				} else {
					jsdom.env({
						html: body,
						src: [jquery],
						done: function (error, window) {
							var $ = window.$;
							if (error) {
								callback(error);
							} else {
								var result = [];

								if (type=='amdm') {

									$("div.content-table article.g-padding-left table.items tbody tr").each( function(index, el) {
										var array = $(el).find('a.artist');
										result.push({
											artist: $(array[0]).text(),
											name: $(array[1]).text(),
											link: $(array[1]).attr('href')
										});
									});

									callback(null, result);
								} else if (type == 'hm6') {
									$("ul.b-listing li").each( function(ind, el) {
										var a_text = $(el).find('a').text();
										var a_href = $(el).find('a').attr('href');
										a_text = $.trim(a_text);
										console.log(a_text.split(' - '));
										result.push({
											artist: a_text.split(' - ')[0],
											name: a_text.split(' - ')[1],
											link: 'http://hm6.ru'+a_href
										});									
									});

									callback(null, result);

								} else if (type == 'muzland') {
									$("ol.search-result li").each( function (ind, element) {
										var array = $(element).find('a');
										result.push({
											artist: $(array[0]).text(),
											name: $(array[1]).text(),
											link: $(array[1]).attr('href'), 
										});
									});

									callback(null, result);
								} else {
									callback('error type');
								}
							}
						}
					});
				}
			});
		};

		async.parallel({
			hm6: function ( callback ) { getHTMLandJQueryDOOM( 'hm6', query, callback); },
			amdm: function ( callback ) { getHTMLandJQueryDOOM( 'amdm', query, callback); },
			muzland: function ( callback ) { getHTMLandJQueryDOOM( "muzland", query, callback); }
		}, function (err, results) {
			if (err) {
				console.log("Import search query error: ", err);
				res.send({ error: "import error" });
			} else {
				res.send(results);
			}
		});
	});
};