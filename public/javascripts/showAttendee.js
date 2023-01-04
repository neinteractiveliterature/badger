/* global showAlert eventDataFields */
var disallowKeypress = 0;
showActions();

$('.note-cleared').hide();
$('#addNote').hide();

$('.editable').on('click', function(){
    disallowKeypress++;
    $('#btn-badge').prop('disabled', true);
    $('#btn-checkin-badge').prop('disabled', true);
});

$('.editable-note').on('click', function(){
    disallowKeypress++;
});

$('.note-edit').on('click', function(){
    var id = $(this).attr('note-id');
    $('#note-'+id+'-contents').click();
});

$('.editable-text').editable('/attendees/update', {
    placeholder: '<span class="edit-placeholder">Click to set a new value</span>',
    callback: function(value, settings){
        disallowKeypress--;
        $('#btn-badge').prop('disabled', false);
        $('#btn-checkin-badge').prop('disabled', false);
    }
});

$('.editable-boolean').editable('/attendees/update', {
    data   : ' {\'Yes\':\'Yes\', \'No\':\'No\' }',
    type   : 'select',
    onblur : 'submit',
    submit: '<button class="btn btn-success btn-xs" type="submit" ><span class="glyphicon glyphicon-ok"></span></button>',
    callback: function(){
        disallowKeypress--;
        $('#btn-badge').prop('disabled', false);
        $('#btn-checkin-badge').prop('disabled', false);
        showActions();
    }
});
$('.editable-pronouns').editable(function(value, settings){
    var id = $(this).attr('id');
    if (value === 'Other'){
        value = prompt('Please enter value');
    }
    $.post('/attendees/update', {id: id, value:value}, function(data){
        $(id).text(data);
    });
    return (value);

}, {
    cssclass: 'edit-pronouns',
    loadurl: '/data/pronouns',
    type   : 'select',
    onblur : 'submit',
    submit: '<button class="btn btn-success btn-xs" type="submit" ><span class="glyphicon glyphicon-ok"></span></button>',
    callback: function(){
        disallowKeypress--;
        $('#btn-badge').prop('disabled', false);
        $('#btn-checkin-badge').prop('disabled', false);
    }
});

$('.editable-type').editable(function(value, settings){
    var id = $(this).attr('id');
    if (value === 'Other'){
        value = prompt('Please enter value');
    }
    $.post('/attendees/update', {id: id, value:value}, function(data){
        $(id).text(data);
    });
    return (value);

}, {
    cssclass: 'edit-type',
    loadurl: '/data/types',
    type   : 'select',
    onblur : 'submit',
    submit: '<button class="btn btn-success btn-xs" type="submit" ><span class="glyphicon glyphicon-ok"></span></button>',
    callback: function(){
        disallowKeypress--;
        $('#btn-badge').prop('disabled', false);
        $('#btn-checkin-badge').prop('disabled', false);
    }
});

$('.editable-note').editable('/notes/update', {
    placeholder: '<span class="edit-placeholder">Click to set a new value</span>',
    callback: function(value, settings){
        disallowKeypress--;
    },
    cancel: '<button class="btn btn-danger btn-xs" type="cancel" ><span class="glyphicon glyphicon-remove"></span> Cancel</button>',
    submit: '<button class="btn btn-success btn-xs" type="submit" ><span class="glyphicon glyphicon-ok"></span> Save</button>',
});



$('#btn-checkin').click(checkIn);
$('#btn-uncheckin').click(uncheckIn);
$('#btn-register').click(register);
$('#btn-unregister').click(unregister);
$('#btn-badge').click(badge);
$('#btn-showNotes').click(showHideNotes);
$('#btn-addNote').click(addNote);
$('#btn-addNoteCancel').click(addNoteCancel);

$('.note-clear').click(clearNote);

function showActions(){
    var registered = $('.registered').text();
    var badged = $('.badged').text();
    var checkedIn = $('.checked-in').text();

    const actions = {
        checkIn: false,
        uncheckIn: false,
        unregister: false,
        badge: false,
    };

    if (checkedIn === 'Yes'){
        actions.uncheckIn = true;
        if (checkFields()){
            actions.badge = true;
        }

    } else {
        actions.unregister = true;
        if (registered && checkFields()){
            actions.checkIn = true;
            actions.badge = true;
        }
    }

    if (actions.checkIn){
        $('#btn-checkin').show();
    } else {
        $('#btn-checkin').hide();
    }

    if (actions.badge){
        $('#btn-badge').show();
    } else {
        $('#btn-badge').hide();
    }

    if (actions.badge && actions.checkIn){
        $('#btn-checkin-badge').show();
    } else {
        $('#btn-checkin-badge').hide();
    }

    if (actions.uncheckIn){
        $('#btn-uncheckin').show();
    } else {
        $('#btn-uncheckin').hide();
    }

    if (actions.unregister){
        $('#btn-unregister').show();
    } else {
        $('#btn-unregister').hide();
    }

    if (badged === 'Yes'){
        $('#btn-badge').html('<u>B</u>adge Again');
    } else {
        $('#btn-badge').html('Print <u>B</u>adge');
    }

    if (registered === 'Yes'){
        $('.registered-actions').show();
        $('.unregistered-actions').hide();
    } else {
        $('.registered-actions').hide();
        $('.unregistered-actions').show();
    }

    function checkFields(){
        const requiredFields = [];
        for (const field in eventDataFields){
            if (eventDataFields[field].requireForCheckin){
                const value = $(`div[data-fieldname="${field}"]`).text();
                if (value !== 'Yes'){
                    return false;
                }
            }
        }
        return true;
    }

}
var metaHeld = false;

$(document).keydown(function(event){

    var keycode = event.which;

    if (keycode < 65 || keycode >90){
        metaHeld = true;
    }
    if (disallowKeypress === 0 && !metaHeld){
        //console.log(keycode);

        if(keycode === 67){ // c
            $('#check-in-and-badge-form').submit();
        } else if ( keycode === 66) { // b
            badge();
        } else if ( keycode === 73) { // i
            checkIn();
        } else if (keycode === 85) { // u
            unregister();
        } else if ( keycode === 82) { // r
            register();
        }
    }
});

$(document).keyup(function(event){

    var keycode = event.which;

    if (keycode < 65 || keycode >90){
        metaHeld = false;
    }
});

function checkIn(){
    if ($('#attendee-'+id+'-checked-in').text() === 'Yes'){
        return;
    }
    var id = $('#btn-checkin').attr('data-id');
    $.ajax({
        method:'POST',
        url: '/api/attendees/' + id + '/checkin',
        success: function(data){
            if (data.success){
                $('#attendee-'+id+'-checked-in').text('Yes');
                showActions();
                showAlert('success', 'Checked In');
            } else {
                showActions();
                showAlert('danger', data.message);
            }
        }
    });
}

function uncheckIn(){
    if ($('#attendee-'+id+'-checked-in').text() === 'No'){
        return;
    }
    var id = $('#btn-checkin').attr('data-id');
    $.ajax({
        method:'POST',
        url: '/api/attendees/' + id + '/uncheckin',
        success: function(data){
            if (data.success){
                $('#attendee-'+id+'-checked-in').text('No');
                showActions();
                showAlert('success', 'Unchecked In');
            }
        }
    });
}

function badge(){
    var id = $('#btn-badge').attr('data-id');
    $.ajax({
        method: 'POST',
        url: '/api/attendees/' + id + '/badge',
        success: function(data){
            if (data.success){
                $('#attendee-'+id+'-badged').text('Yes');
                showActions();
                showAlert('success','Printed Badge');
            }
        },
        error: function(jqxhr) {
            try{
                var data = JSON.parse(jqxhr.responseText);
                showAlert('danger', data.err);
            }
            catch(e){
                showAlert('danger', jqxhr.responseText);
            }
        }
    });
}
function register(){
    var id = $('#btn-register').attr('data-id');
    if ($('#attendee-'+id+'-registered').text() === 'Yes'){
        return;
    }
    $.ajax({
        method: 'POST',
        url: '/api/attendees/' + id + '/register',
        success: function(data){
            if (data.success){
                $('#attendee-'+id+'-registered').text('Yes');
                showActions();
                showAlert('success','Registered');
            }
        }
    });
}
function unregister(){
    var id = $('#btn-unregister').attr('data-id');
    if ($('#attendee-'+id+'-registered').text() === 'No'){
        return;
    }
    $.ajax({
        method: 'POST',
        url: '/api/attendees/' + id + '/unregister',
        success: function(data){
            if (data.success){
                $('#attendee-'+id+'-registered').text('No');
                showActions();
                showAlert('success','Unregistered');
            }
        }
    });
}

function clearNote(){
    var id = $(this).attr('note-id');
    $.ajax({
        method: 'PUT',
        url: '/api/notes/'+id + '/clear',
        success: function(data){
            if (data.success){
                $('#note-'+id).addClass('note-cleared');
                $('#note-'+id).find('.note-clear').remove();
                $('#note-'+id).find('.note-edit').remove();
                if ($('#btn-showNotes').attr('action') !== 'hide'){
                    $('#note-'+id).hide();
                }
            }
        }
    });
}

function showHideNotes(){
    var action = $(this).attr('action');
    if (action === 'show'){
        $('.note-cleared').show();
        $(this).text('Hide Cleared Notes');
        $(this).attr('action', 'hide');
    } else {
        $('.note-cleared').hide();
        $(this).text('Show All Notes');
        $(this).attr('action', 'show');
    }
}

function addNote(){
    var action = $(this).attr('action');
    if (action === 'show'){
        $('#addNote').show();
        $(this).text('Cancel Add Note');
        $(this).attr('action', 'cancel');
        disallowKeypress++;
        $('#note_contents').focus();
    } else {
        disallowKeypress++;
        $('#addNote').hide();
        $(this).text('Add Note');
        $(this).attr('action', 'show');
    }
}
function addNoteCancel(e){
    e.preventDefault();
    disallowKeypress++;
    $('#addNote').hide();
    $('#btn-addNote').text('Add Note');
    $('#btn-addNote').attr('action', 'show');
}
