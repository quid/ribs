do ($=jQuery) ->

    # Make `Ribs` globally accessible.
    window.Ribs = {}

    # Jump keys
    # ---------
    
    # Internal list for registered jump keys.
    Ribs._boundJumpKeys = {}
    # Hotkey to preceed any jump keys.
    Ribs._jumpPrefixKey = "g"
    # Time allowed between prefix and jump key.
    Ribs._jumpTimeout = 1000

    # Sets `_readyToJump` flag for `_jumpTimeout` milliseconds.
    Ribs._poiseJump = ->
        Ribs._readyToJump = true
        clearTimeout(Ribs._jumpInterval)
        Ribs._jumpInterval = setTimeout( ->
            Ribs._readyToJump = false
        , Ribs._jumpTimeout)

    # Executes applicable jump key.
    Ribs._makeJump = (charcode) ->
        Ribs._readyToJump = false
        clearTimeout Ribs._jumpTimeout
        bindings = Ribs._boundJumpKeys[charcode]
        if bindings? and bindings.length > 0
            _.each bindings, (binding) ->
                # Only jump if `el` is visible
                unless binding.el? and $(binding.el).is(":hidden")
                    binding.fn.apply(binding.ctx)

    # The function to use when adding a jump key.
    #
    # + __label__:    Shown in the keyboard bindings pane.
    # + __key__:      The jump key to use.
    # + __fn__:       The callback for when jumpkey combo is hit.
    # + __ctx__:      Context of the jumpkey callback (`this` within fn).
    # + __el__:       The element (defaults to ctx.el). Must be visible on page
    #                 for jumpkey to be active.
    Ribs.bindJumpKey = (label, key, fn, ctx, el) ->
        charCode = key.charCodeAt(0)
        if not el? and ctx instanceof Backbone.View
            el = ctx.el
        Ribs._boundJumpKeys[charCode] ||= []
        Ribs._boundJumpKeys[charCode].push 
            label: label
            fn: fn
            ctx: ctx
            el: el
            key: key
        charCode

    # The function to use when removing a jump key.
    Ribs.unbindJumpKey = (key, ctx) ->
        charCode = key.charCodeAt(0)
        _.each Ribs._boundJumpKeys[charCode], (binding, i)->
            if binding.ctx is ctx
                Ribs._boundJumpKeys[charCode].splice(i, 1)
                if Ribs._boundJumpKeys[charCode].length is 0
                    delete Ribs._boundJumpKeys[charCode]


    # A registry for all views is required when showing hotkey help pane.
    Ribs._registeredListViews = {}

    # Function which will construct/display applicable keyboard shortcuts 
    # in an overlay.
    Ribs.showKeyboardBindings = ->

        className = "ribs-keyboard-shortcuts-overlay"

        # Remove any existing overlays if they exist.
        $(".#{className}").remove()

        # Create overlay div.
        overlay = $.el.div(class: className)

        # First section has generic hotkeys and jump keys.
        ul = $.el.ul()
        $(overlay).append $.el.h1("Navigation"), ul

        # Loop through and add all jump keys.
        _.each _.flatten(Ribs._boundJumpKeys), (binding) ->
            unless binding.el and $(binding.el).is(":hidden")
                li = $.el.li(
                    { class: "hotkey" },
                    $.el.span({class: "jump key"}, "g#{binding.key}"),
                    $.el.span({class: "action"}, "Go to #{binding.label}")
                )
                $(ul).append li

        # Generic ribs hotkeys.
        keys = [
            { key: "?", label: "Open this page" },
            { key: "j", label: "Next item" },
            { key: "J", label: "Last item" },
            { key: "k", label: "Previous item" },
            { key: "K", label: "First item" },
            { key: "x", label: "Select/deselect item" },
            { key: "X", label: "Select/deselect all" },
            { key: "_", label: "Expand/collapse list" },
            { key: "R", label: "Refresh items" }
        ]

        _.each keys, (binding) ->
            li = $.el.li(
                { class: "hotkey" },
                $.el.span({class: "key"}, binding.key),
                $.el.span({class: "action"}, binding.label)
            )
            $(ul).append li


        # A new section for each registered list with all of its actions.
        _.each Ribs._registeredListViews, (view) ->
            unless $(view.el).is(":hidden")
                h1 = $.el.h1 view.plural()
                ul = $.el.ul()
                $(overlay).append h1, ul
                _.each view.actions, (action) ->
                    if action.hotkey?
                        li = $.el.li(
                            { class: "hotkey" },
                            $.el.span({class: "key"}, action.hotkey),
                            $.el.span({class: "action"}, action.label)
                        )
                        $(ul).append li

        # Clicking overlay will remove it.
        $(overlay).bind 'click', ->
            $(overlay).remove()
            false

        # __<return>__ or __<esc>__ will remove overlay.
        $(window).bind 'keyup', (event) -> 
            $(overlay).remove() if event.which is 27
            false

        $("body").append(overlay)
        overlay

    # Main jumpkey handler.
    # TODO: wrap this in an optionally called `enableKeyboardShortcuts` method.
    $(window).on "keypress", (event) ->
        unless $(document.activeElement).is("input:text, textarea")
            prefix = Ribs._jumpPrefixKey.charCodeAt(0)
            if event.which is prefix and not Ribs._readyToJump
                Ribs._poiseJump()
            else if Ribs._readyToJump
                Ribs._makeJump(event.which)
            else if event.which is 63 # '?'
                # Show hotkey bindings
                Ribs.showKeyboardBindings()


    # Views
    # -----

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
            'keypress' : 'keypressed'

        constructor : (options) ->

            @events ||= {}
            _.extend @events, @_ribsEvents

            @view = options?.view

            # create cell views
            @listItemCells = []
            _.each @view.displayAttributes, (attribute) =>
                attribute = _.clone(attribute)
                attribute.view = @
                attribute.model = options.model
                @listItemCells.push new Ribs.ListItemCell attribute

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
            _.each @listItemCells, (cell) =>
                cell.render()
                cell.delegateEvents()
                @$el.append cell.el
            obj = @model.toJSON()

            # Add inline actions.
            _.each @view.inlineActions, (action, key) =>
                unless action.filter? and action.filter(@model) is false
                    @$el.append action.renderInline(this)

        toggle : ->
            unless @$el.is(".disabled") or @view.suppressToggle
                if @$el.is(".selected")
                    @deselect()
                else
                    @select()

        stopPropogation: (e) ->
            e.stopImmediatePropagation()

        select : (event, options={})->
            return if @view.suppressToggle
            @$el.addClass "selected"
            @$el.find("input:checkbox").attr "checked", "checked"
            @model.trigger "selected" unless options.silent

        deselect : (event, options={})->
            return if @view.suppressToggle
            @$el.removeClass "selected"
            @$el.find("input:checkbox").removeAttr "checked"
            @model.trigger "deselected" unless options.silent

        enable : ->
            @$el.removeClass "disabled"
            @$el.find("input:checkbox").removeAttr "disabled"
            @$el.attr("tabindex", 0)
            @model.trigger "enabled"

        disable :-> 
            @$el.addClass "disabled"
            @$el.find("input:checkbox").attr "disabled", "disabled"
            @$el.attr("tabindex", -1)
            @model.trigger "disabled"

        remove: ->
            @deselect()
            super()

        keypressed : (event) -> 
            # __<return>__ and __x__ will toggle selection.
            if event.which in [13, 120] and not @view.suppressToggle
                @toggle()
                return
            if @view.inlineActions.length
                event.originalEvent.listItem = this

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
            _.extend this, options
            super options
            @$el.addClass(@options.class ? @options.field)
            @model.on "change change:#{@field}", @render, this

        renderableValue: (nomap) ->
            # first check if it is a top level attribute
            value = @model.get(@field)
            # else see if it is a nested attribute
            value ||= walk_context(@field, @model.toJSON())
            if "map" of @options and !nomap
                value = @map value, @model, @$el
            value

        render: ()->
            @$el.empty()

            # cells are rendered as html by default
            # unless escape is set 
            if @escape
                @$el.text(@renderableValue())
            else
                @$el.html(@renderableValue())

            if @editable
                label = @label ? @field
                editableEl = $.el.span {
                    class: 'edit button inline', 
                    title: "Edit #{label}"}, '✎'
                if @model.get(@field) in [null, '']
                    $(editableEl).addClass('show')
                else
                    $(editableEl).removeClass('show')

                @$el.append(editableEl) 

            return this

        edit: ->
            # bind events for when it is editable
            # and swap out the cell with any passed
            # in element
            if @editable
                # default to a text field
                if @editable instanceof Function
                    editField = $(@editable(@renderableValue(true), @model))
                else
                    editField = $($.el.input(type: 'text', value: @renderableValue(true)))
                editField.addClass("editableField")
                @$el.html(editField)
                @delegateEvents()
                editField.focus()
                @model.editing = true

            return false

        saveEditedField: (e) ->
            field = $(e.target)
            changeSet = {}
            changeSet[@field] = field.val()
            @model.changeSet = changeSet
            try
                @model.save changeSet,
                    wait: true
            catch e
                @render()

            # BB won't save if nothing changed
            # but we need to rerender to get 
            # the old cell view back
            unless @model.hasChanged()
                @model.trigger("change:#{@field}")

            @model.editing = false

    # `Ribs.List` is the primary Ribs component.
    class Ribs.List extends Backbone.View
  
        itemView: Ribs.ListItem

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
    
            @events ||= {}

            _.extend @events, @_ribsEvents
            _.extend this, options
      
            key = _.uniqueId('ribs_view_')
            Ribs._registeredListViews[key] = this

            # Construct internal components.
            els = _.map @renderOrder, (t) =>
                @["initialize#{t}"]() unless @["suppress#{t}"]

            super options

            _.each els, (el) =>
                @$el.append el if el

            # Bind jump key.
            if @jumpkey?
                Ribs.bindJumpKey @plural(), @jumpkey, ->
                    @$el.find(@jumpSelector).focus()
                , this

            @_subviews = []

            if @collection?
                @setCollection @collection

            @on 'refresh', @refresh
            @$el.addClass('ribs')

        setCollection: (collection)->
            @collection = collection
            _.each _.union(@inlineActions, @batchActions), (action) =>
                action.setCollection @collection if action?
            # Bind events to collection.
            @collection.on "add", (model) => 
                @addItem(model)
            , this
            @collection.on "reset", @addAllItems, this
            @collection.on "selected deselected reset add remove", @updateHeader, this if @$header
            @collection.on "selected deselected reset add remove", @updateFooter, this if @$footer

            # Add items from collection to view.
            @addAllItems()

        getSelected : ->
            return [] unless @$list?
            @$list.find(".item.selected").map (idx, el) =>
                @collection.getByCid $(el).data("cid")

        getDeselected: ->
            return [] unless @$list?
            @$list.find(".item:not(.selected)").map (idx, el) =>
                @collection.getByCid $(el).data("cid")

        getNumSelected: ->
            return 0 unless @$list?
            @$list.find(".item.selected").size()

        getNumDeselected: ->
            return 0 unless @$list?
            @$list.find(".item:not(.selected)").size()

        getNumTotal: ->
            return 0 unless @collection?
            @collection.length
            
        toggleSelected : (event) ->
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
                @sortCollectionBy field
			
        sortCollectionBy: (field) ->

            old_field = @collection.sortingBy
            @collection.sortingDirection ||= {}
            @collection.sortingBy = field

            if field is old_field and field of @collection.sortingDirection
                @collection.sortingDirection[field] *= -1 # toggle direction
            else
                @collection.sortingDirection[field] = 1

            dir = @collection.sortingDirection[field]

            if @collection.remoteSort
                @collection.trigger 'remoteSort', field, dir
            else
                @collection.comparator = (ma,mb)=>
                    a = walk_context field, ma.toJSON()
                    b = walk_context field, mb.toJSON()
                    return  0     if a is b
                    return +1*dir if a > b or not b?
                    return -1*dir if a < b or not a?

                @collection.sort()

                @render()

            @updateHeaderArrows field, old_field

        updateHeaderArrows : (field, old_field) ->

            return unless @collection?

            re = new RegExp(" (#{_.values(@sortArrows).join("|")})$|$")
            dir = @collection.sortingDirection[field] ? 1
            
            # Remove arrows from previously sorted label.
            if old_field?
                old_el = @$header.find("[data-sort-by='#{old_field}']")
                old_label = old_el.html()?.replace(re, "")
                $(old_el).html(old_label)
            
            # Put arrows on currently sorted label.
            el = @$header.find("[data-sort-by='#{field}']")
            label = $(el).html()?.replace(re, " #{@sortArrows[dir]}")
            $(el).html(label)
    
        keypressed : (event) ->
            unless Ribs._readyToJump or $(document.activeElement).is("input:text, textarea")
                if event.which is 106 # j
                    $(document.activeElement).nextAll(".item:visible:not(.disabled):first").focus()
                else if event.which is 107 # k
                    $(document.activeElement).prevAll(".item:visible:not(.disabled):first").focus()
                else if event.which is 74 # J
                    @$list.find(".item:last").focus()
                else if event.which is 75 # K
                    @$list.find(".item:first").focus()
                else if event.which is 95 # _
                    @toggleVisibility()
                else if event.which is 88 # X
                    @toggleSelected()
                else if event.which is 82 # R
                    # refresh collection (from server)
                    @collection.trigger 'before:refresh'
                    @trigger 'refresh'
                else
                    # let the actions know
                    @trigger "keypressed", event
    
        refresh: ->
            if @collection.url?
                @collection.fetch
                    success: =>
                        @$list.find(":first")?.focus()


        focusin : (event) ->
            unless @focussed
                @focussed = true
            @$el.addClass "focussed"
            @collection?.trigger "focusin"
    
        focusout : (event) ->
            if @focussed
                # need to delay to find the proper next document.activeElement
                setTimeout =>
                    if @$el.find(document.activeElement).length is 0
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
            @$title = $( $.el.h1 {class: "title"}, title )
            @$title
        
        initializeActions: ->
            
            @batchActions = []
            @inlineActions = []

            @$batchActions = $($.el.ul class: "actions")
            
            # populate @batchActions and @inlineActions with instance of
            # `Ribs.Action` based on @actions
            _.each @actions, (actionConfig) =>
                actionConfig.collection = @collection
                actionConfig.view = this
                action = new Ribs.Action actionConfig
                if action.inline
                    @inlineActions.push action
                if action.batch isnt false
                    @batchActions.push action
                    action.render()
                    @$batchActions.append action.el

            if @batchActions.length
                @$batchActions
            else
                null
        
        initializeList: ->
            @$list = $($.el.ul( class: "list"))
            @$list
        
        addItem : (model) ->
            if Backbone.View::isPrototypeOf(@itemView::)
                itemView = @itemView
            else
                itemView = @itemView(model)
            view = new itemView( model: model, view: this )
            @$list.append(view.el)
            view.delegateEvents()
            view.render() if @$el.is ":visible"
            @_subviews.push view
            view.select() if @selectedByDefault

        addAllItems : ->
            @_subviews = []
            @$list.empty()
            @collection.trigger "deselected"
            @collection?.each @addItem, this

        get: (id) ->
            _.find @_subviews, (view) ->
                view.model.id == id

        render: ->
            _.each @_subviews, (view,i) ->
                view.render()

        initializeHeader: ->
            @$header = $($.el.div class: "header")

            unless @suppressToggle
                toggle = $.el.input(type: "checkbox", tabindex: -1 )
                $(toggle).attr("checked", "checked") if @selectedByDefault
                @$header.append $.el.div({class:"toggle"}, toggle)

            if @displayAttributes?
                attributes = @displayAttributes
            else
                attributes = _.map @collection.first().toJSON(), (v,k) -> 
                    { field: k }
            _.each attributes, (attribute) =>
                label = attribute.label ? attribute.field
                klass = attribute.class ? attribute.field
                @$header.append $.el.div(
                    {class: klass, "data-sort-by": (attribute.sortField or attribute.field)}, 
                    label
                )

            # sorting and minimizing/maximizing
            @$header.find(".maximize, .minimize").click =>
                @toggleVisibility()

            # put arrow on default sorted by
            @$header.find("[data-sort-by=#{@collection.sortingBy}]").append(" #{@sortArrows[1]}")

            @$header

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
            @$footer = $($.el.div class: "footer")
            @updateFooter()
            @$footer

        updateFooter : ->
            plural = @getNumTotal() isnt 1
            word = if plural then @plural() else @itemName
            @$footer.text "#{@getNumSelected()} / #{@getNumTotal()} #{word} selected"
    

    class Ribs.Action extends Backbone.View
  
        tagName : "li"

        className: "action"
    
        _ribsEvents:
            'click': 'triggerAction'
            'keypress': 'keypressedHere'
  
        constructor : (options) ->
    
            @min = 1
            @max = -1 # -1 means no maximum
            @arity = null # defining arity will override min/max
            @check = null # defining check will be additional to min/max/arity

            @events ||= {}
            _.extend @events, @_ribsEvents
            
            _.extend this, options
            
            super options

            @setCollection @collection if @collection?

            @checkRequirements()
    
        setCollection: (collection) ->
            if collection?
                @collection = collection
                @collection.on "selected deselected reset", @checkRequirements, this
                @view.on "keypressed", @keypressedOnView, this if @hotkey?
  
        checkRequirements: ->
            enable = @allowed()
            @disable() unless enable
            @enable() if enable
    
        allowed : (l) ->

            l ||= @view.getNumSelected()
    
            allow = false
    
            if @arity?
                a = @arity
                r1 = a is l                           # arity is same as #selected
                r2 = a is -1                          # arity is anything
                r3 = !!(a % 1) and l >= Math.floor(a) # #selected >= floor(arity)
                allow = r1 or r2 or r3
            else
                r1 = @min is -1 or l >= @min          # minimum requirement is satisfied
                r2 = @max is -1 or l <= @max          # maximum requirement is satisfied
                allow = r1 and r2
    
            if allow and @check?
                allow = @check.apply(@view, [@view.getSelected()])
    
            allow
    
        disable : ->
            @$el.addClass("disabled")
            @$el.find(".button").attr("tabindex", -1)
    
        enable : ->
            @$el.removeClass("disabled")
            @$el.find(".button").attr("tabindex", 0)
    
        # triggers activate on selected items
        triggerAction : (event, listItem) ->
            if not @$el.is(".disabled") and @allowed()
                @activate.call(@view, @view.getSelected(), listItem)

        # triggers activate on clicked item
        triggerActionInline : (event, listItem) ->
            unless listItem.$el.is ".disabled"
                @activate.call(@view, [listItem.model], listItem)
    
        keypressedHere : (event) ->
            # activate on <return>
            if event.which is 13
                @triggerAction(event)
                return false
            true
    
        keypressedOnView : (event) ->
            if @hotkey? and @hotkey.charCodeAt(0) is event.which
                listItem = event.originalEvent.listItem
                if listItem? and @inline?
                    @triggerActionInline(event, listItem)
                else
                    @triggerAction(event, listItem)
                return false
    
        render : ->
            @$el.html @drawButton()

        drawButton: (inline=false, listItem) ->
            if inline or not @$el.is(".disabled")
                tabindex = 0
            else
                tabindex = -1
            btn = $.el.div class: "button", tabindex: tabindex
            if inline
                label = @inlineLabel ? @label
                if listItem? and label instanceof Function
                    label = label.call this, listItem.model
            else
                label = @batchLabel ? @label
                label = @constructor.highlightHotkey label, @hotkey if @hotkey?

            $(btn).html label
            $(btn).attr "title", @label
            $(btn)

        # renders an independent (rendered and bound)
        renderInline: (listItem) ->
            btn = @drawButton(true, listItem)
            btn.addClass "inline"
            $(btn).on "click", (event) =>
                @triggerActionInline(event, listItem)
                false
            $(btn).on "keypress", (event) =>
                if event.which is 13
                    @triggerActionInline(event, listItem) 
                    false
            btn

        @highlightHotkey : (label, hotkey) ->
            char = hotkey
            new_label = label.replace char, "<span class='hotkey'><strong>#{char}</strong></span>"
            if label is new_label
                new_label = "#{label} <span class='hotkey'>[<strong>#{char}</strong>]</span>"
            new_label
    

    # utility method for accessing objects with dot syntax
    # borrowed from mustache.js
    walk_context = (name, context) ->
        path = name.split "."
        value = context[path.shift()]
        while value? and path.length > 0
            context = value
            value = context[path.shift()]
        return value.apply(context) if typeof value is "function"
        value

