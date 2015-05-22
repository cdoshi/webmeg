define(function (require) {

    "use strict";

    var $               = require('jquery'),
        Backbone        = require('backbone'),
        tplText         = require('text!tpl/Data.html'),
        template        = _.template(tplText),
        alertTplText    = require('text!tpl/Alert.html'),
        alertTemplate   = _.template(alertTplText),
        extendArray     = require('app/extendArray'),
        highcharts      = require('Highcharts'),
        dygraph         = require('dygraphs');



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
            'click .back-button' : 'close',
        },
        
        close: function() {
            $(document).unbind('keydown', this.on_keypress);
            this.stopListening(this.model);
        },
        
         renderHeader: function() {
             var file = this.model.get('file')[0],
                 hdr  = this.model.get('hdr');
             
             // Set the colors, visibility, status (good or bad) and pass to view to render
             this.model.set('colors',extendArray.initialize([hdr.ns],'custom','#0072BD'));
             this.model.set('visible',extendArray.initialize([hdr.ns],'custom',true));
             this.model.set('good',extendArray.initialize([hdr.ns],'custom',true));
             
             this.$el.html(template({fileName: file.name,
                                     hdr: hdr,
                                     colors: this.model.get('colors'),
                                     visible: this.model.get('visible'),
                                     good:this.model.get('good')
                                     
                                    }) + alertTemplate());
             
             
             this.options.reader.getData(this.model,0,10);
            
        },
        
        renderData: function() {
            var hdr = this.model.get('hdr'),
                data = this.model.get('data'),
                time = this.model.get('time'),
                scaling;
            
            scaling = extendArray.stat(data,'absmax');
            data    = extendArray.scalarOperation(data,'divide',scaling[0][0]);
            
            
            for(var i = 0;i < time.length;i++) {
                data[i].unshift(time[i])
            }
            
            var g = new Dygraph($("#dataCont")[0],data,{
                rollPeriod: 14,
                xlabel: 'Time (s)',
                colors : this.model.get('colors'),
                showLabelsOnHighlight : false,
                clickCallback: function(e, p) {
                    console.log('hi');
                },
                pointClickCallback: function(e, p) {
                    console.log('hi');
                },
            });            
        },
        
        on_keypress: function(e) {
            if(e.keyCode === 32) {
                this.options.reader.getData(this.model,10,20);
            }
        }
        
        
    });

});