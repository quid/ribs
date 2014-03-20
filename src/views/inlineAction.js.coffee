class Ribs.InlineAction extends Ribs.BatchAction

    constructor: (options) ->
        super
        @listItem = options.listItem

    label: ->
        label = @model.get("inlineLabel") ? @model.get("label")

        if _.isFunction label
            label = label.call @model, @listItem.model
        label

    getSelected: ->
        [ @listItem.model ]

    getListItem: ->
        @listItem

