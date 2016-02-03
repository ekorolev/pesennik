var App = angular.module('App', [
	'ngRoute',
	'ngCookies',
	'ngSanitize'
]);

App.config(['$routeProvider', 
	function ($routeProvider) {
		$routeProvider.
			when('/', {
				templateUrl: '/templates/index.html'
			}).
			when('/list', { templateUrl: '/templates/list.html', controller: 'listController' }).
			when('/list/:id', { templateUrl: '/templates/list.html', controller:'listController'}).
			when('/song/:id', {templateUrl: '/templates/song.html', controller: 'songController'}).
			when('/create', {templateUrl: '/templates/create.html', controller: 'createController'}).
			when('/song/:id/edit', {templateUrl: '/templates/edit.html', controller: 'editController'}).
			when('/users', {templateUrl: '/templates/users.html', controller: 'usersListController'}).
			otherwise({
				redirectTo: '/'
			});
	}
]);

App.controller('authController', ['$scope', '$rootScope', '$http', 
	function ($scope, $root, $http) {
		$scope.form = {};

		if (!$root.auth) {
			$scope.auth = false;
		} else {
			$scope.auth = true;
			$scope.user = $root.User;
		}

		$scope.signin = function () {
			$http.post('/api/signin', {
				login: $scope.form.login,
				password: $scope.form.password
			}).then(function (response) {
				console.log(response);
				$root.user = response.data.result.user;
				$root.auth = true;
			}, function () {
				console.log('error');
			});
			return false;
		}

		$scope.signout = function () {
			$http.get('/api/signout')
			.then( function (response) {
				$root.auth = false;
				$root.user = {};
			}, function () {
				console.log('error');
			})
		}
	}
]);

App.controller('MainController', ['$scope', '$rootScope', '$http',
	function ($scope, $root, $http) {
		$http.get('/api/signin/check').
		then( function (response) {
			console.log(response);
			if (response.data.auth) {
				$root.auth = true;
				$root.user = response.data.user;
			}
		}, function () {
			console.log('error');
		});

		$root.loadingOn = function () {
			$root.loading = true;
		}
		$root.loadingOff = function () {
			$root.loading = false;
		}

	}


]);

App.controller('listController', ['$scope', '$rootScope', '$http', '$location', '$routeParams',
	function ($scope, $root, $http, $location, $params) {
		$scope.authors = {};
		$scope.owner_id = $params.id;
		var url;
		if ($scope.owner_id) url = '/api/list/'+$scope.owner_id; else url='/api/list';

		$http.get(url).
		then(function (response){
			console.log(response.data);

			if (response.data.success) {
				var sings = response.data.sings;
				angular.forEach(sings, function (sing, index) {
					if (!$scope.authors[sing.author]) $scope.authors[sing.author] = [];
					$scope.authors[sing.author].push(sing);
				});

			}
		}, function () {
			console.log('error');
		});

		$scope.delete = function (id, array, first_index, second_index) {
			console.log(id);
			$http.get('/api/deletesong/'+id).
			then(function (response) {
				console.log(response);
				if (response.data.success) {
					array[first_index].splice(second_index, 1);
					if (array[first_index].length==0) {
						delete array[first_index];
					}
				}
			}, function () {
				console.log('error');
			});
		}

		$scope.edit = function (song) {
			$root.editSong = song;
			$location.path('/song/'+song._id+'/edit');
		}
	}
]);

App.controller('songController', ['$scope', '$rootScope', '$http', '$routeParams', '$location',
	function ($scope, $root, $http, $params) {
		$scope.song = {};

		$http.get('/api/song/'+$params.id).
		then(function (response) {
			$scope.song = response.data.song;
		}, function () {
			console.log('error');
		});

		$scope.delete = function () {
			$http.get('/api/deletesong/'+$scope.song._id).
			then( function (response) {
				$scope.deleteOK = true;
			});
		}
	}
]);

App.controller('editController', ['$scope', '$rootScope', '$http', '$location', '$routeParams',
	function ($scope, $root, $http, $location, $params) {
		window.tinymce.remove('#text');
		window.tinymce.init({
			selector: '#text'
		});
		

		if (!$root.editSong) {
			$http.get('/api/song/'+$params.id).
			then( function (response) {
				$scope.song = response.data.song;
				if (window.tinymce.activeEditor) {
					window.tinymce.activeEditor.setContent(response.data.song.text);
				}
			});
		} else {
			$scope.song = $root.editSong;
			if (window.tinymce.activeEditor) {
				window.tinymce.activeEditor.setContent($scope.song.text);
			}
		}

		$scope.update = function () {
			$scope.song.text = window.tinymce.activeEditor.getContent();
			$http.post('/api/updatesong/'+$scope.song._id, $scope.song).
			then( function (response) {
				if (response.data.success) {
					$location.path('/song/'+response.data.song._id);
				} else {
					console.log(response.data);
				}
			}, function () {

			});
		}
	}
]);

App.controller('createController', ['$scope', '$rootScope', '$http', '$location',
	function ($scope, $root, $http, $location) {
		window.tinymce.remove('#text');
		window.tinymce.init({
			selector: '#text'
		});
		$scope.song = {};

		$scope.create = function () {
			$scope.song.text = window.tinymce.activeEditor.getContent();
			$http.post('/api/create', $scope.song).
			then( function (response) {
				if (response.data.success) {
					$location.path('/song/'+response.data.song._id);
				} else {

				}
			}, function () {

			});
			return false;
		}

		$scope.import = function () {
			$http.post('/api/import', {
				link: $scope.importlink
			}).
			then( function (response) {
				console.log(response.data);
				if (response.data.success) {
					$scope.song.author = response.data.author;
					$scope.song.name = response.data.name;
					window.tinymce.activeEditor.setContent('<pre>'+response.data.text+'</pre>');
				} else {

				}
			}, function () {
				console.log('/api/import error');
			})
			return false;
		}
	}
]);

App.controller('usersListController', ['$scope', '$rootScope', '$http', 
	function ($scope, $rootScope, $http) {
		$scope.users = [];

		$http.get('/api/users').
		then(function (response) {
			if (response.data.success) {
				$scope.users = response.data.users;
			}
		}, function () {
			console.log('error');
		});
	}
]);