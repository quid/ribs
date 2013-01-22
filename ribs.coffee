do ($=jQuery) ->

    # Make `Ribs` globally accessible.
    root = window ? module.exports
    root.Ribs = {}

    # `Ribs.List` is the primary Ribs component.
    class Ribs.List extends Backbone.View
  
        tagName: "div"
    
        itemName: "item"
    
        _ribsEvents: 
            'keypress' : 'keypressed'
            'focusin' : 'focusin'
            'focusout' : 'focusout'
            'click .header .toggle' : 'toggleSelected'
            'click .maximize .minimize' : 'toggleVisibility'
            'click [data-sort-by]' : 'sortByField'

        _ribsOptions: ["displayAttributes", "actions", "itemView"]

        jumpSelector : ".list li:first"
    
        focussed : false

        selectedByDefault : false

        stopPropogation: (e) ->
            e.preventDefault()

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

            super options

            @[k] = options[k] for k in @_ribsOptions when options[k]?
      
            @initializeHotKeys()

            @$el.addClass('ribs')

            @build()
        
        build: ->
            @$el.empty()

            for t in @renderOrder
                l = t.replace /^./, "$#{t[0].toLowerCase()}"
                @[l] = @["initialize#{t}"]() unless @["suppress#{t}"]
                @$el.append @[l]

            @updateHeaderArrows @sortingBy

            @setCollection @collection if @collection?

        render: ->
            for t in @renderOrder
                @["render#{t}"]() unless @["suppress#{t}"]
        
        setCollection: (collection)->
            @collection = collection

            # Unbind events
            @collection.off "selected deselected reset add remove", null, this
            # Bind events to collection
            @collection.on "add", @addItem, this
            @collection.on "sort reset", @addAllItems, this
            @collection.on "reset", @render, this
            @collection.on "selected deselected add remove", @renderActions, this
            @collection.on "selected deselected add remove", @renderHeader, this
            @collection.on "selected deselected add remove", @renderFooter, this

            # Add items from collection to view.
            @addAllItems()

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

        toggleSelected : ->
            if @selectedByDefault is true 
                @$list.find(".item.selected").trigger "deselect", silent: true
                @selectedByDefault = false
                @collection?.trigger "deselected"
            else
                @$list.find(".item:not(.selected)").trigger "select", silent: true
                @selectedByDefault = true
                @collection?.trigger "selected"

        invertSelected : ->
            toSelect = @$list.find(":not(.item.selected)")
            toDeselect = @$list.find(".item.selected")
            toSelect.trigger "select"
            toDeselect.trigger "deselect"
    
        toggleVisibility : ->
            @$header.find(".maximize, .minimize").toggle()

            # Workaround for bug http://bugs.jqueryui.com/ticket/8113
            @$el.attr("class", "") unless @$el.attr("class")?

            @$el.toggleClass "minimized", 100

        sortByField: (event) ->
            field = $(event.target).attr("data-sort-by")
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
                    if da.map?
                        a = da.map a

                    b = mb.get field
                    db = @displayAttributeMap[field]
                    if db.map?
                        b = db.map b

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

            # Lazily construct global keyboard manager
            @constructor.keyboardManager ?= new Ribs.KeyboardManager()
            @keyboardManager = @constructor.keyboardManager

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
            @keyboardManager.handleKeypress event, @keyboardNamespace
    
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
            @itemNamePlural ? @itemName+"s"

        
        addItem : (model) ->
            if Backbone.View::isPrototypeOf(@itemView::)
                itemView = @itemView
            else
                itemView = @itemView(model)
            view = new itemView( model: model, view: this )

            # Respect collection insertion order
            idx = @collection.indexOf(model)
            if @$list.children().size() in [0, idx]
                @$list.append view.el
            else
                @$list.children(":nth-child(#{ idx + 1 })").before view.el

            view.delegateEvents()
            view.render() if @$el.is ":visible"
            @_listSubviews.push view
            view.select() if @selectedByDefault

        addAllItems : ->
            @_listSubviews = []
            @$list.empty()
            @collection?.each @addItem, this

        # Gets list item view by model ID
        get: (id) ->
            _.find @_listSubviews, (view) ->
                view.model.id == id

        # Gets list item view by CID
        getByCid: (cid) ->
            _.find @_listSubviews, (view) ->
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
            
            @batchActions = []
            @inlineActions = []
            @allActions = []
            @_actionSubviews = []

            $batchActions = $ "<ul/>", class: "actions"
            
            _.each @actions, (actionConfig) =>
                action = new Ribs.Action actionConfig, view: this
                @allActions.push action
                if actionConfig.inline
                    @inlineActions.push action
                if actionConfig.batch isnt false
                    @batchActions.push action
                    view = new @actionView
                        model: action
                    @_actionSubviews.push view
                    $batchActions.append view.el
                    view.render()

            $batchActions

        renderActions: ->
            for view in @_actionSubviews
                view.render() 
        
        initializeList: ->
            $list = $ "<ul/>", class: "list"
            $list

        renderList: ->
            for view in @_listSubviews
                view.render() 

        initializeHeader: ->
            $header = $ "<div />", class: "header"

            unless @suppressToggle
                toggle = $ "<input />", 
                    type: "checkbox", 
                    tabindex: -1
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
                .attr("checked", isChecked)
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
            'select' : 'select'
            'deselect' : 'deselect'
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
                @listItemCells.push new @itemCellView attribute

            super options

            if @model?
                @model.on 'change', @render, this
                @model.on 'remove', @remove, this
  
        render : ->
            @$el.empty()
            return unless @model
            @$el.data("cid", @model.cid)

            unless @view.suppressToggle
                toggle = $ "<input/>",
                    type: "checkbox"
                    tabindex: -1
                if @$el.is ".selected"
                    $(toggle).attr "checked", true
                div = $ "<div/>", class: "toggle"
                div.append toggle
                @$el.append div

            # Render our individual cells
            for cell in @listItemCells
                cell.render()
                cell.delegateEvents()
                @$el.append cell.el
            obj = @model.toJSON()

            # Add inline actions.
            ul = $ "<ul/>", class: "actions"
            for key, action of @view.inlineActions
                unless action.filter? and action.filter(@model) is false
                    inlineAction = new @actionView
                        model: action
                        listItem: this
                    inlineAction.render()
                    $(ul).append inlineAction.el
            @$el.append ul

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
            @$("input:checkbox").attr "checked", "checked"
            @model.trigger "selected" unless options.silent

        deselect : (event, options={})->
            return if @view.suppressToggle
            @$el.removeClass "selected"
            @$("input:checkbox").removeAttr "checked"
            @model.trigger "deselected" unless options.silent

        enable : ->
            @$el.removeClass "disabled"
            @$("input:checkbox").removeAttr "disabled"
            @$el.attr("tabindex", 0)
            @model.trigger "enabled"

        disable :-> 
            @$el.addClass "disabled"
            @$("input:checkbox").attr "disabled", "disabled"
            @$el.attr("tabindex", -1)
            @model.trigger "disabled"

        remove: ->
            @deselect()
            super()


    class Ribs.ListItemCell extends Backbone.View
  
        tagName : "div"

        className: "cell"
    
        _ribsEvents:
            'click .edit' : 'edit'
            'blur .editableField' : 'saveEditedField'
  
        constructor : (options) ->

            @events ||= {}
            _.extend @events, @_ribsEvents
            _.extend this, options # TODO remove this
            super options
            @$el.addClass(@options.class ? @options.field)
            @model.on "change change:#{@options.field}", @render, this

        renderableValue: (nomap) ->
            # first check if it is a top level attribute
            value = @model.get(@options.field)
            # else see if it is a nested attribute
            value = @options.map value, @model, @$el if @options.map? and !nomap
            value

        render: ()->
            @$el.empty()

            # cells are rendered as html by default
            # unless escape is set 
            if @options.escape
                @$el.text(@renderableValue())
            else
                @$el.html(@renderableValue())

            if @editable
                label = @options.label ? @options.field
                editableEl = $ "<span/>",
                    class: 'edit button inline', 
                    title: "Edit #{label}"
                    text: '✎'
                if @model.get(@options.field) in [null, '']
                    $(editableEl).addClass('show')
                else
                    $(editableEl).removeClass('show')

                @$el.append(editableEl) 

            return this

        edit: ->
            if @options.editable
                value = @model.get @options.field

                if _.isFunction @options.editable
                    editField = $ @options.editable.call this, value, @model
                else if _.isArray @options.editable
                    editField = $ "<select/>"
                    for option in @options.editable
                        optionEl = $ "<option/>", 
                            value: option
                            text: option
                            selected: options is value
                        editField.append optionEl
                else if _.isObject @options.editable
                    editField = $ "<select/>"
                    for key, option of @options.editable
                        optionEl = $ "<option/>", 
                            value: key
                            text: option
                            selected: key is value
                        editField.append optionEl
                else
                    editField = $ "<input/>", 
                        type: 'text'
                        value: value 

                if editField
                    editField.addClass "editableField"
                    @$el.html editField
                    @delegateEvents()
                    editField.focus()

            return false

        saveEditedField: (e) ->
            field = $(e.target)
            value = field.val()
            changeSet = {}
            changeSet[@options.field] = value
            try
                @model.save changeSet,
                    wait: true
            catch e
                @render()


    class Ribs.Action extends Backbone.Model

        defaults:
            min : 1
            max : -1 # -1 means no maximum
            arity : null # defining arity will override min/max
            check : null # defining check will be additional to min/max/arity

        initialize: (attributes, options) ->

            @ribs = options.view

            @ribs.keyboardManager.registerHotKey
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
                a = @options.arity
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

        activate: (selected)->
            selected = @getSelected() unless selected?
            @get("activate").call @ribs, selected

        getSelected: ->
            @ribs.getSelected()

    class Ribs.BatchAction extends Backbone.View
  
        tagName : "li"

        className: "action"
    
        events:
            'click': 'activate'
            'keypress': 'keypressed'
  
        render : ->
            label = @label()

            btn = $ "<div/>", 
                class: "button"
                title: label
                html: label

            @$el.html btn

            @checkRequirements()

        label: ->
            label = @model.get("batchLabel") ? @model.get("label")
            if @model.has "hotkey"
                label = @constructor.highlightHotkey label, @model.get "hotkey"
            label

        getSelected: ->
            @model.getSelected()
  
        checkRequirements: ->
            @setEnabled @model.allowed @getSelected()
    
        setEnabled : (enabled) ->
            @$el.toggleClass "disabled", not enabled
            idx = if enabled then 0 else -1
            @$(".button").attr "tabindex", idx

        activate: (event) ->
            console.log @getSelected()
            @model.activate @getSelected()
            false

        keypressed : (event) ->
            # activate on <return>
            if event.which is 13
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

            $(window).on "keypress", (e) => @handleKeypress(e)

        registerView: (view, label) ->
            namespace = _.uniqueId "view"
            @registeredViews[namespace] = 
                label: label
                context: view
                tree: {}
                bindings: []
            namespace

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

        registerJumpKey: (options) ->
            options.label = "Go to #{options.label}"
            options.hotkey = @options.jumpPrefixKey + options.jumpkey
            @registerHotKey options


        handleKeypress: (event, namespace="global") ->

            return unless @options.enableKeyboardShortcuts

            # don't do anything if user is typing text
            return if $(document.activeElement).is(":input")

            context = @currentContext ? @registeredViews[namespace].tree

            @execute context, event.which if context?

        execute: (context, charCode) ->

            clearTimeout @timeout if @timeout
            delete @currentContext
            return unless charCode of context

            context = context[charCode]

            if context.upcoming is 0
                for binding in context.bindings
                    ctx = binding.context ? @registeredViews[binding.namespace].context
                    unless binding.precondition and not binding.precondition.call ctx
                        binding.callback.call ctx
            else
                @currentContext = context
                @timeout = setTimeout =>
                    @execute context
                , @options.jumpTime

            false


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

        initialize: (options) ->
            # __<return>__ or __<esc>__ will remove overlay.
            $(window).bind 'keyup', (event) -> 
                @remove() if event.which is 27
                false

        render: ->
            @$el.empty()

            for namespace, view of @options.views
                unless $(view.el).is(":hidden")
                    h1 = $ "<h1/>", text: view.label
                    ul = $ "<ul/>"
                    for binding in view.bindings
                        li = $ "<li/>", class: "hotkey"
                        li.append $ "<span/>", class: "key", text: binding.hotkey
                        li.append $ "<span/>", class: "action", text: binding.label
                        ul.append li
                    @$el.append h1, ul

