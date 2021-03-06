'use strict';

require.config({
    baseUrl: '',
    paths: {
        jquery: 'jquery.min',
        ranger: 'ranger'
    }
});

require([
    'jquery',
    'ranger'
], function ($, Ranger) {
    var ranger = new Ranger({
        title: 'Power',
        min: 10,
        max: 90,
        value: 25,
        width: 300,
        height: 150,
        horizontalContentMargin: 20,
        verticalContentMargin: 10
    });

    ranger.render().appendTo($('.container'));
});
