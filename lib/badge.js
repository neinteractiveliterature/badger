'use strict';
var PDFDocument = require('pdfkit');
var _ = require('underscore');
var printerHelper = require('../lib/printer-helper');
var device = require('../models/device');
var config = require('config');
var async = require('async');

var DEBUG = config.get('app.debug') === 'true';

exports.getPageSize = function(media){
    return getPage(media);
};

var PrintStream = printerHelper.PrintStream;
var currentPrinter = 0;

printerHelper.list(function(err, printers){
    if (err) {
        console.log('Error Listing Printers: ' + err);
        process.exit(1);
    }
    async.each(printers, function(printer, cb){
        device.getByName(printer.name, function(err, data){
            if (err) { return cb(err); }
            if (data){ return cb(); }
            device.create({
                name: printer.name,
                active: false,
                enabled: false,
            }, cb);
        });
    }, function(err){
        if (err){
            console.log('Error Saving Printers: ' + err);
            process.exit(1);
        }
        console.log('Saved Printer List');
    });
});

/*
 * Generate and return a badge
 * display(positions, data, <options>, <callback>)
 */

exports.display = function(){
    var positions = arguments[0];
    var margin = arguments[1];
    var data = arguments[2];
    var options = {};
    var cb = function(){};

    if (typeof arguments[arguments.length-1] === 'function'){
        cb = arguments[arguments.length-1];
    }

    if (arguments.length > 3 && typeof arguments[3] === 'object'){
        options = arguments[3];
    }

    options.display = true;
    options.print = false;

    generate(positions, margin, data, options, cb);
};

/*
 * print a badge
 * print(positions, data, <options>, <callback>)
 */
exports.print = function(){

    var positions = arguments[0];
    var margin = arguments[1];
    var data = arguments[2];
    var options = {};
    var cb = function(){};

    if (typeof arguments[arguments.length-1] === 'function'){
        cb = arguments[arguments.length-1];
    }

    if (arguments.length > 3 && typeof arguments[3] === 'object'){
        options = arguments[3];
    }

    if (! _.has(options.print)){
        var print = config.get('app.print');
        if ( typeof(print)!== 'undefined' && (! print  || print === 'false')){
            options.print = false;
        } else {
            options.print = true;
        }
    }

    generate(positions, margin, data, options, cb);
};



function generate(positions, margin, data, options, cb){

    data = prepData(positions, data);

    var media = config.get('pages.default');
    var page = getPage(options.media, margin);
    var printOptions = {};
    if (config.has('app.printOptions')) {
        printOptions = _.clone(config.get('app.printOptions'));
    }

    for (var key in printOptions){
        if (_.isString(printOptions[key])){
            if (printOptions[key].match(/^false$/i)){
                printOptions[key] = false;
            } else if (printOptions[key].match(/^true$/i)){
                printOptions[key] = true;
            }
        }
    }
    device.listActive(function(err, printers){
        if (err){ return cb(err); }
        if (!printers || printers.length === 0){
            return cb('No Active Printers');
        }
        var printer = printers[++currentPrinter % printers.length].name;

        var doc = new PDFDocument({
            size: [ page.width, page.height ],
            margins: {
                top: page.margin,
                bottom: page.margin,
                left: page.margin,
                right: page.margin,
            }
        });

        var jobName = _.has(data, 'name') ? 'Badge for ' + data.name : config.get('app.name') + ' Job';
        var fileName = config.get('app.outputDir') + '/';
        fileName += _.has(data, 'id') ? data.id + '.pdf': 'badge.pdf';

        var output = new PrintStream({
            printer: printer,
            type: 'PDF',
            jobName: jobName,
            file: fileName,
            print: options.print,
            display: options.display,
            options: printOptions
        }, cb);

        doc.pipe(output);

        positions.forEach(function(position){
            addElement(doc, position, data, page);
        });

        doc.end();
    });
}

function getPage(media, margin){
    if (! _.has(config.pages.sizes, media)){
        media =  config.get('pages.default');
    }
    var ppi = config.get('pages.ppi');
    var mediaLayout = config.get('pages.sizes.' + media);
    var page = {
        width: mediaLayout.width * ppi,
        height: mediaLayout.height * ppi,
        margin: margin * ppi,
    };
    return page;
}

function addElement(doc, position, data, page){
    //console.log(JSON.stringify(position, null, 2));
    var item = position.name;

    if (!_.has(data.badgeData, item)){
        return;
    }

    var text = data.badgeData[item].toString();

    if (text === null){
        return;
    }

    var size = 12;

    var x = position.x;
    var y = position.y;
    var width = page.width - (2*page.margin);
    var align = 'center';

    if (position.size){
        size = Number(position.size);
    }
    if (position.align){
        align = position.align;
    }
    if (position.width){
        width = Number(position.width);
    }


    if (x === 'center'){ x = page.margin; }
    if (x === 'margin'){ x = page.margin; }
    if (y === 'center'){ y = (page.height/2) - size; }
    if (y === 'margin'){ y = page.margin; }
    if (y === '-margin'){ y = page.height - (page.margin + size*1.20); }
    if (typeof(x) === 'string'){
        x = Number(x);
    }
    if (typeof(y) === 'string'){
        y = Number(y);
    }

    var options = {
        align: align,
        width: width
    };

    // Allow pdfkit options to be passed along
    if (_.has(position.pdfOptions)){
        for (var key in position.pdfOptions){
            options.key = position.pdfOptions[key];
        }
    }

    // pick font
    if (position.font){
        doc.font(position.font);
    } else {
        doc.font(config.get('app.defaultFont'));
    }

    // Shrink text to fit document
    doc.fontSize(size);

    var actualSize = size;
    while (doc.widthOfString(text) > width){
        actualSize -= 0.1;
        doc.fontSize(actualSize);
    }

    doc.text(data.badgeData[item], x, y, options);

    DEBUG && console.log(JSON.stringify({
        text: text,
        x:x,
        y:y,
        width:width,
        size: size,
        actualSize: actualSize
    }, null ,2));
}

// Map from database fields to badge fields.
function prepData(positions, data){
    var userData = {
        id: data.id,
        name: data.name,
        badgeData: {}
    };

    var used = [];

    _.each(positions, function(field){
        var badgeField = field.name;
        var dataField = field.name;
        console.log(badgeField + ': ' + dataField);
        if (_.has(field, 'dataField')){
            if (typeof(field.dataField) === 'string'){
                dataField = field.dataField;
            } else if (Array.isArray(field.dataField)){
                for( var i = 0 ; i < field.dataField.length; i++){
                    dataField = field.dataField[i];
                    if (_.has(data.data, dataField) && data.data[dataField] !== '' ){
                        break;
                    }
                }
            }
        }

        if (field.exclusive && used.indexOf(dataField) !== -1 ){
            return;
        }

        if (dataField === 'id'){
            if (_.has(data.data, 'id')  && data.data.id !== ''){
                userData.badgeData.id = data.data.id;
            } else {
                userData.badgeData.id = data.id;
            }
        } else if (dataField === 'name'){
            userData.badgeData[badgeField] = data.name;
        } else if (dataField === 'type'){
            userData.badgeData[badgeField] = data.type;
        } else if (_.has(data.data, dataField)  && data.data[dataField] !== ''){
            userData.badgeData[badgeField] = data.data[dataField];
        } else if (badgeField.match(/^text:\s*/i)){
            userData.badgeData[badgeField] = (badgeField.match(/^text:\s*(.+)$/i))[1];
        }

        used.push(dataField);
    });
    return userData;
}

