define(function (require) {

    "use strict";
    
    var parser      = require('app/parser'),
        extendArray = require('app/extendArray');
    
    /* The purpose of the getHeader function is to get the metadata and the position
     * where the data starts
    */
    function getHeader(model) {
        // Start reading this file
        var reader     = new FileReader(),
            blob,
            file       = model.get('file')[0],
            endByte = (file.size < 100000) ? file.size : 100000; // Load only 1Mb or whichever is smaller
        
		reader.onerror = function(e) {
            console.log(e.target.error.code);
        }
        
        reader.onloadend = function(e) {
            if (e.target.readyState == FileReader.DONE) { // DONE == 2
                var _data = e.target.result;
                
                parseHeader(_data,model,file);
            }
        }
        
        // Do not load entire file in memory. Slice the file
        blob = file.slice(0, endByte);
        reader.readAsArrayBuffer(blob);
    };
    
    function parseHeader(blob,model,file) {
	
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
        
        model.set('hdr',hdr);
    }
    
    function getData(model,from,to) {
        
        var hdr              = model.get('hdr'),
            startRecord      = Math.floor(from),
            endRecord        = Math.ceil(to),
            oneRecord        = hdr.samF * hdr.ns * 2, // 2 is because sshort is 2 bytes long
            totalRecord      = endRecord - startRecord,
            totalBytesNeeded = totalRecord * oneRecord, 
            startByte        = hdr.dataStart + (startRecord * oneRecord + 1), 
            endByte          = startByte + totalBytesNeeded,
            startSam         = parseInt(from - Math.floor(from) * hdr.samF),
            endSam           = startSam + parseInt((to - from) * hdr.samF) - 1,
            samples          = extendArray.serialIndex(startSam,endSam),
            reader           = new FileReader(),
            file             = model.get('file')[0],
            blob;
        
        if(endByte > hdr.totalSize) {
            endByte   = file.size;
            startByte = endByte - totalBytesNeeded;
            samples   = ':';
        }
        
        reader.onerror = function(e) {
            console.log(e.target.error.code);
        }
        
        reader.onloadend = function(e) {
            if (e.target.readyState == FileReader.DONE) { // DONE == 2
                var _data = e.target.result;
                parseData(_data,hdr,totalRecord,model,samples);
            }
        }
        
        // Do not load entire file in memory. Slice the file
        blob = file.slice(startByte, endByte);
        
        reader.readAsArrayBuffer(blob);
        
    };
    
    function parseData(blob,hdr,totalRecord,model,samples) {
        console.log('Reading Data..');
        
        // initialize the scanner with the bytes
        var _scanner  = new parser.Scanner(blob),
            data      = [],
            numSam    = hdr.samF,
            indexVal  = 0,
            temp;
        
        for(var i = 0;i < hdr.ns;i++) data[i] = [];
            
        
        _scanner._littleEndian = true // Data is in litte Endian form
        
        for (var i = 0;i < totalRecord;i++) {
            for (var j = 0;j < hdr.ns;j++) {
                temp = _scanner.scan('sshort',numSam);
                for (var k = 0;k < numSam;k++) 
                    data[j][indexVal + k] = temp[k] * hdr.scaleFac[j] + hdr.dc[j];
            }
            indexVal = numSam + i * numSam;
        }
        
        data = extendArray.subset(data,[':',samples]);
        
        model.set('data',data);
    }
    
    
    return {
        getHeader : getHeader,
        getData   : getData
    }
});