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
            this.listenTo(this.model, 'change:hdr', this.renderHeader);
            this.render();
        },

        render: function () {
            this.options.reader.getHeader(this.model);
            return this;
        },

        events: {
            
        },
        
         renderHeader: function() {
             var file = this.model.get('file')[0],
                 hdr  = this.model.get('hdr');
            this.$el.html(template({fileName: file.name,
                                    samF: hdr.samF,
                                    ns: hdr.ns,
                                    units:hdr.units,
                                    fileSize:(hdr.totalSize/1000000).toFixed(2)}) + alertTemplate());
             
             this.options.reader.getData(this.model,0,10);
            
        },
    });

});