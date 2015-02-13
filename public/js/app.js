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
