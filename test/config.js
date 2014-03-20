var jsdom = require("jsdom");
var document = jsdom.jsdom("<html><body></body></html>", jsdom.level(1, "core"));
global.window = document.createWindow();
