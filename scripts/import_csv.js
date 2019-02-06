#!/usr/local/bin/node
'use strict';
var csv = require('csv');
var fs = require('fs');
var _ = require('underscore');
var async = require('async');
var program = require('commander');
var importer = require('../lib/importer');
var models = {
    event: require('../models/event'),
    importer: require('../models/importer')
};

function die(err){
    if (err){
        console.log(err.stack);
        console.log(err);
        process.exit(1);
    }
    process.exit(0);
}

program
    .version('0.0.1')
    .usage('[options] <event name> <file>')
    .option('-e, --events', 'List Events')
    .option('-c, --clone [event name]', 'Specify an event to clone data from')
    .option('-d, --dryrun', 'Dry run only')
    .option('-v, --verbose', 'verbose messages')
    .parse(process.argv);


if (program.events){
    showEvents(die);
} else {
    var event_name = program.args[0];
    var filename = program.args[1];
    if (!event_name || !filename) {
        program.help();
    }

    async.waterfall([
        function(cb){
            async.parallel({
                event: function(cb){
                    models.event.getByName(event_name, cb);
                },
                clone: function(cb){
                    if (! program.clone){
                        return process.nextTick(cb);
                    }
                    models.event.getByName(program.clone, cb);
                }
            }, cb);
        },

        function(dbData, cb){
            if (! dbData.event){
                console.log('event ' + event_name + ' not found');
                process.exit(0);
            }
            program.event_id = dbData.event.id;
            program.base_url = dbData.event.base_url;

            if (dbData.clone){
                program.clone = dbData.clone.id;
            }

            models.importer.get(dbData.event.importer_id, function(err, importer){
                if (err) { return cb(err); }
                if (!importer){
                    console.log('importer not found');
                    process.exit(0);
                }

                dbData.importer = importer;
                cb(null, dbData);
            });
        },

        function(dbData, cb){

            if (program.verbose){
                console.log(JSON.stringify(dbData, null, 2));
            }

            fs.readFile(filename, 'utf8', function(err, doc){
                if (err) { return cb(err); }
                cb(null, dbData, doc);
            });
        },
        function(dbData, doc, cb){
            csv.parse(doc, {columns: true}, function(err, data){
                if(err){ die(err); }
                async.eachLimit(data, 1, function(row, cb){
                    importer(dbData.importer.rules, row, program, cb);
                }, function(err){
                    if (err) { return cb(err); }
                    cb(null, data.length);
                });
            });
        }
    ], function(err, count){
        if (err){ die(err); }
        console.log('done: ' + count + ' imported');
        process.exit(0);
    });
}


function showEvents(cb){
    console.log('\nEvents:');
    models.event.list(function(err, events){
        if (err) { cb(err); }
        _.each(events, function(event){
            console.log('  ' + event.name);
            if (program.verbose){
                console.log(JSON.stringify(event.badge, null, 2));
            }
        });
        console.log();
        cb();
    });
}

function showImporters(cb){
    console.log('\nImporters:');
    models.importer.list(function(err, importers){
        if (err) { cb(err); }
        _.each(importers, function(importer){
            console.log('  ' + importer.name);
            if (program.verbose){
                console.log(JSON.stringify(importer.rules, null, 2));
            }
        });
        console.log();
        cb();
    });
}
