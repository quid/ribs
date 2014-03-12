class Ribs.ListItemCell extends Backbone.View

    tagName : "div"

    className: "cell"

    _ribsEvents:
        'click .edit' : 'handleEdit'
        'click .editableField' : 'stopPropagation'
        'keypress .editableField' : 'handleKeypress'
        'blur .editableField' : 'saveEditedField'

    constructor : (options) ->

        @events ||= {}
        _.extend @events, @_ribsEvents
        super

        @field = options.field
        @view = options.view
        @map = options.map
        @escape = options.escape
        @editable = options.editable
        @label = options.label
        @edit = options.edit
        @save = options.save


        @$el.addClass(options.class ? options.field)

    renderableValue: (nomap) ->
         
        value = @model.get @field

        if !nomap and _.isFunction @map
            value = @map.call @view.view, value, @model
        value ? ""

    render: ()->
        @$el.empty()

        # cells are rendered as text by default unless `escape` is false
        if @escape is false
            @$el.html @renderableValue()
        else
            @$el.text @renderableValue()

        if @editable is true
            label = @label ? @field
            editBtnEl = $ "<span/>",
                class: 'edit button inline', 
                title: "Edit #{label}"
                text: '✎'
            if @model.get(@field) in [undefined, null, '']
                $(editBtnEl).addClass('show')

            @$el.append(editBtnEl) 

        this

    handleEdit: (event) ->

        if @editable is true

            value = @model.get @field

            if _.isFunction @edit
                # edit = function could return an html element
                editField = @edit.call this, value, @model
            else if _.isArray @edit 
                # edit = array will give a select box
                editField = $ "<select/>"
                for option in @edit
                    optionEl = $ "<option/>", 
                        value: option
                        text: option
                    editField.append optionEl
                    $(optionEl).prop "selected", option is value
            else if _.isObject @edit  
                # edit = object will give a select box
                editField = $ "<select/>"
                for key, option of @edit
                    optionEl = $ "<option/>", 
                        value: key
                        text: option
                    $(optionEl).prop "selected", key is value
                    editField.append optionEl
            else 
                # no edit property will default to a text box
                editField = $ "<input/>", 
                    type: 'text'
                    value: value 

            if _.isElement(editField) or editField instanceof jQuery
                $(editField).addClass "editableField"
                @$el.html editField
                $(editField).focus()

        event.preventDefault()
        false

    stopPropagation: (event) ->
        event.preventDefault()
        false

    saveEditedField: ->
        editField = @$(".editableField")
        if _.isFunction @save
            @save.call this, editField, @model
        else
            value = editField.val()
            changeSet = $.extend true, {}, @model.attributes
            changeSet[@field] = value

            unless @model._validate(changeSet, @model)
                return

            # do whatever it takes to re-render
            try
                @model.save changeSet, 
                    success: => @render()
                    error: => @render()
            catch e
                @render()
    
    handleKeypress: (e)->
        if e.which is 13
            @saveEditedField()
            false

