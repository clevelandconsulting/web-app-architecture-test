var Navigation = {
	id: 'Navigation',
	config: function (configuration) {
		this.configuration = configuration;
	},
	create: function (sandbox) {
		
		var NavigationView = function (sandbox) {
			var 	navItems, 
				//itemTemplate = 'a(href=""+item.link,data-nav-hash=""+item.hash)= item.name',
				itemTemplate = 'a(data-nav-hash=""+item.hash)= item.name',
				view = sandbox.view.create(),
				CONTAINER = sandbox.view.create_element('nav');
				
				
			sandbox.utils.override(view, 'init', sandbox.utils.after(function (items) {
				navItems = items;
				view.render(items);
				sandbox.view.addToBody(CONTAINER);
			}));
			
			view.render = function (items) {
				CONTAINER = sandbox.view.renderCollection(CONTAINER,items,itemTemplate);
				//keep track of the old items
				navItems = items;
			}
			
			return view;
		};
		
		var NavigationCollection = function (sandbox) {
			var items;
			
			return {
				init: function () {
					items = sandbox.collection.create();
				},
				items: function() {
					return items;
				}
			};
		}
		
		var	navItems, navView;
			
		return {
			init: function() {
				navItems = sandbox.collection.create();
				navView = new NavigationView(sandbox);
				//navItems.init();
				navView.init(navItems);
				if (Navigation.configuration) {
					var i=0;
					for(;item=Navigation.configuration.items[i++];) {
						this.addItem(item);
					}
					this.render();
				}
			},
			destroy: function() {
				navItems = null;
			},
			addItem: function (item) {
				item.event = {
					name: 'click',
					fn: this.clickItem
				};
				navItems.add(item);
			},
			removeItem: function (item) {
				navItems.remove(item);
			},
			clickItem: function (item) {
				console.log('clicked', item);
				sandbox.events.notify({
					type: 'navigation-clicked',
					data: item 
				});
			},
			render: function() {
				if (navView) {
					if (navView.hasOwnProperty('render')) {
						navView.render(navItems);
					}
				}
				else {
					sandbox.log(1,"View does not exist for module " + this.id);
				}
			}
		};
	}
};
