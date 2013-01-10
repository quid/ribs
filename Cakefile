fs = require 'fs'
coffee = require 'coffee-script'
UglifyJS = require 'uglify-js'

task 'build', 'compile rib.js from ribs.coffee', (options) ->
  
    src = (fs.readFileSync 'ribs.coffee').toString()
    code = coffee.compile src
    minified = UglifyJS.minify(code, fromString: true).code

    fs.writeFileSync "ribs.js", code
    fs.writeFileSync "ribs.min.js", minified

