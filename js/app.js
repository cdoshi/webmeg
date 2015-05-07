require.config({

    baseUrl: 'lib',

    paths: {
        app: '../js',
        tpl: '../tpl'
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