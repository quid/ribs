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

            @className ||= ""
            @className += " ribs"

            @itemView ?= Ribs.ListItem
    
            @events ||= {}

            _.extend @events, @_ribsEvents
            _.extend this, options

            super options
      
            @initializeHotKeys()

            # Construct internal components (title, header, list etc.)
            @components = []
            for t in @renderOrder
                l = t.replace /^./, "$#{t[0].toLowerCase()}"
                @[l] = @["initialize#{t}"]() unless @["suppress#{t}"]
                @components.push @[l] if l of @

            @$el.addClass('ribs')

            @build()
        
        build: ->
            @$el.empty()

            for t in @components
                @$el.append t

            @_subviews = []

            if @collection?
                @setCollection @collection

        render: ->
            for view, i in @_subviews
                view.render()
            @updateFooter if @$footer
            @updateHeader if @$header
        
        setCollection: (collection)->
            @collection = collection
            # Update actions
            for action in @allActions
                action?.setCollection @collection

            # Unbind events
            @collection.off "selected deselected reset add remove", null, this
            # Bind events to collection
            @collection.on "add", @addItem, this
            @collection.on "reset", @addAllItems, this
            @collection.on "selected deselected reset add remove", @updateHeader, this if @$header
            @collection.on "selected deselected reset add remove", @updateFooter, this if @$footer

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
            if field?
                old_field = @sortingBy
                @sortingDirection ||= {}
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

            return unless @collection?

            re = new RegExp(" (#{_.values(@sortArrows).join("|")})$|$")
            dir = @sortingDirection[field] ? 1
            
            # Remove arrows from previously sorted label.
            if old_field?
                old_el = @$header.find("[data-sort-by='#{old_field}']")
                old_label = old_el.html()?.replace(re, "")
                $(old_el).html(old_label)
            
            # Put arrows on currently sorted label.
            el = @$header.find("[data-sort-by='#{field}']")
            label = $(el).html()?.replace(re, " #{@sortArrows[dir]}")
            $(el).html(label)
    
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
        
        # initializing
        
        initializeTitle: -> 
            title = @title ? @plural()
            title = title.call this if title instanceof Function
            $title = $( $.el.h1 {class: "title"}, title )
            $title
        
        initializeActions: ->
            
            @batchActions = []
            @inlineActions = []
            @allActions = []

            $batchActions = $($.el.ul class: "actions")
            
            # populate @batchActions and @inlineActions with instance of
            # `Ribs.Action` based on @actions
            _.each @actions, (actionConfig) =>
                actionConfig.collection = @collection
                actionConfig.view = this
                if actionConfig.inline
                    @inlineActions.push actionConfig
                if actionConfig.batch isnt false
                    action = new Ribs.Action actionConfig
                    @batchActions.push action
                    @allActions.push action
                    action.render()
                    $batchActions.append action.el

                if actionConfig.hotkey
                    @keyboardManager.registerHotKey
                        hotkey: actionConfig.hotkey
                        label: actionConfig.label
                        namespace: @keyboardNamespace
                        context: actionConfig
                        precondition: actionConfig.allowed
                        callback: =>
                            actionConfig.activate.call @, @getSelected()

            if @batchActions.length
                $batchActions
            else
                null
        
        initializeList: ->
            $list = $($.el.ul( class: "list"))
            $list
        
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
            @_subviews.push view
            view.select() if @selectedByDefault

        addAllItems : ->
            @_subviews = []
            @$list.empty()
            @collection?.each @addItem, this
            @trigger "rendered"

        # Gets list item view by model ID
        get: (id) ->
            _.find @_subviews, (view) ->
                view.model.id == id

        # Gets list item view by CID
        getByCid: (cid) ->
            _.find @_subviews, (view) ->
                view.model.cid == cid

        initializeHeader: ->
            $header = $($.el.div class: "header")

            unless @suppressToggle
                toggle = $.el.input(type: "checkbox", tabindex: -1 )
                $(toggle).attr("checked", "checked") if @selectedByDefault
                $header.append $.el.div({class:"toggle"}, toggle)

            unless @displayAttributes?
                attributes = _.map @collection.first().toJSON(), (v,k) -> 
                    { field: k }
            @displayAttributeMap = {}
            _.each @displayAttributes, (attribute) =>
                @displayAttributeMap[attribute.field] = attribute
                label = attribute.label ? attribute.field
                klass = attribute.class ? attribute.field
                $header.append $.el.div(
                    {class: klass, "data-sort-by": (attribute.sortField or attribute.field)}, 
                    label
                )

            # sorting and minimizing/maximizing
            $header.find(".maximize, .minimize").click =>
                @toggleVisibility()

            # put arrow on default sorted by
            $header.find("[data-sort-by=#{@sortingBy}]").append(" #{@sortArrows[1]}")

            $header


        updateHeader: ->
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
            $footer = $($.el.div class: "footer")
            $footer

        updateFooter : ->
            plural = @getNumTotal() isnt 1
            word = if plural then @plural() else @itemName
            @$footer.text "#{@getNumSelected()} / #{@getNumTotal()} #{word} selected"
    

    class Ribs.Action extends Backbone.View
  
        tagName : "li"

        className: "action"
    
        _ribsEvents:
            'click': 'activate'
            'keypress': 'keypressed'
  
        constructor : (options) ->
    
            @events ||= {}
            _.extend @events, @_ribsEvents

            
            super options

            @options = _.extend {
                min : 1
                max : -1 # -1 means no maximum
                arity : null # defining arity will override min/max
                check : null # defining check will be additional to min/max/arity
            }, options

            @view = options.view

            @setCollection @collection if @collection?
    
        setCollection: (collection) ->
            if collection?
                @collection = collection
                @collection.off "selected deselected reset", null, this
                @collection.on "selected deselected reset", @checkRequirements, this
            @checkRequirements()
  
        checkRequirements: ->
            enable = @allowed()
            @disable() unless enable
            @enable() if enable
    
        allowed : ->

            l = @getNumSelected()
    
            allow = false
    
            if @options.arity?
                a = @options.arity
                r1 = a is l                           # arity is same as #selected
                r2 = a is -1                          # arity is anything
                r3 = !!(a % 1) and l >= Math.floor(a) # #selected >= floor(arity)
                allow = r1 or r2 or r3
            else
                r1 = @options.min is -1 or l >= @options.min          # minimum requirement is satisfied
                r2 = @options.max is -1 or l <= @options.max          # maximum requirement is satisfied
                allow = r1 and r2
    
            if allow and @options.check?
                allow = @options.check.apply(@view, [@getSelected()])
    
            allow

        getSelected: ->
            @view.getSelected()

        getNumSelected: ->
            @view.getNumSelected()
    
        disable : ->
            @$el.addClass("disabled")
            @$(".button").attr("tabindex", -1)
    
        enable : ->
            @$el.removeClass("disabled")
            @$(".button").attr("tabindex", 0)
    
        render : ->
            label = @options.batchLabel ? @options.label
            label = @constructor.highlightHotkey label, @options.hotkey if @options.hotkey?
            tabindex = if @$el.is(".disabled") then -1 else 0
            btn = $.el.div {class: "button", tabindex: tabindex, title: @options.label}
            $(btn).html label

            @$el.html btn

        # triggers activate on selected items
        activate : ->
            @options.activate.call @view, @getSelected()
    
        keypressed : (event) ->
            # activate on <return>
            if event.which is 13
                @activate()
                false

        @highlightHotkey : (label, hotkey) ->
            char = hotkey
            new_label = label.replace char, "<span class='hotkey'><strong>#{char}</strong></span>"
            if label is new_label
                new_label = "#{label} <span class='hotkey'>[<strong>#{char}</strong>]</span>"
            new_label

    class Ribs.InlineAction extends Ribs.Action



        getSelected: ->
            [ @options.listItem?.model ]

        getNumSelected: ->
            1

        render: ->
            tabindex = 0

            label = @options.inlineLabel ? @options.label

            if label instanceof Function
                label = label.call this, @options.listItem.model
            
            btn = $.el.div {class: "inline button", tabindex: tabindex, title: @label}, label

            @$el.html btn


    # View for a list item in a regular `Ribs.List`.
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
                @model.on 'stealfocus', @stealfocus, this
  
        render : ->
            @$el.empty()
            return unless @model
            @$el.data("cid", @model.cid)

            unless @view.suppressToggle
                toggle = $.el.input
                    type: "checkbox"
                    tabindex: -1
                if @$el.is ".selected"
                    $(toggle).attr "checked", true
                @$el.append $.el.div(
                    { class: "toggle" },
                    toggle
                )

            # Render our individual cells
            for cell in @listItemCells
                cell.render()
                cell.delegateEvents()
                @$el.append cell.el
            obj = @model.toJSON()

            # Add inline actions.
            ul = $.el.ul class: "actions"
            for key, action of @view.inlineActions
                unless action.filter? and action.filter(@model) is false
                    options = _.extend action, listItem: this
                    inlineAction = new Ribs.InlineAction options
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

        stealfocus: ->
            @$el.focus()

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
                editableEl = $.el.span {
                    class: 'edit button inline', 
                    title: "Edit #{label}"}, '✎'
                if @model.get(@options.field) in [null, '']
                    $(editableEl).addClass('show')
                else
                    $(editableEl).removeClass('show')

                @$el.append(editableEl) 

            return this

        edit: ->
            # bind events for when it is editable
            # and swap out the cell with any passed
            # in element
            if @options.editable
                value = @model.get @options.field
                # default to a text field
                if @options.editable instanceof Function
                    editField = @options.editable.call this, value, @model
                else if @options.editable instanceof Array
                    el = $.el.select()
                    for option in @options.editable
                        optionEl = $.el.option { value: option }, option
                        $(optionEl).attr 'selected', option is value
                        $(el).append optionEl
                    editField = el
                else
                    editField = $.el.input type: 'text', value: value 

                if editField
                    $(editField).addClass("editableField")
                    @$el.html(editField)
                    @delegateEvents()
                    $(editField).focus()

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

            # Time allowed between prefix and jump key.
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
        #  hotkey: string
        #  label: string (displayed in help screen)
        #  callback: function (required)
        #  context: object
        #  namespace: string
        #  precondition: function
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
                    h1 = $.el.h1 view.label
                    ul = $.el.ul()
                    @$el.append h1, ul
                    for binding in view.bindings
                        li = $.el.li(
                            { class: "hotkey" },
                            $.el.span({class: "key"}, binding.hotkey),
                            $.el.span({class: "action"}, binding.label)
                        )
                        $(ul).append li
