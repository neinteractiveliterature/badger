'use strict';
var PDFDocument = require('pdfkit');
var _ = require('underscore');
var printerHelper = require('../lib/printer-helper');
var config = require('config');

var DEBUG = config.get('app.debug') === 'true';

exports.getPageSize = function(media){
    return getPage(media);
}

var PrintStream = printerHelper.PrintStream;
/*
 * Generate and return a badge
 * display(positions, data, <options>, <callback>)
 */

exports.display = function(){
    var positions = arguments[0];
    var data = arguments[1];
    var options = {};
    var cb = function(){};

    if (typeof arguments[arguments.length-1] === 'function'){
        cb = arguments[arguments.length-1];
    }

    if (arguments.length > 2 && typeof arguments[2] === 'object'){
        options = arguments[2];
    }

    options.display = true;
    options.print = false;

    generate(positions, data, options, cb);
}

/*
 * print a badge
 * print(positions, data, <options>, <callback>)
 */
exports.print = function(){

    var positions = arguments[0];
    var data = arguments[1];
    var options = {};
    var cb = function(){};

    if (typeof arguments[arguments.length-1] === 'function'){
        cb = arguments[arguments.length-1];
    }

    if (arguments.length > 2 && typeof arguments[2] === 'object'){
        options = arguments[2];
    }

    if (! _.has(options.print)){
        var print = config.get('app.print');
        if ( typeof(print)!== 'undefined' && (! print  || print === 'false')){
            options.print = false;
        } else {
            options.print = true;
        }
    }

    generate(positions, data, options, cb);
}



function generate(positions, data, options, cb){

    data = prepData(positions, data);

    var media = config.get('pages.default');
    var page = getPage(options.media);
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

    var printer = options.printer || config.get('app.printer');

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
}

function getPage(media){
    if (! _.has(config.pages.sizes, media)){
        media =  config.get('pages.default');
    }
    var ppi = config.get('pages.ppi');
    var mediaLayout = config.get('pages.sizes.' + media);
    var page = {
        width: mediaLayout.width * ppi,
        height: mediaLayout.height * ppi,
        margin: mediaLayout.margin * ppi,
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
    }

    // Allow pdfkit options to be passed along
    if (_.has(position.pdfOptions)){
        for (key in position.pdfOptions){
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
        } else {
            if (_.has(data.data, dataField)  && data.data[dataField] !== ''){
                userData.badgeData[badgeField] = data.data[dataField];
            }
        }
        used.push(dataField);
    });
    return userData;
}

