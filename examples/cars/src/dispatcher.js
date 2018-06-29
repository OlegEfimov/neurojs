var requestAnimFrame =  window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function(callback) { window.setTimeout(callback, 1000 / 60); };
// var requestAnimFrame = function(callback) { window.setTimeout(callback, 1000 / 60); };
var keyboard = require('./keyboard.js');

function dispatcher(renderer, world) {
    this.renderer = renderer;
    this.world = world;
    this.running = false;
    this.isRunFast = false;
    this.step = 0;

    this.keyboard = new keyboard();
    this.keyboard.subscribe((function (k) {
        for (var i = 0; i < this.world.agents.length; i++) {
            this.world.agents[i].car.handleKeyInput(k);
        }
        
        if (k.get(189)) {
            this.renderer.zoom(0.9);
        }

        if (k.get(187)) {
            this.renderer.zoom(1.1);
        }
    }).bind(this));

    this.__loop = this.loop.bind(this);
}

dispatcher.prototype.dt = function () {
    var now = Date.now(); 
    var diff = now - (this.prev || now);
    this.prev = now; 

    return diff / 1000;
};

dispatcher.prototype.loop = function () {
    if (this.running && !this.isRunFast) {  // start next timer
        requestAnimFrame(this.__loop);
    }

    var dt = 1.0 / 60.0

    // compute phyiscs
    this.world.step(dt);
    this.step++;

    // draw everything
    if (!this.isRunFast || this.step % 5 === 0)
        this.renderer.render();

};

dispatcher.prototype.begin = function () {
    this.running = true;

    if (this.__interval && !this.isRunFast)
        clearInterval(this.__interval)

    if (this.isRunFast)
        this.__interval = setInterval(this.__loop, 0)
    else
        requestAnimFrame(this.__loop)
};

dispatcher.prototype.goFast = function () {
    if (this.isRunFast)
        return

    this.isRunFast = true
    this.begin()
};

dispatcher.prototype.goSlow = function () {
    // if (!this.__interval)
    if (!this.isRunFast)
        return 

    clearInterval(this.__interval)
    this.isRunFast = false;

    this.begin()
}

dispatcher.prototype.stop = function () {
    this.running = false;
};

module.exports = dispatcher;