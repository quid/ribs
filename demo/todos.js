(function($){

    $(function() {

        // Firstly, build a Backbone collection with some bootstrap data.
        var todos = new Backbone.Collection([ 
            { name: "Go to the gym", completed: false },
            { name: "Send a post card to Elaine", completed: false }
        ]);

        // Next we build a Ribs list for the todos.
        var todos_view = new Ribs.List({

            // Reference the collection.
            collection: todos,

            // Give todos  a better name than the default 'item'.
            itemName: "todo",

            // Jump to the list by hitting __g__ and then __t__.
            jumpkey: "t",

            // This set of attributes determines what are shown as columns.
            displayAttributes: [
                {
                    label: "todo",
                    field: "name",
                    editable: true
                },
                { 
                    label: "",
                    field: "completed", 
                    // Convert boolean field to a check mark or empty string.
                    map: function(complete) { 
                        return complete ? "✓" : "";
                    }
                }
            ],
            // We're providing several different flavors of action here.
            actions: [
                {
                    // This label will show up in the keyboard help pane.
                    label: "New TODO",

                    // This overrides the label shown on the button.
                    batchLabel: "New",

                    // Hotkey available when focus is within ribs object.
                    hotkey: "N",

                    // No minimum selection criterea.
                    min: 0,

                    // This is called on click, or when hotkey is hit
                    // remember: scope is the `Ribs.List` instance.
                    activate: function() {
                        // Ask user for some text.
                        var name = prompt("What do you need to do?");
                        if (name && name !== "") {
                            // Add it to the collection.
                            var model = this.collection.push({ name: name, completed: false});
                            // Focus the item
                            this.getByCid(model.cid).$el.focus();
                        }
                    }
                },

                {
                    label: "Complete",
                    inlineLabel: "✓",
                    inline: true,
                    batch: false,
                    hotkey: "c",
                    activate: function(selected) {
                        _.each(selected, function(model) {
                            model.set("completed", true);
                        });
                    }
                },

                // This action is completely hidden from the rendered 
                // Ribs list. However It is visible on the keyboard
                // bindings pane and can be activated by hotkey.
                {
                    label: "Uncomplete",
                    batch: false,
                    hotkey: "u",
                    min: 0,
                    activate: function(selected) {
                        _.each(selected, function(model) {
                            model.set("completed", false);
                        });
                    }
                },

                {
                    label: "Clear selected",
                    hotkey: "C",
                    activate: function(selected) {
                        c = this.collection;
                        _.each(selected, function(model) {
                            c.remove(model);
                        });
                    }
                }
            ],

            // We're overriding the default item view just to get the
            // strike-thru look happening for completed items.
            itemView: Ribs.ListItem.extend({
                initialize: function(options) {
                    var _this = this;
                    this.model.on("change", function(){
                        _this.$el.toggleClass("done", _this.model.get("completed"));
                    });
                }
            })

        });


        // Add the Ribs list to the DOM.
        $("body").prepend(todos_view.el);

        // Render the Ribs list.
        todos_view.render();
        $("a[href=#showKeyboardBindings]").click(function() {
            Ribs.List.keyboardManager.showKeyboardBindings();
            return false;
        });
        
    });

})(jQuery);
