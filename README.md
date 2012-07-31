Ribs
====

Ribs can be used to make beautiful things, like functional list widgets and, 
according to a large number of people, 
[women](http://en.wikipedia.org/wiki/Eve#Creation).

The meat and bones of Ribs is the `Ribs.List` - an extended Backbone view which 
renders a given collection and set of actions. 

Documentation
-------------

Unfortunately we haven't written a tonne of official documentation yet.
However you can feel free to look at the [annotated source](ribs.coffee.html).

Another good way to learn how to use Ribs is to look at the 
[annotated source of our demo application](demo/todos.js.html) 
(yet another Todo manager).

You can see the [application in action here](http://quid.github.com/ribs/demo).

Depenencies
-----------

+ [jquery.js](http://jquery.com)
+ [underscore.js](http://underscorejs.org)
+ [backbone.js](http://backbonejs.org)
+ [laconic.js](http://joestelmach.github.com/laconic)

Downloads
---------

+ [Ribs in CoffeeScript](http://quid.github.com/ribs/ribs.coffee)
+ [Ribs compiled to JavaScript](http://quid.github.com/ribs/ribs.js)
+ [Ribs compiled to JavaScript and uglified](http://quid.github.com/ribs/ribs.min.js)
+ [CSS which might make your widgets more palatable](http://quid.github.com/ribs/ribs.css)


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

Work in Progress
----------------

Ribs is a work in progress. It seems to work well in the lastest Chrome, Firefox
and Safari. Please let us know if something is wrong by [filing an issue on
GitHub](https://github.com/quid/ribs/issues).
