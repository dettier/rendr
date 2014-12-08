var path = require('path'),
    _ = require('underscore'),
    layoutTemplates = {};

module.exports = exports = ViewEngine;

function ViewEngine(options) {
  this.options = options || {};

  /**
   * Ensure `render` is bound to this instance, because it can be passed around.
   */
  this.render = this.render.bind(this);
}

ViewEngine.prototype.render = function render(View /* Class */, data, callback) {
  var app, layoutData;

  data.locals = data.locals || {};
  app = data.app;
  layoutData = _.extend({}, data, {
    body: this.getViewHtml(View, data.locals, app),
    appData: app.toJSON(),
    bootstrappedData: this.getBootstrappedData(data.locals, app),
    _app: app
  });
  this.renderWithLayout(layoutData, app, callback);
};

/**
 * Render with a layout.
 */
ViewEngine.prototype.renderWithLayout = function renderWithLayout(locals, app, callback) {
  var LayoutView = app.loader.getAppViewClass();
  var view = new LayoutView({}, { app : app });

  var data = view.getTemplateData();
  data = view.decorateTemplateData(data);

  var template = view.getTemplate();
  var html = template(_.extend(data, locals));
  callback(null, html);
};

/**
 * Cache layout template function.
 */
ViewEngine.prototype.getLayoutTemplate = function getLayoutTemplate(app, callback) {
  var LayoutView = app.loader.getAppViewClass();
  callback(null, LayoutView.template);
};

ViewEngine.prototype.getViewHtml = function getViewHtml(View /* Class */, locals, app) {
  var view;

  locals = _.clone(locals);

  // Pass in the app.
  locals.app = app;
  view = new View(locals);
  return view.getHtml();
};

ViewEngine.prototype.getBootstrappedData = function getBootstrappedData(locals, app) {
  var bootstrappedData = {};

  _.each(locals, function(modelOrCollection, name) {
    if (app.modelUtils.isModel(modelOrCollection) || app.modelUtils.isCollection(modelOrCollection)) {
      bootstrappedData[name] = {
        summary: app.fetcher.summarize(modelOrCollection),
        data: modelOrCollection.toJSON()
      };
    }
  });
  return bootstrappedData;
};

ViewEngine.prototype.clearCachedLayouts = function () {
  layoutTemplates = {};
};
