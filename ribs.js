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

      List.prototype._ribsOptions = ["displayAttributes", "actions", "itemView"];

      List.prototype.jumpSelector = ".list li:first";

      List.prototype.focussed = false;

      List.prototype.selectedByDefault = false;

      List.prototype.stopPropogation = function(e) {
        return e.preventDefault();
      };

      List.prototype.renderOrder = ["Title", "Actions", "Header", "List", "Footer"];

      function List(options) {
        var k, _i, _len, _ref, _ref1, _ref2;
        this.sortArrows = {};
        this.sortArrows[-1] = "↓";
        this.sortArrows[1] = "↑";
        if ((_ref = this.itemView) == null) {
          this.itemView = Ribs.ListItem;
        }
        if ((_ref1 = this.actionView) == null) {
          this.actionView = Ribs.BatchAction;
        }
        this.events = _.extend({}, this.events, this._ribsEvents);
        this.sortingDirection = {};
        this.sortingBy = "id";
        List.__super__.constructor.call(this, options);
        _ref2 = this._ribsOptions;
        for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
          k = _ref2[_i];
          if (options[k] != null) {
            this[k] = options[k];
          }
        }
        this.initializeHotKeys();
        this.$el.addClass('ribs');
        this.build();
      }

      List.prototype.build = function() {
        var l, t, _i, _len, _ref;
        this.$el.empty();
        _ref = this.renderOrder;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          t = _ref[_i];
          l = t.replace(/^./, "$" + (t[0].toLowerCase()));
          if (!this["suppress" + t]) {
            this[l] = this["initialize" + t]();
          }
          this.$el.append(this[l]);
        }
        if (this.collection != null) {
          return this.setCollection(this.collection);
        }
      };

      List.prototype.render = function() {
        var t, _i, _len, _ref, _results;
        _ref = this.renderOrder;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          t = _ref[_i];
          if (!this["suppress" + t]) {
            _results.push(this["render" + t]());
          } else {
            _results.push(void 0);
          }
        }
        return _results;
      };

      List.prototype.setCollection = function(collection) {
        var fn, t, _i, _len, _ref;
        this.collection = collection;
        this.collection.off("selected deselected sort reset add remove", null, this);
        this.collection.on("add", this.addItem, this);
        this.collection.on("sort reset", this.addAllItems, this);
        _ref = ["Actions", "Footer", "Header"];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          t = _ref[_i];
          fn = this["render" + t];
          if (!this["suppress" + t] && _.isFunction(fn)) {
            this.collection.on("selected deselected add remove", fn, this);
          }
        }
        this.collection.on("reset", this.render, this);
        this.addAllItems();
        if (!this.suppressHeader) {
          return this.updateHeaderArrows(this.sortingBy);
        }
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
        if ((field != null) && (this.collection != null)) {
          old_field = this.sortingBy;
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
        var dir, el, re, _ref;
        re = new RegExp(" (" + (_.values(this.sortArrows).join("|")) + ")$|$");
        dir = (_ref = this.sortingDirection[field]) != null ? _ref : 1;
        if (old_field != null) {
          this.$header.find("[data-sort-by='" + old_field + "'] .arrow").remove();
        }
        el = $("<span />", {
          "class": "arrow",
          text: this.sortArrows[dir]
        });
        return this.$header.find("[data-sort-by='" + field + "']").append(el);
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
        this._listSubviews.push(view);
        if (this.selectedByDefault) {
          return view.select();
        }
      };

      List.prototype.addAllItems = function() {
        var _ref;
        this._listSubviews = [];
        this.$list.empty();
        return (_ref = this.collection) != null ? _ref.each(this.addItem, this) : void 0;
      };

      List.prototype.get = function(id) {
        return _.find(this._listSubviews, function(view) {
          return view.model.id === id;
        });
      };

      List.prototype.getByCid = function(cid) {
        return _.find(this._listSubviews, function(view) {
          return view.model.cid === cid;
        });
      };

      List.prototype.initializeTitle = function() {
        var $title, title, _ref;
        title = (_ref = this.title) != null ? _ref : this.plural();
        if (_.isFunction(title)) {
          title = title.call(this);
        }
        $title = $("<h1 />", {
          "class": "title",
          text: title
        });
        return $title;
      };

      List.prototype.renderTitle = function() {};

      List.prototype.initializeActions = function() {
        var $batchActions,
          _this = this;
        this.batchActions = [];
        this.inlineActions = [];
        this.allActions = [];
        this._actionSubviews = [];
        $batchActions = $("<ul/>", {
          "class": "actions"
        });
        _.each(this.actions, function(actionConfig) {
          var action, view;
          action = new Ribs.Action(actionConfig, {
            view: _this
          });
          _this.allActions.push(action);
          if (actionConfig.inline) {
            _this.inlineActions.push(action);
          }
          if (actionConfig.batch !== false) {
            _this.batchActions.push(action);
            view = new _this.actionView({
              model: action
            });
            _this._actionSubviews.push(view);
            $batchActions.append(view.el);
            return view.render();
          }
        });
        return $batchActions;
      };

      List.prototype.renderActions = function() {
        var view, _i, _len, _ref, _results;
        _ref = this._actionSubviews;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          view = _ref[_i];
          _results.push(view.render());
        }
        return _results;
      };

      List.prototype.initializeList = function() {
        var $list;
        $list = $("<ul/>", {
          "class": "list"
        });
        return $list;
      };

      List.prototype.renderList = function() {
        var view, _i, _len, _ref, _results;
        _ref = this._listSubviews;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          view = _ref[_i];
          _results.push(view.render());
        }
        return _results;
      };

      List.prototype.initializeHeader = function() {
        var $header, attributes, toggle,
          _this = this;
        $header = $("<div />", {
          "class": "header"
        });
        if (!this.suppressToggle) {
          toggle = $("<input />", {
            type: "checkbox",
            tabindex: -1,
            checked: this.selectedByDefault
          });
          $header.append($("<div />", {
            "class": "toggle",
            html: toggle
          }));
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
          var field, klass, label, _ref, _ref1;
          _this.displayAttributeMap[attribute.field] = attribute;
          label = (_ref = attribute.label) != null ? _ref : attribute.field;
          klass = (_ref1 = attribute["class"]) != null ? _ref1 : attribute.field;
          field = $("<div/>", {
            "class": klass,
            "data-sort-by": attribute.sortField || attribute.field
          });
          field.append(label);
          return $header.append(field);
        });
        return $header;
      };

      List.prototype.renderHeader = function() {
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
        $footer = $("<div/>", {
          "class": "footer"
        });
        return $footer;
      };

      List.prototype.renderFooter = function() {
        var plural, word;
        plural = this.getNumTotal() !== 1;
        word = plural ? this.plural() : this.itemName;
        return this.$footer.text("" + (this.getNumSelected()) + " / " + (this.getNumTotal()) + " " + word + " selected");
      };

      return List;

    })(Backbone.View);
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
        var attribute, _i, _len, _ref, _ref1, _ref2;
        this.events || (this.events = {});
        _.extend(this.events, this._ribsEvents);
        if ((_ref = this.itemCellView) == null) {
          this.itemCellView = Ribs.ListItemCell;
        }
        if ((_ref1 = this.actionView) == null) {
          this.actionView = Ribs.InlineAction;
        }
        this.view = options != null ? options.view : void 0;
        this.listItemCells = [];
        _ref2 = this.view.displayAttributes;
        for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
          attribute = _ref2[_i];
          attribute = _.clone(attribute);
          attribute.view = this;
          attribute.model = options.model;
          this.listItemCells.push(new this.itemCellView(attribute));
        }
        ListItem.__super__.constructor.call(this, options);
        if (this.model != null) {
          this.model.on('change', this.render, this);
          this.model.on('remove', this.remove, this);
        }
      }

      ListItem.prototype.render = function() {
        var action, cell, div, inlineAction, key, obj, toggle, ul, _i, _len, _ref, _ref1;
        this.$el.empty();
        if (!this.model) {
          return;
        }
        this.$el.data("cid", this.model.cid);
        if (!this.view.suppressToggle) {
          toggle = $("<input/>", {
            type: "checkbox",
            tabindex: -1
          });
          if (this.$el.is(".selected")) {
            $(toggle).attr("checked", true);
          }
          div = $("<div/>", {
            "class": "toggle"
          });
          div.append(toggle);
          this.$el.append(div);
        }
        _ref = this.listItemCells;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          cell = _ref[_i];
          cell.render();
          cell.delegateEvents();
          this.$el.append(cell.el);
        }
        obj = this.model.toJSON();
        ul = $("<ul/>", {
          "class": "actions"
        });
        _ref1 = this.view.inlineActions;
        for (key in _ref1) {
          action = _ref1[key];
          if (!((action.filter != null) && action.filter(this.model) === false)) {
            inlineAction = new this.actionView({
              model: action,
              listItem: this
            });
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
          editableEl = $("<span/>", {
            "class": 'edit button inline',
            title: "Edit " + label,
            text: '✎'
          });
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
        var editField, key, option, optionEl, value, _i, _len, _ref, _ref1;
        if (this.options.editable) {
          value = this.model.get(this.options.field);
          if (_.isFunction(this.options.editable)) {
            editField = $(this.options.editable.call(this, value, this.model));
          } else if (_.isArray(this.options.editable)) {
            editField = $("<select/>");
            _ref = this.options.editable;
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              option = _ref[_i];
              optionEl = $("<option/>", {
                value: option,
                text: option,
                selected: options === value
              });
              editField.append(optionEl);
            }
          } else if (_.isObject(this.options.editable)) {
            editField = $("<select/>");
            _ref1 = this.options.editable;
            for (key in _ref1) {
              option = _ref1[key];
              optionEl = $("<option/>", {
                value: key,
                text: option,
                selected: key === value
              });
              editField.append(optionEl);
            }
          } else {
            editField = $("<input/>", {
              type: 'text',
              value: value
            });
          }
          if (editField) {
            editField.addClass("editableField");
            this.$el.html(editField);
            this.delegateEvents();
            editField.focus();
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
    Ribs.Action = (function(_super) {

      __extends(Action, _super);

      function Action() {
        return Action.__super__.constructor.apply(this, arguments);
      }

      Action.prototype.defaults = {
        min: 1,
        max: -1,
        arity: null,
        check: null
      };

      Action.prototype.initialize = function(attributes, options) {
        var _this = this;
        this.ribs = options.view;
        return this.ribs.keyboardManager.registerHotKey({
          hotkey: this.get("hotkey"),
          label: this.get("label"),
          namespace: this.ribs.keyboardNamespace,
          context: this,
          precondition: this.allowed,
          callback: function() {
            return _this.activate();
          }
        });
      };

      Action.prototype.allowed = function(selected) {
        var a, allow, l, r1, r2;
        if (selected == null) {
          selected = this.getSelected();
        }
        l = selected.length;
        allow = false;
        if (this.get("arity") != null) {
          a = this.get("arity");
          r1 = a === l;
          r2 = a === -1;
          allow = r1 || r2;
        } else {
          r1 = this.get("min") === -1 || l >= this.get("min");
          r2 = this.get("max") === -1 || l <= this.get("max");
          allow = r1 && r2;
        }
        if (allow && (this.get("check") != null)) {
          allow = this.get("check").call(this.ribs, selected);
        }
        return allow;
      };

      Action.prototype.activate = function(selected) {
        if (selected == null) {
          selected = this.getSelected();
        }
        return this.get("activate").call(this.ribs, selected);
      };

      Action.prototype.getSelected = function() {
        return this.ribs.getSelected();
      };

      return Action;

    })(Backbone.Model);
    Ribs.BatchAction = (function(_super) {

      __extends(BatchAction, _super);

      function BatchAction() {
        return BatchAction.__super__.constructor.apply(this, arguments);
      }

      BatchAction.prototype.tagName = "li";

      BatchAction.prototype.className = "action";

      BatchAction.prototype.events = {
        'click': 'activate',
        'keypress': 'keypressed'
      };

      BatchAction.prototype.render = function() {
        var btn, label;
        label = this.label();
        btn = $("<div/>", {
          "class": "button",
          title: label,
          html: label
        });
        this.$el.html(btn);
        return this.checkRequirements();
      };

      BatchAction.prototype.label = function() {
        var label, _ref;
        label = (_ref = this.model.get("batchLabel")) != null ? _ref : this.model.get("label");
        if (this.model.has("hotkey")) {
          label = this.constructor.highlightHotkey(label, this.model.get("hotkey"));
        }
        return label;
      };

      BatchAction.prototype.getSelected = function() {
        return this.model.getSelected();
      };

      BatchAction.prototype.checkRequirements = function() {
        return this.setEnabled(this.model.allowed(this.getSelected()));
      };

      BatchAction.prototype.setEnabled = function(enabled) {
        var idx;
        this.$el.toggleClass("disabled", !enabled);
        idx = enabled ? 0 : -1;
        return this.$(".button").attr("tabindex", idx);
      };

      BatchAction.prototype.activate = function(event) {
        console.log(this.getSelected());
        this.model.activate(this.getSelected());
        return false;
      };

      BatchAction.prototype.keypressed = function(event) {
        if (event.which === 13) {
          this.activate();
          return false;
        }
      };

      BatchAction.highlightHotkey = function(label, hotkey) {
        var new_label, template;
        template = _.template("<span class='hotkey'><strong><%= hotkey %></strong></span>");
        new_label = label.replace(hotkey, template({
          hotkey: hotkey
        }));
        if (new_label === label) {
          new_label = "" + label + " " + (template({
            hotkey: "[" + hotkey + "]"
          }));
        }
        return new_label;
      };

      return BatchAction;

    })(Backbone.View);
    Ribs.InlineAction = (function(_super) {

      __extends(InlineAction, _super);

      function InlineAction() {
        return InlineAction.__super__.constructor.apply(this, arguments);
      }

      InlineAction.prototype.label = function() {
        var label, _ref;
        label = (_ref = this.model.get("inlineLabel")) != null ? _ref : this.model.get("label");
        if (_.isFunction(label)) {
          label = label.call(this.model, this.options.listItem.model);
        }
        return label;
      };

      InlineAction.prototype.getSelected = function() {
        return [this.options.listItem.model];
      };

      return InlineAction;

    })(Ribs.BatchAction);
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
        var binding, h1, li, namespace, ul, view, _i, _len, _ref, _ref1, _results;
        this.$el.empty();
        _ref = this.options.views;
        _results = [];
        for (namespace in _ref) {
          view = _ref[namespace];
          if (!$(view.el).is(":hidden")) {
            h1 = $("<h1/>", {
              text: view.label
            });
            ul = $("<ul/>");
            _ref1 = view.bindings;
            for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
              binding = _ref1[_i];
              li = $("<li/>", {
                "class": "hotkey"
              });
              li.append($("<span/>", {
                "class": "key",
                text: binding.hotkey
              }));
              li.append($("<span/>", {
                "class": "action",
                text: binding.label
              }));
              ul.append(li);
            }
            _results.push(this.$el.append(h1, ul));
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
