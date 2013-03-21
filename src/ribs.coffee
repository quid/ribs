do ($=jQuery) ->

    # Make `Ribs` globally accessible.
    root = window ? module.exports
    Ribs = root.Ribs ?= {}

    # `Ribs.List` is the primary Ribs component.
    class Ribs.List extends Backbone.View
  
        tagName: "div"
    
        itemName: "item"
    
        _ribsEvents: 
            'keypress' : 'keypressed'
            'focusin' : 'focusin'
            'focusout' : 'focusout'
            'click .header .toggle input' : 'toggleSelected'
            'click .maximize .minimize' : 'toggleVisibility'
            'click [data-sort-by]' : 'sortByField'

        _ribsOptions: ["displayAttributes", "actions", "itemView", "itemName", "title", "jumpkey"]

        jumpSelector : ".list li:first"
    
        focussed : false

        selectedByDefault : false

        renderOrder: ["Title", "Actions", "Header", "List", "Footer"]
    
        constructor : (options) ->
    
            @sortArrows = {}
            @sortArrows[-1] = "↓"
            @sortArrows[1] = "↑"

            @itemView ?= Ribs.ListItem
            @actionView ?= Ribs.BatchAction
    
            @events = _.extend {}, @events, @_ribsEvents

            @sortingDirection = {}
            @sortingBy = "id"

            @[k] = options[k] for k in @_ribsOptions when options[k]?


            # Lazily construct global keyboard manager, if found
            @keyboardManager = Ribs.getKeyboardManager?()

            @initializeHotKeys() if @keyboardManager?

            super

            @$el.addClass('ribs')

        setElement: ->
            super
            @build()

        remove: ->
            @removeAllSubviews()
            @keyboardManager?.deregisterView @keyboardNamespace
            super

        removeAllSubviews: ->
            @removeSubviews "list"
            @removeSubviews "action"

        removeSubviews: (type) ->
            if l = @subviews(type)
                for subview in l
                    subview.remove()
            @["_#{type}Subviews"] = []

        subviews: (type) ->
            @["_#{type}Subviews"]


        build: ->

            @removeAllSubviews()
            @$el.empty()

            for t in @renderOrder
                l = t.replace /^./, "$#{t[0].toLowerCase()}"
                @[l] = @["initialize#{t}"]() unless @["suppress#{t}"] or @[l]?
                @$el.append @[l]
            
            @setCollection @collection if @collection?

        render: ->
            for t in @renderOrder
                @["render#{t}"]() unless @["suppress#{t}"]
            this
        
        setCollection: (collection)->
            @collection = collection

            # Unbind all events
            @stopListening @collection

            # Bind events to collection
            @listenTo @collection, "add", @addItem
            @listenTo @collection, "sort reset", @addAllItems

            # rerender actions, footer, header etc. when list selection changes
            for t in ["Actions", "Footer", "Header"]
                fn = @["render#{t}"]
                if not @["suppress#{t}"] and _.isFunction fn
                    @listenTo @collection, "selected deselected add remove", fn

            # render everything on reset
            @listenTo @collection, "reset", @render

            @addAllItems()

            @updateHeaderArrows @sortingBy unless @suppressHeader


        getSelected : ->
            return [] unless @$list?
            @$list.find(".item.selected").map (idx, el) =>
                @collection.get $(el).data("cid")

        getDeselected: ->
            return [] unless @$list?
            @$list.find(".item:not(.selected)").map (idx, el) =>
                @collection.get $(el).data("cid")

        getNumSelected: ->
            return 0 unless @$list?
            @$list.find(".item.selected").size()

        getNumDeselected: ->
            return 0 unless @$list?
            @$list.find(".item:not(.selected)").size()

        getNumTotal: ->
            return 0 unless @collection?
            @collection.length
            
        toggleFocussedSelected: ->
            unless @suppressToggle
                @$(".item:focus").trigger "toggle"

        toggleSelected : (e)->
            if @selectedByDefault is true 
                @$list.find(".item.selected").trigger "deselectitem", silent: true
                @selectedByDefault = false
                @collection?.trigger "deselected"
            else
                @$list.find(".item:not(.selected)").trigger "selectitem", silent: true
                @selectedByDefault = true
                @collection?.trigger "selected"

        invertSelected : ->
            toSelect = @$list.find(":not(.item.selected)")
            toDeselect = @$list.find(".item.selected")
            toSelect.trigger "select"
            toDeselect.trigger "deselectitem"
    
        toggleVisibility : ->
            @$header.find(".maximize, .minimize").toggle()

            @$el.toggleClass "minimized", 100

        sortByField: (event) ->
            field = $(event.target).attr "data-sort-by"
            if field? and @collection?
                old_field = @sortingBy
                @sortingBy = field

                if field is old_field and field of @sortingDirection
                    @sortingDirection[field] *= -1 # toggle direction
                else
                    @sortingDirection[field] = 1

                dir = @sortingDirection[field]

                @sortCollection field, dir

                @updateHeaderArrows field, old_field
			
        sortCollection: (field, dir) ->

            if @collection.remoteSort
                @collection.trigger 'remoteSort', field, dir
            else
                @collection.comparator = (ma,mb)=>

                    # first check if it is a top level attribute
                    a = ma.get field
                    da = @displayAttributeMap[field]
                    if _.isFunction da.map
                        a = da.map.call @, a, ma

                    b = mb.get field
                    db = @displayAttributeMap[field]
                    if _.isFunction db.map
                        b = db.map.call @, b, mb

                    # make string sorting case insensitive
                    a = a.toLowerCase() if a?.toLowerCase?
                    b = b.toLowerCase() if b?.toLowerCase?

                    return  0     if a is b
                    return +1*dir if a > b or not b?
                    return -1*dir if a < b or not a?

                @collection.sort()


        updateHeaderArrows : (field, old_field) ->

            re = new RegExp(" (#{_.values(@sortArrows).join("|")})$|$")
            dir = @sortingDirection[field] ? 1
            
            # Remove arrows from previously sorted label.
            if old_field?
                @$header.find("[data-sort-by='#{old_field}'] .arrow").remove()
            
            # Put arrows on currently sorted label.
            el = $ "<span />", class: "arrow", text: @sortArrows[dir]
            @$header.find("[data-sort-by='#{field}']").append el

    
        initializeHotKeys: ->

            # Register this view
            @keyboardNamespace = @keyboardManager.registerView this, @plural()

            # Bind jump key.
            if @jumpkey?
                @keyboardManager.registerJumpKey 
                    label: @plural()
                    jumpkey: @jumpkey
                    context: this
                    callback: =>
                        @$(@jumpSelector).focus()
                    precondition: =>
                        @$el.is ":visible"

            unless @suppressHotKeys

                hotkeys = [
                    hotkey: "j"
                    label: "Focus next item"
                    callback: =>
                        $(document.activeElement).nextAll(".item:visible:not(.disabled):first").focus()
                ,
                    hotkey: "J"
                    label: "Focus last item"
                    callback: =>
                        @$list.find(".item:last").focus()
                ,
                    hotkey: "k" 
                    label: "Focus previous item"
                    callback: =>
                        $(document.activeElement).prevAll(".item:visible:not(.disabled):first").focus()
                ,
                    hotkey: "K"
                    label: "Focus first item"
                    callback: =>
                        @$list.find(".item:first").focus()
                ,
                    hotkey: "x"
                    label: "Select/deselect item"
                    callback: =>
                        @toggleFocussedSelected()
                ,
                    hotkey: "X"
                    label: "Select/deselect all"
                    callback: =>
                        @toggleSelected()
                ,
                    hotkey: "_"
                    label: "Expand/collapse list"
                    callback: =>
                        @toggleVisibility()
                ,
                    hotkey: "R"
                    label: "Refresh items"
                    callback: =>
                        # refresh collection (from server)
                        @refresh()
                ]


                for hotkey in hotkeys
                    hotkey.namespace = @keyboardNamespace
                    @keyboardManager.registerHotKey hotkey

        keypressed : (event) ->
            @trigger "keypressed", event
            @keyboardManager?.handleKeypress event, @keyboardNamespace
    
        refresh: ->
            if @collection.url?
                @trigger 'refresh'
                @collection.fetch
                    success: =>
                        @$list.find(".item:first")?.focus()

        focusin : (event) ->
            unless @focussed
                @focussed = true
            @$el.addClass "focussed"
            @collection?.trigger "focusin"
    
        focusout : (event) ->
            if @focussed
                # need to delay to find the proper next document.activeElement
                setTimeout =>
                    if @$(document.activeElement).length is 0
                        @$el.removeClass "focussed"
                    @focussed = false
                    @collection?.trigger "focusout"
                , 10
        
        plural : ->
            @itemNamePlural ? @itemName + "s"

        
        addItem : (model) ->
            if Backbone.View::isPrototypeOf(@itemView::)
                itemView = @itemView
            else
                itemView = @itemView(model)
            view = new itemView model: model, view: this

            # Respect collection insertion order
            idx = @collection.indexOf model
            if @$list.children().size() in [0, idx]
                @$list.append view.el
            else
                @$list.children(":nth-child(#{ idx + 1 })").before view.el

            view.render() if @$el.is ":visible"
            @subviews("list").push view
            view.select() if @selectedByDefault

        addAllItems : ->
            @removeSubviews "list"
            @$list.empty()
            @collection?.each @addItem, this

        # Gets list item view by model ID
        get: (id) ->
            _.find @subviews("list"), (view) ->
                view.model.id == id

        # Gets list item view by CID
        getByCid: (cid) ->
            _.find @subviews("list"), (view) ->
                view.model.cid == cid
        
        # initializing
        
        initializeTitle: -> 
            title = @title ? @plural()
            title = title.call this if _.isFunction title
            $title = $ "<h1 />", class: "title", text: title
            $title

        renderTitle: ->
            # do nothing
        
        initializeActions: ->
            
            @removeSubviews "action"

            $batchActions = $ "<ul/>", class: "actions"

            @allActions = new Ribs.Actions @actions, ribs: this
            
            @inlineActions = @allActions.where inline: true

            @batchActions = @allActions.where batch: true

            for action in @batchActions
                view = new @actionView model: action
                @subviews("action").push view
                $batchActions.append view.el
                view.render()

            $batchActions

        renderActions: ->
            for view in @subviews("action")
                view.render() 
        
        initializeList: ->
            $list = $ "<ul/>", class: "list"
            $list

        renderList: ->
            for view in @subviews("list")
                view.render() 
                view.delegateEvents()

        initializeHeader: ->
            $header = $ "<div />", class: "header"

            unless @suppressToggle
                toggle = $ "<input />", 
                    type: "checkbox", 
                    checked: @selectedByDefault
                $header.append $ "<div />", class:"toggle", html: toggle

            unless @displayAttributes?
                attributes = _.map @collection.first().toJSON(), (v,k) -> 
                    { field: k }
            @displayAttributeMap = {}
            _.each @displayAttributes, (attribute) =>
                @displayAttributeMap[attribute.field] = attribute
                label = attribute.label ? attribute.field
                klass = attribute.class ? attribute.field
                field = $ "<div/>", 
                    class: klass
                    "data-sort-by": (attribute.sortField or attribute.field)
                field.append label
                $header.append field

            $header

        renderHeader: ->
            n = @getNumSelected()
            l = @getNumTotal()
            @selectedByDefault = true if n >= l
            @selectedByDefault = false if n is 0
            isChecked = n isnt 0
            isTransparent = isChecked and n < l
            opacity = if isTransparent then 0.5 else 1
            @$header.find(".toggle input")
                .prop("checked", isChecked)
                .css("opacity", opacity)

        initializeFooter: ->
            $footer = $ "<div/>", class: "footer"
            $footer

        renderFooter : ->
            plural = @getNumTotal() isnt 1
            word = if plural then @plural() else @itemName
            @$footer.text "#{@getNumSelected()} / #{@getNumTotal()} #{word} selected"


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

            unless @view.suppressToggle
                toggle = $ "<input/>",
                    type: "checkbox"
                    tabindex: -1
                if @$el.is ".selected"
                    $(toggle).prop "checked", true
                div = $ "<div/>", class: "toggle"
                div.append toggle
                @$el.append div

            # Render our individual cells
            for cell in @listItemCells
                @$el.append cell.el
                cell.render()
                cell.delegateEvents()

            # Add inline actions.
            ul = $ "<ul/>", class: "actions"
            for inlineAction in @inlineActions
                $(ul).append inlineAction.el
                inlineAction.render()
                inlineAction.delegateEvents()
            @$el.append ul
            
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


    class Ribs.ListItemCell extends Backbone.View
  
        tagName : "div"

        className: "cell"
    
        _ribsEvents:
            'click .edit' : 'edit'
            'click .editableField' : 'stopPropagation'
            'keypress .editableField' : 'handleKeypress'
            'blur .editableField' : 'saveEditedField'
  
        constructor : (options) ->

            @events ||= {}
            _.extend @events, @_ribsEvents
            super
            @$el.addClass(@options.class ? @options.field)

        renderableValue: (nomap) ->
             
            value = @model.get @options.field

            if !nomap and _.isFunction @options.map
                value = @options.map.call @options.view.view, value, @model
            value ? ""

        render: ()->
            @$el.empty()

            # cells are rendered as text by default unless `escape` is false
            if @options.escape is false
                @$el.html @renderableValue()
            else
                @$el.text @renderableValue()

            if @options.editable is true
                label = @options.label ? @options.field
                editBtnEl = $ "<span/>",
                    class: 'edit button inline', 
                    title: "Edit #{label}"
                    text: '✎'
                if @model.get(@options.field) in [undefined, null, '']
                    $(editBtnEl).addClass('show')
                else
                    $(editBtnEl).removeClass('show')

                @$el.append(editBtnEl) 

            this

        edit: (event) ->

            if @options.editable is true

                value = @model.get @options.field

                if _.isFunction @options.edit
                    # edit = function could return an html element
                    editField = @options.edit.call this, value, @model
                else if _.isArray @options.edit 
                    # edit = array will give a select box
                    editField = $ "<select/>"
                    for option in @options.edit
                        optionEl = $ "<option/>", 
                            value: option
                            text: option
                            selected: option is value
                        editField.append optionEl
                else if _.isObject @options.edit  
                    # edit = object will give a select box
                    editField = $ "<select/>"
                    for key, option of @options.edit
                        optionEl = $ "<option/>", 
                            value: key
                            text: option
                            selected: key is value
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

            false

        stopPropagation: (e) ->
            false

        saveEditedField: ->
            editField = @$(".editableField")
            if _.isFunction @options.save
                @options.save.call this, editField, @model
            else
                value = editField.val()
                changeSet = $.extend true, {}, @model.attributes
                changeSet[@options.field] = value

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
                @actions = new Ribs.Actions @get("actions"), ribs: @ribs
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

    class Ribs.InlineAction extends Ribs.BatchAction

        label: ->
            label = @model.get("inlineLabel") ? @model.get("label")
            if _.isFunction label
                label = label.call @model, @options.listItem.model
            label

        getSelected: ->
            [ @options.listItem.model ]

        getListItem: ->
            @options.listItem

