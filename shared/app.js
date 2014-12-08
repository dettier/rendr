/**
 * This is the app instance that is shared between client and server.
 * The client also subclasses it for client-specific stuff.
 */

var Backbone = require('backbone'),
    Fetcher = require('./fetcher'),
    ModelUtils = require('./modelUtils'),
    isServer = (typeof window === 'undefined');

if (!isServer) {
  Backbone.$ = window.$ || require('jquery');
}

module.exports = Backbone.Model.extend({

  defaults: {
    loading: false
  },

  /**
   * @shared
   */
  constructor: function(attributes, options) {
    attributes = attributes || {};
    this.options = options || {};
    this.loader  = this.options.loader;

    if (!loader) {
      throw new Error("Loader is not defined");
    }

    this.modelUtils = this.options.modelUtils || new ModelUtils(this.loader);

    /**
     * On the server-side, you can access the Express request, `req`.
     */
    if (this.options.req) {
      this.req = this.options.req;
    }

    /**
     * Instantiate the `Fetcher`, which is used on client and server.
     */
    this.fetcher = new Fetcher({
      app: this
    });

    /**
     * Initialize the `ClientRouter` on the client-side.
     */
    if (!isServer) {
      var ClientRouter = this.loader.getClientLoaderClass();
      new ClientRouter({
        app: this,
        appViewClass: this.loader.getAppViewClass(),
        rootPath: attributes.rootPath
      });
    }

    Backbone.Model.apply(this, arguments);

    if (this.postInitialize) {
      console.warn('`postInitialize` is deprecated, please use `initialize`');
      this.postInitialize();
    }
  },

  /**
   * @shared
   */
  fetch: function() {
    this.fetcher.fetch.apply(this.fetcher, arguments);
  },

  /**
   * @client
   */
  getAppViewClass: function () {
    return this.loader.getAppViewClass();
  },

  /**
   * @client
   */
  bootstrapData: function(modelMap) {
    this.fetcher.bootstrapData(modelMap);
  },

  /**
   * @client
   */
  start: function() {
    this.router.start();
    this.trigger('start');
  }
});
