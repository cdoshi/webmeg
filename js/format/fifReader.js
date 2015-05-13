define(function (require) {

    "use strict";
    
    var parser = require('app/parser'),
        loadHandler = function(file) {
            return function(e) {
                console.log(e);
                var _data = e.target.result,
                data  = parse(_data);
            }
        },
        errorHandler=function(e) {
            console.log('Error:' + e.target.error.code);
        };
    
    function getHeader(file) {
        // Start reading this file
        var reader     = new FileReader();
		reader.onerror = errorHandler;
		reader.onload  = loadHandler(file);
		reader.readAsArrayBuffer(file);
    };
    
    
    
    function parse(bytes) {
	
        console.log('Start parsing..');
        // initialize the scanner with the bytes
        var _scanner  = new parser.Scanner(bytes),
            data_info = fiff_setup_read_raw(_scanner);
    }
    
    function fiff_setup_read_raw(_scanner) {
        
    }
    
    function getData(header,from,to) {
        console.log('Display data from ' + from + ' to ' + to + ' seconds');
    };
    
    
    return {
        getHeader : getHeader,
        getData   : getData
    }
});