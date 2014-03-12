(function() {
  var Ribs, root,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  if (typeof exports === "undefined") {
    root = window;
  } else {
    root = exports;
  }

  Ribs = root.Ribs = {};

  Ribs.VERSION = "0.1.3";

  (function($) {
    var _keyboardManager;
    _keyboardManager = null;
    Ribs.getKeyboardManager = function() {
      return _keyboardManager != null ? _keyboardManager : _keyboardManager = new Ribs.KeyboardManager();
    };
    return Ribs.KeyboardManager = (function() {
      KeyboardManager.prototype.boundCharCodes = {};

      KeyboardManager.prototype.registeredViews = {};

      KeyboardManager.prototype.options = {
        jumpPrefixKey: "g",
        jumpTime: 1000,
        enableKeyboardShortcuts: true
      };

      function KeyboardManager(options) {
        this.handleKeypress = __bind(this.handleKeypress, this);
        this.options = _.extend(this.options, options);
        if (typeof window !== 'undefined') {
          this.registeredViews.global = {
            bindings: [],
            tree: {},
            label: "Global",
            context: window
          };
          $(window).on("keypress", this.handleKeypress);
        }
        this.registerHotKey({
          hotkey: "?",
          callback: this.showKeyboardBindings,
          context: this,
          label: "Show hotkeys"
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

      KeyboardManager.prototype.deregisterView = function(namespace) {
        return delete this.registeredViews[namespace];
      };

      KeyboardManager.prototype.registerHotKey = function(options) {
        var code, i, key, ns, _i, _len, _ref;
        if (options.charCodes == null) {
          options.charCodes = (function() {
            var _i, _len, _ref, _results;
            _ref = options.hotkey.split("");
            _results = [];
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              key = _ref[_i];
              _results.push(key.charCodeAt(0));
            }
            return _results;
          })();
        }
        ns = options.namespace != null ? options.namespace : options.namespace = "global";
        root = this.registeredViews[ns].tree;
        _ref = options.charCodes;
        for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
          code = _ref[i];
          if (root[code] == null) {
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
        var code, current, i, key, ns, _i, _len, _ref, _results;
        if (options.charCodes == null) {
          options.charCodes = (function() {
            var _i, _len, _ref, _results;
            _ref = options.hotkey.split("");
            _results = [];
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              key = _ref[_i];
              _results.push(key.charCodeAt(0));
            }
            return _results;
          })();
        }
        ns = options.namespace != null ? options.namespace : options.namespace = "global";
        root = current = this.registeredViews[ns].tree;
        _ref = options.charCodes;
        _results = [];
        for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
          code = _ref[i];
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
        var context, _ref;
        if (namespace == null) {
          namespace = "global";
        }
        if (!this.options.enableKeyboardShortcuts) {
          return;
        }
        if ($(document.activeElement).not(":radio").not(":checkbox").not(":button").is(":input")) {
          return;
        }
        context = (_ref = this.currentContext) != null ? _ref : this.registeredViews[namespace].tree;
        if (context != null) {
          return this.walkContext(context, event.which);
        }
      };

      KeyboardManager.prototype.walkContext = function(context, charCode) {
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
          this.jumpTimeout = setTimeout((function(_this) {
            return function() {
              delete _this.currentContext;
              return _this.execute(context);
            };
          })(this), this.options.jumpTime);
        }
        return false;
      };

      KeyboardManager.prototype.execute = function(context) {
        var binding, ctx, _i, _len, _ref, _ref1, _results;
        if (context.bindings.length) {
          _ref = context.bindings;
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            binding = _ref[_i];
            ctx = (_ref1 = binding.context) != null ? _ref1 : this.registeredViews[binding.namespace].context;
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
  })(jQuery);

  Ribs.Action = (function(_super) {
    __extends(Action, _super);

    function Action() {
      return Action.__super__.constructor.apply(this, arguments);
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
      var availableActions, _ref, _ref1;
      this.ribs = (_ref = options.ribs) != null ? _ref : this.collection.ribs;
      if (this.has("actions")) {
        availableActions = _.reject(this.get("actions"), (function(_this) {
          return function(action) {
            return (action.available != null) && !action.available.call(_this.ribs);
          };
        })(this));
        this.actions = new Ribs.Actions(availableActions, {
          ribs: this.ribs
        });
        this.min = 0;
      }
      if (this.has("hotkey") && !this.ribs.suppressHotKeys) {
        return (_ref1 = this.ribs.keyboardManager) != null ? _ref1.registerHotKey({
          hotkey: this.get("hotkey"),
          label: this.get("label"),
          namespace: this.ribs.keyboardNamespace,
          context: this,
          precondition: this.allowed,
          callback: (function(_this) {
            return function() {
              return _this.activate();
            };
          })(this)
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
      var activate;
      if (selected == null) {
        selected = this.getSelected();
      }
      activate = this.get("activate");
      if (_.isFunction(activate)) {
        return activate.call(this.ribs, selected, listItem);
      }
    };

    Action.prototype.getSelected = function() {
      return this.ribs.getSelected();
    };

    return Action;

  })(Backbone.Model);

  Ribs.Actions = (function(_super) {
    __extends(Actions, _super);

    function Actions() {
      return Actions.__super__.constructor.apply(this, arguments);
    }

    Actions.prototype.model = Ribs.Action;

    return Actions;

  })(Backbone.Collection);

  Ribs.BatchAction = (function(_super) {
    __extends(BatchAction, _super);

    function BatchAction() {
      return BatchAction.__super__.constructor.apply(this, arguments);
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
      var _ref;
      return (_ref = this.model.get("tooltip")) != null ? _ref : this.label(false);
    };

    BatchAction.prototype.label = function(highlight) {
      var label, _ref;
      if (highlight == null) {
        highlight = true;
      }
      label = (_ref = this.model.get("batchLabel")) != null ? _ref : this.model.get("label");
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
      this.model.activate(this.getSelected(), this.getListItem());
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

  Ribs.InlineAction = (function(_super) {
    __extends(InlineAction, _super);

    function InlineAction(options) {
      InlineAction.__super__.constructor.apply(this, arguments);
      this.listItem = options.listItem;
    }

    InlineAction.prototype.label = function() {
      var label, _ref;
      label = (_ref = this.model.get("inlineLabel")) != null ? _ref : this.model.get("label");
      if (_.isFunction(label)) {
        label = label.call(this.model, this.listItem.model);
      }
      return label;
    };

    InlineAction.prototype.getSelected = function() {
      return [this.listItem.model];
    };

    InlineAction.prototype.getListItem = function() {
      return this.listItem;
    };

    return InlineAction;

  })(Ribs.BatchAction);

  Ribs.KeyboardHelpView = (function(_super) {
    __extends(KeyboardHelpView, _super);

    function KeyboardHelpView() {
      this.handleKeyup = __bind(this.handleKeyup, this);
      return KeyboardHelpView.__super__.constructor.apply(this, arguments);
    }

    KeyboardHelpView.prototype.className = "ribs-keyboard-shortcuts-overlay";

    KeyboardHelpView.prototype.events = {
      'click': "remove"
    };

    KeyboardHelpView.prototype.initialize = function(options) {
      this.views = options.views;
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
      var binding, bindings, h1, hasNoKeys, isHidden, li, namespace, ul, view, _i, _len, _ref, _ref1, _results;
      this.$el.empty();
      _ref = this.views;
      _results = [];
      for (namespace in _ref) {
        view = _ref[namespace];
        bindings = view.bindings;
        isHidden = $((_ref1 = view.context) != null ? _ref1.el : void 0).is(":hidden");
        hasNoKeys = Object.keys(bindings).length === 0;
        if (!(isHidden || hasNoKeys)) {
          h1 = $("<h1/>", {
            text: view.label
          });
          ul = $("<ul/>");
          for (_i = 0, _len = bindings.length; _i < _len; _i++) {
            binding = bindings[_i];
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

  (function($) {
    return Ribs.List = (function(_super) {
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
        var k, _i, _len, _ref;
        this.sortArrows = {};
        this.sortArrows[-1] = "↓";
        this.sortArrows[1] = "↑";
        if (this.itemView == null) {
          this.itemView = Ribs.ListItem;
        }
        if (this.actionView == null) {
          this.actionView = Ribs.BatchAction;
        }
        this.events = _.extend({}, this.events, this._ribsEvents);
        this.sortingDirection = {};
        this.sortingBy = "id";
        _ref = this._ribsOptions;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          k = _ref[_i];
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
        var _ref;
        this.removeAllSubviews();
        if ((_ref = this.keyboardManager) != null) {
          _ref.deregisterView(this.keyboardNamespace);
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
        var l, t, _i, _len, _ref;
        this.removeAllSubviews();
        this.$el.empty();
        _ref = this.renderOrder;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          t = _ref[_i];
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

      List.prototype.delegateEvents = function() {
        var sv, view, _i, _len, _ref, _results;
        List.__super__.delegateEvents.apply(this, arguments);
        _ref = ["list", "actions"];
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          sv = _ref[_i];
          if (this.subviews(sv) != null) {
            _results.push((function() {
              var _j, _len1, _ref1, _results1;
              _ref1 = this.subviews(sv);
              _results1 = [];
              for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
                view = _ref1[_j];
                _results1.push(view.delegateEvents());
              }
              return _results1;
            }).call(this));
          }
        }
        return _results;
      };

      List.prototype.render = function() {
        this._render(this.renderOrder);
        return this;
      };

      List.prototype._render = function(order) {
        var t, _i, _len, _results;
        _results = [];
        for (_i = 0, _len = order.length; _i < _len; _i++) {
          t = order[_i];
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
        this.stopListening(this.collection);
        this.listenTo(this.collection, "add", this.addItem);
        this.listenTo(this.collection, "sort reset", this.addAllItems);
        _ref = ["Actions", "Footer", "Header"];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          t = _ref[_i];
          fn = this["render" + t];
          if (!this["suppress" + t] && _.isFunction(fn)) {
            this.listenTo(this.collection, "selected deselected add remove reset", fn);
          }
        }
        this.addAllItems();
        if (!this.suppressHeader) {
          return this.updateHeaderArrows(this.sortingBy);
        }
      };

      List.prototype.getSelected = function() {
        if (this.$list == null) {
          return [];
        }
        return this.$list.find(".item.selected").map((function(_this) {
          return function(idx, el) {
            return _this.collection.get($(el).data("cid"));
          };
        })(this));
      };

      List.prototype.getDeselected = function() {
        if (this.$list == null) {
          return [];
        }
        return this.$list.find(".item:not(.selected)").map((function(_this) {
          return function(idx, el) {
            return _this.collection.get($(el).data("cid"));
          };
        })(this));
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
        var _ref, _ref1;
        if (this.selectedByDefault === true) {
          this.$list.find(".item.selected").trigger("deselectitem", {
            silent: true
          });
          this.selectedByDefault = false;
          return (_ref = this.collection) != null ? _ref.trigger("deselected") : void 0;
        } else {
          this.$list.find(".item:not(.selected)").trigger("selectitem", {
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
        return toDeselect.trigger("deselectitem");
      };

      List.prototype.select = function(ids) {
        var id, _i, _len, _ref;
        if (!_.isArray(ids)) {
          ids = [ids];
        }
        for (_i = 0, _len = ids.length; _i < _len; _i++) {
          id = ids[_i];
          if ((_ref = this.get(id)) != null) {
            _ref.$el.trigger("selectitem", {
              silent: true
            });
          }
        }
        return this._render(["Header", "Footer", "Actions"]);
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
        if (this.collection.remoteSort) {
          return this.collection.trigger('remoteSort', field, dir);
        } else {
          this.collection.comparator = (function(_this) {
            return function(ma, mb) {
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
          })(this);
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
        var hotkey, hotkeys, _i, _len, _results;
        this.keyboardNamespace = this.keyboardManager.registerView(this, this.plural());
        if (this.jumpkey != null) {
          this.keyboardManager.registerJumpKey({
            label: this.plural(),
            jumpkey: this.jumpkey,
            context: this,
            callback: (function(_this) {
              return function() {
                return _this.$(_this.jumpSelector).focus();
              };
            })(this),
            precondition: (function(_this) {
              return function() {
                return _this.$el.is(":visible");
              };
            })(this)
          });
        }
        if (!this.suppressHotKeys) {
          hotkeys = [
            {
              hotkey: "j",
              label: "Focus next item",
              callback: (function(_this) {
                return function() {
                  return $(document.activeElement).nextAll(".item:visible:not(.disabled):first").focus();
                };
              })(this)
            }, {
              hotkey: "J",
              label: "Focus last item",
              callback: (function(_this) {
                return function() {
                  return _this.$list.find(".item:last").focus();
                };
              })(this)
            }, {
              hotkey: "k",
              label: "Focus previous item",
              callback: (function(_this) {
                return function() {
                  return $(document.activeElement).prevAll(".item:visible:not(.disabled):first").focus();
                };
              })(this)
            }, {
              hotkey: "K",
              label: "Focus first item",
              callback: (function(_this) {
                return function() {
                  return _this.$list.find(".item:first").focus();
                };
              })(this)
            }, {
              hotkey: "x",
              label: "Select/deselect item",
              callback: (function(_this) {
                return function() {
                  return _this.toggleFocussedSelected();
                };
              })(this)
            }, {
              hotkey: "X",
              label: "Select/deselect all",
              callback: (function(_this) {
                return function() {
                  return _this.toggleSelected();
                };
              })(this)
            }, {
              hotkey: "_",
              label: "Expand/collapse list",
              callback: (function(_this) {
                return function() {
                  return _this.toggleVisibility();
                };
              })(this)
            }, {
              hotkey: "R",
              label: "Refresh items",
              callback: (function(_this) {
                return function() {
                  return _this.refresh();
                };
              })(this)
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
        var _ref;
        this.trigger("keypressed", event);
        return (_ref = this.keyboardManager) != null ? _ref.handleKeypress(event, this.keyboardNamespace) : void 0;
      };

      List.prototype.refresh = function() {
        if (this.collection.url != null) {
          this.trigger('refresh');
          return this.collection.fetch({
            success: (function(_this) {
              return function() {
                var _ref;
                return (_ref = _this.$list.find(".item:first")) != null ? _ref.focus() : void 0;
              };
            })(this)
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
        if (this.focussed) {
          return setTimeout((function(_this) {
            return function() {
              var _ref;
              if (_this.$(document.activeElement).length === 0) {
                _this.$el.removeClass("focussed");
              }
              _this.focussed = false;
              return (_ref = _this.collection) != null ? _ref.trigger("focusout") : void 0;
            };
          })(this), 10);
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
        view.render();
        this.subviews("list").push(view);
        if (this.selectedByDefault) {
          return view.select();
        }
      };

      List.prototype.addAllItems = function() {
        var _ref;
        this.removeSubviews("list");
        this.$list.empty();
        return (_ref = this.collection) != null ? _ref.each(this.addItem, this) : void 0;
      };

      List.prototype.get = function(id) {
        return _.find(this.subviews("list"), function(view) {
          return view.model.id === id;
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
        var $batchActions, action, view, _availableActions, _i, _len, _ref;
        this.removeSubviews("action");
        $batchActions = $("<ul/>", {
          "class": "actions"
        });
        _availableActions = _.reject(this.actions, (function(_this) {
          return function(action) {
            return (action.available != null) && !action.available.call(_this);
          };
        })(this));
        this.allActions = new Ribs.Actions(_availableActions, {
          ribs: this
        });
        this.inlineActions = this.allActions.where({
          inline: true
        });
        this.batchActions = this.allActions.where({
          batch: true
        });
        _ref = this.batchActions;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          action = _ref[_i];
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
        var view, _i, _len, _ref, _results;
        _ref = this.subviews("action");
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          view = _ref[_i];
          view.render();
          _results.push(view.delegateEvents());
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
        _ref = this.subviews("list");
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          view = _ref[_i];
          view.render();
          _results.push(view.delegateEvents());
        }
        return _results;
      };

      List.prototype.initializeHeader = function() {
        var $header, attributes, toggle;
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
        _.each(this.displayAttributes, (function(_this) {
          return function(attribute) {
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
          };
        })(this));
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
  })(jQuery);

  (function($) {
    return Ribs.ListItem = (function(_super) {
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
        var action, attribute, inlineAction, key, listItemCell, _i, _len, _ref, _ref1;
        this.events || (this.events = {});
        _.extend(this.events, this._ribsEvents);
        if (this.itemCellView == null) {
          this.itemCellView = Ribs.ListItemCell;
        }
        if (this.actionView == null) {
          this.actionView = Ribs.InlineAction;
        }
        this.view = options != null ? options.view : void 0;
        this.listItemCells = [];
        _ref = this.view.displayAttributes;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          attribute = _ref[_i];
          attribute = _.clone(attribute);
          attribute.view = this;
          attribute.model = options.model;
          listItemCell = new this.itemCellView(attribute);
          this.listItemCells.push(listItemCell);
        }
        this.inlineActions = [];
        _ref1 = this.view.inlineActions;
        for (key in _ref1) {
          action = _ref1[key];
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
        var cell, div, inlineAction, toggle, ul, _i, _j, _len, _len1, _ref, _ref1;
        this.$el.empty();
        if (!this.model) {
          return;
        }
        this.$el.data("cid", this.model.cid);
        ul = $("<ul/>", {
          "class": "actions"
        });
        _ref = this.inlineActions;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          inlineAction = _ref[_i];
          $(ul).append(inlineAction.el);
          inlineAction.render();
          inlineAction.delegateEvents();
        }
        this.$el.append(ul);
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
        for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
          cell = _ref1[_j];
          this.$el.append(cell.el);
          cell.render();
          cell.delegateEvents();
        }
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
<<<<<<< HEAD
        if ($(document.activeElement).not(":radio").not(":checkbox").not(":button").is(":input,[contenteditable]")) {
=======
        if (this.view.suppressToggle) {
>>>>>>> Refactoring Ribs into multiple files. Removing requirejs as it wasn't working so well in the tests.
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
        var inlineAction, listItemCell, _i, _j, _len, _len1, _ref, _ref1;
        this.deselect();
        _ref = this.inlineActions;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          inlineAction = _ref[_i];
          inlineAction.remove();
        }
        _ref1 = this.listItemCells;
        for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
          listItemCell = _ref1[_j];
          listItemCell.remove();
        }
        return ListItem.__super__.remove.apply(this, arguments);
      };

      return ListItem;

    })(Backbone.View);
  })(jQuery);

  Ribs.ListItemCell = (function(_super) {
    __extends(ListItemCell, _super);

    ListItemCell.prototype.tagName = "div";

    ListItemCell.prototype.className = "cell";

    ListItemCell.prototype._ribsEvents = {
      'click .edit': 'handleEdit',
      'click .editableField': 'stopPropagation',
      'keypress .editableField': 'handleKeypress',
      'blur .editableField': 'saveEditedField'
    };

    function ListItemCell(options) {
      var _ref;
      this.events || (this.events = {});
      _.extend(this.events, this._ribsEvents);
      ListItemCell.__super__.constructor.apply(this, arguments);
      this.field = options.field;
      this.view = options.view;
      this.map = options.map;
      this.escape = options.escape;
      this.editable = options.editable;
      this.label = options.label;
      this.edit = options.edit;
      this.save = options.save;
      this.$el.addClass((_ref = options["class"]) != null ? _ref : options.field);
    }

    ListItemCell.prototype.renderableValue = function(nomap) {
      var value;
      value = this.model.get(this.field);
      if (!nomap && _.isFunction(this.map)) {
        value = this.map.call(this.view.view, value, this.model);
      }
      return value != null ? value : "";
    };

    ListItemCell.prototype.render = function() {
      var editBtnEl, label, _ref, _ref1;
      this.$el.empty();
      if (this.escape === false) {
        this.$el.html(this.renderableValue());
      } else {
        this.$el.text(this.renderableValue());
      }
      if (this.editable === true) {
        label = (_ref = this.label) != null ? _ref : this.field;
        editBtnEl = $("<span/>", {
          "class": 'edit button inline',
          title: "Edit " + label,
          text: '✎'
        });
        if ((_ref1 = this.model.get(this.field)) === (void 0) || _ref1 === null || _ref1 === '') {
          $(editBtnEl).addClass('show');
        }
        this.$el.append(editBtnEl);
      }
      return this;
    };

    ListItemCell.prototype.handleEdit = function(event) {
      var editField, key, option, optionEl, value, _i, _len, _ref, _ref1;
      if (this.editable === true) {
        value = this.model.get(this.field);
        if (_.isFunction(this.edit)) {
          editField = this.edit.call(this, value, this.model);
        } else if (_.isArray(this.edit)) {
          editField = $("<select/>");
          _ref = this.edit;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            option = _ref[_i];
            optionEl = $("<option/>", {
              value: option,
              text: option
            });
            editField.append(optionEl);
            $(optionEl).prop("selected", option === value);
          }
        } else if (_.isObject(this.edit)) {
          editField = $("<select/>");
          _ref1 = this.edit;
          for (key in _ref1) {
            option = _ref1[key];
            optionEl = $("<option/>", {
              value: key,
              text: option
            });
            $(optionEl).prop("selected", key === value);
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
      event.preventDefault();
      return false;
    };

    ListItemCell.prototype.stopPropagation = function(event) {
      event.preventDefault();
      return false;
    };

    ListItemCell.prototype.saveEditedField = function() {
      var changeSet, e, editField, value;
      editField = this.$(".editableField");
      if (_.isFunction(this.save)) {
        return this.save.call(this, editField, this.model);
      } else {
        value = editField.val();
        changeSet = $.extend(true, {}, this.model.attributes);
        changeSet[this.field] = value;
        if (!this.model._validate(changeSet, this.model)) {
          return;
        }
        try {
          return this.model.save(changeSet, {
            success: (function(_this) {
              return function() {
                return _this.render();
              };
            })(this),
            error: (function(_this) {
              return function() {
                return _this.render();
              };
            })(this)
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

}).call(this);
