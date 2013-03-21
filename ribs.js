(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  (function($) {
    var Ribs, root, _ref, _ref1, _ref2, _ref3, _ref4;

    root = typeof window !== "undefined" && window !== null ? window : module.exports;
    Ribs = (_ref = root.Ribs) != null ? _ref : root.Ribs = {};
    Ribs.List = (function(_super) {
      __extends(List, _super);

      List.prototype.tagName = "div";

      List.prototype.itemName = "item";

      List.prototype._ribsEvents = {
        'keypress': 'keypressed',
        'focusin': 'focusin',
        'focusout': 'focusout',
        'click .header .toggle input': 'toggleSelected',
        'click .maximize .minimize': 'toggleVisibility',
        'click [data-sort-by]': 'sortByField'
      };

      List.prototype._ribsOptions = ["displayAttributes", "actions", "itemView", "itemName", "title", "jumpkey"];

      List.prototype.jumpSelector = ".list li:first";

      List.prototype.focussed = false;

      List.prototype.selectedByDefault = false;

      List.prototype.renderOrder = ["Title", "Actions", "Header", "List", "Footer"];

      function List(options) {
        var k, _i, _len, _ref1, _ref2, _ref3;

        this.sortArrows = {};
        this.sortArrows[-1] = "↓";
        this.sortArrows[1] = "↑";
        if ((_ref1 = this.itemView) == null) {
          this.itemView = Ribs.ListItem;
        }
        if ((_ref2 = this.actionView) == null) {
          this.actionView = Ribs.BatchAction;
        }
        this.events = _.extend({}, this.events, this._ribsEvents);
        this.sortingDirection = {};
        this.sortingBy = "id";
        _ref3 = this._ribsOptions;
        for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
          k = _ref3[_i];
          if (options[k] != null) {
            this[k] = options[k];
          }
        }
        this.keyboardManager = typeof Ribs.getKeyboardManager === "function" ? Ribs.getKeyboardManager() : void 0;
        if (this.keyboardManager != null) {
          this.initializeHotKeys();
        }
        List.__super__.constructor.apply(this, arguments);
        this.$el.addClass('ribs');
      }

      List.prototype.setElement = function() {
        List.__super__.setElement.apply(this, arguments);
        return this.build();
      };

      List.prototype.remove = function() {
        var _ref1;

        this.removeAllSubviews();
        if ((_ref1 = this.keyboardManager) != null) {
          _ref1.deregisterView(this.keyboardNamespace);
        }
        return List.__super__.remove.apply(this, arguments);
      };

      List.prototype.removeAllSubviews = function() {
        this.removeSubviews("list");
        return this.removeSubviews("action");
      };

      List.prototype.removeSubviews = function(type) {
        var l, subview, _i, _len;

        if (l = this.subviews(type)) {
          for (_i = 0, _len = l.length; _i < _len; _i++) {
            subview = l[_i];
            subview.remove();
          }
        }
        return this["_" + type + "Subviews"] = [];
      };

      List.prototype.subviews = function(type) {
        return this["_" + type + "Subviews"];
      };

      List.prototype.build = function() {
        var l, t, _i, _len, _ref1;

        this.removeAllSubviews();
        this.$el.empty();
        _ref1 = this.renderOrder;
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          t = _ref1[_i];
          l = t.replace(/^./, "$" + (t[0].toLowerCase()));
          if (!(this["suppress" + t] || (this[l] != null))) {
            this[l] = this["initialize" + t]();
          }
          this.$el.append(this[l]);
        }
        if (this.collection != null) {
          return this.setCollection(this.collection);
        }
      };

      List.prototype.render = function() {
        var t, _i, _len, _ref1;

        _ref1 = this.renderOrder;
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          t = _ref1[_i];
          if (!this["suppress" + t]) {
            this["render" + t]();
          }
        }
        return this;
      };

      List.prototype.setCollection = function(collection) {
        var fn, t, _i, _len, _ref1;

        this.collection = collection;
        this.stopListening(this.collection);
        this.listenTo(this.collection, "add", this.addItem);
        this.listenTo(this.collection, "sort reset", this.addAllItems);
        _ref1 = ["Actions", "Footer", "Header"];
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          t = _ref1[_i];
          fn = this["render" + t];
          if (!this["suppress" + t] && _.isFunction(fn)) {
            this.listenTo(this.collection, "selected deselected add remove", fn);
          }
        }
        this.listenTo(this.collection, "reset", this.render);
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

      List.prototype.toggleSelected = function(e) {
        var _ref1, _ref2;

        if (this.selectedByDefault === true) {
          this.$list.find(".item.selected").trigger("deselectitem", {
            silent: true
          });
          this.selectedByDefault = false;
          return (_ref1 = this.collection) != null ? _ref1.trigger("deselected") : void 0;
        } else {
          this.$list.find(".item:not(.selected)").trigger("selectitem", {
            silent: true
          });
          this.selectedByDefault = true;
          return (_ref2 = this.collection) != null ? _ref2.trigger("selected") : void 0;
        }
      };

      List.prototype.invertSelected = function() {
        var toDeselect, toSelect;

        toSelect = this.$list.find(":not(.item.selected)");
        toDeselect = this.$list.find(".item.selected");
        toSelect.trigger("select");
        return toDeselect.trigger("deselectitem");
      };

      List.prototype.toggleVisibility = function() {
        this.$header.find(".maximize, .minimize").toggle();
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
            if (_.isFunction(da.map)) {
              a = da.map.call(_this, a, ma);
            }
            b = mb.get(field);
            db = _this.displayAttributeMap[field];
            if (_.isFunction(db.map)) {
              b = db.map.call(_this, b, mb);
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
            if (a > b || (b == null)) {
              return +1 * dir;
            }
            if (a < b || (a == null)) {
              return -1 * dir;
            }
          };
          return this.collection.sort();
        }
      };

      List.prototype.updateHeaderArrows = function(field, old_field) {
        var dir, el, re, _ref1;

        re = new RegExp(" (" + (_.values(this.sortArrows).join("|")) + ")$|$");
        dir = (_ref1 = this.sortingDirection[field]) != null ? _ref1 : 1;
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
        var hotkey, hotkeys, _i, _len, _results,
          _this = this;

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
        if (!this.suppressHotKeys) {
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
        }
      };

      List.prototype.keypressed = function(event) {
        var _ref1;

        this.trigger("keypressed", event);
        return (_ref1 = this.keyboardManager) != null ? _ref1.handleKeypress(event, this.keyboardNamespace) : void 0;
      };

      List.prototype.refresh = function() {
        var _this = this;

        if (this.collection.url != null) {
          this.trigger('refresh');
          return this.collection.fetch({
            success: function() {
              var _ref1;

              return (_ref1 = _this.$list.find(".item:first")) != null ? _ref1.focus() : void 0;
            }
          });
        }
      };

      List.prototype.focusin = function(event) {
        var _ref1;

        if (!this.focussed) {
          this.focussed = true;
        }
        this.$el.addClass("focussed");
        return (_ref1 = this.collection) != null ? _ref1.trigger("focusin") : void 0;
      };

      List.prototype.focusout = function(event) {
        var _this = this;

        if (this.focussed) {
          return setTimeout(function() {
            var _ref1;

            if (_this.$(document.activeElement).length === 0) {
              _this.$el.removeClass("focussed");
            }
            _this.focussed = false;
            return (_ref1 = _this.collection) != null ? _ref1.trigger("focusout") : void 0;
          }, 10);
        }
      };

      List.prototype.plural = function() {
        var _ref1;

        return (_ref1 = this.itemNamePlural) != null ? _ref1 : this.itemName + "s";
      };

      List.prototype.addItem = function(model) {
        var idx, itemView, view, _ref1;

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
        if ((_ref1 = this.$list.children().size()) === 0 || _ref1 === idx) {
          this.$list.append(view.el);
        } else {
          this.$list.children(":nth-child(" + (idx + 1) + ")").before(view.el);
        }
        if (this.$el.is(":visible")) {
          view.render();
        }
        this.subviews("list").push(view);
        if (this.selectedByDefault) {
          return view.select();
        }
      };

      List.prototype.addAllItems = function() {
        var _ref1;

        this.removeSubviews("list");
        this.$list.empty();
        return (_ref1 = this.collection) != null ? _ref1.each(this.addItem, this) : void 0;
      };

      List.prototype.get = function(id) {
        return _.find(this.subviews("list"), function(view) {
          return view.model.id === id;
        });
      };

      List.prototype.getByCid = function(cid) {
        return _.find(this.subviews("list"), function(view) {
          return view.model.cid === cid;
        });
      };

      List.prototype.initializeTitle = function() {
        var $title, title, _ref1;

        title = (_ref1 = this.title) != null ? _ref1 : this.plural();
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
        var $batchActions, action, view, _i, _len, _ref1;

        this.removeSubviews("action");
        $batchActions = $("<ul/>", {
          "class": "actions"
        });
        this.allActions = new Ribs.Actions(this.actions, {
          ribs: this
        });
        this.inlineActions = this.allActions.where({
          inline: true
        });
        this.batchActions = this.allActions.where({
          batch: true
        });
        _ref1 = this.batchActions;
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          action = _ref1[_i];
          view = new this.actionView({
            model: action
          });
          this.subviews("action").push(view);
          $batchActions.append(view.el);
          view.render();
        }
        return $batchActions;
      };

      List.prototype.renderActions = function() {
        var view, _i, _len, _ref1, _results;

        _ref1 = this.subviews("action");
        _results = [];
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          view = _ref1[_i];
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
        var view, _i, _len, _ref1, _results;

        _ref1 = this.subviews("list");
        _results = [];
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          view = _ref1[_i];
          view.render();
          _results.push(view.delegateEvents());
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
          var field, klass, label, _ref1, _ref2;

          _this.displayAttributeMap[attribute.field] = attribute;
          label = (_ref1 = attribute.label) != null ? _ref1 : attribute.field;
          klass = (_ref2 = attribute["class"]) != null ? _ref2 : attribute.field;
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
        return this.$header.find(".toggle input").prop("checked", isChecked).css("opacity", opacity);
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
        'selectitem': 'select',
        'deselectitem': 'deselect',
        'click a': 'stopPropogation'
      };

      function ListItem(options) {
        var action, attribute, inlineAction, key, listItemCell, _i, _len, _ref1, _ref2, _ref3, _ref4;

        this.events || (this.events = {});
        _.extend(this.events, this._ribsEvents);
        if ((_ref1 = this.itemCellView) == null) {
          this.itemCellView = Ribs.ListItemCell;
        }
        if ((_ref2 = this.actionView) == null) {
          this.actionView = Ribs.InlineAction;
        }
        this.view = options != null ? options.view : void 0;
        this.listItemCells = [];
        _ref3 = this.view.displayAttributes;
        for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
          attribute = _ref3[_i];
          attribute = _.clone(attribute);
          attribute.view = this;
          attribute.model = options.model;
          listItemCell = new this.itemCellView(attribute);
          this.listItemCells.push(listItemCell);
        }
        this.inlineActions = [];
        _ref4 = this.view.inlineActions;
        for (key in _ref4) {
          action = _ref4[key];
          if (!((action.filter != null) && action.filter(this.model) === false)) {
            inlineAction = new this.actionView({
              model: action,
              listItem: this
            });
            this.inlineActions.push(inlineAction);
          }
        }
        ListItem.__super__.constructor.apply(this, arguments);
        if (this.model != null) {
          this.listenTo(this.model, "change", this.render);
          this.listenTo(this.model, "remove", this.remove);
        }
      }

      ListItem.prototype.render = function() {
        var cell, div, inlineAction, toggle, ul, _i, _j, _len, _len1, _ref1, _ref2;

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
            $(toggle).prop("checked", true);
          }
          div = $("<div/>", {
            "class": "toggle"
          });
          div.append(toggle);
          this.$el.append(div);
        }
        _ref1 = this.listItemCells;
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          cell = _ref1[_i];
          this.$el.append(cell.el);
          cell.render();
          cell.delegateEvents();
        }
        ul = $("<ul/>", {
          "class": "actions"
        });
        _ref2 = this.inlineActions;
        for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
          inlineAction = _ref2[_j];
          $(ul).append(inlineAction.el);
          inlineAction.render();
          inlineAction.delegateEvents();
        }
        this.$el.append(ul);
        return this;
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
        this.$("input:checkbox").prop("checked", true);
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
        this.$("input:checkbox").prop("checked", false);
        if (!options.silent) {
          return this.model.trigger("deselected");
        }
      };

      ListItem.prototype.enable = function() {
        this.$el.removeClass("disabled");
        this.$("input:checkbox").prop("disabled", false);
        this.$el.prop("tabindex", 0);
        return this.model.trigger("enabled");
      };

      ListItem.prototype.disable = function() {
        this.$el.addClass("disabled");
        this.$("input:checkbox").prop("disabled", true);
        this.$el.prop("tabindex", -1);
        return this.model.trigger("disabled");
      };

      ListItem.prototype.remove = function() {
        var inlineAction, listItemCell, _i, _j, _len, _len1, _ref1, _ref2;

        this.deselect();
        _ref1 = this.inlineActions;
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          inlineAction = _ref1[_i];
          inlineAction.remove();
        }
        _ref2 = this.listItemCells;
        for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
          listItemCell = _ref2[_j];
          listItemCell.remove();
        }
        return ListItem.__super__.remove.apply(this, arguments);
      };

      return ListItem;

    })(Backbone.View);
    Ribs.ListItemCell = (function(_super) {
      __extends(ListItemCell, _super);

      ListItemCell.prototype.tagName = "div";

      ListItemCell.prototype.className = "cell";

      ListItemCell.prototype._ribsEvents = {
        'click .edit': 'edit',
        'click .editableField': 'stopPropagation',
        'keypress .editableField': 'handleKeypress',
        'blur .editableField': 'saveEditedField'
      };

      function ListItemCell(options) {
        var _ref1;

        this.events || (this.events = {});
        _.extend(this.events, this._ribsEvents);
        ListItemCell.__super__.constructor.apply(this, arguments);
        this.$el.addClass((_ref1 = this.options["class"]) != null ? _ref1 : this.options.field);
      }

      ListItemCell.prototype.renderableValue = function(nomap) {
        var value;

        value = this.model.get(this.options.field);
        if (!nomap && _.isFunction(this.options.map)) {
          value = this.options.map.call(this.options.view.view, value, this.model);
        }
        return value != null ? value : "";
      };

      ListItemCell.prototype.render = function() {
        var editBtnEl, label, _ref1, _ref2;

        this.$el.empty();
        if (this.options.escape === false) {
          this.$el.html(this.renderableValue());
        } else {
          this.$el.text(this.renderableValue());
        }
        if (this.options.editable === true) {
          label = (_ref1 = this.options.label) != null ? _ref1 : this.options.field;
          editBtnEl = $("<span/>", {
            "class": 'edit button inline',
            title: "Edit " + label,
            text: '✎'
          });
          if ((_ref2 = this.model.get(this.options.field)) === (void 0) || _ref2 === null || _ref2 === '') {
            $(editBtnEl).addClass('show');
          } else {
            $(editBtnEl).removeClass('show');
          }
          this.$el.append(editBtnEl);
        }
        return this;
      };

      ListItemCell.prototype.edit = function(event) {
        var editField, key, option, optionEl, value, _i, _len, _ref1, _ref2;

        if (this.options.editable === true) {
          value = this.model.get(this.options.field);
          if (_.isFunction(this.options.edit)) {
            editField = this.options.edit.call(this, value, this.model);
          } else if (_.isArray(this.options.edit)) {
            editField = $("<select/>");
            _ref1 = this.options.edit;
            for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
              option = _ref1[_i];
              optionEl = $("<option/>", {
                value: option,
                text: option,
                selected: option === value
              });
              editField.append(optionEl);
            }
          } else if (_.isObject(this.options.edit)) {
            editField = $("<select/>");
            _ref2 = this.options.edit;
            for (key in _ref2) {
              option = _ref2[key];
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
          if (_.isElement(editField) || editField instanceof jQuery) {
            $(editField).addClass("editableField");
            this.$el.html(editField);
            $(editField).focus();
          }
        }
        return false;
      };

      ListItemCell.prototype.stopPropagation = function(e) {
        return false;
      };

      ListItemCell.prototype.saveEditedField = function() {
        var changeSet, e, editField, value,
          _this = this;

        editField = this.$(".editableField");
        if (_.isFunction(this.options.save)) {
          return this.options.save.call(this, editField, this.model);
        } else {
          value = editField.val();
          changeSet = $.extend(true, {}, this.model.attributes);
          changeSet[this.options.field] = value;
          if (!this.model._validate(changeSet, this.model)) {
            return;
          }
          try {
            return this.model.save(changeSet, {
              success: function() {
                return _this.render();
              },
              error: function() {
                return _this.render();
              }
            });
          } catch (_error) {
            e = _error;
            return this.render();
          }
        }
      };

      ListItemCell.prototype.handleKeypress = function(e) {
        if (e.which === 13) {
          this.saveEditedField();
          return false;
        }
      };

      return ListItemCell;

    })(Backbone.View);
    Ribs.Action = (function(_super) {
      __extends(Action, _super);

      function Action() {
        _ref1 = Action.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      Action.prototype.defaults = {
        min: 1,
        max: -1,
        arity: null,
        check: null,
        batch: true,
        inline: false
      };

      Action.prototype.initialize = function(attributes, options) {
        var _ref2, _ref3,
          _this = this;

        this.ribs = (_ref2 = options.ribs) != null ? _ref2 : this.collection.ribs;
        if (this.has("actions")) {
          this.actions = new Ribs.Actions(this.get("actions"), {
            ribs: this.ribs
          });
          this.min = 0;
        }
        if (this.has("hotkey") && !this.ribs.suppressHotKeys) {
          return (_ref3 = this.ribs.keyboardManager) != null ? _ref3.registerHotKey({
            hotkey: this.get("hotkey"),
            label: this.get("label"),
            namespace: this.ribs.keyboardNamespace,
            context: this,
            precondition: this.allowed,
            callback: function() {
              return _this.activate();
            }
          }) : void 0;
        }
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

      Action.prototype.activate = function(selected, listItem) {
        if (selected == null) {
          selected = this.getSelected();
        }
        return this.get("activate").call(this.ribs, selected, listItem);
      };

      Action.prototype.getSelected = function() {
        return this.ribs.getSelected();
      };

      return Action;

    })(Backbone.Model);
    Ribs.Actions = (function(_super) {
      __extends(Actions, _super);

      function Actions() {
        _ref2 = Actions.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      Actions.prototype.model = Ribs.Action;

      return Actions;

    })(Backbone.Collection);
    Ribs.BatchAction = (function(_super) {
      __extends(BatchAction, _super);

      function BatchAction() {
        _ref3 = BatchAction.__super__.constructor.apply(this, arguments);
        return _ref3;
      }

      BatchAction.prototype.tagName = "li";

      BatchAction.prototype.className = "action";

      BatchAction.prototype.events = {
        'click': 'activateIfAllowed',
        'keypress': 'keypressed'
      };

      BatchAction.prototype.attributes = {
        tabindex: 0
      };

      BatchAction.prototype.render = function() {
        var btn, cont;

        btn = $("<div/>", {
          "class": "button",
          title: this.tooltip(),
          html: this.label()
        });
        this.$el.html(btn);
        if (this.model.actions) {
          cont = $("<ul/>", {
            "class": "dropdown",
            title: this.label(false)
          });
          this.model.actions.each(function(action) {
            var view;

            view = new Ribs.BatchAction({
              model: action
            });
            $(cont).append(view.el);
            return view.render();
          });
          $(btn).append(cont);
        } else {
          this.checkRequirements();
        }
        return this;
      };

      BatchAction.prototype.tooltip = function() {
        var _ref4;

        return (_ref4 = this.model.get("tooltip")) != null ? _ref4 : this.label(false);
      };

      BatchAction.prototype.label = function(highlight) {
        var label, _ref4;

        if (highlight == null) {
          highlight = true;
        }
        label = (_ref4 = this.model.get("batchLabel")) != null ? _ref4 : this.model.get("label");
        if (highlight && this.model.has("hotkey")) {
          label = this.constructor.highlightHotkey(label, this.model.get("hotkey"));
        }
        return label;
      };

      BatchAction.prototype.getSelected = function() {
        return this.model.getSelected();
      };

      BatchAction.prototype.getListItem = function() {};

      BatchAction.prototype.checkRequirements = function() {
        return this.setEnabled(this.model.allowed(this.getSelected()));
      };

      BatchAction.prototype.setEnabled = function(enabled) {
        var idx;

        this.$el.toggleClass("disabled", !enabled);
        idx = enabled ? 0 : -1;
        return this.$el.prop("tabindex", idx);
      };

      BatchAction.prototype.activate = function() {
        if (this.model.activate != null) {
          this.model.activate(this.getSelected(), this.getListItem());
        }
        return false;
      };

      BatchAction.prototype.activateIfAllowed = function(event) {
        if (!this.$el.is(".disabled")) {
          this.activate();
        }
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
    return Ribs.InlineAction = (function(_super) {
      __extends(InlineAction, _super);

      function InlineAction() {
        _ref4 = InlineAction.__super__.constructor.apply(this, arguments);
        return _ref4;
      }

      InlineAction.prototype.label = function() {
        var label, _ref5;

        label = (_ref5 = this.model.get("inlineLabel")) != null ? _ref5 : this.model.get("label");
        if (_.isFunction(label)) {
          label = label.call(this.model, this.options.listItem.model);
        }
        return label;
      };

      InlineAction.prototype.getSelected = function() {
        return [this.options.listItem.model];
      };

      InlineAction.prototype.getListItem = function() {
        return this.options.listItem;
      };

      return InlineAction;

    })(Ribs.BatchAction);
  })(jQuery);

  (function($) {
    var Ribs, root, _keyboardManager, _ref, _ref1;

    root = typeof window !== "undefined" && window !== null ? window : module.exports;
    Ribs = (_ref = root.Ribs) != null ? _ref : root.Ribs = {};
    _keyboardManager = null;
    Ribs.getKeyboardManager = function() {
      return _keyboardManager != null ? _keyboardManager : _keyboardManager = new Ribs.KeyboardManager();
    };
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
        this.handleKeypress = __bind(this.handleKeypress, this);        this.options = _.extend(this.options, options);
        this.registerHotKey({
          hotkey: "?",
          callback: this.showKeyboardBindings,
          context: this,
          label: "Show hotkeys"
        });
        $(window).on("keypress", this.handleKeypress);
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

      KeyboardManager.prototype.deregisterView = function(namespace) {
        return delete this.registeredViews[namespace];
      };

      KeyboardManager.prototype.registerHotKey = function(options) {
        var code, i, key, ns, _i, _len, _ref1, _ref2, _ref3, _ref4;

        if ((_ref1 = options.charCodes) == null) {
          options.charCodes = (function() {
            var _i, _len, _ref2, _results;

            _ref2 = options.hotkey.split("");
            _results = [];
            for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
              key = _ref2[_i];
              _results.push(key.charCodeAt(0));
            }
            return _results;
          })();
        }
        ns = (_ref2 = options.namespace) != null ? _ref2 : options.namespace = "global";
        root = this.registeredViews[ns].tree;
        _ref3 = options.charCodes;
        for (i = _i = 0, _len = _ref3.length; _i < _len; i = ++_i) {
          code = _ref3[i];
          if ((_ref4 = root[code]) == null) {
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

      KeyboardManager.prototype.deregisterHotKey = function(options) {
        var code, current, i, key, ns, _i, _len, _ref1, _ref2, _ref3, _results;

        if ((_ref1 = options.charCodes) == null) {
          options.charCodes = (function() {
            var _i, _len, _ref2, _results;

            _ref2 = options.hotkey.split("");
            _results = [];
            for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
              key = _ref2[_i];
              _results.push(key.charCodeAt(0));
            }
            return _results;
          })();
        }
        ns = (_ref2 = options.namespace) != null ? _ref2 : options.namespace = "global";
        root = current = this.registeredViews[ns].tree;
        _ref3 = options.charCodes;
        _results = [];
        for (i = _i = 0, _len = _ref3.length; _i < _len; i = ++_i) {
          code = _ref3[i];
          current = current[code];
          if (i === options.charCodes.length - 1) {
            _results.push(current.bindings = _.reject(current.bindings, function(binding) {
              return (!options.context || options.context === binding.context) && (!options.callback || options.callback === binding.callback);
            }));
          } else {
            _results.push(current.upcoming -= 1);
          }
        }
        return _results;
      };

      KeyboardManager.prototype.registerJumpKey = function(options) {
        options.label = "Go to " + options.label;
        options.hotkey = this.options.jumpPrefixKey + options.jumpkey;
        return this.registerHotKey(options);
      };

      KeyboardManager.prototype.deregisterJumpKey = function(options) {
        options.hotkey = this.options.jumpPrefixKey + options.jumpkey;
        return this.deregisterHotKey(options);
      };

      KeyboardManager.prototype.handleKeypress = function(event, namespace) {
        var context, _ref1;

        if (namespace == null) {
          namespace = "global";
        }
        if (!this.options.enableKeyboardShortcuts) {
          return;
        }
        if ($(document.activeElement).is(":input")) {
          return;
        }
        context = (_ref1 = this.currentContext) != null ? _ref1 : this.registeredViews[namespace].tree;
        if (context != null) {
          return this.walkContext(context, event.which);
        }
      };

      KeyboardManager.prototype.walkContext = function(context, charCode) {
        var _this = this;

        if (this.jumpTimeout) {
          clearTimeout(this.jumpTimeout);
        }
        delete this.currentContext;
        if (!(charCode in context)) {
          return;
        }
        context = context[charCode];
        if (context.upcoming === 0) {
          this.execute(context);
        } else {
          this.currentContext = context;
          this.jumpTimeout = setTimeout(function() {
            delete _this.currentContext;
            return _this.execute(context);
          }, this.options.jumpTime);
        }
        return false;
      };

      KeyboardManager.prototype.execute = function(context) {
        var binding, ctx, _i, _len, _ref1, _ref2, _results;

        if (context.bindings.length) {
          _ref1 = context.bindings;
          _results = [];
          for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
            binding = _ref1[_i];
            ctx = (_ref2 = binding.context) != null ? _ref2 : this.registeredViews[binding.namespace].context;
            if (!(binding.precondition && !binding.precondition.call(ctx))) {
              _results.push(binding.callback.call(ctx));
            } else {
              _results.push(void 0);
            }
          }
          return _results;
        }
      };

      KeyboardManager.prototype.showKeyboardBindings = function() {
        var view, _ref1;

        if ((_ref1 = this.constructor.view) != null) {
          _ref1.$el.remove();
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
        this.handleKeyup = __bind(this.handleKeyup, this);        _ref1 = KeyboardHelpView.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      KeyboardHelpView.prototype.className = "ribs-keyboard-shortcuts-overlay";

      KeyboardHelpView.prototype.events = {
        'click': "remove"
      };

      KeyboardHelpView.prototype.initialize = function() {
        return $(window).on("keyup", this.handleKeyup);
      };

      KeyboardHelpView.prototype.remove = function() {
        $(window).off("keyup", this.handleKeyup);
        return KeyboardHelpView.__super__.remove.apply(this, arguments);
      };

      KeyboardHelpView.prototype.handleKeyup = function(event) {
        if (event.which === 27) {
          this.remove();
        }
        return false;
      };

      KeyboardHelpView.prototype.render = function() {
        var binding, h1, li, namespace, ul, view, _i, _len, _ref2, _ref3, _ref4, _results;

        this.$el.empty();
        _ref2 = this.options.views;
        _results = [];
        for (namespace in _ref2) {
          view = _ref2[namespace];
          if (!$((_ref3 = view.context) != null ? _ref3.el : void 0).is(":hidden")) {
            h1 = $("<h1/>", {
              text: view.label
            });
            ul = $("<ul/>");
            _ref4 = view.bindings;
            for (_i = 0, _len = _ref4.length; _i < _len; _i++) {
              binding = _ref4[_i];
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
