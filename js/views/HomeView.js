define(function (require) {

    "use strict";

    var $               = require('jquery'),
        Backbone        = require('backbone'),
        tplText         = require('text!tpl/Home.html'),
        template        = _.template(tplText),
        alertTplText    = require('text!tpl/Alert.html'),
        alertTemplate   = _.template(alertTplText);

    return Backbone.View.extend({

        initialize: function (options) {
            this.options = options;
            this.render();
        },

        render: function () {
            this.$el.html(template() + alertTemplate());
            return this;
        },

        events: {
            'dragenter #dropCont' : 'dropMsg',
            'dragleave #dropCont' : 'dragMsg',
            'drop #dropCont' : 'dropEx',
            'dragover #dropCont': function(e) {
                e.stopPropagation();
                e.preventDefault();
            },
            'change #fileSelect': 'dropEx',
            'click #fileSelect': function(e) {
                $("#fileSelect").val('');
            },
            'resize': 'resize'
        },
        
        dropMsg: function () {
            $("#dragndropMsg h4").text('Drop the file into the box');
        },
        
        dragMsg: function () {
            $("#dragndropMsg h4").text('Drag the required file into the box');
        },
        
        dropEx: function(e) {
            e.stopPropagation();
            e.preventDefault();
            // grab the file list
            var fileList = e.target.files || e.originalEvent.dataTransfer.files,
                options = this.options,
                slider = options.slider,
                ext;
            
            
            // Return if more than one file
            if (fileList.length != 1) {
                $("#alertDiv").find('.modal-title').text('Load one file only')
                $("#alertDiv").modal('show');
                return;
            }
            else {
                ext = fileList[0].name.split('.').pop();
                
                require(['app/format/' + ext + 'Reader'], function (reader) {
                    location.hash="dataview";
                    options.dataModel.set({file:fileList,type:ext});
                    reader.getHeader(options.dataModel);
                    
                }, function (err) {
                    console.log(err);
                    $("#alertDiv").find('.modal-title').text('Unsupported file format')
                    $("#alertDiv").modal('show');
                });
            }
            $("#dragndropMsg h4").text('Drag the required file into the box');

        },
        
        resize: function() {
            console.log('hi');
        }
    });

});