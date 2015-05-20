define(function (require) {

    "use strict";

    var $           = require('jquery'),
        Backbone    = require('backbone'),

        DataFile = Backbone.Model.extend({
            defaults: {
                file:{},
                type:'',
                dataPointer:0,
                hdr:{},
                hdrCnt:0,
                data:[],
                dataCnt:0,
                time:[]
            },
            initialize: function() {
            }
        })

    return {
        DataFile: DataFile
    };

});