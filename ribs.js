(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  (function($) {
    var walk_context;
    window.Ribs = {};
    Ribs._boundJumpKeys = {};
    Ribs._jumpPrefixKey = "g";
    Ribs._jumpTimeout = 1000;
    Ribs._poiseJump = function() {
      Ribs._readyToJump = true;
      clearTimeout(Ribs._jumpInterval);
      return Ribs._jumpInterval = setTimeout(function() {
        return Ribs._readyToJump = false;
      }, Ribs._jumpTimeout);
    };
    Ribs._makeJump = function(charcode) {
      var bindings;
      Ribs._readyToJump = false;
      clearTimeout(Ribs._jumpTimeout);
      bindings = Ribs._boundJumpKeys[charcode];
      if ((bindings != null) && bindings.length > 0) {
        return _.each(bindings, function(binding) {
          if (!((binding.el != null) && $(binding.el).is(":hidden"))) {
            return binding.fn.apply(binding.ctx);
          }
        });
      }
    };
    Ribs.bindJumpKey = function(label, key, fn, ctx, el) {
      var charCode, _base;
      charCode = key.charCodeAt(0);
      if (!(el != null) && ctx instanceof Backbone.View) {
        el = ctx.el;
      }
      (_base = Ribs._boundJumpKeys)[charCode] || (_base[charCode] = []);
      Ribs._boundJumpKeys[charCode].push({
        label: label,
        fn: fn,
        ctx: ctx,
        el: el,
        key: key
      });
      return charCode;
    };
    Ribs.unbindJumpKey = function(key, ctx) {
      var charCode;
      charCode = key.charCodeAt(0);
      return _.each(Ribs._boundJumpKeys[charCode], function(binding, i) {
        if (binding.ctx === ctx) {
          Ribs._boundJumpKeys[charCode].splice(i, 1);
          if (Ribs._boundJumpKeys[charCode].length === 0) {
            return delete Ribs._boundJumpKeys[charCode];
          }
        }
      });
    };
    Ribs._registeredListViews = {};
    Ribs.showKeyboardBindings = function() {
      var className, keys, overlay, ul;
      className = "ribs-keyboard-shortcuts-overlay";
      $("." + className).remove();
      overlay = $.el.div({
        "class": className
      });
      ul = $.el.ul();
      $(overlay).append($.el.h1("Navigation"), ul);
      _.each(_.flatten(Ribs._boundJumpKeys), function(binding) {
        var li;
        if (!(binding.el && $(binding.el).is(":hidden"))) {
          li = $.el.li({
            "class": "hotkey"
          }, $.el.span({
            "class": "jump key"
          }, "g" + binding.key), $.el.span({
            "class": "action"
          }, "Go to " + binding.label));
          return $(ul).append(li);
        }
      });
      keys = [
        {
          key: "?",
          label: "Open this page"
        }, {
          key: "j",
          label: "Next item"
        }, {
          key: "J",
          label: "Last item"
        }, {
          key: "k",
          label: "Previous item"
        }, {
          key: "K",
          label: "First item"
        }, {
          key: "x",
          label: "Select/deselect item"
        }, {
          key: "X",
          label: "Select/deselect all"
        }, {
          key: "_",
          label: "Expand/collapse list"
        }, {
          key: "R",
          label: "Refresh items"
        }
      ];
      _.each(keys, function(binding) {
        var li;
        li = $.el.li({
          "class": "hotkey"
        }, $.el.span({
          "class": "key"
        }, binding.key), $.el.span({
          "class": "action"
        }, binding.label));
        return $(ul).append(li);
      });
      _.each(Ribs._registeredListViews, function(view) {
        var h1;
        if (!$(view.el).is(":hidden")) {
          h1 = $.el.h1(view.plural());
          ul = $.el.ul();
          $(overlay).append(h1, ul);
          return _.each(view.actions, function(action) {
            var li;
            if (action.hotkey != null) {
              li = $.el.li({
                "class": "hotkey"
              }, $.el.span({
                "class": "key"
              }, action.hotkey), $.el.span({
                "class": "action"
              }, action.label));
              return $(ul).append(li);
            }
          });
        }
      });
      $(overlay).bind('click', function() {
        $(overlay).remove();
        return false;
      });
      $(window).bind('keyup', function(event) {
        if (event.which === 27) {
          $(overlay).remove();
        }
        return false;
      });
      $("body").append(overlay);
      return overlay;
    };
    $(window).on("keypress", function(event) {
      var prefix;
      if (!$(":focus").is("input:text, textarea")) {
        prefix = Ribs._jumpPrefixKey.charCodeAt(0);
        if (event.which === prefix && !Ribs._readyToJump) {
          return Ribs._poiseJump();
        } else if (Ribs._readyToJump) {
          return Ribs._makeJump(event.which);
        } else if (event.which === 63) {
          return Ribs.showKeyboardBindings();
        }
      }
    });
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
        'click a': 'stopPropogation',
        'keypress': 'keypressed'
      };

      function ListItem(options) {
        var _this = this;
        this.events || (this.events = {});
        _.extend(this.events, this._ribsEvents);
        this.view = options != null ? options.view : void 0;
        this.listItemCells = [];
        _.each(this.view.displayAttributes, function(attribute) {
          attribute = _.clone(attribute);
          attribute.view = _this;
          attribute.model = options.model;
          return _this.listItemCells.push(new Ribs.ListItemCell(attribute));
        });
        ListItem.__super__.constructor.call(this, options);
        if (this.model != null) {
          this.model.on('change', this.render, this);
          this.model.on('remove', this.remove, this);
          this.model.on('stealfocus', this.stealfocus, this);
        }
      }

      ListItem.prototype.render = function() {
        var obj, toggle,
          _this = this;
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
        _.each(this.listItemCells, function(cell) {
          cell.render();
          cell.delegateEvents();
          return _this.$el.append(cell.el);
        });
        obj = this.model.toJSON();
        return _.each(this.view.inlineActions, function(action, key) {
          if (!((action.filter != null) && action.filter(_this.model) === false)) {
            return _this.$el.append(action.renderInline(_this));
          }
        });
      };

      ListItem.prototype.toggle = function() {
        if (!(this.$el.is(".disabled") || this.view.suppressToggle)) {
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
        this.$el.find("input:checkbox").attr("checked", "checked");
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
        this.$el.find("input:checkbox").removeAttr("checked");
        if (!options.silent) {
          return this.model.trigger("deselected");
        }
      };

      ListItem.prototype.enable = function() {
        this.$el.removeClass("disabled");
        this.$el.find("input:checkbox").removeAttr("disabled");
        this.$el.attr("tabindex", 0);
        return this.model.trigger("enabled");
      };

      ListItem.prototype.disable = function() {
        this.$el.addClass("disabled");
        this.$el.find("input:checkbox").attr("disabled", "disabled");
        this.$el.attr("tabindex", -1);
        return this.model.trigger("disabled");
      };

      ListItem.prototype.remove = function() {
        this.deselect();
        return ListItem.__super__.remove.call(this);
      };

      ListItem.prototype.keypressed = function(event) {
        var _ref;
        if (((_ref = event.which) === 13 || _ref === 120) && !this.view.suppressToggle) {
          this.toggle();
          return;
        }
        if (this.view.inlineActions.length) {
          return event.originalEvent.listItem = this;
        }
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
        this.model.on("change change:" + this.field, this.render, this);
      }

      ListItemCell.prototype.renderableValue = function(nomap) {
        var value;
        value = this.model.get(this.field);
        value || (value = walk_context(this.field, this.model.toJSON()));
        if ("map" in this.options && !nomap) {
          value = this.map(value, this.model, this.$el);
        }
        return value;
      };

      ListItemCell.prototype.render = function() {
        var editableEl, _ref;
        this.$el.empty();
        if (this.escape) {
          this.$el.text(this.renderableValue());
        } else {
          this.$el.html(this.renderableValue());
        }
        if (this.editable) {
          editableEl = $.el.span({
            "class": 'edit button inline'
          }, '✎');
          if ((_ref = this.model.get(this.field)) === null || _ref === '') {
            $(editableEl).addClass('show');
          } else {
            $(editableEl).removeClass('show');
          }
          this.$el.append(editableEl);
        }
        return this;
      };

      ListItemCell.prototype.edit = function() {
        var editField;
        if (this.editable) {
          if (this.editable instanceof Function) {
            editField = $(this.editable(this.renderableValue(true), this.model));
          } else {
            editField = $($.el.input({
              type: 'text',
              value: this.renderableValue(true)
            }));
          }
          editField.addClass("editableField");
          this.$el.html(editField);
          this.delegateEvents();
          editField.focus();
          this.model.editing = true;
        }
        return false;
      };

      ListItemCell.prototype.saveEditedField = function(e) {
        var changeSet, field;
        field = $(e.target);
        changeSet = {};
        changeSet[this.field] = field.val();
        this.model.changeSet = changeSet;
        try {
          this.model.save(changeSet, {
            wait: true
          });
        } catch (e) {
          this.render();
        }
        if (!this.model.hasChanged()) {
          this.model.trigger("change:" + this.field);
        }
        return this.model.editing = false;
      };

      return ListItemCell;

    })(Backbone.View);
    Ribs.List = (function(_super) {

      __extends(List, _super);

      List.prototype.itemView = Ribs.ListItem;

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
        var els, key,
          _this = this;
        this.sortArrows = {};
        this.sortArrows[-1] = "↓";
        this.sortArrows[1] = "↑";
        this.className || (this.className = "");
        this.className += " ribs";
        this.events || (this.events = {});
        _.extend(this.events, this._ribsEvents);
        _.extend(this, options);
        key = _.uniqueId('ribs_view_');
        Ribs._registeredListViews[key] = this;
        els = _.map(this.renderOrder, function(t) {
          if (!_this["suppress" + t]) {
            return _this["initialize" + t]();
          }
        });
        List.__super__.constructor.call(this, options);
        _.each(els, function(el) {
          if (el) {
            return _this.$el.append(el);
          }
        });
        if (this.jumpkey != null) {
          Ribs.bindJumpKey(this.plural(), this.jumpkey, function() {
            return this.$el.find(this.jumpSelector).focus();
          }, this);
        }
        this._subviews = [];
        if (this.collection != null) {
          this.setCollection(this.collection);
        }
        this.on('refresh', this.refresh);
        this.$el.addClass('ribs');
      }

      List.prototype.setCollection = function(collection) {
        var _this = this;
        this.collection = collection;
        _.each(_.union(this.inlineActions, this.batchActions), function(action) {
          if (action != null) {
            return action.setCollection(_this.collection);
          }
        });
        this.collection.on("add", function(model) {
          return _this.addItem(model);
        }, this);
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
          return _this.collection.getByCid($(el).data("cid"));
        });
      };

      List.prototype.getDeselected = function() {
        var _this = this;
        if (this.$list == null) {
          return [];
        }
        return this.$list.find(".item:not(.selected)").map(function(idx, el) {
          return _this.collection.getByCid($(el).data("cid"));
        });
      };

      List.prototype.getNumSelected = function() {
        if (this.$list == null) {
          return 0;
        }
        return this.$list.find(".item.selected").size();
      };

      List.prototype.getNumTotal = function() {
        if (this.collection == null) {
          return 0;
        }
        return this.collection.length;
      };

      List.prototype.toggleSelected = function(event) {
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
        var field;
        field = $(event.target).attr("data-sort-by");
        if (field != null) {
          return this.sortCollectionBy(field);
        }
      };

      List.prototype.sortCollectionBy = function(field) {
        var dir, old_field, _base,
          _this = this;
        old_field = this.collection.sortingBy;
        (_base = this.collection).sortingDirection || (_base.sortingDirection = {});
        this.collection.sortingBy = field;
        if (field === old_field && field in this.collection.sortingDirection) {
          this.collection.sortingDirection[field] *= -1;
        } else {
          this.collection.sortingDirection[field] = 1;
        }
        dir = this.collection.sortingDirection[field];
        if (this.collection.remoteSort) {
          this.collection.trigger('remoteSort', field, dir);
        } else {
          this.collection.comparator = function(ma, mb) {
            var a, b;
            a = walk_context(field, ma.toJSON());
            b = walk_context(field, mb.toJSON());
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
          this.collection.sort();
          this.render();
        }
        return this.updateHeaderArrows(field, old_field);
      };

      List.prototype.updateHeaderArrows = function(field, old_field) {
        var dir, el, label, old_el, old_label, re, _ref, _ref1, _ref2;
        if (this.collection == null) {
          return;
        }
        re = new RegExp(" (" + (_.values(this.sortArrows).join("|")) + ")$|$");
        dir = (_ref = this.collection.sortingDirection[field]) != null ? _ref : 1;
        if (old_field != null) {
          old_el = this.$header.find("[data-sort-by='" + old_field + "']");
          old_label = (_ref1 = old_el.html()) != null ? _ref1.replace(re, "") : void 0;
          $(old_el).html(old_label);
        }
        el = this.$header.find("[data-sort-by='" + field + "']");
        label = (_ref2 = $(el).html()) != null ? _ref2.replace(re, " " + this.sortArrows[dir]) : void 0;
        return $(el).html(label);
      };

      List.prototype.keypressed = function(event) {
        if (!(Ribs._readyToJump || $(":focus").is("input:text, textarea"))) {
          if (event.which === 106) {
            return $(":focus").nextAll(".item:visible:not(.disabled):first").focus();
          } else if (event.which === 107) {
            return $(":focus").prevAll(".item:visible:not(.disabled):first").focus();
          } else if (event.which === 74) {
            return this.$list.find(".item:last").focus();
          } else if (event.which === 75) {
            return this.$list.find(".item:first").focus();
          } else if (event.which === 95) {
            return this.toggleVisibility();
          } else if (event.which === 88) {
            return this.toggleSelected();
          } else if (event.which === 82) {
            this.collection.trigger('before:refresh');
            return this.trigger('refresh');
          } else {
            return this.trigger("keypressed", event);
          }
        }
      };

      List.prototype.refresh = function() {
        var _this = this;
        if (this.collection.url != null) {
          return this.collection.fetch({
            success: function() {
              var _ref;
              return (_ref = _this.$list.find(":first")) != null ? _ref.focus() : void 0;
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
            if (_this.$el.find(document.activeElement).length === 0) {
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
        var title, _ref;
        title = (_ref = this.title) != null ? _ref : this.plural();
        if (title instanceof Function) {
          title = title.call(this);
        }
        this.$title = $($.el.h1({
          "class": "title"
        }, title));
        return this.$title;
      };

      List.prototype.initializeActions = function() {
        var _this = this;
        this.batchActions = [];
        this.inlineActions = [];
        this.$batchActions = $($.el.ul({
          "class": "actions"
        }));
        _.each(this.actions, function(actionConfig) {
          var action;
          actionConfig.collection = _this.collection;
          actionConfig.view = _this;
          action = new Ribs.Action(actionConfig);
          if (action.inline) {
            _this.inlineActions.push(action);
          }
          if (action.batch !== false) {
            _this.batchActions.push(action);
            action.render();
            return _this.$batchActions.append(action.el);
          }
        });
        if (this.batchActions.length) {
          return this.$batchActions;
        } else {
          return null;
        }
      };

      List.prototype.initializeList = function() {
        this.$list = $($.el.ul({
          "class": "list"
        }));
        return this.$list;
      };

      List.prototype.addItem = function(model) {
        var itemView, view;
        if (Backbone.View.prototype.isPrototypeOf(this.itemView.prototype)) {
          itemView = this.itemView;
        } else {
          itemView = this.itemView(model);
        }
        view = new itemView({
          model: model,
          view: this
        });
        this.$list.append(view.el);
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
        this.collection.trigger("deselected");
        return (_ref = this.collection) != null ? _ref.each(this.addItem, this) : void 0;
      };

      List.prototype.get = function(id) {
        return _.find(this._subviews, function(view) {
          return view.model.id === id;
        });
      };

      List.prototype.render = function() {
        return _.each(this._subviews, function(view, i) {
          return view.render();
        });
      };

      List.prototype.initializeHeader = function() {
        var attributes, toggle,
          _this = this;
        this.$header = $($.el.div({
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
          this.$header.append($.el.div({
            "class": "toggle"
          }, toggle));
        }
        if (this.displayAttributes != null) {
          attributes = this.displayAttributes;
        } else {
          attributes = _.map(this.collection.first().toJSON(), function(v, k) {
            return {
              field: k
            };
          });
        }
        _.each(attributes, function(attribute) {
          var klass, label, _ref, _ref1;
          label = (_ref = attribute.label) != null ? _ref : attribute.field;
          klass = (_ref1 = attribute["class"]) != null ? _ref1 : attribute.field;
          return _this.$header.append($.el.div({
            "class": klass,
            "data-sort-by": attribute.sortField || attribute.field
          }, label));
        });
        this.$header.find(".maximize, .minimize").click(function() {
          return _this.toggleVisibility();
        });
        this.$header.find("[data-sort-by=" + this.collection.sortingBy + "]").append(" " + this.sortArrows[1]);
        return this.$header;
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
        this.$footer = $($.el.div({
          "class": "footer"
        }));
        this.updateFooter();
        return this.$footer;
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
        'click': 'triggerAction',
        'keypress': 'keypressedHere'
      };

      function Action(options) {
        this.min = 1;
        this.max = -1;
        this.arity = null;
        this.check = null;
        this.events || (this.events = {});
        _.extend(this.events, this._ribsEvents);
        _.extend(this, options);
        Action.__super__.constructor.call(this, options);
        if (this.collection != null) {
          this.setCollection(this.collection);
        }
        this.checkRequirements();
      }

      Action.prototype.setCollection = function(collection) {
        if (collection != null) {
          this.collection = collection;
          this.collection.on("selected deselected reset", this.checkRequirements, this);
          if (this.hotkey != null) {
            return this.view.on("keypressed", this.keypressedOnView, this);
          }
        }
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

      Action.prototype.allowed = function(l) {
        var a, allow, r1, r2, r3;
        l || (l = this.view.getNumSelected());
        allow = false;
        if (this.arity != null) {
          a = this.arity;
          r1 = a === l;
          r2 = a === -1;
          r3 = !!(a % 1) && l >= Math.floor(a);
          allow = r1 || r2 || r3;
        } else {
          r1 = this.min === -1 || l >= this.min;
          r2 = this.max === -1 || l <= this.max;
          allow = r1 && r2;
        }
        if (allow && (this.check != null)) {
          allow = this.check.apply(this.view, [this.view.getSelected()]);
        }
        return allow;
      };

      Action.prototype.disable = function() {
        this.$el.addClass("disabled");
        return this.$el.find(".button").attr("tabindex", -1);
      };

      Action.prototype.enable = function() {
        this.$el.removeClass("disabled");
        return this.$el.find(".button").attr("tabindex", 0);
      };

      Action.prototype.triggerAction = function(event, listItem) {
        if (!this.$el.is(".disabled") && this.allowed()) {
          return this.activate.call(this.view, this.view.getSelected(), listItem);
        }
      };

      Action.prototype.triggerActionInline = function(event, listItem) {
        if (!listItem.$el.is(".disabled")) {
          return this.activate.call(this.view, [listItem.model], listItem);
        }
      };

      Action.prototype.keypressedHere = function(event) {
        if (event.which === 13) {
          this.triggerAction(event);
          return false;
        }
        return true;
      };

      Action.prototype.keypressedOnView = function(event) {
        var listItem;
        if ((this.hotkey != null) && this.hotkey.charCodeAt(0) === event.which) {
          listItem = event.originalEvent.listItem;
          if ((listItem != null) && (this.inline != null)) {
            this.triggerActionInline(event, listItem);
          } else {
            this.triggerAction(event, listItem);
          }
          return false;
        }
      };

      Action.prototype.render = function() {
        return this.$el.html(this.drawButton());
      };

      Action.prototype.drawButton = function(inline, listItem) {
        var btn, label, tabindex, _ref, _ref1;
        if (inline == null) {
          inline = false;
        }
        if (inline || !this.$el.is(".disabled")) {
          tabindex = 0;
        } else {
          tabindex = -1;
        }
        btn = $.el.div({
          "class": "button",
          tabindex: tabindex
        });
        if (inline) {
          label = (_ref = this.inlineLabel) != null ? _ref : this.label;
          if ((listItem != null) && label instanceof Function) {
            label = label.call(this, listItem.model);
          }
        } else {
          label = (_ref1 = this.batchLabel) != null ? _ref1 : this.label;
          if (this.hotkey != null) {
            label = this.constructor.highlightHotkey(label, this.hotkey);
          }
        }
        $(btn).html(label);
        $(btn).attr("title", this.label);
        return $(btn);
      };

      Action.prototype.renderInline = function(listItem) {
        var btn,
          _this = this;
        btn = this.drawButton(true, listItem);
        btn.addClass("inline");
        $(btn).on("click", function(event) {
          _this.triggerActionInline(event, listItem);
          return false;
        });
        $(btn).on("keypress", function(event) {
          if (event.which === 13) {
            _this.triggerActionInline(event, listItem);
            return false;
          }
        });
        return btn;
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
    return walk_context = function(name, context) {
      var path, value;
      path = name.split(".");
      value = context[path.shift()];
      while ((value != null) && path.length > 0) {
        context = value;
        value = context[path.shift()];
      }
      if (typeof value === "function") {
        return value.apply(context);
      }
      return value;
    };
  })(jQuery);

}).call(this);
