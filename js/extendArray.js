define(function (require) {

    "use strict";

        // Function that will return 1D array, used for initializing
    var fill = function fill(dim, type,value) {
        var arr = [], i;
        for (i = 0; i < dim; i++) {
            if (type === 'ones') arr[i] = 1;
            else if (type === 'rands') arr[i] = Math.random();
            else if(type === 'empty') arr[i] = undefined;
            else if(type === 'custom') arr[i] = value;
            
            else arr[i] = 0;
        }
        return arr;
    },
        // Function to check if arrays have the same dimension
        checkDimensions = function (arr, arr1) {
            var size = this.dimensions(arr),
                size1 = this.dimensions(arr1),
                i;
            
            if (size.length !== size1.length) return false;
            else {
                for (i = 0; i < size.length; i++) {
                    if(size[i] !== size1[i]) return false;
                } 
            }
            return true;
        },
        
        convert1Dto2D = function (arr) {
            var newarr = [],
                els = arr.length,
                i;
            newarr[0]=[];
            for(i = 0; i < els; i++) {
                newarr[0][i] = arr[i];
            }
            return newarr;
        },
        
        initeye = function (arr, check) {
            var size = arr.length,
                newarr = [],
                dim,
                i, j;
            
            if(check) {
                if (size === 1) size.unshift(size[0]);
            }
            
            // Base Case
            if(size < 3) {
                
                for(i = 0; i < arr[0]; i++) {
                    newarr[i] = [];
                    for (j = 0;j < arr[1];j++) {
                        if(i === j) newarr[i][j] = 1;
                        else newarr[i][j] = 0;
                    }
                }
            }
            // Recursive Case
            else {
                dim = arr[0];
                for (var i = 0;i < dim;i++) newarr[i] = initeye(arr.slice(1),false);
            }
            
            return newarr;
        },
        
        cofactors = function (arr,size) {
            var newarr = [],
                rows = size[0],
                i,j;
            
            for(i = 0;i < rows;i++) {
                newarr[i]=[];
                for(j = 0;j < rows;j++) {
                    newarr[i][j] = Math.pow(-1,i+j) * 
                        this.determinant(this.subset(arr,
                                         [this.serialIndex(0,size[0]-1,1,[i]),this.serialIndex(0,size[0]-1,1,[j])]),false);
                }
            }
            return newarr;      
        },
        
        // Check if input is array
        checkArray = function (arr) {
            if(arr === undefined) return false;
            if (arr.constructor.toString().indexOf("Array") > -1) return true;
            return false;
        },
        
        // Get dimensions of array
        dimensions = function (arr,check) {
            if(check === undefined) {
                if(arr === undefined) return [];
                if(arr.length === 0) return 0;
                if(!this.checkArray(arr)) return false;
            }
            var depth = [];
            // Base Case
            if(arr[0].length === undefined) return [arr.length];
            
            // Recursive Case
            else depth = depth.concat(arr.length,this.dimensions(arr[0],false));
            
                        
            return depth;
        },
        
        // Get array filled with either zeros,ones,empty or random numbers
        initialize = function (arr,type,value,check) {
            if(check === undefined) check=true;
            
            if(check) {
                if(arr === undefined || arr.length === 0) return [];
                if(!this.checkArray(arr) || arguments.length > 3) return false;
                if(type !== 'ones' && 
                   type !== 'zeros' && 
                   type !== 'rands' && 
                   type !== 'empty' &&
                   type !== 'custom' &&
                   type !== 'eye') 
                    return false;
                
                if(type === 'eye') return initeye.bind(this,arr,check)();
            }
            
            var newarr = [],dim;
            
            // Base Case
            if(arr.length === 1) return fill(arr[0],type,value);
            
            // Recursive Case
            else {
                dim = arr[0];
                for(var i = 0;i < dim;i++)
                    newarr[i] = this.initialize(arr.slice(1),type,value,false);
            }
            
            return newarr;
        },
        
        // Computes transpose of the array. Supports only upto 2D
        transpose = function(arr,newarr,check) {
            
            if(check === undefined) {
                if(arr === undefined || arr.length === 0) return [];
                if(!this.checkArray(arr)) return false;
                if(newarr === undefined) newarr=[];
            }
            
            var size = this.dimensions(arr),
                dim,
                dimlen,
                i;
            
            // Base Case
            if(size.length === 1) {
                if(newarr.length === 0) {
                    for(i = 0;i < size[0];i++) 
                        newarr[i] = [arr[i]];    
                }
                
                else {
                    var size1 = this.dimensions(newarr);
                    for(i = 0; i < size[0]; i++) 
                        newarr[i][size1[1]] = arr[i];
                }
            }
            
            // Recursive Case
            else {
                dim = size.shift();
                for(i = 0; i < dim; i++) 
                    newarr = this.transpose(arr[i],newarr,false);
            }
             
            return newarr;  
        },
        
         // Compute cross product
        crossProduct = function(arr,arr1,check) {
            
            if(check === undefined) {
                if(arr === undefined || arr1 === undefined) return [];
                if(!this.checkArray(arr) || !this.checkArray(arr1)) return false;
            }
            
            var size = this.dimensions(arr),
                size1 = this.dimensions(arr1),
                newarr=[];
            
                if(check) {
                    if(size.length === 1) {
                        size.unshift(1);
                        arr = convert1Dto2D(arr);
                    }
                    if(size1.length === 1) {
                        size1.unshift(1);
                        arr1 = convert1Dto2D(arr1);
                    }
                    
                    if(size.length > 2) {
                        console.error('Matrix multipication higher than 2D not supported');
                        return false;
                    }
                    else if(size[1] != size1[0]) {
                        console.error('Columns of first array do not match rows of second');
                        return false;
                    }
                    arr1 = this.transpose(arr1);
                }
                
            
            // Base Case
            if(size.length === 1) {
                return this.stat(this.dotOperation(arr,arr1,'multiply'),'add')[0];
            }
            
            // Recursive Case
            else {
                var rows = size[0],
                    cols = size1[1];
                
                for(var i = 0;i < rows;i++) {
                    newarr[i]=[];
                    for(var j = 0;j < cols;j++) 
                        newarr[i][j] = this.crossProduct(arr[i],arr1[j],false);
                }
            }
            return newarr;   
        },
        
        // Perform element by element operation. Either add, subtract, multiply or divide
        dotOperation = function(arr,arr1,type,check) {
            
            if(check === undefined) {
                if(arr === undefined || arr1 === undefined || type === undefined) return [];
                if(!this.checkArray(arr) || !this.checkArray(arr1)) return false;
                if(!checkDimensions.bind(this,arr,arr1)()) {
                    console.error('Arrays must be of same dimensions');
                    return false;
                }
            }
            
            if(type !== 'add' && 
               type !== 'subtract' && 
               type !== 'multiply' && 
               type !== 'divide') 
                return false;
            
           var size = this.dimensions(arr),
                dim,
                newarr=[];
            
            // Base Case
            if(size.length === 1) {
                if(type === 'add')
                    for(var i = 0;i < size[0];i++) newarr[i] = arr[i] + arr1[i];
                else if(type === 'subtract')
                    for(var i = 0;i < size[0];i++) newarr[i] = arr[i] - arr1[i];
                else if(type === 'multiply')
                    for(var i = 0;i < size[0];i++) newarr[i] = arr[i] * arr1[i];
                else if(type === 'divide')
                    for(var i = 0;i < size[0];i++) newarr[i] = arr[i] / arr1[i];
                
            }
            
            // Recursive Case
            else {
                dim = size.shift();
                for(var i = 0;i < dim;i++) newarr[i] = this.dotOperation(arr[i],arr1[i],type,false);
            }
            return newarr;     
        },
        
        // Perform element by element operation with a scalar. Either add, subtract, multiply,divide, absolute value
        scalarOperation = function(arr,operation,num,check) {
            if(arr === undefined || operation === undefined) return [];
            
            if(check === undefined) {
                if(operation !== 'add' && 
                   operation !== 'subtract' && 
                   operation !== 'multiply' && 
                   operation !== 'divide' &&
                   operation !== 'abs' &&
                   operation !== 'power' &&
                   operation !== 'sqrt' &&
                   operation !== 'log' &&
                   operation !== 'log10' &&
                   operation !== 'copy') 
                    return false;
            
                if(operation === 'abs' || 
                   operation === 'sqrt' ||
                   operation === 'log' || 
                   operation === 'log10' || 
                   operation === 'copy') num = 0;
                        
                if(num === undefined || typeof num !== 'number') return arr;
                if(!this.checkArray(arr)) return false;
            }
            
            var size = this.dimensions(arr),
                dim,
                newarr=[],
                els;
            
            // Base Case
            if(size.length === 1) {
                els = size[0];
                if(operation === 'add')
                    for(var i = 0;i < els;i++) newarr[i] = arr[i] + num;
                else if(operation === 'subtract')
                    for(var i = 0;i < els;i++) newarr[i] = arr[i] - num;
                else if(operation === 'multiply')
                    for(var i = 0;i < els;i++) newarr[i] = arr[i] * num;
                else if(operation === 'divide')
                    for(var i = 0;i < els;i++) newarr[i] = arr[i] / num;
                else if(operation === 'abs') {
                    for(var i = 0;i < els;i++) newarr[i] = Math.abs(arr[i]);
                }
                else if(operation === 'power') {
                    for(var i = 0;i < els;i++) newarr[i] = Math.pow(arr[i],num);
                }
                else if(operation === 'sqrt') {
                    for(var i = 0;i < els;i++) newarr[i] = Math.sqrt(arr[i]);
                }
                else if(operation === 'log') {
                    for(var i = 0;i < els;i++) newarr[i] = Math.log(arr[i]);
                }
                else if(operation === 'log10') {
                    for(var i = 0;i < els;i++) newarr[i] = Math.log10(arr[i]);
                }
                else if(operation === 'copy') {
                    for(var i = 0;i < els;i++) newarr[i] = arr[i];
                }
                
            }
            
            // Recursive Case
            else {
                dim = size.shift();
                for(var i = 0;i < dim;i++) newarr[i] = this.scalarOperation(arr[i],operation,num,false);
            }
             
            return newarr;   
        },
        // Compute mean of a[0][0],a[0][1], ..., a[0][n] elements of array. 
        stat = function(arr, operation,type,check) {
            
            if(check === undefined) {
                if(arr === undefined) return [];
                if(!this.checkArray(arr)) return false;
                if(operation !== 'mean' 
                   && operation !== 'max' 
                   && operation !== 'min'
                   && operation !== 'popstd'
                   && operation !== 'samstd'
                   && operation !== 'absmax'
                   && operation !== 'absmin'
                   && operation !== 'add'
                   && operation !== 'multiply') return false;
                if(type === undefined) type = 'horizontal';
            }
            
            if(type === 'vertical') {
                var arr1 = ExtendArray.transpose(arr);
                return ExtendArray.stat(arr1,operation);
            }
            
            var size = this.dimensions(arr),
                dim,
                newarr=[],
                els;
            
            // Base Case
            if(size.length === 1) {
                els = size[0];
                if(operation === 'mean') {
                    var sum = 0;
                    for(var i = 0;i < els;i++) sum += arr[i];
                    newarr[0] = sum / els;
                }
                else if(operation === 'max') {
                    newarr[0] = Math.max.apply(null, arr);
                }
                else if(operation === 'absmax') {
                    newarr[0] = Math.max.apply(null, this.scalarOperation(arr,'abs'));                    
                }
                else if(operation === 'absmin') {
                    newarr[0] = Math.min.apply(null, this.scalarOperation(arr,'abs'));                    
                }
                else if(operation === 'min') {
                    newarr[0] = Math.min.apply(null, arr);
                }
                else if(operation === 'add') {
                    var sum = 0;
                    for(var i = 0;i < els;i++) sum += arr[i];
                    newarr[0] = sum;
                }
                else if(operation === 'multiply') {
                    var sum = 1;
                    for(var i = 0;i < els;i++) sum *= arr[i];
                    newarr[0] = sum;
                }
                else if(operation === 'popstd') {
                    var avg = this.stat(arr,'mean');
                    newarr[0] = Math.sqrt(this.stat(this.power(this.scalarOperation(arr,'subtract',this.stat(arr,'mean')[0]),2),'add')[0]/els);
                }
                else if(operation === 'samstd') {
                    var avg = this.stat(arr,'mean');
                    newarr[0] = Math.sqrt(this.stat(this.power(this.scalarOperation(arr,'subtract',this.stat(arr,'mean')[0]),2),'add')[0]/(els-1));
                }
            }
            
            // Recursive Case
            else {
                dim = size.shift();
                for(var i = 0;i < dim;i++) newarr[i] = this.stat(arr[i],operation,false);
            }
            return newarr;  
        },
        
        subset = function(arr, index, check) {
            
            if(check === undefined) {
                if(arr === undefined) return [];
                if(!this.checkArray(arr) && !this.checkArray(index)) return false;
            }
            
            var size = this.dimensions(arr),
                newarr = [],    
                dim,
                i, j;
            
            
            if (index.length > size.length) return false;
            else if(index.length < size.length) {
                for(i = 0;i < (size.length - index.length);i++) index[index.length] = ':';
            }
            
            for(var i = 0;i < index.length;i++) {
                if(typeof(index[i]) === 'number') index[i] = [index[i]];
                else if(index[i] === ':') {
                    index[i] = [];
                    for (j = 0;j < size[i];j++) index[i][j] = j;
                }
            }
            
            if(index[0] === ':') dim = arr[0].length; 
            else dim = index[0].length;
            
            // Base Case
            if(size.length === 1) {
                for(var i = 0;i < dim;i++) 
                    newarr[i] = arr[index[0][i]];
            }
            
            // Recursive Case
            else {
                for(var i = 0;i < dim;i++) 
                    newarr[i] = this.subset(arr[index[0][i]],index.slice(1),false);
            }
             
            return newarr;  
            
        },
        
        determinant = function(arr, check, det) {
            if(check === undefined) check = true;
            
            var size = this.dimensions(arr);
             
            if(check) {
                
                if(arr === undefined) return [];
                if(!this.checkArray(arr)) return false;
                
                if(size.length !== 2) {
                    console.error('Supports 2D matrices only');
                    return false;
                }
                if(size[0] !== size[1]) {
                    console.error('Supports square matrices only');
                    return false;
                }
                
                arr = this.scalarOperation(arr,'copy');
                
                if(det === undefined) det = 0;
            }
            
            // Base Case
            if(size[0] === 1) return arr[0][0];
            
            else if(size[0] === 2) 
                return arr[0][0] * arr[1][1] - arr[0][1] * arr[1][0];
            
            // Recursive Case
            else {
                var ind = this.serialIndex(1,size[0]-1),
                    arr1,
                    rows = size[0],
                    cols = size[1],
                    i,j,scale=1;
                    
                for(i = 1;i < rows;i++) {
                    for(j = 1;j < cols;j++) arr[i][j] = arr[i][j] * arr[0][0] - arr[i][0] * arr[0][j];
                }
                
                
                if(Math.abs(arr[1][1]) > Math.pow(10,5)) {
                    scale = Math.pow(10,-5);
                    arr = this.scalarOperation(arr,'multiply',scale);
                }
                else if(Math.abs(arr[1][1]) < Math.pow(10,-5)) {
                    scale = Math.pow(10,5);
                    arr = this.scalarOperation(arr,'multiply',scale);
                }
                
                arr1 = this.subset(arr,[ind,ind]);
                
                det = this.determinant(arr1,false,det);
                
                det = det / scale;

                for(i = 1;i < rows - 1;i++) det = det/(arr[0][0]);
                
            }
             
            return det;
        },
        
        serialIndex = function(startInd,endInd,jump,exclude,tot) {
            if(jump === undefined) jump = 1;
            if(exclude === undefined) exclude = [];
            if(!this.checkArray(exclude)) {
                console.error('exclude argument is an array');
                return false;
            }
            if(tot === undefined) tot = 0;
            
            var newarr = [],
                temp = -1,
                check = false,
                i = startInd;
            
            if (exclude.length !== 0) check = true;
            
            while(i <= endInd || newarr.length < tot) {
                
                if(check) temp = exclude.indexOf(i); 
                if(temp === -1) newarr[newarr.length] = i;
                i = i + jump;
                
            }
        
            return newarr;
        },
        
        inverse = function(arr, check) {
            if(check === undefined) check = true;
            var size = this.dimensions(arr),det;
            if(check) {
                if(arr === undefined) return [];
                if(!this.checkArray(arr)) return false;
            }
                
            if(size.length !== 2) {
                console.error('Supports 2D matrices only');
                return false;
            }
            if(size[0] !== size[1]) {
                console.error('Supports square matrices only');
                return false;
            }
            
            det = this.determinant(arr)
                
            if(det === 0) {
                console.error('Inverse of singular matrix cannot be determined');
                return false;
            }
            return this.scalarOperation(this.adjoint(arr,false),'divide',det);
            
        },
        
        pseudoinverse = function(arr) {
            if(arr === undefined) return [];
            if(!this.checkArray(arr)) return false;
            
            var size = this.dimensions(arr);
            
            if(size.length > 2) {
                console.error('Supports only upto 2D');
                return false;
            }
            
            var transarr = this.transpose(arr);
            
            if(size[0] > size[1]) {
                
                return this.crossProduct(this.inverse(this.crossProduct(transarr,arr),false),transarr);
            }
            else {
                return this.crossProduct(transarr,this.inverse(this.crossProduct(arr,transarr),false));
            }
        },
        
        adjoint = function(arr, check) {
            if(check === undefined) check = true;
            
            if(check) {
                if(arr === undefined) return [];
                if(!this.checkArray(arr)) return false;
            }
            
            var size = this.dimensions(arr);
                
            if(check) {    
                if(size.length !== 2) {
                    console.error('Supports 2D matrices only');
                    return false;
                }
                if(size[0] !== size[1]) {
                    console.error('Supports square matrices only');
                    return false;
                }
            }
            
            return this.transpose(cofactors.bind(this,arr,size)());
        },
        
        // Convert multidimesional array to 1D array
        serialize = function(arr, check) {
            
            if(check === undefined) check = true;
            
            if(check) {
                if(arr === undefined) return [];
                if(!this.checkArray(arr)) return false;
            }
            
            var newarr = [],
                size = this.dimensions(arr);
            
            // Base Case
            if(size.length === 1) {
                for(var i = 0;i < size;i++) newarr[i] = arr[i];
            }
            // Recursive Case
            else {
                var tot = size[0];
                for(var i = 0;i < tot;i++) 
                    newarr = newarr.concat(this.serialize(arr[i],false));
            }
            
            return newarr;
        },
        
        reshape = function(arr, arr1, jump, check) {
            if(check === undefined) check = true;
            
            if(check) {
                if(arr === undefined) return [];
                if(!(this.checkArray(arr) &&  this.checkArray(arr1))) return false;
                
                var size = this.dimensions(arr),
                    total  = this.stat(size,'multiply')[0];
                
                if(total !== this.stat(arr1,'multiply')[0]) {
                    console.error("Can't reshape " + this.print(size) + " array to " + this.print(arr1) + " array");
                    return false;
                }
                
                if(size.length > 1) arr = this.serialize(arr);
                
                if(jump === undefined) jump = 0; // Consecutive
                else if(total%jump) {
                    console.error('Cannot reshape with this jump value');
                    return false;
                }
            }
            
            var newarr = [];
            
            // Base Case
            if(arr1.length === 1) {
                for(var i = 0;i < arr.length;i++) newarr[i] = arr[i];
            }
            // Recursive Case
            else {
                var firstDim = arr1[0],
                    tot    = this.stat(arr1,'multiply')[0],
                    rem = tot/firstDim;
                
                arr1 = this.subset(arr1,[this.serialIndex(1,arr1.length-1)]);
                
                for(var i = 0;i < firstDim;i++) {
                    if(jump === 0)
                        newarr.push(this.reshape(this.subset(arr,[this.serialIndex(i*rem,0,1,[],rem)]),arr1,jump,false))
                    else
                        newarr.push(this.reshape(this.subset(arr,[this.serialIndex(i,0,firstDim,[],rem)]),arr1,jump,false))
                }
            }
            return newarr;
        },
        
        print = function(arr) {
            if(arr === undefined) return [];
            if(!this.checkArray(arr)) return false;
            
            var size = this.dimensions(arr),rows,cols,str='';
            
            if(size.length > 2) {
                console.error('Supports upto 2D matrices only');
                return false;
            }
            else if(size.length === 2) {
                rows = size[0];
                cols = size[1];
                str += '[';
                for(var i = 0;i < rows;i++) {
                    str += '[';
                    for(var j = 0;j < cols;j++) {
                        if( j === cols - 1) 
                            str += arr[i][j];
                        else 
                            str += arr[i][j] + ', ';
                    }
                    
                    if( i !== rows - 1) str += '],';
                    else str += ']';
                }
                str = str + ']';   
            }
            else {
                rows = size[0];
                str += '[';
                for(var i = 0;i < rows;i++) {
                    if(i === rows - 1) str += arr[i];
                    else str += arr[i] + ', ';
                }
                str += ']';
            }
            
            return str;
        };

    return {
        checkArray      : checkArray,
        dimensions      : dimensions,
        initialize      : initialize,
        transpose       : transpose,
        crossProduct    : crossProduct,
        dotOperation    : dotOperation,
        scalarOperation : scalarOperation,
        stat            : stat,
        subset          : subset,
        determinant     : determinant,
        serialIndex     : serialIndex,
        inverse         : inverse,
        pseudoinverse   : pseudoinverse,
        adjoint         : adjoint,
        serialize       : serialize,
        reshape         : reshape,
        print           : print
    };

});