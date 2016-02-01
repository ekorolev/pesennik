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
			//$(document.body).append("Index route has been called...");
		},
		list: function (id) {
			//$(document.body).append("List route has been called....");
		},
		view: function (id) {
			//$(document.body).append("View song with id: "+id);
		}
	});

	var AuthView = Backbone.View.extend({
		initialize: function(){
			this.render();
		},
		render: function(){
			if (!window.User) {
				var template = _.template( $("#auth_template").html(), {} );
				this.$el.html( template );			
			} else {
				var template = _.template( $("#personal_template").html(), {} );
				this.$el.html( template );					
			}
		}
	});

	App.Views.Auth = new AuthView({ el: $("#Auth") });
	new App.Router;
	Backbone.history.start();

});