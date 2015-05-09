define(function (require) {

    "use strict";

    var $ = require('jquery'),
        Backbone = require('backbone'),
        PageSlider = require('pageslider'),
        HomeView = require('app/views/HomeView'),
        slider = new PageSlider($('body')),
        homeView = new HomeView();

    return Backbone.Router.extend({

        routes: {
            "": "home",
            "help": "help"
        },

        home: function () {
            homeView.delegateEvents();
            slider.slidePage(homeView.$el);
        },
        help: function() {
            require(['app/views/HelpView'], function (HelpView) {
                slider.slidePage(new HelpView().$el);
            });
        }
    });

});