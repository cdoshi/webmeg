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
            
            var dataModel = options.dataModel,
                reader    = options.reader;
            
            // Get header information of the file
            reader.getHeader(dataModel); 
            
            var a =1;
                
            
            
            // Get 10 seconds of data or whichever is less
            //dataModel.data = options.reader.getData(dataModel.hdr,0,10);
            
        },

        render: function () {
            var fileList = this.options.dataModel.get('file');
            this.$el.html(template({fileName: fileList[0].name}) + alertTemplate());
            return this;
        },

        events: {
            
        },
    });

});