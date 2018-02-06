'use strict';
var util = require('util');
var Writable = require('stream').Writable;
//var printer = require('printer');
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
                console.log('Printing to ' + config.printer);
                return cb();
                /*
                printer.printDirect({
                    data: data,
                    printer: config.printer,
                    type: config.type,
                    docname: config.jobName,
                    options: config.options,
                    success: function(jobId){
                        console.log("sent to printer " + config.printer + " with ID: "+jobId);
                        cb();
                    },
                    error: function(err){
                        console.log(err);
                        cb(err);
                    }
                });
                */
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

function listPrinters(cb){
    var printerList = printer.getPrinters();
    if (cb){
        return process.nextTick(function(){
            cb(null, printerList);
        } );
    } else {
        return (printerList);
    }
}

function getJobs(printerName, cb){
    var printerData = printer.getPrinter(printerName);
    var jobs = [];
    if (_.has(printerData, 'jobs')){
        jobs = printerData.jobs;
    }
    process.nextTick(function(){
        cb(null, jobs);
    });
}

function getJobStatus(printerName, jobId, cb){
    var status = printer.getJob(printerName, jobId);
    process.nextTick(function(){
        cb(null, status);
    });
}

function cancelJob(printerName, jobId, cb){
    var job = printer.getJob(printerName, jobId);
    if ( job.status.indexOf('PRINTED') !== -1){
         process.nextTick(cb);
    }
    console.log('canceling ' + job.id + ' on ' + printerName);
    if (printer.setJob(printerName, job.id, 'CANCEL')){
        process.nextTick(cb);
    } else {
        process.nextTick(function(){
            cb(new Error('Error while canceling jobs: ' + printerName + ': ' + job.id));
        });
    }
}

function cancelJobs(printerName, cb){
    console.log('canceling all jobs on ' + printerName);
    var printerData = printer.getPrinter(printerName);
    if (! _.has(printerData, 'jobs')){
        return process.nextTick(cb);
    };

    async.each(printerData.jobs, function(job, cb){
        cancelJob(printerName, job.id, cb);
    }, cb);
}

function cancelAllJobs(cb){
    var data = listPrinters();
    async.each(data, function(printerData, cb){
        cancelJobs(printerData.name, cb);
    }, cb);
}


module.exports = {
    PrintStream: getPrintStream,
    list: listPrinters,
    getJobs: getJobs,
    getJobStatus: getJobStatus,
    cancelJob: cancelJob,
    cancelJobs: cancelJobs,
    cancelAllJobs: cancelAllJobs
};

