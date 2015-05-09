define(function (require) {

    "use strict";
    
    var parser = require('app/parser');
    
    function fiff_read_info(file) {
        console.log('hi');
    }
    
    function fiff_read_raw_segment(file) {
        console.log('hi');
    }
    
    
    return {
        fiff_read_info: fiff_read_info,
        fiff_read_raw_segment: fiff_read_raw_segment
    }
});