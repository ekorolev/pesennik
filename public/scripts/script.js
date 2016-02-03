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

App.controller('listController', ['$scope', '$rootScope', '$http', 
	function ($scope, $root, $http) {
		$scope.authors = {};
		
		$http.get('/api/list').
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
	}
]);

App.controller('songController', ['$scope', '$rootScope', '$http', '$routeParams',
	function ($scope, $root, $http, $params) {
		$scope.song = {};

		$http.get('/api/song/'+$params.id).
		then(function (response) {
			$scope.song = response.data.sing;
		}, function () {
			console.log('error');
		});
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