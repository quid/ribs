class Ribs.BatchAction extends Backbone.View

    tagName : "li"

    className: "action"

    events:
        'click': 'activateIfAllowed'
        'keypress': 'keypressed'

    attributes:
        tabindex: 0

    render : ->

        btn = $ "<div/>", 
            class: "button"
            title: @tooltip()
            html: @label()

        @$el.html btn

        if @model.actions

            cont = $ "<ul/>", 
                class: "dropdown"
                title: @label(false)

            @model.actions.each (action) ->
                view = new Ribs.BatchAction model: action
                $(cont).append view.el
                view.render()

            $(btn).append cont

        else

            @checkRequirements()

        this

    tooltip: ->
        @model.get("tooltip") ? @label(false)

    label: (highlight=true)->
        label = @model.get("batchLabel") ? @model.get("label")
        if highlight and @model.has "hotkey"
            label = @constructor.highlightHotkey label, @model.get "hotkey"
        label

    getSelected: ->
        @model.getSelected()

    getListItem: ->
        # override

    checkRequirements: ->
        @setEnabled @model.allowed @getSelected()

    setEnabled : (enabled) ->
        @$el.toggleClass "disabled", not enabled
        idx = if enabled then 0 else -1
        @$el.prop "tabindex", idx

    activate: () ->
        @model.activate @getSelected(), @getListItem()
        false

    activateIfAllowed: (event) ->
        unless @$el.is ".disabled"
            @activate()
        false

    keypressed : (event) ->
        if event.which is 13 # <return>
            @activate()
            false

    @highlightHotkey : (label, hotkey) ->
        template = _.template "<span class='hotkey'><strong><%= hotkey %></strong></span>"
        new_label = label.replace hotkey, template hotkey: hotkey
        if new_label is label
            new_label = "#{label} #{ template hotkey: "[#{hotkey}]"}"
        new_label

