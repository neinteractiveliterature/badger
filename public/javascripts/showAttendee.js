
disallowKeypress = 0;
showActions();

$('.note-cleared').hide();
$('#addNote').hide();

$('.editable').on('click', function(){
    disallowKeypress++;
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
    }
});

$('.editable-boolean').editable('/attendees/update', {
    data   : " {'Yes':'Yes', 'No':'No' }",
    type   : 'select',
    onblur : 'submit',
    callback: function(){
        disallowKeyPress--;
        showActions();
    }
});
$('.editable-pronouns').editable(function(value, settings){
    var id = $(this).attr('id');
    if (value === 'Other'){
        value = prompt('Please enter value')
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
    callback: function(){
        disallowKeypress--;
    }
});

$('.editable-type').editable(function(value, settings){
    var id = $(this).attr('id');
    if (value === 'Other'){
        value = prompt('Please enter value')
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
     callback: function(){
        disallowKeypress--;
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

    if (checkedIn === 'Yes'){
        $('#btn-checkin-badge').hide();
        $('#btn-checkin').hide();
        $('#btn-unregister').hide();
        $('#btn-uncheckin').show();
    } else {
        $('#btn-checkin-badge').show();
        $('#btn-checkin').show();
        $('#btn-unregister').show();
        $('#btn-uncheckin').hide();
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
