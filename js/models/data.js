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
                time:[],
                colors:[],
                visibility:[],
                good:[],
                startTime:0, //
                dataLength:10, // Length of data to be displayed
                scaling:0,
                defaultColor:'#0072BD',
                badColor:'#FF0000',
                highlightColor:'#00FF00',
                annotation:[],
                evType:[],
                typePlot:'Stacked',
                selection:{names:[],indices:[]},
                currentSlt:'',
                removeDC:false
            },
            initialize: function() {
            }
        })

    return {
        DataFile: DataFile
    };

});