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
        },

        render: function () {
            var file = this.options.dataModel.get('file')[0],
                hdr  = this.options.dataModel.get('hdr');
            this.$el.html(template({fileName: file.name,
                                    samF: hdr.samF,
                                    ns: hdr.ns,
                                    units:hdr.units,
                                    fileSize:(hdr.totalSize/1000000).toFixed(2)}) + alertTemplate());
            return this;
        },

        events: {
            
        },
    });

});