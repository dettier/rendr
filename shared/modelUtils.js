/**
 * Since we make rendr files AMD friendly on app setup stage
 * we need to pretend that this code is pure commonjs
 * means no AMD-style require calls.
 */
var BaseModel = require("./base/model"),
    BaseCollection = require("./base/collection");

module.exports = ModelUtils;

function ModelUtils(loader) {
  this.loader = loader;
  this._classMap = {};
}

ModelUtils.prototype.getModel = function(path, attrs, options, callback) {
  attrs = attrs || {};
  options = options || {};
  this.getModelConstructor(path, function(err, Model) {
    callback(new Model(attrs, options));
  });
};

ModelUtils.prototype.getCollection = function(path, models, options, callback) {
  models = models || [];
  options = options || {};
  this.getCollectionConstructor(path, function(err, Collection) {
    callback(new Collection(models, options));
  });
};

ModelUtils.prototype.getModelConstructor = function(path, callback) {
  path = this.underscorize(path);
  this.loader.getModelClass(path, callback);
};

ModelUtils.prototype.getCollectionConstructor = function(path, callback) {
  path = this.underscorize(path);
  this.loader.getCollectionClass(path, callback);
};

ModelUtils.prototype.isModel = function(obj) {
  return obj instanceof BaseModel;
};

ModelUtils.prototype.isCollection = function(obj) {
  return obj instanceof BaseCollection;
};

ModelUtils.prototype.getModelNameForCollectionName = function(collectionName) {
  var Collection;
  Collection = this.getCollectionConstructor(collectionName);
  return this.modelName(Collection.prototype.model);
};

ModelUtils.uppercaseRe = /([A-Z])/g;

ModelUtils.prototype.underscorize = function(name) {
  if (name == null) {
    return undefined;
  }
  name = name.replace(ModelUtils.uppercaseRe, function(c) {
    return "_" + c.toLowerCase();
  });
  if (name[0] === "_") {
    name = name.slice(1);
  }
  return name;
};

/**
 * The 'name' property is added to the constructor when using a named function,
 * and it cannot be changed.  I.e.:
 *
 * function MyClass(){}
 * MyClass.name
 * -> "MyClass"
 *
 * We first look for the 'id' property of the constructor, which is compatible
 * with standard Backbone-style class inheritance.
 *
 * var MyClass = Backbone.Model.extend({});
 * MyClass.name
 * -> ""
 * MyClass.id = "MyClass"
 */
ModelUtils.prototype.modelName = function(modelOrCollectionClass) {
  return this.underscorize(modelOrCollectionClass.id || modelOrCollectionClass.name);
};

ModelUtils.prototype.modelIdAttribute = function(modelName, callback) {
  this.getModelConstructor(modelName, function(constructor) {
    callback(constructor.prototype.idAttribute);
  });
};
