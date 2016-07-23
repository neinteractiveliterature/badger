$().ready(function(){
    $('#alert-messages').hide();
});

var messageTimeout = null;
function showAlert(type, message, timeout){
    if (!timeout){
        timeout = 2000;
    }
    $('#alert-messages').html(message);
    $('#alert-messages').attr('class', 'alert alert-' + type);
    $('#alert-messages').show('fast');
    clearTimeout(messageTimeout);
    messageTimeout = setTimeout(function(){
        $('#alert-messages').hide('slow');

    }, timeout);
}

