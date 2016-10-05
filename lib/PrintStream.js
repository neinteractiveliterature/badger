'use strict';
var util = require('util');
var Writable = require('stream').Writable;
var printer = require('printer');
var async = require('async');
var fs = require('fs');
var _ = require('underscore');

function PrintStream(options) {
    if (!(this instanceof PrintStream))
       return new PrintStream(options);
    Writable.call(this, options);

    var config = {
        jobName: 'node print job',
        print: true
    };

    _.each(['printer', 'print', 'type', 'jobName', 'file', 'display', 'options'], function(key){
        if (_.has(options, key)){
            config[key] = options[key];
        }
    });

    this.config = config;
    this.data = [];
}
util.inherits(PrintStream, Writable);

PrintStream.prototype._write = function(chunk, encoding, cb){
    var buffer = (Buffer.isBuffer(chunk)) ? chunk : new Buffer(chunk, enc);
    this.data.push(buffer);
    cb();
}

function getPrintStream(options, cb){
    if (typeof(cb) !== 'function'){
        cb = function(){};
    };

    var ps = new PrintStream(options);
    ps.on('finish', function(){

        var data = Buffer.concat(this.data);
        var config = this.config;

        async.parallel({
            file: function(cb){
                if (_.has(config, 'file')){
                    fs.writeFile(config.file, data, cb);
                } else {
                    process.nextTick(cb);
                }
            },
            print: function(cb){

                if (! config.print){
                  return process.nextTick(cb);
                }

                printer.printDirect({
                    data: data,
                    printer: config.printer,
                    type: config.type,
                    docname: config.jobName,
                    options: config.options,
                    success: function(jobID){
                        console.log("sent to printer " + config.printer + " with ID: "+jobID);
                        cb();
                    },
                    error: function(err){
                        console.log(err);
                        cb(err);
                    }
                });
            }
        }, function(err){
            if (err) { return cb(err); }
            if (config.display){
                return cb(null, data);
            }
            cb();
        });
    });
    return ps;
}

module.exports = getPrintStream;
