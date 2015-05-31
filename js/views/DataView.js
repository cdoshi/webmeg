define(function (require) {

    "use strict";

    var $               = require('jquery'),
        Backbone        = require('backbone'),
        tplText         = require('text!tpl/Data.html'),
        template        = _.template(tplText),
        alertTplText    = require('text!tpl/Alert.html'),
        alertTemplate   = _.template(alertTplText),
        extendArray     = require('app/extendArray'),
        dygraph         = require('dygraphs'),
        triggerClick    = true,
        g;
        
    return Backbone.View.extend({

        initialize: function (options) {
            this.options = options;
            this.listenTo(this.model, 'change:hdrCnt', this.renderHeader);
            this.listenTo(this.model, 'change:dataCnt',_.throttle(this.renderData, 500,{leading: false}));
            this.listenTo(this.model, 'change:scaling',_.throttle(this.renderData, 500,{leading: false}));
            _.bindAll(this, "on_keypress");
            _.bindAll(this, "changeColor");
            _.bindAll(this, "pointClickCallback");
            _.bindAll(this, "clickCallback");
            _.bindAll(this, "addEls");
            _.bindAll(this, "plotStacked");
            _.bindAll(this, "plotButterfly");
            $(document).bind('keydown', this.on_keypress);
            if(g) g.destroy();
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
            'click #hideBad'     : 'hideBad',
            'click #resetSelect' : 'resetSelection',
            'click #evType'      : 'crNewEvtType',
            'click #resetZoom'   : function() { g.resetZoom();},
            'click #plotType'    : 'plotType'
        },
        
        plotType: function(e) {
            var type = (this.model.get('typePlot') === 'Stacked') ? 'Butterfly' : 'Stacked';
            $(e.target).html(type);
            this.model.set('typePlot',type);
            g.destroy();
            this.renderData();
        },
        
        plotStacked: function(data,labels) {
            var model = this.model,
                hdr   = model.get('hdr'),
                ticks = [];
            
            for(var i = 0;i < hdr.ns;i++) ticks.push({v:i+1,label:hdr.channels[i]});
            
            if(g) g.destroy();
            
            g = new Dygraph($("#dataCont")[0],data,{
                xlabel: 'Time (s)',
                displayAnnotations: true,
                digitsAfterDecimal : 6,
                colors: model.get('colors'),
                valueRange: [0,hdr.ns+1],
                showLabelsOnHighlight : false,
                pointClickCallback: this.pointClickCallback,
                clickCallback: this.clickCallback,
                zoomCallback: function() {
                    $('.xline').css({'visibility':'hidden'});
                },
                labels: labels,
                axes: {
                    y: {
                        ticker: function() {
                            return ticks;
                        }
                    }
                }
            });

            g.ready(this.addEls);
            
            
        },
        
        plotButterfly: function(data,labels) {
            var model = this.model,
                hdr   = model.get('hdr');
            
            if(g) g.destroy();
                
            g = new Dygraph($("#dataCont")[0],data,{
                xlabel: 'Time (s)',
                ylabel: 'Amplitude (' + hdr.units + ')',
                displayAnnotations:true,
                digitsAfterDecimal : 6,
                colors : model.get('colors'),
                showLabelsOnHighlight : false,
                pointClickCallback: this.pointClickCallback,
                clickCallback: this.clickCallback,
                zoomCallback: function() {
                    $('.xline').css({'visibility':'hidden'});
                },
                labels: labels,
            });

            g.ready(this.addEls);

        },
        
        close: function() {
            $(document).unbind('keydown', this.on_keypress);
            this.stopListening(this.model);
        },
        
        changeColor: function(chan,update,type,color) {
            var model     = this.model,
                hdr       = model.get('hdr'),
                chanIndex = hdr.channels.indexOf(chan),
                index     = g.user_attrs_.labels.indexOf(chan) - 1,
                allColors = model.get('colors'),
                good      = model.get('good');
            
            if(color === undefined && type === 'bad') {
                color = (allColors[chanIndex] === model.get('badColor')) ? 
                    model.get('defaultColor') : 
                    model.get('badColor');
            }
            else if(color === undefined && type === 'highlight') {
                if(good[chanIndex] && allColors[chanIndex] === model.get('highlightColor')) {
                    color = model.get('defaultColor');
                } 
                else if(!good[chanIndex] && allColors[chanIndex] === model.get('highlightColor')) {
                    color = model.get('badColor');
                }
                else {
                    color = model.get('highlightColor');
                }
            }
            else if(color === undefined && type === 'reset') {
                if(good[chanIndex]) color = model.get('defaultColor');
                else color = model.get('badColor');
            }
            
            allColors[chanIndex] = color;
            
            if(index >= 0) {
                g.colorsMap_[chan] = color;
                if(update) g.updateOptions({});
                g.user_attrs_.colors[index] = color;
                Dygraph.updateDeep(g.user_attrs_, g.user_attrs_);
            }
            
        },
        
        pointClickCallback: function(e, p) {
            var value = p.yval * this.model.get('scaling');
            this.changeColor(p.name,true,'highlight');
            $('.xline').css({'visibility':'visible','left':p.canvasx});
            $('#legend').html('Time:' + p.xval.toFixed(4) + 's;' 
                              + p.name + ':' + value.toFixed(2) + this.model.get('hdr').units);
            $('#legend').css({'visibility':'visible'});
            triggerClick = false;
        },
        
        clickCallback: function(e,x,pts) {
            if(triggerClick) {
                if(pts.length > 0) {
                    $('.xline').css({'visibility':'visible','left':pts[0].canvasx});
                    $('#legend').html('Time:' + pts[0].xval.toFixed(4) + 's');
                    $('#legend').css({'visibility':'visible'});
                }
            }
            triggerClick = true;
        },
        
        addEls: function() {
            // Create line marker
            var xline  = document.createElement("div"),
                legend = document.createElement("div");
            xline.className = "xline";
            $("#dataCont")[0].appendChild(xline);

            // Create legend box
            legend.id = "legend";
            $("#dataCont")[0].appendChild(legend);
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
                visible = this.model.get('good'),
                index1  = g.user_attrs_.labels.indexOf(chan) - 1;
            
            if($(e.target).is(':checked'))
                visible[index] = true;
            else
                visible[index] = false;
            
            if(index1 >= 0)
                g.setVisibility(index,visible[index]);
            
        },
        
        // Mark some of the selected channels as bad or good
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
        
        resetSelection: function(e) {
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
                    that.changeColor(g.user_attrs_.labels[index+1],false,'reset');
                }
            });
            g.updateOptions({});
        },
        
        // Mark all as either good or bad channels
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
            var labels  = g.user_attrs_.labels,
                visible = this.model.get('visible'),
                good    = this.model.get('good'),
                chan,
                chanIndex;
            
            $.each($("#chanTable > tbody > tr"),function(index,value) {
                chan = $(value).find('.channel').html();
                
                if(visible[index] && !good[index]) {
                    visible[index] = false;
                    $(value).find('.visible').removeAttr('checked');
                    chanIndex = labels.indexOf(chan) - 1;
                    if(chanIndex >=0)
                        g.setVisibility(index,visible[index]);
                }
            });
                
        },
        
        // Create new event type
        crNewEvtType: function(e) {
            var evType = this.model.get('evType'),
                name   = $("#crEvModal input").val().trim();
            
            if(evType.indexOf(name) < 0) {
                console.log('hi');
            }
        },
        
         renderHeader: function() {
             var model =  this.model,
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
            var model  = this.model,
                hdr    = this.model.get('hdr'),
                data   = extendArray.scalarOperation(this.model.get('data'),'copy'),
                time   = this.model.get('time'),
                labels = hdr.channels.slice();
            
           labels.unshift("Time");
            
            if(model.get('scaling') === 0) {
                model.set('scaling',extendArray.stat(extendArray.serialize(extendArray.stat(data,'absmax')),'absmax')[0]);
            }
            
            data = extendArray.scalarOperation(data,'divide',model.get('scaling'));
            
            if(model.get('typePlot') === 'Stacked') {
                var addOffset = extendArray.serialIndex(1,hdr.ns);
                for(var i = 0;i < data.length;i++) {
                    data[i] = extendArray.dotOperation(data[i],addOffset,'add');
                }
            }
            
            for(var i = 0;i < time.length;i++) {
                data[i].unshift(time[i])
            }
            
            if(g) {
                g.updateOptions({file:data});
            } 
            else {   
                if(model.get('typePlot') === 'Stacked') this.plotStacked(data,labels);
                else this.plotButterfly(data,labels);
            }
            
        },
        
        on_keypress: function(e) {
            var model = this.model,
                time  = model.get('time'),
                hdr   = model.get('hdr');
            
            
            if(e.keyCode === 37) { // Left Button
                var to   = time[0],
                    from = to - this.model.get('dataLength');
                this.options.reader.getData(model,from,to);
            }
            
            else if(e.keyCode === 38) { // Up Button
                if(model.get('typePlot') === 'stacked')
                    model.set('scaling',model.get('scaling')/2);
                else
                    g.updateOptions({valueRange:[g.axes_[0].minyval/2,g.axes_[0].maxyval/2]});
            }
            
            else if(e.keyCode === 39) { // Right Button
                var from = time[time.length-1]+1/hdr.samF,
                    to   = from + model.get('dataLength');
                this.options.reader.getData(this.model,from,to);
            }
            
            else if(e.keyCode === 40) { // Down Button
                if(model.get('typePlot') === 'stacked')
                    model.set('scaling',model.get('scaling')*2);
                else
                    g.updateOptions({valueRange:[g.axes_[0].minyval*2,g.axes_[0].maxyval*2]});
            }
            
            else if(e.keyCode === 46) { // Delete
                this.markSome();
                this.hideBad();
            }
        }    
    });

});