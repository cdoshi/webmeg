define(function (require) {

    "use strict";

    var $               = require('jquery'),
        Backbone        = require('backbone'),
        tplText         = require('text!tpl/Home.html'),
        template        = _.template(tplText);
    


    return Backbone.View.extend({

        initialize: function () {
            this.render();
            this.$("#dataCont").css("height",$(document).height() - 52);
        },

        render: function () {
            this.$el.html(template());
            return this;
        },

        events: {
            'dragenter #dataCont' : 'dropMsg',
            'dragleave #dataCont' : 'dragMsg',
            'drop #dataCont' : 'dropEx',
            'dragover #dataCont': function(e) {
                e.stopPropagation();
                e.preventDefault();
            },
            'change #fileSelect': 'dropEx'
        },
        
        dropMsg: function () {
            $("#dragndropMsg h4")[0].innerHTML = 'Drop the file into the box';
        },
        
        dragMsg: function () {
            $("#dragndropMsg h4")[0].innerHTML = 'Drag the required file into the box';
        },
        
        dropEx: function(e) {
            e.stopPropagation();
            e.preventDefault();
            // grab the file list
            var fileList = e.target.files || e.originalEvent.dataTransfer.files,ext;  
            // Return if user dragged more than one file 
            if (fileList.length != 1) {
                $("#alertDiv").find('.modal-title').text('Load one file only')
                $("#alertDiv").modal('show');
                return;
            }
            else {
                ext = fileList[0].name.split('.').pop();
                require(['jquery', 'backbone','app/format/' + ext + 'Reader','bootstrap'], function ($, Backbone, reader) {
                    
                }, function (err) {
                    $("#alertDiv").find('.modal-title').text('Unsupported file format')
                    $("#alertDiv").modal('show');
                });
            }
        }
    });

});