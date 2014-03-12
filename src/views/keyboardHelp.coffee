class Ribs.KeyboardHelpView extends Backbone.View

    className: "ribs-keyboard-shortcuts-overlay"

    events: 
        'click' : "remove"

    initialize: (options) ->
        @views = options.views
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

        for namespace, view of @views
            bindings = view.bindings
            isHidden = $(view.context?.el).is ":hidden"
            hasNoKeys = Object.keys(bindings).length is 0
            unless isHidden or hasNoKeys
                h1 = $ "<h1/>", text: view.label
                ul = $ "<ul/>"
                for binding in bindings
                    li = $ "<li/>", class: "hotkey"
                    li.append $ "<span/>", class: "key", text: binding.hotkey
                    li.append $ "<span/>", class: "action", text: binding.label
                    ul.append li
                @$el.append h1, ul


