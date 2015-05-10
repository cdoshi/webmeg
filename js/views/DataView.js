define(function (require) {

    "use strict";

    var $               = require('jquery'),
        Backbone        = require('backbone'),
        tplText         = require('text!tpl/Data.html'),
        template        = _.template(tplText),
        alertTplText    = require('text!tpl/Alert.html'),
        alertTemplate   = _.template(alertTplText);

    return Backbone.View.extend({

        initialize: function (options) {
            this.options = options;
            this.render();
            this.$("#dataCont").css("height",$(document).height() - 52);
        },

        render: function () {
            var fileList = this.options.fileList;
            this.$el.html(template({fileName: fileList[0].name}) + alertTemplate());
            return this;
        },

        events: {
            
        },
    });

});