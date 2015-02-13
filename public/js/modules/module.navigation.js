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
