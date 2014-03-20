class Ribs.Action extends Backbone.Model

    defaults:
        min : 1
        max : -1 # -1 means no maximum
        arity : null # defining arity will override min/max
        check : null # defining check will be additional to min/max/arity
        batch: true
        inline: false

    initialize: (attributes, options) ->

        @ribs = options.ribs ? @collection.ribs

        if @has "actions"
            availableActions = _.reject @get("actions"), (action) =>
                action.available? and not action.available.call @ribs
            @actions = new Ribs.Actions availableActions, ribs: @ribs
            @min = 0

        if @has("hotkey") and not @ribs.suppressHotKeys
            @ribs.keyboardManager?.registerHotKey
                hotkey: @get "hotkey"
                label: @get "label"
                namespace: @ribs.keyboardNamespace
                context: this
                precondition: @allowed
                callback: =>
                    @activate()

    allowed : (selected) ->

        selected = @getSelected() unless selected?

        l = selected.length

        allow = false

        if @get("arity")?
            a = @get "arity"
            r1 = a is l       # arity is same as #selected
            r2 = a is -1      # arity is anything
            allow = r1 or r2
        else
            r1 = @get("min") is -1 or l >= @get("min")   # minimum requirement is satisfied
            r2 = @get("max") is -1 or l <= @get("max")   # maximum requirement is satisfied
            allow = r1 and r2

        if allow and @get("check")?
            allow = @get("check").call(@ribs, selected)

        allow

    activate: (selected, listItem)->
        selected = @getSelected() unless selected?
        activate = @get "activate"
        if _.isFunction activate
            activate.call @ribs, selected, listItem

    getSelected: ->
        @ribs.getSelected()

class Ribs.Actions extends Backbone.Collection

    model: Ribs.Action
