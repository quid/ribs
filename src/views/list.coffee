do ($=jQuery) ->

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
        
        delegateEvents: ->
            super
            for sv in ["list", "actions"] when @subviews(sv)?
                view.delegateEvents() for view in @subviews(sv)

        render: ->
            @_render @renderOrder
            this

        _render: (order) ->
            for t in order
                @["render#{t}"]() unless @["suppress#{t}"]
        
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
                    @listenTo @collection, "selected deselected add remove reset", fn

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
            @lastSelected = null

        invertSelected : ->
            toSelect = @$list.find(":not(.item.selected)")
            toDeselect = @$list.find(".item.selected")
            toSelect.trigger "select"
            toDeselect.trigger "deselectitem"

        select: (ids) ->
            ids = [ids] unless _.isArray ids
            for id in ids
                @get(id)?.$el.trigger "selectitem", silent: true
            @_render ["Header", "Footer", "Actions"]

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

            view.render()
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

            _availableActions = _.reject @actions, (action) =>
                action.available? and !action.available.call this

            @allActions = new Ribs.Actions _availableActions, ribs: this
            
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
                view.delegateEvents()

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

