var _ = require('underscore'),
  Backbone = require('backbone'),
  isServer = (typeof window === 'undefined'),
  isAMDEnvironment = !isServer && (typeof define !== 'undefined');

if (!isServer) {
  Backbone.$ = window.$ || require('jquery');
}

function noop() {}

function stringRouteDefinitionToObject(element) {
  var parts = element.split('#');
  return {
    controller: parts[0],
    action: parts[1]
  };
}

function parseRouteDefinitions(definitions) {
  return definitions.reduce(function(route, element) {
    if (_.isString(element)) {
      element = stringRouteDefinitionToObject(element);
    }
    return _.extend(route, element);
  }, {});
}

/**
 * Base router class shared between ClientRouter and ServerRouter.
 */
function BaseRouter(options) {
  this.route = this.route.bind(this);
  this._routes = [];
  this._initOptions(options);
  this.initialize(options);
}

_.extend(BaseRouter.prototype, Backbone.Events, {
  /**
   * Config
   *   - errorHandler: function to correctly handle error
   *   - appConfig:
   *     - getRoutes (required)
   *     - getController(name, callback) (required)
   */
  options: null,

  /**
   * Internally stored route definitions.
   */
  _routes: null,

  reverseRoutes: false,

  initialize: noop,

  _initOptions: function(options) {
    options = options || {};

    this.loader = options.loader;
    this.options = options;
  },

  getController : function (controllerName, callback) {
    this.loader.getControllerClass(controllerName, callback);
  },

  getRedirect: function(route, params) {
    var redirect = route.redirect;

    if (typeof redirect === 'function') {
      redirect = redirect(params);
    }

    return redirect;
  },

  getRouteBuilder: function() {
    return this.loader.getRouteBuilder();
  },

  buildRoutes: function() {
    var routeBuilder = this.getRouteBuilder(),
      routes = [];

    function captureRoutes() {
      routes.push(_.toArray(arguments));
    }

    routeBuilder(captureRoutes);
    if (this.reverseRoutes) {
      routes = routes.reverse();
    }

    routes.forEach(this.addRouteDefinition, this);

    return this.routes();
  },

  addRouteDefinition: function(route) {
    try {
      this.route.apply(this, route);
    } catch (error) {
      error.message = 'Error building routes (' + error.message + ')';
      throw error;
    }
  },

  /**
   * Returns a copy of current route definitions.
   */
  routes: function() {
    return this._routes.slice().map(function(route) {
      return route.slice();
    });
  },

  /**
   * Method passed to routes file to build up routes definition.
   * Adds a single route definition.
   */
  route: function(pattern) {
    var action, definitions, handler, route, routeObj;

    definitions = _.toArray(arguments).slice(1);
    route = parseRouteDefinitions(definitions);

    if (!(pattern instanceof RegExp) && pattern.slice(0, 1) !== '/') {
      pattern = "/" + pattern;
    }

    handler = this.getHandler(pattern, route);
    routeObj = [pattern, route, handler];
    this._routes.push(routeObj);
    this.trigger('route:add', routeObj);
    return routeObj;
  },

  /**
   * Methods to be extended by subclasses.
   * -------------------------------------
   */

  /**
   * This is the method that renders the request.
   */
  getHandler: noop
});

module.exports = BaseRouter;
module.exports.setAMDEnvironment = function(flag) {
  isAMDEnvironment = flag;
};
