fs = require 'fs'
path = require 'path'
coffee = require 'coffee-script'
stylus = require 'stylus'
UglifyJS = require 'uglify-js'

srcDir = path.resolve 'src'

getSrcDir = (dirname) ->
    files = fs.readdirSync "src/#{dirname}"
    files = files.map (s) ->
        path.resolve "src/#{dirname}/#{s}"
    files


styleFiles = ->
    [
        path.resolve 'src/ribs.styl'
    ]

scriptFiles = ->
    viewFiles = getSrcDir 'views'
    modelFiles = getSrcDir 'models'
    [
        path.resolve 'src/ribs.coffee'
        path.resolve 'src/hotkeys.coffee'
    ].concat modelFiles.concat viewFiles

allFiles = ->
    scriptFiles().concat styleFiles()

joinFiles = (files...) ->
    code = ""
    for filename in files
        console.log "Compiling #{filename}"
        src = (fs.readFileSync filename).toString()
        code += src
    code

task 'watch', 'Watch for changes in source files and rebuild', ->
    console.log "Watching for changes in " + srcDir

    invoke 'build'

    for file in allFiles() then do (file) ->
        fs.watchFile file, { interval: 250 }, -> # Look for a change every 250ms
            console.log "Change in #{file}"
            invoke 'build'

task 'build', 'Compile Ribs', (options) ->
    console.log "Building..."

    jsCode = joinFiles scriptFiles()...

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
    styleCode = joinFiles styleFiles()...
    stylus.render styleCode, filename: 'ribs.css', (err, css) ->
        throw err if err
        fs.writeFile 'ribs.css', css, (err) ->
            throw err if err
            console.log "Wrote ribs.css"
