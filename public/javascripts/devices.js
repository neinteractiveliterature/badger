

$('.clear-jobs-button').on('click', clearJobs);
$('.activate-printer-button').on('click', toggleActive);
$('.enable-printer-button').on('click', toggleEnabled);

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
    $printerRow = $this.parent().parent().parent();
    $activeField = $printerRow.find(".printer-active");

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

function toggleEnabled(e){
    var $this = $(this);
    var printerName = $this.attr('data-device');
    var url = '/devices/' + printerName;
    var activate = $(this).text() === 'Enable';
    $printerRow = $this.parent().parent().parent();
    $enabledField = $printerRow.find(".printer-enabled");
    $activeField = $printerRow.find(".printer-active");
    $activeButton = $printerRow.find(".activate-printer-button");

    if (activate) {
        url += '/enable';
    } else {
        url += '/disable';
    }

    $.ajax({
        url: url,
        type: 'POST',
        data:{_method: 'PUT'},
        success: function(result) {
            if (activate){
                $enabledField.text('Yes');
                $this.text('Disable');
                $activeButton.show();
            } else {
                $printerRow.removeClass('success');
                $enabledField.text('No');
                $activeField.text('No');
                $activeButton.hide();
                $this.text('Enable');
            }
        }
    });
}
