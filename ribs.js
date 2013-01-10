(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  (function($) {
    var root;
    root = typeof window !== "undefined" && window !== null ? window : module.exports;
    root.Ribs = {};
    Ribs.List = (function(_super) {

      __extends(List, _super);

      List.prototype.tagName = "div";

      List.prototype.itemName = "item";

      List.prototype._ribsEvents = {
        'keypress': 'keypressed',
        'focusin': 'focusin',
        'focusout': 'focusout',
        'click .header .toggle': 'toggleSelected',
        'click .maximize .minimize': 'toggleVisibility',
        'click [data-sort-by]': 'sortByField'
      };

      List.prototype.jumpSelector = ".list li:first";

      List.prototype.focussed = false;

      List.prototype.selectedByDefault = false;

      List.prototype.stopPropogation = function(e) {
        return e.preventDefault();
      };

      List.prototype.renderOrder = ["Title", "Actions", "Header", "List", "Footer"];

      function List(options) {
        var l, t, _i, _len, _ref, _ref1;
        this.sortArrows = {};
        this.sortArrows[-1] = "↓";
        this.sortArrows[1] = "↑";
        this.className || (this.className = "");
        this.className += " ribs";
        if ((_ref = this.itemView) == null) {
          this.itemView = Ribs.ListItem;
        }
        this.events || (this.events = {});
        _.extend(this.events, this._ribsEvents);
        _.extend(this, options);
        List.__super__.constructor.call(this, options);
        this.initializeHotKeys();
        this.components = [];
        _ref1 = this.renderOrder;
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          t = _ref1[_i];
          l = t.replace(/^./, "$" + (t[0].toLowerCase()));
          if (!this["suppress" + t]) {
            this[l] = this["initialize" + t]();
          }
          if (l in this) {
            this.components.push(this[l]);
          }
        }
        this.$el.addClass('ribs');
        this.build();
      }

      List.prototype.build = function() {
        var t, _i, _len, _ref;
        this.$el.empty();
        _ref = this.components;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          t = _ref[_i];
          this.$el.append(t);
        }
        this._subviews = [];
        if (this.collection != null) {
          return this.setCollection(this.collection);
        }
      };

      List.prototype.render = function() {
        var i, view, _i, _len, _ref;
        _ref = this._subviews;
        for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
          view = _ref[i];
          view.render();
        }
        if (this.$footer) {
          this.updateFooter;
        }
        if (this.$header) {
          return this.updateHeader;
        }
      };

      List.prototype.setCollection = function(collection) {
        var action, _i, _len, _ref;
        this.collection = collection;
        _ref = this.allActions;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          action = _ref[_i];
          if (action != null) {
            action.setCollection(this.collection);
          }
        }
        this.collection.off("selected deselected reset add remove", null, this);
        this.collection.on("add", this.addItem, this);
        this.collection.on("reset", this.addAllItems, this);
        if (this.$header) {
          this.collection.on("selected deselected reset add remove", this.updateHeader, this);
        }
        if (this.$footer) {
          this.collection.on("selected deselected reset add remove", this.updateFooter, this);
        }
        return this.addAllItems();
      };

      List.prototype.getSelected = function() {
        var _this = this;
        if (this.$list == null) {
          return [];
        }
        return this.$list.find(".item.selected").map(function(idx, el) {
          return _this.collection.get($(el).data("cid"));
        });
      };

      List.prototype.getDeselected = function() {
        var _this = this;
        if (this.$list == null) {
          return [];
        }
        return this.$list.find(".item:not(.selected)").map(function(idx, el) {
          return _this.collection.get($(el).data("cid"));
        });
      };

      List.prototype.getNumSelected = function() {
        if (this.$list == null) {
          return 0;
        }
        return this.$list.find(".item.selected").size();
      };

      List.prototype.getNumDeselected = function() {
        if (this.$list == null) {
          return 0;
        }
        return this.$list.find(".item:not(.selected)").size();
      };

      List.prototype.getNumTotal = function() {
        if (this.collection == null) {
          return 0;
        }
        return this.collection.length;
      };

      List.prototype.toggleFocussedSelected = function() {
        if (!this.suppressToggle) {
          return this.$(".item:focus").trigger("toggle");
        }
      };

      List.prototype.toggleSelected = function() {
        var _ref, _ref1;
        if (this.selectedByDefault === true) {
          this.$list.find(".item.selected").trigger("deselect", {
            silent: true
          });
          this.selectedByDefault = false;
          return (_ref = this.collection) != null ? _ref.trigger("deselected") : void 0;
        } else {
          this.$list.find(".item:not(.selected)").trigger("select", {
            silent: true
          });
          this.selectedByDefault = true;
          return (_ref1 = this.collection) != null ? _ref1.trigger("selected") : void 0;
        }
      };

      List.prototype.invertSelected = function() {
        var toDeselect, toSelect;
        toSelect = this.$list.find(":not(.item.selected)");
        toDeselect = this.$list.find(".item.selected");
        toSelect.trigger("select");
        return toDeselect.trigger("deselect");
      };

      List.prototype.toggleVisibility = function() {
        this.$header.find(".maximize, .minimize").toggle();
        if (this.$el.attr("class") == null) {
          this.$el.attr("class", "");
        }
        return this.$el.toggleClass("minimized", 100);
      };

      List.prototype.sortByField = function(event) {
        var dir, field, old_field;
        field = $(event.target).attr("data-sort-by");
        if (field != null) {
          old_field = this.sortingBy;
          this.sortingDirection || (this.sortingDirection = {});
          this.sortingBy = field;
          if (field === old_field && field in this.sortingDirection) {
            this.sortingDirection[field] *= -1;
          } else {
            this.sortingDirection[field] = 1;
          }
          dir = this.sortingDirection[field];
          this.sortCollection(field, dir);
          return this.updateHeaderArrows(field, old_field);
        }
      };

      List.prototype.sortCollection = function(field, dir) {
        var _this = this;
        if (this.collection.remoteSort) {
          return this.collection.trigger('remoteSort', field, dir);
        } else {
          this.collection.comparator = function(ma, mb) {
            var a, b, da, db;
            a = ma.get(field);
            da = _this.displayAttributeMap[field];
            if (da.map != null) {
              a = da.map(a);
            }
            b = mb.get(field);
            db = _this.displayAttributeMap[field];
            if (db.map != null) {
              b = db.map(b);
            }
            if ((a != null ? a.toLowerCase : void 0) != null) {
              a = a.toLowerCase();
            }
            if ((b != null ? b.toLowerCase : void 0) != null) {
              b = b.toLowerCase();
            }
            if (a === b) {
              return 0;
            }
            if (a > b || !(b != null)) {
              return +1 * dir;
            }
            if (a < b || !(a != null)) {
              return -1 * dir;
            }
          };
          return this.collection.sort();
        }
      };

      List.prototype.updateHeaderArrows = function(field, old_field) {
        var dir, el, label, old_el, old_label, re, _ref, _ref1, _ref2;
        if (this.collection == null) {
          return;
        }
        re = new RegExp(" (" + (_.values(this.sortArrows).join("|")) + ")$|$");
        dir = (_ref = this.sortingDirection[field]) != null ? _ref : 1;
        if (old_field != null) {
          old_el = this.$header.find("[data-sort-by='" + old_field + "']");
          old_label = (_ref1 = old_el.html()) != null ? _ref1.replace(re, "") : void 0;
          $(old_el).html(old_label);
        }
        el = this.$header.find("[data-sort-by='" + field + "']");
        label = (_ref2 = $(el).html()) != null ? _ref2.replace(re, " " + this.sortArrows[dir]) : void 0;
        return $(el).html(label);
      };

      List.prototype.initializeHotKeys = function() {
        var hotkey, hotkeys, _base, _i, _len, _ref, _results,
          _this = this;
        if ((_ref = (_base = this.constructor).keyboardManager) == null) {
          _base.keyboardManager = new Ribs.KeyboardManager();
        }
        this.keyboardManager = this.constructor.keyboardManager;
        this.keyboardNamespace = this.keyboardManager.registerView(this, this.plural());
        if (this.jumpkey != null) {
          this.keyboardManager.registerJumpKey({
            label: this.plural(),
            jumpkey: this.jumpkey,
            context: this,
            callback: function() {
              return _this.$(_this.jumpSelector).focus();
            },
            precondition: function() {
              return _this.$el.is(":visible");
            }
          });
        }
        hotkeys = [
          {
            hotkey: "j",
            label: "Focus next item",
            callback: function() {
              return $(document.activeElement).nextAll(".item:visible:not(.disabled):first").focus();
            }
          }, {
            hotkey: "J",
            label: "Focus last item",
            callback: function() {
              return _this.$list.find(".item:last").focus();
            }
          }, {
            hotkey: "k",
            label: "Focus previous item",
            callback: function() {
              return $(document.activeElement).prevAll(".item:visible:not(.disabled):first").focus();
            }
          }, {
            hotkey: "K",
            label: "Focus first item",
            callback: function() {
              return _this.$list.find(".item:first").focus();
            }
          }, {
            hotkey: "x",
            label: "Select/deselect item",
            callback: function() {
              return _this.toggleFocussedSelected();
            }
          }, {
            hotkey: "X",
            label: "Select/deselect all",
            callback: function() {
              return _this.toggleSelected();
            }
          }, {
            hotkey: "_",
            label: "Expand/collapse list",
            callback: function() {
              return _this.toggleVisibility();
            }
          }, {
            hotkey: "R",
            label: "Refresh items",
            callback: function() {
              return _this.refresh();
            }
          }
        ];
        _results = [];
        for (_i = 0, _len = hotkeys.length; _i < _len; _i++) {
          hotkey = hotkeys[_i];
          hotkey.namespace = this.keyboardNamespace;
          _results.push(this.keyboardManager.registerHotKey(hotkey));
        }
        return _results;
      };

      List.prototype.keypressed = function(event) {
        this.trigger("keypressed", event);
        return this.keyboardManager.handleKeypress(event, this.keyboardNamespace);
      };

      List.prototype.refresh = function() {
        var _this = this;
        if (this.collection.url != null) {
          this.trigger('refresh');
          return this.collection.fetch({
            success: function() {
              var _ref;
              return (_ref = _this.$list.find(".item:first")) != null ? _ref.focus() : void 0;
            }
          });
        }
      };

      List.prototype.focusin = function(event) {
        var _ref;
        if (!this.focussed) {
          this.focussed = true;
        }
        this.$el.addClass("focussed");
        return (_ref = this.collection) != null ? _ref.trigger("focusin") : void 0;
      };

      List.prototype.focusout = function(event) {
        var _this = this;
        if (this.focussed) {
          return setTimeout(function() {
            var _ref;
            if (_this.$(document.activeElement).length === 0) {
              _this.$el.removeClass("focussed");
            }
            _this.focussed = false;
            return (_ref = _this.collection) != null ? _ref.trigger("focusout") : void 0;
          }, 10);
        }
      };

      List.prototype.plural = function() {
        var _ref;
        return (_ref = this.itemNamePlural) != null ? _ref : this.itemName + "s";
      };

      List.prototype.initializeTitle = function() {
        var $title, title, _ref;
        title = (_ref = this.title) != null ? _ref : this.plural();
        if (title instanceof Function) {
          title = title.call(this);
        }
        $title = $($.el.h1({
          "class": "title"
        }, title));
        return $title;
      };

      List.prototype.initializeActions = function() {
        var $batchActions,
          _this = this;
        this.batchActions = [];
        this.inlineActions = [];
        this.allActions = [];
        $batchActions = $($.el.ul({
          "class": "actions"
        }));
        _.each(this.actions, function(actionConfig) {
          var action;
          actionConfig.collection = _this.collection;
          actionConfig.view = _this;
          if (actionConfig.inline) {
            _this.inlineActions.push(actionConfig);
          }
          if (actionConfig.batch !== false) {
            action = new Ribs.Action(actionConfig);
            _this.batchActions.push(action);
            _this.allActions.push(action);
            action.render();
            $batchActions.append(action.el);
          }
          if (actionConfig.hotkey) {
            return _this.keyboardManager.registerHotKey({
              hotkey: actionConfig.hotkey,
              label: actionConfig.label,
              namespace: _this.keyboardNamespace,
              context: actionConfig,
              precondition: actionConfig.allowed,
              callback: function() {
                return actionConfig.activate.call(_this, _this.getSelected());
              }
            });
          }
        });
        if (this.batchActions.length) {
          return $batchActions;
        } else {
          return null;
        }
      };

      List.prototype.initializeList = function() {
        var $list;
        $list = $($.el.ul({
          "class": "list"
        }));
        return $list;
      };

      List.prototype.addItem = function(model) {
        var idx, itemView, view, _ref;
        if (Backbone.View.prototype.isPrototypeOf(this.itemView.prototype)) {
          itemView = this.itemView;
        } else {
          itemView = this.itemView(model);
        }
        view = new itemView({
          model: model,
          view: this
        });
        idx = this.collection.indexOf(model);
        if ((_ref = this.$list.children().size()) === 0 || _ref === idx) {
          this.$list.append(view.el);
        } else {
          this.$list.children(":nth-child(" + (idx + 1) + ")").before(view.el);
        }
        view.delegateEvents();
        if (this.$el.is(":visible")) {
          view.render();
        }
        this._subviews.push(view);
        if (this.selectedByDefault) {
          return view.select();
        }
      };

      List.prototype.addAllItems = function() {
        var _ref;
        this._subviews = [];
        this.$list.empty();
        if ((_ref = this.collection) != null) {
          _ref.each(this.addItem, this);
        }
        return this.trigger("rendered");
      };

      List.prototype.get = function(id) {
        return _.find(this._subviews, function(view) {
          return view.model.id === id;
        });
      };

      List.prototype.getByCid = function(cid) {
        return _.find(this._subviews, function(view) {
          return view.model.cid === cid;
        });
      };

      List.prototype.initializeHeader = function() {
        var $header, attributes, toggle,
          _this = this;
        $header = $($.el.div({
          "class": "header"
        }));
        if (!this.suppressToggle) {
          toggle = $.el.input({
            type: "checkbox",
            tabindex: -1
          });
          if (this.selectedByDefault) {
            $(toggle).attr("checked", "checked");
          }
          $header.append($.el.div({
            "class": "toggle"
          }, toggle));
        }
        if (this.displayAttributes == null) {
          attributes = _.map(this.collection.first().toJSON(), function(v, k) {
            return {
              field: k
            };
          });
        }
        this.displayAttributeMap = {};
        _.each(this.displayAttributes, function(attribute) {
          var klass, label, _ref, _ref1;
          _this.displayAttributeMap[attribute.field] = attribute;
          label = (_ref = attribute.label) != null ? _ref : attribute.field;
          klass = (_ref1 = attribute["class"]) != null ? _ref1 : attribute.field;
          return $header.append($.el.div({
            "class": klass,
            "data-sort-by": attribute.sortField || attribute.field
          }, label));
        });
        $header.find(".maximize, .minimize").click(function() {
          return _this.toggleVisibility();
        });
        $header.find("[data-sort-by=" + this.sortingBy + "]").append(" " + this.sortArrows[1]);
        return $header;
      };

      List.prototype.updateHeader = function() {
        var isChecked, isTransparent, l, n, opacity;
        n = this.getNumSelected();
        l = this.getNumTotal();
        if (n >= l) {
          this.selectedByDefault = true;
        }
        if (n === 0) {
          this.selectedByDefault = false;
        }
        isChecked = n !== 0;
        isTransparent = isChecked && n < l;
        opacity = isTransparent ? 0.5 : 1;
        return this.$header.find(".toggle input").attr("checked", isChecked).css("opacity", opacity);
      };

      List.prototype.initializeFooter = function() {
        var $footer;
        $footer = $($.el.div({
          "class": "footer"
        }));
        return $footer;
      };

      List.prototype.updateFooter = function() {
        var plural, word;
        plural = this.getNumTotal() !== 1;
        word = plural ? this.plural() : this.itemName;
        return this.$footer.text("" + (this.getNumSelected()) + " / " + (this.getNumTotal()) + " " + word + " selected");
      };

      return List;

    })(Backbone.View);
    Ribs.Action = (function(_super) {

      __extends(Action, _super);

      Action.prototype.tagName = "li";

      Action.prototype.className = "action";

      Action.prototype._ribsEvents = {
        'click': 'activate',
        'keypress': 'keypressed'
      };

      function Action(options) {
        this.events || (this.events = {});
        _.extend(this.events, this._ribsEvents);
        Action.__super__.constructor.call(this, options);
        this.options = _.extend({
          min: 1,
          max: -1,
          arity: null,
          check: null
        }, options);
        this.view = options.view;
        if (this.collection != null) {
          this.setCollection(this.collection);
        }
      }

      Action.prototype.setCollection = function(collection) {
        if (collection != null) {
          this.collection = collection;
          this.collection.off("selected deselected reset", null, this);
          this.collection.on("selected deselected reset", this.checkRequirements, this);
        }
        return this.checkRequirements();
      };

      Action.prototype.checkRequirements = function() {
        var enable;
        enable = this.allowed();
        if (!enable) {
          this.disable();
        }
        if (enable) {
          return this.enable();
        }
      };

      Action.prototype.allowed = function() {
        var a, allow, l, r1, r2, r3;
        l = this.getNumSelected();
        allow = false;
        if (this.options.arity != null) {
          a = this.options.arity;
          r1 = a === l;
          r2 = a === -1;
          r3 = !!(a % 1) && l >= Math.floor(a);
          allow = r1 || r2 || r3;
        } else {
          r1 = this.options.min === -1 || l >= this.options.min;
          r2 = this.options.max === -1 || l <= this.options.max;
          allow = r1 && r2;
        }
        if (allow && (this.options.check != null)) {
          allow = this.options.check.apply(this.view, [this.getSelected()]);
        }
        return allow;
      };

      Action.prototype.getSelected = function() {
        return this.view.getSelected();
      };

      Action.prototype.getNumSelected = function() {
        return this.view.getNumSelected();
      };

      Action.prototype.disable = function() {
        this.$el.addClass("disabled");
        return this.$(".button").attr("tabindex", -1);
      };

      Action.prototype.enable = function() {
        this.$el.removeClass("disabled");
        return this.$(".button").attr("tabindex", 0);
      };

      Action.prototype.render = function() {
        var btn, label, tabindex, _ref;
        label = (_ref = this.options.batchLabel) != null ? _ref : this.options.label;
        if (this.options.hotkey != null) {
          label = this.constructor.highlightHotkey(label, this.options.hotkey);
        }
        tabindex = this.$el.is(".disabled") ? -1 : 0;
        btn = $.el.div({
          "class": "button",
          tabindex: tabindex,
          title: this.options.label
        });
        $(btn).html(label);
        return this.$el.html(btn);
      };

      Action.prototype.activate = function() {
        return this.options.activate.call(this.view, this.getSelected());
      };

      Action.prototype.keypressed = function(event) {
        if (event.which === 13) {
          this.activate();
          return false;
        }
      };

      Action.highlightHotkey = function(label, hotkey) {
        var char, new_label;
        char = hotkey;
        new_label = label.replace(char, "<span class='hotkey'><strong>" + char + "</strong></span>");
        if (label === new_label) {
          new_label = "" + label + " <span class='hotkey'>[<strong>" + char + "</strong>]</span>";
        }
        return new_label;
      };

      return Action;

    })(Backbone.View);
    Ribs.InlineAction = (function(_super) {

      __extends(InlineAction, _super);

      function InlineAction() {
        return InlineAction.__super__.constructor.apply(this, arguments);
      }

      InlineAction.prototype.getSelected = function() {
        var _ref;
        return [(_ref = this.options.listItem) != null ? _ref.model : void 0];
      };

      InlineAction.prototype.getNumSelected = function() {
        return 1;
      };

      InlineAction.prototype.render = function() {
        var btn, label, tabindex, _ref;
        tabindex = 0;
        label = (_ref = this.options.inlineLabel) != null ? _ref : this.options.label;
        if (label instanceof Function) {
          label = label.call(this, this.options.listItem.model);
        }
        btn = $.el.div({
          "class": "inline button",
          tabindex: tabindex,
          title: this.label
        }, label);
        return this.$el.html(btn);
      };

      return InlineAction;

    })(Ribs.Action);
    Ribs.ListItem = (function(_super) {

      __extends(ListItem, _super);

      ListItem.prototype.tagName = "li";

      ListItem.prototype.className = "item";

      ListItem.prototype.attributes = {
        tabindex: 0
      };

      ListItem.prototype._ribsEvents = {
        'click': 'toggle',
        'toggle': 'toggle',
        'select': 'select',
        'deselect': 'deselect',
        'click a': 'stopPropogation'
      };

      function ListItem(options) {
        var attribute, _i, _len, _ref;
        this.events || (this.events = {});
        _.extend(this.events, this._ribsEvents);
        this.view = options != null ? options.view : void 0;
        this.listItemCells = [];
        _ref = this.view.displayAttributes;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          attribute = _ref[_i];
          attribute = _.clone(attribute);
          attribute.view = this;
          attribute.model = options.model;
          this.listItemCells.push(new Ribs.ListItemCell(attribute));
        }
        ListItem.__super__.constructor.call(this, options);
        if (this.model != null) {
          this.model.on('change', this.render, this);
          this.model.on('remove', this.remove, this);
          this.model.on('stealfocus', this.stealfocus, this);
        }
      }

      ListItem.prototype.render = function() {
        var action, cell, inlineAction, key, obj, options, toggle, ul, _i, _len, _ref, _ref1;
        this.$el.empty();
        if (!this.model) {
          return;
        }
        this.$el.data("cid", this.model.cid);
        if (!this.view.suppressToggle) {
          toggle = $.el.input({
            type: "checkbox",
            tabindex: -1
          });
          if (this.$el.is(".selected")) {
            $(toggle).attr("checked", true);
          }
          this.$el.append($.el.div({
            "class": "toggle"
          }, toggle));
        }
        _ref = this.listItemCells;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          cell = _ref[_i];
          cell.render();
          cell.delegateEvents();
          this.$el.append(cell.el);
        }
        obj = this.model.toJSON();
        ul = $.el.ul({
          "class": "actions"
        });
        _ref1 = this.view.inlineActions;
        for (key in _ref1) {
          action = _ref1[key];
          if (!((action.filter != null) && action.filter(this.model) === false)) {
            options = _.extend(action, {
              listItem: this
            });
            inlineAction = new Ribs.InlineAction(options);
            inlineAction.render();
            $(ul).append(inlineAction.el);
          }
        }
        return this.$el.append(ul);
      };

      ListItem.prototype.toggle = function() {
        if (!this.$el.is(".disabled")) {
          if (this.$el.is(".selected")) {
            return this.deselect();
          } else {
            return this.select();
          }
        }
      };

      ListItem.prototype.stopPropogation = function(e) {
        return e.stopImmediatePropagation();
      };

      ListItem.prototype.select = function(event, options) {
        if (options == null) {
          options = {};
        }
        if (this.view.suppressToggle) {
          return;
        }
        this.$el.addClass("selected");
        this.$("input:checkbox").attr("checked", "checked");
        if (!options.silent) {
          return this.model.trigger("selected");
        }
      };

      ListItem.prototype.deselect = function(event, options) {
        if (options == null) {
          options = {};
        }
        if (this.view.suppressToggle) {
          return;
        }
        this.$el.removeClass("selected");
        this.$("input:checkbox").removeAttr("checked");
        if (!options.silent) {
          return this.model.trigger("deselected");
        }
      };

      ListItem.prototype.enable = function() {
        this.$el.removeClass("disabled");
        this.$("input:checkbox").removeAttr("disabled");
        this.$el.attr("tabindex", 0);
        return this.model.trigger("enabled");
      };

      ListItem.prototype.disable = function() {
        this.$el.addClass("disabled");
        this.$("input:checkbox").attr("disabled", "disabled");
        this.$el.attr("tabindex", -1);
        return this.model.trigger("disabled");
      };

      ListItem.prototype.remove = function() {
        this.deselect();
        return ListItem.__super__.remove.call(this);
      };

      ListItem.prototype.stealfocus = function() {
        return this.$el.focus();
      };

      return ListItem;

    })(Backbone.View);
    Ribs.ListItemCell = (function(_super) {

      __extends(ListItemCell, _super);

      ListItemCell.prototype.tagName = "div";

      ListItemCell.prototype.className = "cell";

      ListItemCell.prototype._ribsEvents = {
        'click .edit': 'edit',
        'blur .editableField': 'saveEditedField'
      };

      function ListItemCell(options) {
        var _ref;
        this.events || (this.events = {});
        _.extend(this.events, this._ribsEvents);
        _.extend(this, options);
        ListItemCell.__super__.constructor.call(this, options);
        this.$el.addClass((_ref = this.options["class"]) != null ? _ref : this.options.field);
        this.model.on("change change:" + this.options.field, this.render, this);
      }

      ListItemCell.prototype.renderableValue = function(nomap) {
        var value;
        value = this.model.get(this.options.field);
        if ((this.options.map != null) && !nomap) {
          value = this.options.map(value, this.model, this.$el);
        }
        return value;
      };

      ListItemCell.prototype.render = function() {
        var editableEl, label, _ref, _ref1;
        this.$el.empty();
        if (this.options.escape) {
          this.$el.text(this.renderableValue());
        } else {
          this.$el.html(this.renderableValue());
        }
        if (this.editable) {
          label = (_ref = this.options.label) != null ? _ref : this.options.field;
          editableEl = $.el.span({
            "class": 'edit button inline',
            title: "Edit " + label
          }, '✎');
          if ((_ref1 = this.model.get(this.options.field)) === null || _ref1 === '') {
            $(editableEl).addClass('show');
          } else {
            $(editableEl).removeClass('show');
          }
          this.$el.append(editableEl);
        }
        return this;
      };

      ListItemCell.prototype.edit = function() {
        var editField, value;
        if (this.options.editable) {
          value = this.model.get(this.options.field);
          if (this.options.editable instanceof Function) {
            editField = this.options.editable.call(this, value, this.model);
          } else {
            editField = $.el.input({
              type: 'text',
              value: value
            });
          }
          if (editField) {
            $(editField).addClass("editableField");
            this.$el.html(editField);
            this.delegateEvents();
            $(editField).focus();
          }
        }
        return false;
      };

      ListItemCell.prototype.saveEditedField = function(e) {
        var changeSet, field, value;
        field = $(e.target);
        value = field.val();
        changeSet = {};
        changeSet[this.options.field] = value;
        try {
          return this.model.save(changeSet, {
            wait: true
          });
        } catch (e) {
          return this.render();
        }
      };

      return ListItemCell;

    })(Backbone.View);
    Ribs.KeyboardManager = (function() {

      KeyboardManager.prototype.boundCharCodes = {};

      KeyboardManager.prototype.registeredViews = {
        global: {
          bindings: [],
          tree: {},
          label: "Global",
          context: window
        }
      };

      KeyboardManager.prototype.options = {
        jumpPrefixKey: "g",
        jumpTime: 1000,
        enableKeyboardShortcuts: true
      };

      function KeyboardManager(options) {
        var _this = this;
        this.options = _.extend(this.options, options);
        this.registerHotKey({
          hotkey: "?",
          callback: this.showKeyboardBindings,
          context: this,
          label: "Show hotkeys"
        });
        $(window).on("keypress", function(e) {
          return _this.handleKeypress(e);
        });
      }

      KeyboardManager.prototype.registerView = function(view, label) {
        var namespace;
        namespace = _.uniqueId("view");
        this.registeredViews[namespace] = {
          label: label,
          context: view,
          tree: {},
          bindings: []
        };
        return namespace;
      };

      KeyboardManager.prototype.registerHotKey = function(options) {
        var code, i, key, ns, _i, _len, _ref, _ref1, _ref2, _ref3;
        if ((_ref = options.charCodes) == null) {
          options.charCodes = (function() {
            var _i, _len, _ref1, _results;
            _ref1 = options.hotkey.split("");
            _results = [];
            for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
              key = _ref1[_i];
              _results.push(key.charCodeAt(0));
            }
            return _results;
          })();
        }
        ns = (_ref1 = options.namespace) != null ? _ref1 : options.namespace = "global";
        root = this.registeredViews[ns].tree;
        _ref2 = options.charCodes;
        for (i = _i = 0, _len = _ref2.length; _i < _len; i = ++_i) {
          code = _ref2[i];
          if ((_ref3 = root[code]) == null) {
            root[code] = {
              bindings: [],
              upcoming: 0
            };
          }
          if (i === options.charCodes.length - 1) {
            root[code].bindings.push(options);
          } else {
            root[code].upcoming += 1;
          }
          root = root[code];
        }
        this.registeredViews[ns].bindings.push(options);
        return ns;
      };

      KeyboardManager.prototype.registerJumpKey = function(options) {
        options.label = "Go to " + options.label;
        options.hotkey = this.options.jumpPrefixKey + options.jumpkey;
        return this.registerHotKey(options);
      };

      KeyboardManager.prototype.handleKeypress = function(event, namespace) {
        var context, _ref;
        if (namespace == null) {
          namespace = "global";
        }
        if (!this.options.enableKeyboardShortcuts) {
          return;
        }
        if ($(document.activeElement).is(":input")) {
          return;
        }
        context = (_ref = this.currentContext) != null ? _ref : this.registeredViews[namespace].tree;
        if (context != null) {
          return this.execute(context, event.which);
        }
      };

      KeyboardManager.prototype.execute = function(context, charCode) {
        var binding, ctx, _i, _len, _ref, _ref1,
          _this = this;
        if (this.timeout) {
          clearTimeout(this.timeout);
        }
        delete this.currentContext;
        if (!(charCode in context)) {
          return;
        }
        context = context[charCode];
        if (context.upcoming === 0) {
          _ref = context.bindings;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            binding = _ref[_i];
            ctx = (_ref1 = binding.context) != null ? _ref1 : this.registeredViews[binding.namespace].context;
            if (!(binding.precondition && !binding.precondition.call(ctx))) {
              binding.callback.call(ctx);
            }
          }
        } else {
          this.currentContext = context;
          this.timeout = setTimeout(function() {
            return _this.execute(context);
          }, this.options.jumpTime);
        }
        return false;
      };

      KeyboardManager.prototype.showKeyboardBindings = function() {
        var view, _ref;
        if ((_ref = this.constructor.view) != null) {
          _ref.$el.remove();
        }
        view = this.constructor.view = new Ribs.KeyboardHelpView({
          views: this.registeredViews,
          hotkeys: this.boundCharCodes
        });
        view.render();
        return $("body").append(view.el);
      };

      return KeyboardManager;

    })();
    return Ribs.KeyboardHelpView = (function(_super) {

      __extends(KeyboardHelpView, _super);

      function KeyboardHelpView() {
        return KeyboardHelpView.__super__.constructor.apply(this, arguments);
      }

      KeyboardHelpView.prototype.className = "ribs-keyboard-shortcuts-overlay";

      KeyboardHelpView.prototype.events = {
        'click': "remove"
      };

      KeyboardHelpView.prototype.initialize = function(options) {
        return $(window).bind('keyup', function(event) {
          if (event.which === 27) {
            this.remove();
          }
          return false;
        });
      };

      KeyboardHelpView.prototype.render = function() {
        var binding, h1, li, namespace, ul, view, _ref, _results;
        this.$el.empty();
        _ref = this.options.views;
        _results = [];
        for (namespace in _ref) {
          view = _ref[namespace];
          if (!$(view.el).is(":hidden")) {
            h1 = $.el.h1(view.label);
            ul = $.el.ul();
            this.$el.append(h1, ul);
            _results.push((function() {
              var _i, _len, _ref1, _results1;
              _ref1 = view.bindings;
              _results1 = [];
              for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
                binding = _ref1[_i];
                li = $.el.li({
                  "class": "hotkey"
                }, $.el.span({
                  "class": "key"
                }, binding.hotkey), $.el.span({
                  "class": "action"
                }, binding.label));
                _results1.push($(ul).append(li));
              }
              return _results1;
            })());
          } else {
            _results.push(void 0);
          }
        }
        return _results;
      };

      return KeyboardHelpView;

    })(Backbone.View);
  })(jQuery);

}).call(this);
