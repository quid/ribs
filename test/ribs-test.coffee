path = require "path"

rootDir = path.resolve "#{__dirname}/../"

global.jQuery = require "jquery"
global._ = require "underscore"
global.Backbone = require "backbone"
global.Backbone.$ = jQuery
global.Ribs = require("ribs").Ribs

describe 'Ribs Tests', ->

    describe '#sortCollection()', ->

        before (done) ->

            food = [
                name: 'apple'
                health: 6
            ,
                name: 'banana'
                health: 4
            ,
                name: 'spinach'
                health: 10
            ]

            @list = new Ribs.List
                collection: new Backbone.Collection food
                displayAttributes: [field: 'name', field: 'health']

            done()

        it 'sorts collections in ascending order', ->
            @list.sortCollection 'health', 1

            first = @list.collection.first()
            first.get('name').should.equal 'banana'

            last = @list.collection.last()
            last.get('name').should.equal 'spinach'

        it 'sorts collections in descending order', ->
            @list.sortCollection 'health', -1

            first = @list.collection.at 0
            first.get('name').should.equal 'spinach'

            last = @list.collection.at 2
            last.get('name').should.equal 'banana'
