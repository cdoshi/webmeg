require.config({

    baseUrl: 'lib',

    paths: {
        app: '../js',
        tpl: '../tpl'
    },
    map: {
        '*': {
            'app/models': 'app/models/data'
        }
    },

    shim: {
        'backbone': {
            deps: ['underscore', 'jquery'],
            exports: 'Backbone'
        },
        'underscore': {
            exports: '_'
        },
        'bootstrap': { 
            deps: ['jquery'] 
        }, 
        'highcharts': {
            deps: ['jquery'],
            exports: 'Highcharts'
        }
    }

});

require(['jquery', 'backbone', "fastclick", 'app/router','bootstrap'], function ($, Backbone, FastClick, Router) {

    "use strict";

    var router = new Router();
    
    $(function () {
        FastClick.attach(document.body);
    });

    $("body").on("click", ".back-button", function (event) {
        event.preventDefault();
        window.history.back();
    });

    Backbone.history.start();
});