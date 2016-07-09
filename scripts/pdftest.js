'use strict';
var _ = require('underscore');
var badge = require('../lib/badge');
var config = require('config');

var userData = {
    id: 1234,
    name: 'Dave Kapell',
    badgeData:{
        mainName: 'Clever Nickname',
        secondName: 'Dave Kapell',
        type: 'paid',
        id: 1234,
        extra: 'Safety Staff',
        pronouns: 'He/Him/His'
    }
};

var positions = [
    {
        name: 'mainName',
        x: 'center',
        y: 'center',
        align: 'center',
        size: 14,
        font: '/Users/dkapell/Library/Fonts/Windlass.ttf',
    },
    {
        name: 'secondName',
        x: 'center',
        y: 85,
        align: 'center',
        size: 12,
    },
    {
        name: 'pronouns',
        x: 'center',
        y: 100,
        align: 'center',
        size: 10,
    },
    {
        name: 'extra',
        x: 'center',
        y: 120,
        align: 'center',
        size: 10,
        font: '/Library/Fonts/Arial Black.ttf',
    },
    {
        name: 'id',
        x: 'margin',
        y: '-margin',
        size: 6,
        align: 'left'
    },
    {
        name: 'type',
        x: 'margin',
        y: '-margin',
        size: 6,
        align:'right'
    }
];

badge.print(positions, userData, function(err){
    if (err){
        console.log(err);
        process.exit(1);
    }
    console.log('done');
    process.exit(0);
});
