var Sandbox = {
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
				create: function () {
					return core.view.create();
				},
				create_element: function (html) {
					return core.view.create_element(html);
				},
				renderCollection: function(container,items,template) {
					return core.view.renderCollection(container,items,template);
				},
				/*
build: function (object, template) {
					return core.view.renderTemplate(object,template);
				},
				addHTMLToContainerAtEnd: function (container, html) {
					return core.view.addHTML(container, html, 'beforeend');
				},
*/
				addToBody: function(element) {
					return core.view.addToBody(element);
				},
			},
			collection: {
				create: function() {
					return core.collection.create();
				}
			},
			events: {
				notify: function(object) {
					return core.events.notify(moduleID, object);
				},
				addEvent: function(container, eventInfo, objectHash, object) {
					return core.events.bind(container,eventInfo,objectHash, object);
				}
			},
			log: core.log
		};
	}
}