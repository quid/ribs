fs = require 'fs'
coffee = require 'coffee-script'
stylus = require 'stylus'
UglifyJS = require 'uglify-js'


joinFiles = (files...) ->
    code = ""
    for filename in files
        src = (fs.readFileSync "src/#{filename}").toString()
        code += src
    code

task 'build', 'compile rib.js from ribs.coffee', (options) ->
  
    jsCode = joinFiles 'ribs.coffee', 'hotkeys.coffee'

    # compile coffeescript
    jsCode = coffee.compile jsCode
    fs.writeFileSync "ribs.js", jsCode

    # minify / uglify
    minified = UglifyJS.minify(jsCode, fromString: true).code
    fs.writeFileSync "ribs.min.js", minified


    styleCode = joinFiles 'ribs.stylus'
    stylus.render styleCode, filename: 'ribs.css', (err, css) ->
        fs.writeFileSync "ribs.css", css
