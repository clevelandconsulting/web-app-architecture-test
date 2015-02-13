//require('./core-backbone.js');

module.exports = {
	create: function (core, moduleID) {
		return {
			utils: {
				override: function(object, methodName, callback) {
					object[methodName] = callback(object[methodName]);
				},
				after: function(extraBehavior) {
					return function(original) {
						return function() {
							var returnValue = original.apply(this, arguments);
							extraBehavior.apply(this, arguments);
							return returnValue;
						}
					}
				},
				before: function(extraBehavior) {
					return function(original) {
						return function() {
							extraBehavior.apply(this, arguments);
							return original.apply(this, arguments);
						}
					}
				}
			},
			view: {
				makeCollectionView: function (config) {
					return core.view.createCollectionView(config);
				},
				initCollectionView: function (View, model) {
					var v = core.view.get(View, model);
					//console.log('new view = ', v);
					return v;
				},
				createCollectionView: function(config, model) {
					var View = this.makeCollectionView(config);
					return this.initCollectionView(View,model);
				},
				
				create_element: function (html) {
					return core.view.create_element(html);
				},
				renderCollection: function(container,items,template) {
					return core.view.renderCollection(container,items,template);
				},
				addToBody: function(element) {
					return core.view.addToBody(element);
				},
			},
			model: {
				make: function(config) {
					return core.model.create(config);
				},
				init: function (Model) {
					return core.model.get(Model);
				},
				create: function(config) {
					var Model = this.make(config);
					return this.init(Model);
				}
			},
			collection: {
				make: function(config) {
					return core.collection.create(config);
				},
				init: function (Collection) {
					return core.collection.get(Collection);
				},
				create: function(config) {
					var Collection = this.make(config);
					return this.init(Collection);
				}
			},
			events: {
				notify: function(event) {
					return core.events.notify(moduleID, event);
				},
				register: function(events) {
					return core.events.register(moduleID, events);
				}
			},
			log: core.log
		};
	}
};