define(function (require) {

    "use strict";

    var $               = require('jquery'),
        Backbone        = require('backbone'),
        tplText         = require('text!tpl/Data.html'),
        template        = _.template(tplText),
        alertTplText    = require('text!tpl/Alert.html'),
        alertTemplate   = _.template(alertTplText),
        extendArray     = require('app/extendArray'),
        highcharts      = require('Highcharts');


    return Backbone.View.extend({

        initialize: function (options) {
            this.options = options;
            this.listenTo(this.model, 'change:hdrCnt', this.renderHeader);
            this.listenTo(this.model, 'change:dataCnt', this.renderData);
            _.bindAll(this, 'on_keypress');
            $(document).bind('keydown', this.on_keypress);
            this.render();
        },

        render: function () {
            this.options.reader.getHeader(this.model);
            return this;
        },

        events: {
            'keyup #dataCont': 'trial',
            'click .back-button' : 'close',
        },
        
        close: function() {
            $(document).unbind('keydown', this.on_keypress);
            this.stopListening(this.model);
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
        
        renderData: function() {
            var hdr = this.model.get('hdr'),
                data = this.model.get('data');
            $('#dataCont').highcharts({
                chart: {
                    animation: false
                },
                xAxis: {
                },
                legend: {
                    enabled: false
                },

                
                series:(function(){
                    var d=new Array();
                    for (var i=0; i<hdr.ns;i++)
                        d.push({data:data[i],animation:false,color:'#FF0000'});
                    return d;
                })(),
                
                
            });
        },
        
        on_keypress: function() {
            console.log('hi');
        }
        
        
    });

});