(function () {
    'use strict';

    angular
        .module('app')
        .config(configure);

    configure.$inject = ['$routeProvider'];

    function configure($routeProvider) {
        $routeProvider
            .when('/', {
                templateUrl: '../html/views/firstView.html',
                controller: 'firstView',
            })
            .when('/transparent', {
                templateUrl: '../html/views/transparentView.html'
            })
            .when('/recording', {
                templateUrl: '../html/views/recorderView.html',
                controller: 'recorder'
            })
        ;
    }

})();