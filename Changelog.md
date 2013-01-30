0.1.1 - Jan, 30, 2013

- A `displayAttributes` property `editable` now must be boolean.
  Use an `edit` property to change the default widget.
- Display attributes now have `save` property which can define a function to
  override the default `Backbone.Model` `save` which gets called.
- Display attributes are now escaped by default. Set `escape: false` to turn off.

0.1.0 - Jan, 21, 2013

- Updated Backbone to version 0.9.10.
- Using `$.fn.prop` instead of `$.fn.attr` when appropriate.
- Any `updateHeader`, `updateFooter`, etc. method is now `renderHeader`.
  The main `render` method will call respective sub-render methods while looping
  over the `renderOrder` property.
- Refactored `Action` into becoming instances of `Backbone.Model`.
- Introduced `Ribs.BatchAction` and `Ribs.InlineAction`, which are views.
- Bug fixes.
