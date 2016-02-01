var App = angular.module('App', [
	'ngRoute',
	'ngCookies'
]);

App.config(['$routeProvider', 
	function ($routeProvider) {
		$routeProvider.
			when('/', {
				templateUrl: '/templates/index.html'
			}).
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
			$http.post('/signin', {
				login: $scope.form.login,
				password: $scope.form.password
			}).then(function (response) {
				console.log(response);
				$root.User = {};
				$root.User.login = response.data.result.login;
				$root.auth = true;
				$scope.auth = true;
				$scope.user = {};
				$scope.user.login = response.data.result.login;
			}, function () {
				alert('error');
			});
			return false;
		}
	}
]);
