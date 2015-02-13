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