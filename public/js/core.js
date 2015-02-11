var Core = function(){
	var 	debug = true,
		moduleStorage = {};
	
	return {
		modules: {
			register: function(module) {
				var 	moduleID = module.id,
					creator = module.create,
					temp; 
				if (typeof moduleID === 'string' && typeof creator === 'function') { 
					sandbox = Sandbox.create(Core, moduleID);
					temp = creator(sandbox); 
					if (temp.init && temp.destroy && typeof temp.init === 'function' && typeof temp.destroy === 'function') { 
						moduleStorage[moduleID] = { 
							create : creator, 
							instance : null 
						}; 
						temp = null; 
					} else { 
						Core.log(1, "Module \"" + moduleID + "\" Registration: FAILED: instance has no init or destroy functions"); 
					} 
				} else { 
					Core.log(1, "Module \"" + moduleID +  "\" Registration: FAILED: one or more arguments are of incorrect type" ); 
				} 
			},
			
			start: function (moduleID) {
				var mod = moduleStorage[moduleID]; 
				if (mod) { 
					sandbox = Sandbox.create(Core, moduleID);
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
					Core.log(1, "Stop Module '" + moduleID + "': FAILED : module does not exist or has not been started"); 
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
			create: function() {
				return {
					init: function() {
					}
				};
			},
			create_element: function (html) {
				return document.createElement(html)
				
			},
			append_element: function (container,el) {
				container.appendChild(el);
			},
			renderTemplate: function (object, template) {
				var fn = jade.compile(template);
				return fn(object);
			},
			addHTML: function(container, html, method) {
				container.insertAdjacentHTML(method, html );
				return container;
			},
			addToBody: function(element) {
				var body = document.getElementsByTagName('body')[0];
				this.append_element(body,element);
			},
			renderCollection: function(container,collection,template) {
				var i=0;
				for(;item = collection.items()[i++];) {
					container = this.addHTML(container,this.renderTemplate(item,template), 'beforeend');
					//if there's an event, bind it!
					if(item.event) {
						Core.events.bind(container, item.event, item.hash, item);
					}
				}
				return container;
			}
			
		},
		
		collection: {
			create: function() {
				
				return function(){
					var items = [];
					
					return {
						add: function(item) {
							var lastHash = -1;
							
							if(items.length > 0) {
								lastHash = items[items.length-1].hash;
							}
							
							item.hash = lastHash+1;
							items.push(item);
						},
						remove: function(item) {
							var index = items.indexOf(item);
							if (index > -1) {
								items.splice(index,1);
							}
						},
						items: function() {
							return items;
						}
					};
				}();
			},
			
			
		},
		
		events: {
			register: function (moduleID, evts) { 
				if (this.is_obj(evts) && moduleID) { 
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
				var mod; 
				for (mod in moduleStorage) { 
					if (moduleStorage.hasOwnProperty(mod)){ 
						mod = moduleStorage[mod]; 
						if (mod.events && mod.events[evt.type]) { 
							mod.events[evt.type](evt.data); 
						} 
					} 
				} 
			},
			bind: function(container,eventInfo,objectHash, object) {
				elements = jQuery(container).find('*[data-nav-hash="' + objectHash + '"]')
				return elements.bind(eventInfo.name,object,eventInfo.fn);
			}
		},
		
		log: function (severity, message) {
			if(debug) {
				console[severity===1?'log':(severity===2?'warn':'error')](message);
			}
		}
	};
}();