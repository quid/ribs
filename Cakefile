fs = require 'fs'
coffee = require 'coffee-script'
UglifyJS = require 'uglify-js'

task 'build', 'compile rib.js from ribs.coffee', (options) ->
  
    files = [ 'ribs.coffee', 'hotkeys.coffee' ]
    code = ""
    for filename in files
        src = (fs.readFileSync "src/#{filename}").toString()
        code += src

    code = coffee.compile code
    minified = UglifyJS.minify(code, fromString: true).code

    fs.writeFileSync "ribs.js", code
    fs.writeFileSync "ribs.min.js", minified

