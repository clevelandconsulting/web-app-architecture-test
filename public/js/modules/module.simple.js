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
