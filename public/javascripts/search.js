$().ready(function () {
    var attendees = new Bloodhound({
        datumTokenizer: Bloodhound.tokenizers.obj.whitespace('name', 'email'),
        queryTokenizer: Bloodhound.tokenizers.whitespace,
        prefetch: {
            url: '/api/attendees/listRegistered',
            cache:false,
        },
        remote: {
            url: '/api/attendees/search?query=%QUERY',
            wildcard: '%QUERY',
            filter: function(x) {
                return x;
            },

        },
        sorter: function(a, b){
            var comp = a.type.localeCompare(b.type);
            if (comp !== 0){
                return comp;
            }
            return (a.name.localeCompare(b.name));
        }
    });
    var suggestionTemplate = '<strong>{{name}}</strong> – <small>{{email}}</small> ( {{type}} )';

    $('.typeahead').typeahead(null, {
        name: 'attendees',
        hint: true,
        highlight: true,
        items: 10,
        minLength:2,
        display: 'name',
        templates: {
             suggestion: Handlebars.compile('<div>' + suggestionTemplate + '</div>')
        },
        source: attendees.ttAdapter()
    }).on('typeahead:select', function(e, item){
        window.location.href='/attendees/' + item.id;
    });

});
