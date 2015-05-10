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
            this.$("#dropCont").css("height",$(document).height() - 52);
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
            'change #fileSelect': 'dropEx'
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
                slider = this.options.slider,
                ext;  
            
            // Return if more than one file
            if (fileList.length != 1) {
                $("#alertDiv").find('.modal-title').text('Load one file only')
                $("#alertDiv").modal('show');
                return;
            }
            else {
                
                ext = fileList[0].name.split('.').pop();
                require(['jquery', 'backbone','app/format/' + ext + 'Reader','app/views/DataView','bootstrap'], 
                        function ($, Backbone, reader,DataView) {
                    slider.slidePage(new DataView({fileList:fileList}).$el);
                    location.hash="dataview";
                    
                }, function (err) {
                    $("#alertDiv").find('.modal-title').text('Unsupported file format')
                    $("#alertDiv").modal('show');
                });
            }
        }
    });

});