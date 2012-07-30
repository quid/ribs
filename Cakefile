fs = require 'fs'
coffee = require 'coffee-script'
{parser, uglify} = require 'uglify-js'

option '-u', '--uglify', 'uglify js output'

task 'build', 'compile rib.js from ribs.coffee', (options) ->
  
    cs = (fs.readFileSync 'ribs.coffee').toString()
    js = coffee.compile cs
    outfile = "ribs.js"
    if options.uglify
        ast = parser.parse js
        ast = uglify.ast_mangle ast
        ast = uglify.ast_squeeze ast
        js = uglify.gen_code ast
        outfile = "ribs.min.js"
    fs.writeFileSync outfile, js

