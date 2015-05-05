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
        },

        home: function () {
            homeView.delegateEvents();
            slider.slidePage(homeView.$el);
        },
    });

});