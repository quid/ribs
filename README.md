Ribs
====

Ribs can be used to make beautiful things, like
functional collection widgets and, according to a large number of people, 
[women](http://en.wikipedia.org/wiki/Eve#Creation).

The meat and bones of Ribs is the `Ribs.List` - an extended Backbone view which 
renders a given collection and set of actions. 


Keyboard Utilities
------------------

Support for keyboard shortcuts is one of the more useful features of Ribs.

Ribs lists can have jumpkeys. Jumpkeys are prefixed by 'g' and will put keyboard
focus on the first item in the Ribs list. Additional jumpkeys can be registered
at will with the `Ribs.registerJumpKey(...)` function.

Actions can have hotkeys. Pressing a hotkey will trigger the action on all 
selected items in the focussed Ribs list.

Both Jumpkeys and Hotkeys can be discovered by the user by hitting the global 
hotkey `?`. Calling `Ribs.showKeyboardBindings()` will do the same.


Depenencies
-----------

+ [jquery.js](http://jquery.com)
+ [underscore.js](http://underscorejs.org)
+ [backbone.js](http://backbonejs.org)
+ [laconic.js](http://joestelmach.github.com/laconic)


Example
-------

