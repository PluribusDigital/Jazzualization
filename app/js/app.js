'use strict';

/* App Module */
var jazzualizeFilters      = angular.module('jazzualizeFilters', []);
var jazzualizeControllers  = angular.module('jazzualizeControllers', []);
var jazzualizeApp          = angular.module('jazzualizeApp', [
  'ngRoute',
  'jazzualizeControllers',
  'jazzualizeFilters'
]);


jazzualizeApp.config(['$routeProvider',
  function($routeProvider) {
    $routeProvider.
      when('/useCases/force', {
        templateUrl: 'partials/layout.html',
        controller: 'UseCaseForceController'
      }).
      otherwise({
          redirectTo: '/useCases/force'
      });
  }]);
