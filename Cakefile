fs = require 'fs'
path = require 'path'
coffee = require 'coffee-script'
stylus = require 'stylus'
UglifyJS = require 'uglify-js'

srcDir = path.resolve 'src'

appFiles  = [
    path.resolve 'src/ribs.coffee'
    path.resolve 'src/hotkeys.coffee'
    path.resolve 'src/ribs.styl'
]

joinFiles = (files...) ->
    code = ""
    for filename in files
        src = (fs.readFileSync "src/#{filename}").toString()
        code += src
    code

task 'watch', 'Watch for changes in source files and rebuild', ->
    console.log "Watching for changes in " + srcDir

    invoke 'build'

    for file in appFiles then do (file) ->
        fs.watchFile file, { interval: 250 }, -> # Look for a change every 250ms
            console.log "Change in #{file}"
            invoke 'build'

task 'build', 'Compile Ribs', (options) ->
    console.log "Building..."

    jsCode = joinFiles 'ribs.coffee', 'hotkeys.coffee'

    # compile coffeescript
    jsCode = coffee.compile jsCode
    fs.writeFile "ribs.js", jsCode, (err) ->
        throw err if err
        console.log "Wrote ribs.js"

    # minify / uglify javascript
    minified = UglifyJS.minify(jsCode, fromString: true).code
    fs.writeFile "ribs.min.js", minified, (err) ->
        throw err if err
        console.log "Wrote ribs.min.js"

    # compile stylus to css
    styleCode = joinFiles 'ribs.styl'
    stylus.render styleCode, filename: 'ribs.css', (err, css) ->
        throw err if err
        fs.writeFile 'ribs.css', css, (err) ->
            throw err if err
            console.log "Wrote ribs.css"
