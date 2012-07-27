fs = require 'fs'
coffee = require 'coffee-script'
{parser, uglify} = require 'uglify-js'

option '-u', '--uglify', 'uglify js output'

task 'build', 'compile rib.js from ribs.coffee', (options) ->
  
    cs = (fs.readFileSync 'ribs.coffee').toString()
    js = coffee.compile cs
    if options.uglify
        ast = parser.parse js
        ast = uglify.ast_mangle ast
        ast = uglify.ast_squeeze ast
        js = uglify.gen_code ast
    fs.writeFileSync 'ribs.js', js

