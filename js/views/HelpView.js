define(function (require) {

    "use strict";

    var $               = require('jquery'),
        Backbone        = require('backbone'),
        tplText         = require('text!tpl/Help.html'),
        template        = _.template(tplText);
    
    return Backbone.View.extend({

        initialize: function () {
            this.render();
        },

        render: function () {
            this.$el.html(template());
            return this;
        },

        events: {
            'click .back-button' : 'close',
        },
        
        close: function() {
            this.model.set('dataCnt',0);
            $(document).unbind('keydown', this.on_keypress);
            this.stopListening(this.model);
        }
        
    });

});