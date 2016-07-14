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
  .usage('[options] <event> <importer> <file>')
  .option('-e, --events', 'List Events')
  .option('-i, --importers', 'List Importers')
  .option('-d, --dryrun', 'Dry run only')
  .option('-v, --verbose', 'verbose messages')
  .parse(process.argv);


if (program.events){
    showEvents(die);
} else if (program.importers){
    showImporters(die);
} else {
    var event_name = program.args[0];
    var importer_name = program.args[1];
    var filename = program.args[2];
    if (!event_name || !importer_name || !filename) {
        program.help()
    }

    async.waterfall([
        function(cb){
            async.parallel({
                importer: function(cb){
                    models.importer.getByName(importer_name, cb);
                },
                event: function(cb){
                    models.event.getByName(event_name, cb);
                }
            }, cb);
        },

        function(dbData, cb){
            if (! dbData.importer){
                console.log('importer ' + importer_name + ' not found');
                process.exit(0);
            }
            if (! dbData.event){
                console.log('event ' + event_name + ' not found');
                process.exit(0);
            }

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
                    program.event_id = dbData.event.id;
                    importer(dbData.importer.rules, row, program, cb);
                }, function(err){
                    if (err) { return cb(err); }
                    cb(null, data.length);
                });
            });
        }
    ], function(err, count){
        if (err){ die(err); }
        console.log('done: ' + count + " imported");
        process.exit(0);
    });
}


function showEvents(cb){
    console.log('\nEvents:');
    models.event.list(function(err, events){
        if (err) { cb(err); }
        _.each(events, function(event){
            console.log('  ' + event.name);
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
        });
        console.log();
        cb();
    });
}
