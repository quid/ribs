do ($=jQuery) ->
    class Ribs.ListItem extends Backbone.View

        tagName: "li"

        className: "item"

        attributes:
            tabindex: 0

        _ribsEvents:
            'click' : 'toggle'
            'toggle' : 'toggle'
            'selectitem' : 'select'
            'deselectitem' : 'deselect'
            'click a' : 'stopPropogation'

        constructor : (options) ->

            @events ||= {}
            _.extend @events, @_ribsEvents

            @itemCellView ?= Ribs.ListItemCell
            @actionView ?= Ribs.InlineAction
            @view = options?.view

            # create cell views
            @listItemCells = []
            for attribute in @view.displayAttributes
                attribute = _.clone(attribute)
                attribute.view = @
                attribute.model = options.model
                listItemCell = new @itemCellView attribute
                @listItemCells.push listItemCell

            @inlineActions = []
            for key, action of @view.inlineActions
                unless action.filter? and action.filter(@model) is false
                    inlineAction = new @actionView
                        model: action
                        listItem: this
                    @inlineActions.push inlineAction

            super

            if @model?
                @listenTo @model, "change", @render
                @listenTo @model, "remove", @remove

        render : ->

            @$el.empty()
            return unless @model
            @$el.data("cid", @model.cid)


            # Add inline actions.
            ul = $ "<ul/>", class: "actions"
            for inlineAction in @inlineActions
                $(ul).append inlineAction.el
                inlineAction.render()
                inlineAction.delegateEvents()
            @$el.append ul

            # Add selection toggle
            unless @view.suppressToggle
                toggle = $ "<input/>",
                    type: "checkbox"
                    tabindex: -1
                if @$el.is ".selected"
                    $(toggle).prop "checked", true
                div = $ "<div/>", class: "toggle"
                div.append toggle
                @$el.append div

            # Add individual cells
            for cell in @listItemCells
                @$el.append cell.el
                cell.render()
                cell.delegateEvents()
            
            this

        toggle: ->
            unless @$el.is(".disabled")
                if @$el.is(".selected")
                    @deselect()
                else
                    @select()

        stopPropogation: (e) ->
            e.stopImmediatePropagation()

        select: (event, options={})->
            return if @view.suppressToggle
            @$el.addClass "selected"
            @$("input:checkbox").prop "checked", true
            @model.trigger "selected" unless options.silent

        deselect : (event, options={})->
            return if @view.suppressToggle
            @$el.removeClass "selected"
            @$("input:checkbox").prop "checked", false
            @model.trigger "deselected" unless options.silent

        enable : ->
            @$el.removeClass "disabled"
            @$("input:checkbox").prop "disabled", false
            @$el.prop "tabindex", 0
            @model.trigger "enabled"

        disable :-> 
            @$el.addClass "disabled"
            @$("input:checkbox").prop "disabled", true
            @$el.prop "tabindex", -1
            @model.trigger "disabled"

        remove: ->
            @deselect()
            for inlineAction in @inlineActions
                inlineAction.remove()
            for listItemCell in @listItemCells
                listItemCell.remove()
            super
