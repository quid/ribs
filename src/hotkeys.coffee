do ($=jQuery) ->

    # Make `Ribs` globally accessible.
    root = window ? module.exports
    Ribs = root.Ribs ?= {}

    # Keyboard manager access point
    _keyboardManager = null
    Ribs.getKeyboardManager = ->
        _keyboardManager ?= new Ribs.KeyboardManager()

    class Ribs.KeyboardManager
    
        # Internal char code tree for registered hot keys.
        boundCharCodes: {}

        # A registry for all views is required when showing hotkey help pane.
        registeredViews:
            global:
                bindings: []
                tree: {}
                label: "Global"
                context: window

        options:

            # Hotkey to preceed any jump keys.
            jumpPrefixKey: "g"

            # Time allowed between hotkeys
            jumpTime: 1000

            enableKeyboardShortcuts: true

        constructor: (options) ->

            @options = _.extend @options, options

            @registerHotKey
                hotkey: "?"
                callback: @showKeyboardBindings
                context: this
                label: "Show hotkeys"

            $(window).on "keypress", @handleKeypress

        registerView: (view, label) ->
            namespace = _.uniqueId "view"
            @registeredViews[namespace] = 
                label: label
                context: view
                tree: {}
                bindings: []
            namespace

        deregisterView: (namespace) ->
            delete @registeredViews[namespace]

        # options:
        #  hotkey: string (required)
        #  label: string (required - displayed in help screen)
        #  callback: function (required)
        #  context: object (optional)
        #  namespace: string (optional)
        #  precondition: function (optional)
        registerHotKey: (options) ->
            options.charCodes ?= ( key.charCodeAt 0 for key in options.hotkey.split "" )
            ns = options.namespace ?= "global"
            root = @registeredViews[ns].tree
            for code, i in options.charCodes
                root[code] ?= { bindings: [], upcoming: 0 }
                if i is options.charCodes.length - 1
                    root[code].bindings.push options
                else
                    root[code].upcoming += 1
                root = root[code]
            @registeredViews[ns].bindings.push options
            ns

        deregisterHotKey: (options) ->
            options.charCodes ?= ( key.charCodeAt 0 for key in options.hotkey.split "" )
            ns = options.namespace ?= "global"
            root = current = @registeredViews[ns].tree
            for code, i in options.charCodes
                current = current[code]
                if i is options.charCodes.length - 1
                    current.bindings = _.reject current.bindings, (binding) ->
                        (not options.context or options.context is binding.context) and
                        (not options.callback or options.callback is binding.callback)
                else
                    current.upcoming -= 1

        registerJumpKey: (options) ->
            options.label = "Go to #{options.label}"
            options.hotkey = @options.jumpPrefixKey + options.jumpkey
            @registerHotKey options

        deregisterJumpKey: (options) ->
            options.hotkey = @options.jumpPrefixKey + options.jumpkey
            @deregisterHotKey options

        handleKeypress: (event, namespace="global") =>

            return unless @options.enableKeyboardShortcuts

            # don't do anything if user is typing text
            return if $(document.activeElement).is(":input")

            context = @currentContext ? @registeredViews[namespace].tree

            @walkContext context, event.which if context?

        walkContext: (context, charCode) ->

            clearTimeout @jumpTimeout if @jumpTimeout
            delete @currentContext
            return unless charCode of context

            context = context[charCode]

            # if there are no more possible hotkey matches, execute immediately
            if context.upcoming is 0
                @execute context
            else
                @currentContext = context
                @jumpTimeout = setTimeout =>
                    delete @currentContext
                    @execute context
                , @options.jumpTime

            false

        execute: (context) ->
            if context.bindings.length
                for binding in context.bindings
                    ctx = binding.context ? @registeredViews[binding.namespace].context
                    unless binding.precondition and not binding.precondition.call ctx
                        binding.callback.call ctx



        # Function which will construct/display applicable keyboard shortcuts 
        # in an overlay.
        showKeyboardBindings: ->
            @constructor.view?.$el.remove()
            view = @constructor.view = new Ribs.KeyboardHelpView
                views: @registeredViews
                hotkeys: @boundCharCodes

            view.render()

            $("body").append view.el
            
                

    class Ribs.KeyboardHelpView extends Backbone.View

        className: "ribs-keyboard-shortcuts-overlay"

        events: 
            'click' : "remove"

        initialize:  ->
            $(window).on "keyup", @handleKeyup

        remove: ->
            $(window).off "keyup", @handleKeyup
            super

        handleKeyup: (event) =>
            # __<return>__ or __<esc>__ will remove overlay.
            @remove() if event.which is 27
            false

        render: ->
            @$el.empty()

            for namespace, view of @options.views
                bindings = view.bindings
                unless $(view.context?.el).is ":hidden" or Object.keys(bindings).length == 0
                    h1 = $ "<h1/>", text: view.label
                    ul = $ "<ul/>"
                    for binding in bindings
                        li = $ "<li/>", class: "hotkey"
                        li.append $ "<span/>", class: "key", text: binding.hotkey
                        li.append $ "<span/>", class: "action", text: binding.label
                        ul.append li
                    @$el.append h1, ul


