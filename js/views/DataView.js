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
        dygraph         = require('dygraphs'),
        g;



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
            'click .status' : 'changeStatus',
            'click #allBad' : 'markAllBad'
        },
        
        close: function() {
            this.model.set('dataCnt',0);
            $(document).unbind('keydown', this.on_keypress);
            this.stopListening(this.model);
        },
        
        changeStatus: function(e) {
            $(e.target).parent().parent().toggleClass('danger');
        },
        
        markAllBad: function() {
            $("#chanTable").find('.status').removeAttr('checked');
        },
        
         renderHeader: function() {
             var file = this.model.get('file')[0],
                 hdr  = this.model.get('hdr'),
                 from = this.model.get('startTime'),
                 to   = from + this.model.get('dataLength');
             
             // Set the colors, visibility, status (good or bad) and pass to view to render
             this.model.set('colors',extendArray.initialize([hdr.ns],'custom',this.model.get('defaultColor')));
             this.model.set('visible',extendArray.initialize([hdr.ns],'custom',true));
             this.model.set('good',extendArray.initialize([hdr.ns],'custom',true));
             
             this.$el.html(template({fileName: file.name,
                                     hdr: hdr,
                                     colors: this.model.get('colors'),
                                     visible: this.model.get('visible'),
                                     good:this.model.get('good')
                                    }) + alertTemplate());
             
             
             this.options.reader.getData(this.model,from,to);
            
        },
        
        renderData: function() {
            if(this.model.get('dataCnt') === 0) return;
            var model = this.model,
                hdr = this.model.get('hdr'),
                data = extendArray.scalarOperation(this.model.get('data'),'copy'),
                time = this.model.get('time'),
                scaling,
                channel = hdr.channels.slice();
            
            
           channel.unshift("Time");
            
            
            for(var i = 0;i < time.length;i++) {
                data[i].unshift(time[i])
            }
            
            if(this.model.get('dataCnt') === 1) {
                if (g) { g.destroy(); }
                g = new Dygraph($("#dataCont")[0],data,{
                    xlabel: 'Time (s)',
                    digitsAfterDecimal : 6,
                    colors : model.get('colors'),
                    showLabelsOnHighlight : false,
                    pointClickCallback: function(e, p) {
                        var chan  = p.name,
                            index = hdr.channels.indexOf(p.name),
                            color = (g.user_attrs_.colors[index] === model.get('badColor')) ? model.get('defaultColor') : model.get('badColor');
                        
                        g.colorsMap_[chan] = color;
                        g.renderGraph_(true);
                        g.user_attrs_.colors[index] = color;
                        Dygraph.updateDeep(g.user_attrs_, g.user_attrs_);
                        
                    },
                    labels: channel,
                });
            }
            else {
                g.updateOptions({file: data});
            }
            
            
        },
        
        on_keypress: function(e) {
            var time = this.model.get('time'),
                hdr  = this.model.get('hdr');
            if(e.keyCode === 39) {
                var from = time[time.length-1]+1/hdr.samF,
                    to   = from + this.model.get('dataLength');
                this.options.reader.getData(this.model,from,to);
            }
            else if(e.keyCode === 37) {
                var to   = time[0],
                    from = to - this.model.get('dataLength');
                this.options.reader.getData(this.model,from,to);
            }
        }
        
        
    });

});