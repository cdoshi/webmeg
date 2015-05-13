define(function (require) {

    "use strict";

    var $ = require('jquery'),
        Backbone = require('backbone'),
        PageSlider = require('pageslider'),
        HomeView = require('app/views/HomeView'),
        slider = new PageSlider($('body')),
        models  = require('app/models'),
        dataModel  = new models.DataFile(),
        homeView = new HomeView({dataModel:dataModel,slider:slider});

    return Backbone.Router.extend({

        routes: {
            "": "home",
            "help": "help",
            "dataview":"dataview"
        },

        home: function () {
            homeView.delegateEvents();
            slider.slidePage(homeView.$el);
        },
        help: function() {
            require(['app/views/HelpView'], function (HelpView) {
                slider.slidePage(new HelpView().$el);
            });
        },
        dataview: function() {
            if(dataModel.get('file').length === undefined)
                window.location = "#";
            else {
                require(['app/views/DataView'], 
                        function (DataView) {
                    slider.slidePage(new DataView({dataModel:dataModel}).$el);
                });
            }
            
        }
    });

});