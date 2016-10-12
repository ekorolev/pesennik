var App = angular.module('App', [
	'ngRoute',
	'ngCookies',
	'ngSanitize'
]);

App.config(['$routeProvider', 
	function ($routeProvider) {
		$routeProvider.
			when('/', {templateUrl: '/templates/index.html', controller: 'indexController'}).
			when('/list/', { templateUrl: '/templates/list.html', controller: 'listController' }).
			when('/list/:id/', { templateUrl: '/templates/list.html', controller:'listController'}).
			when('/song/:id/', {templateUrl: '/templates/song.html', controller: 'songController'}).
			when('/create/', {templateUrl: '/templates/create.html', controller: 'createController'}).
			when('/song/:id/edit', {templateUrl: '/templates/edit.html', controller: 'editController'}).
			when('/users/', {templateUrl: '/templates/users.html', controller: 'usersListController'}).
			when('/signup/', {templateUrl:'/templates/signup.html'}).
			when('/search/:query/', {templateUrl: '/templates/search.html', controller: 'searchController'}).
			otherwise({
				redirectTo: '/'
			});
	}
]);

App.run(function($rootScope) {
    $rootScope.$on("$locationChangeStart", function(event, next, current) { 

    });
});

App.controller('indexController', ['$rootScope', '$location',
	function ($root, $location) {
		if ($root.auth) {
			$location.path('/list');
		}
	}
]);
App.controller('authController', ['$scope', '$rootScope', '$http', '$location', '$cookies',
	function ($scope, $root, $http, $location, $cookies) {
		$scope.form = {};

		if (!$root.auth) {
			$scope.auth = false;
		} else {
			$scope.auth = true;
			$scope.user = $root.user;
		}

		$scope.signin = function () {
			$http.post('/api/signin', {
				login: $scope.form.login,
				password: $scope.form.password,
				remember_me: $scope.form.remember_me
			}).then(function (response) {
				if (response.data.success) {
					$root.user = response.data.result.user;
					$root.auth = true;


					if (response.data.cookie) {
						$cookies.put('logintoken:email', response.data.cookie.email);
						$cookies.put('logintoken:token', response.data.cookie.token);
						$cookies.put('logintoken:series', response.data.cookie.series);
					}

					$location.path('/list');	
				} else {
					$scope.errorMessage = "Ошибка входа";
					if (response.data.error="invalid_password") {
						$scope.errorMessage = "Неправильный пароль";
					}					

					setTimeout(function () {
						$scope.errorMessage = "";
					}, 300);
				}
				
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

				$cookies.remove('logintoken:email');
				$cookies.remove('logintoken:token');
				$cookies.remove('logintoken:series');
			}, function () {
				console.log('error');
			});
		}
	}
]);

App.controller('MainController', ['$scope', '$rootScope', '$http', '$cookies', '$location',
	function ($scope, $root, $http, $cookies, $location) {
		$scope.global = $root;

		$root.loadingOn = function () {
			$root.loading = true;
		}
		$root.loadingOff = function () {
			$root.loading = false;
		}

		$root.search = function (query) {
			$location.path("/search/"+query);
		}
		
		$scope.goto_home = function () {
			$location.path('/list');
		}


		if (!$root.auth) {
			console.log('you are not auth!');
		}

		var logintoken_email = $cookies.get('logintoken:email');
		console.log('logintoken email: ', logintoken_email);
		if (logintoken_email && !$root.auth) {
			var logintoken_token = $cookies.get('logintoken:token');
			var logintoken_series = $cookies.get('logintoken:series');
			$http.post('/api/signin/remember', {
				logintoken_email: logintoken_email,
				logintoken_series: logintoken_series,
				logintoken_token: logintoken_token
			}).then( function (response) {
				console.log('remember_response: ', response.data);
				if (response.data.error) {
					console.log(response.data.error);
				} else {
					$root.auth  = true;
					$root.user = response.data.result.user;
					if (response.data.cookie) {
						$cookies.put('logintoken:email', response.data.cookie.email);
						$cookies.put('logintoken:token', response.data.cookie.token);
						$cookies.put('logintoken:series', response.data.cookie.series);
					}
				}
			});
		} else {

			console.log('try check');
			$http.get('/api/signin/check').
			then(function (response) {
				var data = response.data;
				console.log(data);
				if (data.auth) {
					$root.auth = true;
					$root.user = data.user;
				}
			});
		}
	}


]);

App.controller('listController', ['$scope', '$rootScope', '$http', '$location', '$routeParams',
	function ($scope, $root, $http, $location, $params) {
		$scope.authors = {};
		$scope.owner_id = $params.id;
		$scope.songs = [];
		var url;
		if ($scope.owner_id) url = '/api/list/'+$scope.owner_id; else url='/api/list';

		$root.loadingOn();
		$http.get(url).
		then(function (response){
			console.log(response.data);

			if (response.data.success) {
				var sings = response.data.sings;
				$scope.songs = sings;
				angular.forEach(sings, function (sing, index) {
					if (!$scope.authors[sing.author]) $scope.authors[sing.author] = [];
					$scope.authors[sing.author].push(sing);
				});

			}

			$root.loadingOff();
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
	function ($scope, $root, $http, $params, $location) {
		$scope.song = {};

		$http.get('/api/song/'+$params.id).
		then(function (response) {
			$scope.song = response.data.song;
			var indexBeginPre = $scope.song.text.indexOf('<pre>');
			if (indexBeginPre!=0) {
				$scope.song.text = $scope.song.text.split('<pre>').join('');
				$scope.song.text = $scope.song.text.split('</pre>').join('');
				$scope.song.text = '<pre>'+$scope.song.text+'</pre>';
			}
		}, function () {
			console.log('error');
		});

		$scope.delete = function () {
			$http.get('/api/deletesong/'+$scope.song._id).
			then( function (response) {
				$scope.deleteOK = true;
			});
		}

		$scope.copy = function () {
			$http.get('/api/copy/'+$scope.song._id).
			then(function (res) {
				if (res.data.success) {
					$location.path('/song/'+res.data.song._id);
				} else {
					console.log(res.data);
				}
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
		console.log('createController');
		window.tinymce.remove('#text');
		window.tinymce.init({
			selector: '#text'
		});
		$scope.song = {};

		$scope.create = function () {
			$root.loadingOn();
			$scope.song.text = window.tinymce.activeEditor.getContent();
			$scope.song.copylink = $scope.importlink;
			$http.post('/api/create', $scope.song).
			then( function (response) {
				if (response.data.success) {
					$location.path('/song/'+response.data.song._id);
				} else {

				}
				$root.loadingOff();
			}, function () {

			});
			return false;
		}

		$scope.import = function () {
			$root.loadingOn();
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

				$root.loadingOff();
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

App.controller('searchController', ['$scope', '$rootScope', '$http', '$location', '$routeParams',
	function ($scope, $rootScope, $http, $location, $params) {
		$scope.search_results = {};
		$scope.search_types = [ 'amdm', 'hm6', 'muzland' ];

		$scope.add_song = function ( song ) {
			$http.post('/api/import_and_create', {
				url: song.link
			}).
			then( function (response) {
				console.log(response);
			}, function ( response ) {
				console.log(response);
			});
		};

		$scope.show_song = function ( song ) {
			$http.post('/api/import', {
				link: song.link
			}).
			then( function (response) {
				console.log(response);
			}, function (response) {
				console.log(response);
			});
		};

		$http.get('/api/search?query='+$params.query).
		then( 
			function (response) {
				$scope.search_results = response.data;

				console.log(response.data);
			},
			function () {
				console.log('error search request');
			}
		);
	}
]);

App.filter('orderByKey', [ function () {
	return function (input) {
	    if (!angular.isUndefined(input)) {
	        var tmpInput = [];
	        angular.forEach(input, function(value, key){
	            tmpInput.push(key);
	        });
	        tmpInput.sort();

	        var tmpOutput = {};
	        angular.forEach(tmpInput, function(key){
	            tmpOutput[key] = input[key];
	        });
	        return tmpOutput;
	    } else {
	        return input;
	    }
	};
}]);