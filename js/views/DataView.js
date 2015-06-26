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
            this.listenTo(this.model, 'change:currentSlt',this.renderData);
            this.listenTo(this.model, 'change:removeDC',this.renderData);
            
            _.bindAll(this, 
                      "on_keypress",
                      "changeColor",
                      "pointClickCallback",
                      "clickCallback",
                      "addEls",
                      "plotStacked",
                      "plotButterfly",
                      "scrollRight",
                      "scrollLeft",
                      "scaleUp",
                      "scaleDown",
                      "getColors",
                      "getVisible"
                     );        
            
            $(document).bind('keydown', this.on_keypress);
            if(g) g.destroy();
            this.render();
            
        },
        
        render: function () {
            this.options.reader.getHeader(this.model);
            return this;
        },

        events: {
            'click .back-button'  : 'close',
            'click .status'       : 'changeStatus',
            'click .visible'      : 'changeVisible',
            'click #allBad'       : 'markAll',
            'click #someBad'      : 'markSome',
            'click #allGood'      : 'markAll',
            'click #someGood'     : 'markSome',
            'click #hideBad'      : 'hideBad',
            'click #resetSelect'  : 'resetSelection',
            'click #evType'       : 'crNewEvtType',
            'click #removeDC'     : 'removeDC',
            'click #scrollLeft'   : function() { this.scrollLeft();},
            'click #scrollRight'  : function() { this.scrollRight();},
            'click #scaleUp'      : function() { this.scaleUp();},
            'click #scaleDown'    : function() { this.scaleDown();},
            'click #plotType'     : 'plotType',
            'click #mrkEv'        : 'markEvent',
            'click #sltTable td'  : 'chSlt',
            'click #delSlt'       : 'deleteSlt',
            'click #addSlt'       : 'addSlt',
            'click #editSlt'      : 'editSlt',
            'click #applySlt'     : 'applySlt',
            'change #plotType'    : 'plotType',
            'mousewheel #dataCont' : 'wheeled',
            'change input#scPlot'      : 'changeScale',
            'change input#dataLength'  : 'changeLength',
            'change input#editSlnName' : 'editSlnName',
            'change input#jumpTo'      : 'jumpTo'
        },
        
        removeDC: function() {
            this.model.set('removeDC',!this.model.get('removeDC'));
            
            if(this.model.get('removeDC')) {
                $("#removeDC").html('<span class="glyphicon glyphicon-ok"></span> Remove DC Offset');
            }
            else {
                $("#removeDC").html('Remove DC Offset');
            }
        },
        
        jumpTo: function() {
             var val  = parseFloat($("#jumpTo").val()),
                to;
            
            if(isNaN(val)) {
                $("#alertDiv").find('.modal-title').text('Enter valid number');
                $("#alertDiv").modal('show');
                $("#jumpTo").val('');
                return;
            }
            else if(val < 0 || val > this.model.get('hdr').records) {
                $("#alertDiv").find('.modal-title').text('Out of range');
                $("#alertDiv").modal('show');
                $("#jumpTo").val('');
                return;
            }
            
            this.options.reader.getData(this.model,val,val+this.model.get('dataLength'));
        },
        
        // Add a user channel selection
        addSlt: function() {        
            var slts = this.model.get('selection'),
                num  = slts.names.length;
            slts.names[num] = 'Default_' + num;
            slts.indices[num] = [0];
            $('#sltTable tr:last').after('<tr><td>' + slts.names[num] + '</td></tr>');
            $('#sltTable td').eq(num).trigger('click');
        },
        
        // Edit user selection
        editSlt: function(e) {
            var row  = $('#sltTable').find('.active'),
                name = row.html().trim();
            
            console.log($(e.target));
            row.parent().html('<input id="editSlnName" type="text" class="form-control active" value="' + name +'">');
        },
        
        // Trigger only if user changes the name of channel selection
        editSlnName: function(e) {
            var slts  = this.model.get('selection'),
                name  = $('#editSlnName').val().trim(),
                row   = $('#sltTable').find('.active'),
                index = $("#sltTable tbody tr").index(row.parent());
            
            if(slts.names.indexOf(name) >= 0) {
                $("#alertDiv").find('.modal-title').text('Cannot have the same name')
                $("#alertDiv").modal('show');
                return;
            } else {
                row.parent().html('<td class="active">' + name +'</td>');
                slts.names[index] = name;
            }
            
        },
        
        // Delete channel selection
        deleteSlt: function() {
            if($('#sltTable td').length === 1) {
                $("#alertDiv").find('.modal-title').text('Need to have at least one selection');
                $("#alertDiv").modal('show');
                return;
            }
            var slt   = $("#sltTable").find('.active').html().trim(),
                slts  = this.model.get('selection'),
                index = slts.names.indexOf(slt);
            
                slts.names.splice(index,1);
                slts.indices.splice(index,1);
                $("#sltTable td").eq(index).remove();
                $("#sltTable td").eq(0).trigger('click');
            
        },
        
        // Apply channels selected by user to the display
        applySlt: function() {
            var options = $("#chList").find('option:selected'),
                model   = this.model,
                hdr     = model.get('hdr'),
                currSlt = model.get('currentSlt'),
                slts    = model.get('selection'),
                index   = slts.names.indexOf(currSlt),
                indices=[];
            
            if(options.length === 0) {
                $("#alertDiv").find('.modal-title').text('Select atleast one channel')
                $("#alertDiv").modal('show');
                return;
            }
            
            for(var i = 0;i < options.length;i++) {
                indices[i] = hdr.channels.indexOf(options[i].text);
            }
            
            slts.indices[index] = indices;
            g.destroy();
            this.renderData();
        },
        
        // Change channels selected if user clicks on a selection table
        chSlt: function(e) {
            var val = $(e.target).html().trim();
            
            if(val !== this.model.get('currentSlt')) {
                var slts    = this.model.get('selection'),
                    index   = slts.names.indexOf(val),
                    indices = slts.indices[index],
                    options = $("#chList").find('option');
                
                
                $("#chList").find('option:selected').removeAttr('selected');
                $("#sltTable td").removeClass('active');
                for(var i = 0;i < indices.length;i++)
                    $("#chList").find('option').eq(indices[i]).attr('selected','selected');
                
                $(e.target).addClass('active');
                g.destroy();
                this.model.set('currentSlt',val);
            }  
        },
        
        // In progress
        markEvent: function() {
            g.setAnnotations([
                {
                    series: this.model.get('hdr').channels[0],
                    x:$("#legend").attr('data-timeval') ,
                    shortText: "Event1",
                    text: "",
                    attachAtBottom:true
                }
            ]);
        },
        
        // Scroll to the right of data
        scrollRight: function() {
            var time = this.model.get('time'),
                from = time[time.length-1]+1/this.model.get('hdr').samF,
                to   = from + this.model.get('dataLength');
            this.options.reader.getData(this.model,from,to);
        },
        
        // Scroll to the left of data
        scrollLeft: function() {
             var time = this.model.get('time'), 
                 to   = time[0],
                 from = to - this.model.get('dataLength');
            this.options.reader.getData(this.model,from,to);
        },
        
        // Increase the scale of the data
        scaleUp: function() {
            var model = this.model;
            
            if(model.get('typePlot') === 'Stacked')
                model.set('scaling',model.get('scaling')/2);
            else
                g.updateOptions({valueRange:[g.axes_[0].minyval/2,g.axes_[0].maxyval/2]});
            
        },
        
        // Decrease the scale of data
        scaleDown: function() {
            var model = this.model;
            
            if(model.get('typePlot') === 'Stacked')
                model.set('scaling',model.get('scaling')*2);
            else
                g.updateOptions({valueRange:[g.axes_[0].minyval*2,g.axes_[0].maxyval*2]});
        },
        
        // Scroll through the data is user uses mouse wheel
        wheeled: function(e) {
            e.preventDefault();
            if(e.originalEvent.wheelDelta < 0) this.scrollRight();
            else this.scrollLeft();
        },
        
        // Change scale is user manually enters a number
        changeScale: function() {
            var val = parseFloat($("#scPlot").val());
            if(isNaN(val)) {
                $("#scPlot").val(this.model.get('scaling'));
                return;
            }
            this.model.set('scaling',parseFloat($("#scPlot").val()));
        },
        
        // Change length of data on display
        changeLength: function() {
            var time = this.model.get('time'),
                from = time[0],
                val  = parseFloat($("#dataLength").val()),
                to;
            
            if(isNaN(val)) {
                $("#dataLength").val(this.model.get('dataLength'));
                return;
            }
            else if(val < 0 || val > this.model.get('hdr').records) {
                $("#dataLength").val(this.model.get('dataLength'));
                return;
            }
            
            this.model.set('dataLength',val);
            
            to = from + val;
            this.options.reader.getData(this.model,from,to);
        },
        
        // Get colors of all channels selected in the selection window
        getColors: function() {
            var model = this.model,
                colors = model.get('colors'),
                slts  = model.get('selection'),
                currSlt = model.get('currentSlt'),
                index = slts.names.indexOf(currSlt),
                indices = slts.indices[index],
                currColor=[];
            
            for(var i = 0;i < indices.length;i++) currColor[i] = colors[indices[i]];
            return currColor;
            
        },
        
        // Get visibility of all channels selected in the selection window
        getVisible: function() {
            var model       = this.model,
                visible     = model.get('visible'),
                slts        = model.get('selection'),
                currSlt     = model.get('currentSlt'),
                index       = slts.names.indexOf(currSlt),
                indices     = slts.indices[index],
                currVisible = [];
            
            for(var i = 0;i < indices.length;i++) currVisible[i] = visible[indices[i]];
            return currVisible;
        },
        
        // Change plot type to stacked or butterfly when user clicks button on the footer
        plotType: function(e) {
            var type = (this.model.get('typePlot') === 'Stacked') ? 'Butterfly' : 'Stacked';
            if($('#plotType span').hasClass('glyphicon-option-horizontal')) {
                $('#plotType span').removeClass().addClass('glyphicon glyphicon-option-vertical');
            } else {
                $('#plotType span').removeClass().addClass('glyphicon glyphicon-option-horizontal');
            }
            this.model.set('typePlot',type);
            g.destroy();
            this.renderData();
        },
        
        // Plot series in stacked mode
        plotStacked: function(data,labels) {
            var model = this.model,
                hdr   = model.get('hdr'),
                ticks = [];
            
            for(var i = 1;i < labels.length;i++) ticks.push({v:i,label:labels[i]});
            
            g = new Dygraph($("#dataCont")[0],data,{
                xlabel: 'Time (s)',
                displayAnnotations: true,
                digitsAfterDecimal : 6,
                colors: this.getColors(),
                visibility: this.getVisible(),
                valueRange: [0,labels.length],
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
        
        // Plot series in butterfly mode
        plotButterfly: function(data,labels) {
            var model = this.model,
                hdr   = model.get('hdr');
                
            g = new Dygraph($("#dataCont")[0],data,{
                xlabel: 'Time (s)',
                ylabel: 'Amplitude (' + hdr.units + ')',
                displayAnnotations:true,
                digitsAfterDecimal : 6,
                colors : this.getColors(),
                visibility: this.getVisible(),
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
        
        // When user clicks back-button unbind all events and stop listening to key down events
        close: function() {
            this.model.set('dataCnt',0);
            this.unbind();
            $(document).unbind('keydown', this.on_keypress);
            this.stopListening(this.model);
        },
        
        // Change color if user clicks on series or marks as bad channel and vice-versa
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
        
        // Trigger this callback when user clicks on a time series
        pointClickCallback: function(e, p) {
            var value = this.model.get('data')[p.idx][this.model.get('hdr').channels.indexOf(p.name)];
            this.changeColor(p.name,true,'highlight');
            $('.xline').css({'visibility':'visible','left':p.canvasx});
            $('#legend').html('Time:' + p.xval.toFixed(4) + 's;' 
                              + p.name + ':' + value.toFixed(2) + this.model.get('hdr').units);
            $('#legend').css({'visibility':'visible'});
            $('#legend').attr('data-timeval',p.xval);
            triggerClick = false;
        },
        
        // Trigger this callback when user clicks on chart area
        clickCallback: function(e,x,pts) {
            if(triggerClick) {
                if(pts.length > 0) {
                    $('.xline').css({'visibility':'visible','left':pts[0].canvasx});
                    $('#legend').html('Time:' + pts[0].xval.toFixed(4) + 's');
                    $('#legend').css({'visibility':'visible'});
                    $('#legend').attr('data-timeval',pts[0].xval);
                }
            }
            triggerClick = true;
        },
        
        // Add vertical line and legend to the graph
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
        
        // Change status of channel to good or bad
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
        
        // Change visibility of the channel
        changeVisible: function(e) {
            var row     = $(e.target).parent().parent(),
                chan    = $(row.find('.channel')).html(),
                hdr     = this.model.get('hdr'),
                index   = hdr.channels.indexOf(chan),
                visible = this.model.get('visible'),
                index1  = g.user_attrs_.labels.indexOf(chan) - 1;
            
            if($(e.target).is(':checked'))
                visible[index] = true;
            else
                visible[index] = false;
            
            if(index1 >= 0)
                g.setVisibility(index1,visible[index]);
            
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
        
        // Remove the highlight from all series
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
        
        // Do not display bad channels
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
                        g.setVisibility(chanIndex,visible[index]);
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
        
        // Render the first glimpse of the data and set view to file parameters
        renderHeader: function() {
            var model =  this.model,
                file  = model.get('file')[0],
                hdr   = model.get('hdr'),
                from  = model.get('startTime'),
                to    = from + model.get('dataLength'),
                slts  = model.get('selection');
            
            if(model.get('colors').length === 0) {
                // Set the colors, visibility, status (good or bad) and pass to view for rendering
                model.set('colors',extendArray.initialize([hdr.ns],'custom',model.get('defaultColor')));
                model.set('good',extendArray.initialize([hdr.ns],'custom',true));
                model.set('visible',extendArray.initialize([hdr.ns],'custom',true));
                slts.names[0] = 'Default';
                slts.indices[0] = extendArray.serialIndex(0,19);
                model.set('currentSlt','Default');
             }
             
             this.$el.html(template({fileName: file.name,
                                     hdr: hdr,
                                     colors: model.get('colors'),
                                     visible: model.get('visible'),
                                     good:model.get('good'),
                                     selection:model.get('selection')
                                    }) + alertTemplate());
             
             $('[data-toggle="tooltip"]').tooltip();
             this.options.reader.getData(model,from,to);
            
        },
        
        // Render the data
        renderData: function() {
            if(this.model.get('dataCnt') === 0) return;
            var model   = this.model,
                hdr     = model.get('hdr'),
                slts    = model.get('selection'),
                curSlt  = model.get('currentSlt'),
                data    = extendArray.scalarOperation(this.model.get('data'),'copy'),
                time    = this.model.get('time'),
                index   = slts.names.indexOf(curSlt),
                indices = slts.indices[index],
                labels  = ['Time'];
            
            for(var i = 0;i < indices.length;i++) labels[i+1] = hdr.channels[indices[i]];
            
            data = extendArray.subset(data,[':',indices]);
            
            if(model.get('scaling') === 0) {
                model.set('scaling',extendArray.stat(extendArray.serialize(extendArray.stat(data,'absmax')),'absmax')[0]);
            }
            
            $("#scPlot").val(model.get('scaling'));
            
            data = extendArray.scalarOperation(data,'divide',model.get('scaling'));
            
            if(model.get('removeDC')) {
            }
            
            
            if(model.get('typePlot') === 'Stacked') {
                var addOffset = extendArray.serialIndex(1,indices.length);
                for(var i = 0;i < data.length;i++) {
                    data[i] = extendArray.dotOperation(data[i],addOffset,'add');
                }
            }
            
            for(var i = 0;i < time.length;i++)
                data[i].unshift(time[i])
            
            if(g) {
                if(g.user_attrs_ !== null) {
                    if(g.isZoomed()) g.resetZoom();
                    g.updateOptions({file:data});
                }
                else {
                    if(model.get('typePlot') === 'Stacked') this.plotStacked(data,labels);
                    else this.plotButterfly(data,labels);    
                }
            } 
            else {
                if(model.get('typePlot') === 'Stacked') this.plotStacked(data,labels);
                else this.plotButterfly(data,labels);
            }
        },
        
        // Trigger when user presses key on keyboard
        on_keypress: function(e) {
            if(e.keyCode === 37) // Left Button
               this.scrollLeft();
            else if(e.keyCode === 38) // Up Button
                this.scaleUp();
            else if(e.keyCode === 39) // Right Button
                this.scrollRight();
            else if(e.keyCode === 40) // Down Button    
                this.scaleDown();
            else if(e.keyCode === 46) { // Delete
                this.markSome();
                this.hideBad();
            }
        }    
    });

});