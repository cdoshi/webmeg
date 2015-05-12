define(function (require) {

    "use strict";

    var $           = require('jquery'),
        Backbone    = require('backbone'),

        DataFile = Backbone.Model.extend({
            defaults: {
                file:{}
            },
            initialize: function() {
                this.on("change:file", function(model){
                    var name = model.get("file"); 
                    console.log("Changed my name to " + name );
                });
            }
        })

    return {
        DataFile: DataFile
    };

});