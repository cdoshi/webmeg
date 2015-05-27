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
             _.bindAll(this, "changeColor");
            $(document).bind('keydown', this.on_keypress);
            this.render();
        },

        render: function () {
            this.options.reader.getHeader(this.model);
            return this;
        },

        events: {
            'click .back-button' : 'close',
            'click .status'      : 'changeStatus',
            'click .visible'     : 'changeVisible',
            'click #allBad'      : 'markAll',
            'click #someBad'     : 'markSome',
            'click #allGood'     : 'markAll',
            'click #someGood'    : 'markSome',
            'click #hideBad'     : 'hideBad'
        },
        
        close: function() {
            this.model.set('dataCnt',0);
            $(document).unbind('keydown', this.on_keypress);
            this.stopListening(this.model);
        },
        
        changeColor: function(chan,update,type,color) {
            var model = this.model,
                hdr = model.get('hdr'),
                chanIndex = hdr.channels.indexOf(chan),
                index = g.user_attrs_.labels.indexOf(chan) - 1,
                allColors = model.get('colors');
            
            
            if(color === undefined && type === 'bad') {
                color = (g.user_attrs_.colors[index] === model.get('badColor')) ? 
                    model.get('defaultColor') : 
                    model.get('badColor');
            }
            else if(color === undefined && type === 'highlight') {
                if(model.get('good')[chanIndex] && g.user_attrs_.colors[index] === model.get('highlightColor')) {
                    color = model.get('defaultColor');
                } 
                else if(!model.get('good')[chanIndex] && g.user_attrs_.colors[index] === model.get('highlightColor')) {
                    color = model.get('badColor');
                }
                else {
                    color = model.get('highlightColor');
                }
            }
            
            g.colorsMap_[chan] = color;
            if(update) g.updateOptions({});
            g.user_attrs_.colors[index] = color;
            Dygraph.updateDeep(g.user_attrs_, g.user_attrs_);
            allColors[chanIndex] = color;
        },
        
        changeStatus: function(e) {
            var row   = $(e.target).parent().parent(),
                chan  = $(row.find('.channel')).html(),
                hdr   = this.model.get('hdr'),
                index = hdr.channels.indexOf(chan),
                good  = this.model.get('good');
                
            if($(e.target).is(':checked')) {
                row.removeClass().addClass('success');
                good[index] = true;
            }
            else {
                row.removeClass().addClass('danger');
                good[index] = false;
            }   
            
            this.changeColor(chan,true,'bad');
        },
        
        changeVisible: function(e) {
            var row     = $(e.target).parent().parent(),
                chan    = $(row.find('.channel')).html(),
                hdr     = this.model.get('hdr'),
                index   = hdr.channels.indexOf(chan),
                visible = this.model.get('good');
            
            if($(e.target).is(':checked'))
                visible[index] = true;
            else
                visible[index] = false;
            
            g.setVisibility(index,visible[index]);
            
        },
        
        markSome: function(e) {
            var that  = this,
                model = this.model,
                good  = model.get('good'),
                hdr   = model.get('hdr'),
                row,
                status,
                chan,
                chanIndex;
            
            g.user_attrs_.colors.forEach(function(value,index) {
                if(value === that.model.get('highlightColor')) {
                    chan = g.user_attrs_.labels[index+1];
                    chanIndex = hdr.channels.indexOf(chan);
                    row = $('#chanTable tr:contains(' + chan + ')');
                    status = row.find('.status');
                    if(good[chanIndex]) {
                        good[chanIndex] = false;
                        row.removeClass().addClass('danger');
                        status.removeAttr('checked');
                        that.changeColor(g.user_attrs_.labels[index+1],false,'bad',that.model.get('badColor'));
                    } else {
                        good[chanIndex] = true;
                        row.removeClass().addClass('success');
                        status.prop('checked','checked');
                        that.changeColor(g.user_attrs_.labels[index+1],false,'bad',that.model.get('defaultColor'));
                    }
                }
            });
            g.updateOptions({});
        },
        
        markAll: function(e) {
            var that  = this,
                good  = this.model.get('good'),
                status;
            
            if($(e.toElement).hasClass('btn-danger')) {
                $.each($("#chanTable > tbody > tr"),function(index,value) {
                    $(value).find('.status').removeAttr('checked');
                    good[index] = false;
                    $(value).removeClass().addClass('danger');
                    that.changeColor($(value).find('.channel').html(),false,'bad',that.model.get('badColor'));
                });
            }
            else {
                $.each($("#chanTable > tbody > tr"),function(index,value) {
                    $(value).find('.status').prop('checked','checked');
                    good[index] = true;
                    $(value).removeClass().addClass('success');
                    that.changeColor($(value).find('.channel').html(),false,'bad',that.model.get('defaultColor'));
                });
            }
            g.updateOptions({});
        },
        
        hideBad: function(e) {
            
        },
        
         renderHeader: function() {
             var model =  this.model;
                 file  = model.get('file')[0],
                 hdr   = model.get('hdr'),
                 from  = model.get('startTime'),
                 to    = from + model.get('dataLength');
             
             // Set the colors, visibility, status (good or bad) and pass to view to render
             model.set('colors',extendArray.initialize([hdr.ns],'custom',model.get('defaultColor')));
             model.set('visible',extendArray.initialize([hdr.ns],'custom',true));
             model.set('good',extendArray.initialize([hdr.ns],'custom',true));
             
             this.$el.html(template({fileName: file.name,
                                     hdr: hdr,
                                     colors: model.get('colors'),
                                     visible: model.get('visible'),
                                     good:model.get('good')
                                    }) + alertTemplate());
             
             
             this.options.reader.getData(model,from,to);
            
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
                var that = this;
                if (g) { g.destroy(); }
                g = new Dygraph($("#dataCont")[0],data,{
                    xlabel: 'Time (s)',
                    digitsAfterDecimal : 6,
                    colors : model.get('colors'),
                    showLabelsOnHighlight : false,
                    pointClickCallback: function(e, p) {
                        that.changeColor(p.name,true,'highlight');   
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
            if(e.keyCode === 39) { // Right Button
                var from = time[time.length-1]+1/hdr.samF,
                    to   = from + this.model.get('dataLength');
                this.options.reader.getData(this.model,from,to);
            }
            else if(e.keyCode === 37) { // Left Button
                var to   = time[0],
                    from = to - this.model.get('dataLength');
                this.options.reader.getData(this.model,from,to);
            }
            else if(e.keyCode === 46) { // Delete
                this.markSome();
            }
        }
        
        
    });

});
