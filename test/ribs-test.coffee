path = require "path"

rootDir = path.resolve "#{__dirname}/../"

global.jQuery = require "jquery"
global._ = require "underscore"
global.Backbone = require "backbone"
global.Backbone.$ = jQuery
global.Ribs = require("ribs").Ribs

describe 'Ribs Tests', ->

    before (done) ->
            
        @list = new Ribs.List
            model: Backbone.Model
            collection: new Backbone.Collection
            displayAttributes: [
                field: "value"
            ]
        done()

    describe '#sortCollection()', ->
        it 'should sort collection in ascending and descending order', ->
            list = @list
            sortField = list.displayAttributes[0]["field"]
            #console.log "sortField [" + sortField + "]"
            
            list.collection.add(new Backbone.Model({id: "1", value: "hello"}))
            list.collection.add(new Backbone.Model({id: "2", value: "goodbye"}))
            list.collection.add(new Backbone.Model({id: "3", value: "what?"}))
            
            list.getNumTotal().should.equal 3
            
            # sort ascending
            list.sortCollection(sortField, 1)
            
            list.getNumTotal().should.equal 3
            
            list.collection.first().attributes[sortField].should.equal "goodbye"
            list.collection.last().attributes[sortField].should.equal "what?"
            
            # sort descending
            list.sortCollection(sortField, -1)
            
            list.collection.first().attributes[sortField].should.equal "what?"
            list.collection.last().attributes[sortField].should.equal "goodbye"
            
            #list.collection.each (item, counter) ->
            #    console.log counter + " = " + item.attributes[sortField]
    ###
    not ready yet
    describe '#sortByField()', ->
        it 'should sort collection by field in toggled order', ->
            list = module.exports.list
            displayField = list.displayAttributes[0]["field"]
            sortField = "id"
            
            list.collection.add(new Backbone.Model({id: "1", value: "hello"}))
            list.collection.add(new Backbone.Model({id: "2", value: "goodbye"}))
            list.collection.add(new Backbone.Model({id: "3", value: "what?"}))
            
            event = {}
            event.target =
                "data-sort-by": sortField
                
            list.sortByField(event)

            list.collection.each (item, counter) ->
                console.log counter + " = " + item.attributes[displayField]
    ###
