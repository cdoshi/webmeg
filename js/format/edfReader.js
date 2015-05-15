define(function (require) {

    "use strict";
    
    var parser = require('app/parser');
    
    /* The purpose of the getHeader function is to get the metadata and the position
     * where the data starts
    */
    function getHeader(dataModel) {
        // Start reading this file
        var reader     = new FileReader(),
            blob,
            file       = dataModel.get('file')[0],
            endByte = (file.size < 100000) ? file.size : 100000; // Load only 1Mb or whichever is smaller
        
		reader.onerror = function(e) {
            console.log(e.target.error.code);
        }
        
        reader.onloadend = function(e) {
            if (e.target.readyState == FileReader.DONE) { // DONE == 2
                var _data = e.target.result;
                
                parseHeader(_data,dataModel,file);
            }
        }
        
        // Do not load entire file in memory. Slice the file
        blob = file.slice(0, endByte);
        reader.readAsArrayBuffer(blob);
    };
    
    function parseHeader(blob,dataModel,file) {
	
        console.log('Reading header..');
        // initialize the scanner with the bytes
        var _scanner  = new parser.Scanner(blob),
            hdr = {};
        _scanner._littleEndian = true // Data is in litte Endian form
        
        // Get edf version        
        hdr.ver = parseFloat(String.fromCharCode.apply(String, _scanner.scan('uchar',8)));
        
        // Get patient name
        hdr.patientID = String.fromCharCode.apply(String,_scanner.scan('schar',80)).trim();

        // Get record ID
        hdr.recordID = String.fromCharCode.apply(String,_scanner.scan('schar',80)).trim();

        // Get start date (dd.mm.yy)
        hdr.startDate = String.fromCharCode.apply(String,_scanner.scan('schar',8)).trim();
        
        // Get start time (hh.mm.ss)
        hdr.startTime = String.fromCharCode.apply(String,_scanner.scan('schar',8)).trim();
        
        // Get number of bytes
        hdr.bytes = parseFloat(String.fromCharCode.apply(String,_scanner.scan('schar',8)));
        
        _scanner.scan('uchar',44); // reserved

        // Get length of data
        hdr.records = parseFloat(String.fromCharCode.apply(String,_scanner.scan('char',8)));

        // Get number of segments
        hdr.duration = parseFloat(String.fromCharCode.apply(String,_scanner.scan('char',8)));
        
        // Get number of channels
        var numChan = parseFloat(String.fromCharCode.apply(String,_scanner.scan('char',4)));
        hdr.ns = numChan;

        // Get channel labels
        hdr.channels = [];
        for (var i = 0;i < numChan;i++) 
            hdr.channels[i] = String.fromCharCode.apply(String,_scanner.scan('char',16)).trim();
        
        // Get transducers
        hdr.transducers = [];
        for (var i = 0;i < numChan;i++)
            hdr.transducers[i] = String.fromCharCode.apply(String,_scanner.scan('char',80)).trim();
            
        // Get units
        
        for (var i = 0;i < numChan - 1;i++) _scanner.scan('char',8);
        
        hdr.units = String.fromCharCode.apply(String,_scanner.scan('char',8)).trim();

        // Get physical minimum
        hdr.physicalMin = [];
        for (var i = 0;i < numChan;i++)
            hdr.physicalMin[i] = parseFloat(String.fromCharCode.apply(String,_scanner.scan('char',8)));

        // Get physical maximum
        hdr.physicalMax = [];
        for (var i = 0;i < numChan;i++)
            hdr.physicalMax[i] = parseFloat(String.fromCharCode.apply(String,_scanner.scan('char',8)));
            
        // Get digital minimum
        hdr.digitalMin = [];
        for (var i = 0;i < numChan;i++)
            hdr.digitalMin[i] = parseFloat(String.fromCharCode.apply(String,_scanner.scan('char',8)));

        // Get digital maximum
        hdr.digitalMax = [];
        for (var i = 0;i < numChan;i++)
            hdr.digitalMax[i] = parseFloat(String.fromCharCode.apply(String,_scanner.scan('char',8)));

        // Get preFilter
        hdr.preFilter = [];
        for (var i = 0;i < numChan;i++)
            hdr.preFilter[i] = String.fromCharCode.apply(String,_scanner.scan('char',80)).trim();

        // Get samples
        for (var i = 0;i < numChan - 1;i++)
            _scanner.scan('char',8);
        
        hdr.samF = parseFloat(String.fromCharCode.apply(String,_scanner.scan('char',8)));

        for (var i = 0;i < numChan;i++)
            _scanner.scan('char',32); // reserved
        

        hdr.scaleFac = [];
        for (var i = 0;i < numChan;i++)
            hdr.scaleFac[i] = (hdr.physicalMax[i] - hdr.physicalMin[i])/(hdr.digitalMax[i] - hdr.digitalMin[i]);

        hdr.dc = [];
        for (var i = 0;i < numChan;i++)
            hdr.dc[i] = hdr.physicalMax[i] - hdr.scaleFac[i] * hdr.digitalMax[i];
        
        hdr.dataStart = _scanner._dataPointer;
        
        hdr.totalSize = file.size;
        
        dataModel.set('hdr',hdr);
    }
    
    function getData(hdr,from,to) {
        var totalSec         = to - from,
            totalBytesNeeded = parseInt(totalSec * hdr.samF * hdr.ns * 2), // 2 is because sshort is 2 bytes long
            startByte        = hdr.dataStart + parseInt(from * hdr.samF * hdr.ns * 2), 
            endByte          = startByte + totalBytesNeeded,
            reader           = new FileReader(),
            blob;
        
        if(endByte > hdr.totalSize) {
            endByte   = file.size;
            startByte = endByte - totalBytesNeeded;
        }
        
        reader.onerror = function(e) {
            console.log(e.target.error.code);
        }
        
        reader.onloadend = function(e) {
            if (e.target.readyState == FileReader.DONE) { // DONE == 2
                var _data = e.target.result,
                data  = parseData(_data);
            }
        }
        
        // Do not load entire file in memory. Slice the file
        blob = file.slice(startByte, endByte);
        reader.readAsArrayBuffer(blob);
        
    };
    
    function parseData(blob) {
        
    }
    
    
    return {
        getHeader : getHeader,
        getData   : getData
    }
});