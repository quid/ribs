var requirejs = require("./lib/r");

var jsdom = require("jsdom");
var document = jsdom.jsdom("<html><body></body></html>", jsdom.level(1, "core"));
global.window = document.createWindow();

requirejs.config({
    baseUrl: './test/lib',
    paths: {
        jquery		: 'jquery',
        underscore	: 'underscore',
        backbone	: 'backbone'
    },
    shim: {
    	jquery : {
    		exports: '$'
    	},
    	underscore : {
    		exports: '_'
    	},
        backbone : {
            // load underscore and jquery before loading backbone
            deps: ['underscore', 'jquery'],
            // once loaded, use the global 'Backbone' as the module value
            exports: 'Backbone'
        }
    }
});
