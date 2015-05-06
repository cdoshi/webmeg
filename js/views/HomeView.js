define(function (require) {

    "use strict";

    var $               = require('jquery'),
        Backbone        = require('backbone'),
        tplText         = require('text!tpl/Home.html'),
        template        = _.template(tplText);


    return Backbone.View.extend({

        initialize: function () {
            this.render();
            this.$("#dataCont").css("height",$(document).height() - 52);
        },

        render: function () {
            this.$el.html(template());
            return this;
        },

        events: {
            'dragenter #dataCont' : 'dropMsg',
            'dragleave #dataCont' : 'dragMsg',
            'drop #dataCont' : 'dropEx',
        },
        
        dropMsg: function () {
            $("#dragndropMsg h4")[0].innerHTML = 'Drop the file into the box';
        },
        
        dragMsg: function () {
            $("#dragndropMsg h4")[0].innerHTML = 'Drag the required file into the box';
        },
        
        dropEx: function(ev) {
            ev.preventDefault();
            
            var a =1;
        }
        
    });

});