var _ = require('underscore');
var async = require('async');

var models = {
    attendee: require('../models/attendee'),
    note: require('../models/note')
};

var counter = 0;

module.exports = function(rules, row, options, cb){
    async.waterfall([
        function(cb){
            importAttendee(rules.attendee, row, options, cb);
        },
        function(id, cb){
            importNotes(rules.notes, id, row, options, cb);
        }
    ], cb);
};

function importAttendee(rules, row, options, cb){
    var attendee = {
        event_id: options.event_id,
        data:{},
        badged: false,
        checked_in: false,
    };
    var cloneFields = [];

    for (var fieldName in rules){
        var data;
        var field = rules[fieldName];
        var type = 'string';

        if (Array.isArray(field)){
            data = getArrayField(field, row);
        } else if (typeof(field) === 'string'){
            data = getField(field, row);
        } else if (typeof(field) === 'object'){
            data = getObjectField(fieldName, field, row);
            type = field.type || 'string';
        }

        if (data){
            attendee.data[fieldName] = data;
            if (type === 'name'){
                attendee.name = data;
            } else if(type === 'type'){
                attendee.type = data;
                if (data === 'Unpaid'){
                    attendee.registered = false;
                } else {
                    attendee.registered = true;
                }
            } else if (type === 'email'){
                attendee.email = data;
            } else if (type === 'url' && _.has(options, 'base_url')){
                if (_.has(field, 'path')){
                    attendee.data[fieldName] = options.base_url + field.path.replace(/{ID}/, attendee.data[fieldName]);
                } else {
                    attendee.data[fieldName] = options.base_url + '/' + attendee.data[fieldName];
                }
            } else if (type === 'boolean'){
                if (data.match(/(false|null)/i) || data === ''){
                    attendee.data[fieldName] = false;
                } else {
                    attendee.data[fieldName] = true;
                }
            }
        }

        if (options.clone && field.clone){
            // Clone these from previous event
            cloneFields.push(fieldName);
        }

        if (options.clone && field.cloneifEmpty && ! attendee.data[fieldName]){
            // Clone these from previous event if no new data is provided
            cloneFields.push(fieldName);
        }
    }
    async.each(cloneFields, function(fieldName, cb){
        models.attendee.getByEmail(options.clone, attendee.email, function(err, old){
            if (old){
                attendee.data[fieldName] = old.data[fieldName];
            }
            cb();
        });
    }, function(err){
        if (err) { return cb(err); }
        if (options.verbose){
            console.log(JSON.stringify(attendee, null, 2));
        }
        if (options.dryrun){
            process.nextTick(function(){
                cb(null, ++counter);
            });
        } else {
            models.attendee.getByEmail(options.event_id, attendee.email, function(err, existing){
                if (err) { return cb(err); }
                if (existing){
                    existing.name = attendee.name;
                    existing.data = attendee.data;
                    existing.registered = attendee.registered;
                    existing.type = attendee.type;
                    console.log(JSON.stringify(existing, null, 2));
                    models.attendee.update(existing.id, existing, function(err){
                        if (err){ return cb(err); }
                        cb(null, existing.id);
                    });
                } else {
                    models.attendee.create(attendee, cb);
                }
            });
        }
    });
}

function importNotes(rules, id, row, options, cb){
    var notes = [];
    _.each(rules, function(entry){
        var note;
        if (_.has(row, entry.field)){
            if (_.has(entry, 'map')){
                if (_.has(entry.map, row[entry.field].toString())){
                    note = entry.map[row[entry.field].toString()];
                } else {
                    note = row[entry.field];
                }
            } else if (_.has(entry, 'filter')) {
                const parts = row[entry.field].split(/\s*,\s*/);
                note = parts.filter(e => {
                    return (_.indexOf(entry.filter, e) === -1);
                }).join(', ');
            } else {
                note = row[entry.field];
            }
        }
        if (note){
            notes.push(note);
        }

    });
    async.each(notes, function(note, cb){
        var doc = {
            attendee_id: id,
            contents: note,
            cleared: false,
        };
        if (options.verbose){
            console.log(JSON.stringify(doc, null, 2));
        }
        if (options.dryrun){
            process.nextTick(cb);
        } else {
            saveNote(doc, cb);
        }
    }, cb);
}

function saveNote(doc, cb){
    models.note.listByAttendee(doc.attendee_id, function(err, notes){
        if(err) { return cb(err); }
        var found = false;
        _.each(notes, function(note){
            if (note.contents === doc.contents){
                found = note.id;
            }
        });
        if (found){
            return cb(null, found);
        }
        models.note.create(doc, cb);
    });
}


function getField(field, row){
    if (_.has(row, field)){
        return row[field];
    }
    return null;
}

function getArrayField(arr, row){
    var data = '';
    _.each(arr, function(element){
        var datum = getField(element, row);
        if (datum){
            data += datum;
        } else {
            data += element;
        }
    });
    if (data !== ''){
        return data;
    }
    return null;
}

function getObjectField(field, obj, row){
    if (_.has(obj, 'field')){

        field = obj.field;
    }

    var data;
    if (Array.isArray(field)){
        data = getArrayField(field, row);
    } else if (typeof(field) === 'string'){
        data = getField(field, row);
    }

    if (_.has(obj, 'map') && _.has(obj.map, data)){
        data = obj.map[data];
    }

    if (data !== ''){
        return data;
    }
    return null;
}
