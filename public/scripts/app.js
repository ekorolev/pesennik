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

	var MainView = Backbone.View.extend({
		initialize: function(){
			this.render();
		},
		render: function(){
			// Compile the template using underscore
			var template = _.template( $("#search_template").html(), {} );
			// Load the compiled HTML into the Backbone "el"
			this.$el.html( template );
		}
	});

	App.Views.Main = new MainView({ el: $("#Main") });
	new App.Router;
	Backbone.history.start();

});