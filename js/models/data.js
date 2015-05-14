define(function (require) {

    "use strict";

    var $           = require('jquery'),
        Backbone    = require('backbone'),

        DataFile = Backbone.Model.extend({
            defaults: {
                file:{},
                type:'',
                dataPointer:0,
                data:[]
            },
            initialize: function() {
            }
        })

    return {
        DataFile: DataFile
    };

});