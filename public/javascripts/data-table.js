$(function(){
  $(".table-sorted").tablesorter({
      theme:'Bootstrap',

      widthFixed: true,

      headerTemplate : '{content} {icon}',

      // widget code contained in the jquery.tablesorter.widgets.js file
      // use the zebra stripe widget if you plan on hiding any rows (filter widget)
      widgets : [ "uitheme", "filter", "zebra" ],

      widgetOptions : {
        // using the default zebra striping class name, so it actually isn't included in the theme variable above
        // this is ONLY needed for bootstrap theming if you are using the filter widget, because rows are hidden
        zebra : ["even", "odd"],

        // reset filters button
        filter_reset : ".reset",

        // extra css class name (string or array) added to the filter element (input or select)
        filter_cssFilter : "form-control",
      }
  })
  .tablesorterPager({

      container: $(".ts-pager"),

      cssGoto: ".pagenum",

      removeRows: true,

      output: '{startRow} - {endRow} / {filteredRows} ({totalRows})'

    });
});

$('.clickable-row').on('click', function(e){
    e.preventDefault();
    var object = $(this).attr('data-click-object');
    var id = $(this).attr('data-click-id');
    window.location.href='/'+ object + '/' + id;
});
