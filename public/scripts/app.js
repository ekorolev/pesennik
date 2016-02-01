$(function () {

	window.App = {
		Models: {},
		Collections: {},
		Views: {},
		Router: {}
	};

	App.Router = Backbone.Router.extend({
		routes: {
			'': 'index',
			'list(/:id)': 'list',
			'song/:id': 'view'
		},
		index: function () {
			$(document.body).append("Index route has been called...");
		},
		list: function (id) {
			$(document.body).append("List route has been called....");
		},
		view: function (id) {
			$(document.body).append("View song with id: "+id);
		}
	});

	new App.Router;
	Backbone.history.start();

});