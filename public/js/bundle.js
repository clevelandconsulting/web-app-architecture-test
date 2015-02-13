(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*
var mediator = (function(){
    var subscribe = function(channel, fn){
        if (!mediator.channels[channel]) mediator.channels[channel] = [];
        mediator.channels[channel].push({ context: this, callback: fn });
        return this;
    },
 
    publish = function(channel){
        if (!mediator.channels[channel]) return false;
        var args = Array.prototype.slice.call(arguments, 1);
        for (var i = 0, l = mediator.channels[channel].length; i < l; i++) {
            var subscription = mediator.channels[channel][i];
            subscription.callback.apply(subscription.context, args);
        }
        return this;
    };
 
    return {
        channels: {},
        publish: publish,
        subscribe: subscribe,
        installTo: function(obj){
            obj.subscribe = subscribe;
            obj.publish = publish;
        }
    };
 
}());

var obj = { name: 'sam' };
mediator.installTo(obj);
obj.subscribe('nameChange', function(arg){
        console.log(this.name);
        this.name = arg;
        console.log(this.name);
});
 
obj.publish('nameChange', 'john'); //sam, john
*/

//console.log(Navigation);
var App = function() {
	var Navigation = require('./modules/module.navigation');
	var Core = require('./core-backbone');
	var Simple = require('./modules/module.simple');
	
	
	Navigation.config({
		items: [
			{name: 'home', link: 'home.html', sort: 2},
			{name: 'about', link: 'about.html', sort: 1}
		]
	});
	
		
	Core.modules.register(Navigation);
	
	Core.modules.start(Navigation.id);
	
	Core.modules.register(Simple);
	
	Core.modules.start(Simple.id);
};

App();

},{"./core-backbone":2,"./modules/module.navigation":3,"./modules/module.simple":4}],2:[function(require,module,exports){
module.exports = function(){
	var 	debug = true,
		moduleStorage = {},
		Sandbox = require ('./sandbox');
	var utils = {
			isArray: function(object) { return _.isArray(object); },
			isObject: function(object) { return _.isObject(object); }	
	};
		
	var core = {
		modules: {
			register: function(module) {
				var 	moduleID = module.id,
					creator = module.create,
					temp; 
				if (typeof moduleID === 'string' && typeof creator === 'function') { 
					var sandbox = Sandbox.create(core, moduleID);
					var temp = creator(sandbox); 
					if (temp.init && temp.destroy && typeof temp.init === 'function' && typeof temp.destroy === 'function') { 
						moduleStorage[moduleID] = { 
							create : creator, 
							instance : null 
						}; 
						temp = null; 
					} else { 
						core.log(1, "Module \"" + moduleID + "\" Registration: FAILED: instance has no init or destroy functions"); 
					} 
				} else { 
					core.log(1, "Module \"" + moduleID +  "\" Registration: FAILED: one or more arguments are of incorrect type" ); 
				} 
			},
			
			start: function (moduleID) {
				var mod = moduleStorage[moduleID]; 
				if (mod) {
					var sandbox = Sandbox.create(core, moduleID);
					mod.instance = mod.create(sandbox); 
					mod.instance.init(); 
				} 
			},
			start_all : function () { 
				var moduleID; 
				for (moduleID in moduleStorage) { 
					if (moduleStorage.hasOwnProperty(moduleID)) { 
						this.start(moduleID); 
					} 
				}
			},
			stop : function (moduleID) { 
				var data; 
				if (data = moduleStorage[moduleId] && data.instance) { 
					data.instance.destroy(); 
					data.instance = null; 
				} else { 
					core.log(1, "Stop Module '" + moduleID + "': FAILED : module does not exist or has not been started"); 
				} 
			}, 
			stop_all : function () { 
				var moduleID; 
				for (moduleID in moduleStorage) { 
					if (moduleStorage.hasOwnProperty(moduleID)) { 
						this.stop(moduleID); 
					} 
				}
			}
		},
		
		view: {
			runTemplate: function(template,context,options) {
				return Handlebars.templates[template](context, options);
			},
			createCollectionView: function(config) {
			
				var events = {}, evt;
				for(var i=0;evt = config.events[i++];) {
					var eventWrapper = function(fn) {
						return function (e) {
							e.preventDefault();
							var id = $(e.currentTarget).data('id');
							
							var item = this.collection.get(id);
							//console.log(fn, id, item);
							return fn(e,item);
						}
					};
					events[evt.event + ' ' + evt.selector] = eventWrapper(evt.fn);
				}
				
				var View = Backbone.View.extend({
					core: this,
					tagName: config.tagName,
					className: config.className,
					events: events,
					constructor: function(collection) {
						this.collection = collection;
						if(config.bindSelector) {
							this.el = $(config.bindSelector);
						}
						Backbone.View.apply(this,arguments);
					},
					initialize: function() {
						_.bindAll(this, "render");
						this.collection.__backbone.bind("add", this.added, this);
						this.collection.__backbone.bind("remove", this.remove, this);
						this.collection.__backbone.bind("reset", this.reset, this);
					},
					template: function() {
						var context = {}
						context[config.templateContext] = this.collection.__backbone.models;
						return this.core.runTemplate(config.template,context);
					},
					added: function(item) {
						this.listenTo(item,"change",this.render);
						this.render();
					},
					remove: function(item) {
						//console.log('remove', item, this);
						this.stopListening(item,"change",this.render);
						this.render();
					},
					reset: function(collection) {
						var i=0,item;
						for(;item=collection.models[i++];)
							this.stopListening(item,"change",this.render);
						this.render();
					},
					render: function() {
						this.$el.html(this.template(this.model));
						return this;
					}
				
				});
				
				return View;
			},
			get: function(View, model) {
				return new View(model);
			},			
		},
		
		model: {
			create: function(config) {
				return Backbone.Model.extend(config);
			},
			
			get: function(Model, attributes) {
				var m;

				if(Object.defineProperty) {
					m = new Model(attributes);
					Object.defineProperty(m, "id", {
						get: function id() {
							return this.cid;
						}
					});
				}
				else {
					Model.prototype.__defineGetter__("id", function id() { return this.cid; });
					m = new Model(attributes);
				}
				
				var getters = {};
				var setters = {};
				var prototyping = false;
				
				for(key in m.attributes) {
					if (m.attributes.hasOwnProperty(key)) {
						//need the getters and setters objects so that the functions will be different and called anonymously
						getters[key] = function(key) {
							return function() { 
								return this.attributes[key]; 
							};
						};
						setters[key] = function(key) {
							return function(value) { 
								return this.attributes[key] = value; 
							};
						};
						
						//define the property
						if(Object.defineProperty) {
							Object.defineProperty(m, key, {
								get: getters[key](key),
								set: setters[key](key)
							});
						}
						else {
							prototyping = true;
							Model.prototype.__defineGetter__(key, getters[key](key));
							Model.prototype.__defineSetter__(key, setters[key](key));
						}
						
					}
				}
				
				if(prototyping) {
					m = new Model(attributes);
				}
				return m;
			}
		},
		
		collection: {
			create: function(config) {
				//config.model = config.model.__backbone;
				var BBCollection = Backbone.Collection.extend(config);
				
				var Collection = function() {
					var collection = new BBCollection();
					
					return {
						__backboneFN: BBCollection,
						__backbone: collection,
						get: function(id) { return collection.get(id); },
						add: function(item) {
							//make a new model
							var m = core.model.get(collection.model, item);
							return collection.add(m);
						},
						remove: function (id) { return collection.remove(id) },
						reset: function() { return collection.reset() },
						first: function() { return collection.first() },
					};
				};
				
				Collection.__backbone = BBCollection;
				
				return Collection;				
			},
			get: function (Collection) {
				return new Collection;
			}
			
		},
		
		events: {
			register: function (moduleID, evts) { 
				if (utils.isObject(evts) && moduleID) { 
					if (moduleStorage[moduleID]) { 
						moduleStorage[moduleID].events = evts; 
					} else { 
						this.log(1, ""); 
					} 
				} else { 
					this.log(1, ""); 
				} 
			},
			notify: function(moduleID, evt) {
				//console.log('calling notify', moduleID, evt);
				var mod; 
				for (mod in moduleStorage) { 
					if (moduleStorage.hasOwnProperty(mod)){ 
						//console.log('examining mod', moduleStorage[mod]);
						mod = moduleStorage[mod]; 
						if (mod.events && mod.events[evt.type]) { 
							var modEvt = mod.events[evt.type]
							if(modEvt.hasOwnProperty('cxt')) {
								modEvt.cxt[modEvt.fn](evt.data); 
							}
							else {
								modEvt(evt.data);
							}
							
						} 
					} 
				} 
			},
			removeEvents : function (evts, mod) { 
				var i = 0, evt; 
				if (utils.isArray(evts) && mod && (mod = moduleStorage[mod]) && mod.events) { 
					for ( ; evt = evts[i++] ; ) { 
							delete mod.events[evt]; 
						} 
				} 
			},
		},
		
		log: function (severity, message) {
			if(debug) {
				console[severity===1?'log':(severity===2?'warn':'error')](message);
			}
		}
	};
	
	return core;
}();
},{"./sandbox":5}],3:[function(require,module,exports){
//require('./sandbox');

module.exports = function() {
	var configuration;
	var navigation = {
		id: 'Navigation',
		config: function (_configuration) {
			configuration = _configuration;
		},
		discoverable: {
			clicked: 'navigation-clicked',
			entered: 'navigation-entered',
			left: 'navigation-left'	
		},
		watching: {
			configure: 'navigation-configure',
		},
		create: function (sandbox) {
			
			var	self = this,
				navCollection, 
				navView,
				module;
				
			module = {
				
				init: function() {
					//create our model function for use in the collection
					var NavItem = sandbox.model.make({
						attributes: ['name','link','sort']
					});
					
					//create the collection for use as the model on the view
					navCollection = sandbox.collection.create({
						model: NavItem,
						comparator: 'sort'
					});
					
					//create a view
					navView = sandbox.view.createCollectionView({
						bindSelector: 'header',
						tagName: 'nav',
						className: '',
						events: [
							{selector:'a',event:'click',fn:this.clickItem},
							{selector:'a',event:'mouseenter',fn:this.mouseEnter},
							{selector:'a',event:'mouseleave',fn:this.mouseLeave}
						],
						template: 'nav.html',
						templateContext: 'navItems',
					}, navCollection);
	
					if (configuration) {
						this.configure(configuration);
					}
					
					setTimeout(function() {
						var item = navCollection.first();
						item.set('name', 'whatever');
					}, 1000);
					
					//register the events we're listening for and pass the function and context (or just function)
					sandbox.events.register({
						'navigation-configure': {fn: "configure", cxt:this}
					});
				},
				configure: function(configuration) {
					var i=0,item;
					for(;item=configuration.items[i++];) {
						this.addItem(item);
					}
				},
				destroy: function() {
					navView.remove();
					navCollection = null;
					navView = null;
				},
				addItem: function (item) {
					return navCollection.add(item);
				},
				removeItem: function (id) {
					return navCollection.remove(id);
				},
				clickItem: function (e, item) {
					sandbox.events.notify({
						type: Navigation.discoverable.clicked,
						data: item 
					});
				},
				mouseEnter: function(e, item) {
					sandbox.events.notify({
						type: Navigation.discoverable.entered,
						data: item 
					});
				},
				mouseLeave: function(e, item) {
					sandbox.events.notify({
						type: Navigation.discoverable.left,
						data: item 
					});
				},
	
			};
			
			return module;
		}
	};
	
	return navigation;
}();

},{}],4:[function(require,module,exports){
module.exports = {
	id: 'Simple',
	create: function(sandbox) {
		var items = [
			{name: 'more1', link: 'home.html', sort: 4},
			{name: 'more2', link: 'about.html', sort: 3}
		];
		return {
			init: function() {
				//send a navigation configure notification, to get the navigation to configure
				sandbox.events.notify({
					type: 'navigation-configure',
					data: {items: items}
				});
				
				//register to listen to navigation clicks, enters, lefts
				sandbox.events.register({
					'navigation-clicked': this.listener('clicked'),
					'navigation-entered': this.listener('entered'),
					'navigation-left': this.listener('left')
				});
			},
			destroy: function() {
				
			},
			listener: function(type) {
				return function(item) {
					console.log('listener[' + type + ']: ', item );
				};
				
			}
		};
	}
};

},{}],5:[function(require,module,exports){
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
},{}]},{},[1]);
