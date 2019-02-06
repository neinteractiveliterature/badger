/* global BootstrapDialog */
$(function () {
    $('#badgeform').sortable({
        tolerance: 'pointer',
        revert: 'invalid',
        placeholder: 'panel panel-default placeholder',
        forcePlaceholderSize: true,
        forceHelperSize: true,
        axis: 'y',
        stop: function (event, ui) {
            updateNames($(this));
        }

    });

    $('.use-data-field').each(updateDataFields);
    $('.use-data-field').change(updateDataFields);


    $('.remove-field').click(function(e){
        e.preventDefault();
        var $parent = $(this).closest('li');
        BootstrapDialog.confirm({
            title: 'Remove Field',
            message: 'Are you sure you want to remove this field?',
            callback: function(result){
                if(result) {
                    $parent.remove();
                }
            }
        });

    });

    $('#add-field').click(function(e){
        e.preventDefault();
        var $li = $('<li>')
            .addClass('panel')
            .addClass('panel-default')
            .addClass('form-horizontal')
            .addClass('ui-sortable-handle');

        $('#emptyField').children().clone().appendTo($li);
        $li.appendTo($('#badgeform'));
        updateNames($('#badgeform'));
        $('.field-remove').click(function(e){
            e.preventDefault();
            $(this).closest('li').remove();
        });
    });
});

function updateDataFields(){
    var val = $(this).is(':checked') ;
    var row = $(this).attr('data-row');
    if (val){
        $('#badge-' + row + '-datafield').val($('#badge-'+row+'-name').val());
        $('#badge-' + row + '-datafield').attr('readonly', true);
    } else {
        $('#badge-' + row + '-datafield').attr('readonly', false);
    }
}


function updateNames($list){
    $list.find('li').each(function (idx) {
        var $inp = $(this).find('input,select');
        $inp.each(function () {
            if (this.name){
                this.name = this.name.replace(/(\[\d+\])/, '[' + idx + ']');
            }
            if ($(this).attr('data-row')){
                $(this).attr('data-row', idx);
            }
            if (this.id.match(/badge-\d+-/)){
                this.id = this.id.replace(/badge-\d+-/, 'badge-' + idx + '-');
            }
        });

    });
}
