

$('.clear-jobs-button').on('click', clearJobs);
$('.activate-printer-button').on('click', toggleActive);

function clearJobs(e){
    var $this = $(this);
    var printerName = $this.attr('data-device');
    var $countfield = $this.parent().parent().find(".job-count");
    $.ajax({
        url: '/devices/' + printerName + '/clear',
        type: 'POST',
        data:{_method: 'PUT'},
        success: function(result) {
            $countfield.text(result.length);
            $this.hide();
        }
    });
}

function toggleActive(e){
    var $this = $(this);
    var printerName = $this.attr('data-device');
    var url = '/devices/' + printerName;
    var activate = $(this).text() === 'Activate';
    $printerRow = $this.parent().parent();
    $activeField = $this.parent().parent().find(".printer-active");

    if (activate) {
        url += '/activate';
    } else {
        url += '/deactivate';
    }

    $.ajax({
        url: url,
        type: 'POST',
        data:{_method: 'PUT'},
        success: function(result) {
            if (activate){
                $printerRow.addClass('success');
                $activeField.text('Yes');
                $this.text('Deactivate');
            } else {
                $printerRow.removeClass('success');
                $activeField.text('No');
                $this.text('Activate');
            }
        }
    });
}
