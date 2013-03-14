Ribs
====

Ribs can be used to make beautiful things, like functional list widgets and, 
according to a large number of people, 
[women](http://en.wikipedia.org/wiki/Eve#Creation).

The meat and bones of Ribs is the `Ribs.List` - an extention to Backbone view 
which renders models from a collection and allows an intuitive way to define 
actions to run against selected models. 

Annotated Source
----------------

- [ribs.coffee](http://quid.github.com/ribs/docs/ribs.html).
- [hotkeys.coffee](http://quid.github.com/ribs/docs/hotkeys.html).

Example application
-------------------

A good way to learn how to use Ribs is to look at the 
[annotated source of our demo application](http://quid.github.com/ribs/docs/demo/todos.html).

You can see the application in action [here](http://quid.github.com/ribs/demo).

Dependencies
------------

+ [jquery.js](http://jquery.com)
+ [underscore.js](http://underscorejs.org)
+ [backbone.js](http://backbonejs.org)

Downloads
---------

+ [Ribs compiled to JavaScript](http://quid.github.com/ribs/ribs.js)
+ [Ribs compiled to minfied JavaScript](http://quid.github.com/ribs/ribs.min.js)
+ [CSS which might make your widgets more palatable](http://quid.github.com/ribs/ribs.css)


Keyboard Utilities
------------------

Support for keyboard shortcuts is one of the more useful features of Ribs.

Ribs lists can have jumpkeys. Jumpkeys are prefixed by 'g' and will put keyboard
focus on the first item in the Ribs list when triggered by the user.

Actions can have hotkeys. Pressing a hotkey will trigger the action. Input to
actions is a list of all selected items in the focussed Ribs list.

Both Jumpkeys and Hotkeys can be discovered by the user by hitting the global 
hotkey `?`. Calling `Ribs.getKeyboardManager().showKeyboardBindings()` will do the same.

Work in Progress
----------------

Ribs is a work in progress. It seems to work well in the lastest Chrome, Firefox
and Safari. Please let us know if something is wrong by [filing an issue on
GitHub](https://github.com/quid/ribs/issues).
