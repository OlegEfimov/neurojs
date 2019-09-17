var car = require('./car.js');

var INITIAL_ACTION = 0.0;
var ACTIONS_DELAY = 2;


function agent(opt, world) {
    this.socket = new WebSocket("ws://localhost:9001/");
    // this.socket = new ReconnectingWebSocket("ws://localhost:9001/");

    this.car = new car(world, opt)
    this.options = opt

    this.world = world
    this.frequency = 20
    this.reward = 0
    this.loaded = false

    this.loss = 0
    this.timer = 0
    this.timerFrequency = 60 / this.frequency
    this.rewardOnForce_0 = 0
    this.rewardOnForce_1 = 0
    this.rewardOnContactTop = 0
    this.rewardOnContactBack = 0
    this.rewardOnSpin = 0

    this.actionArray = [];
    this.currentSensorsData = [];
    this.nextSensorsData = [];
    this.sendSocketData = false;

    for (i = 0; i < ACTIONS_DELAY; i++) {
      this.actionArray.push([INITIAL_ACTION, INITIAL_ACTION]);
    }

    this.action = this.car.action = [INITIAL_ACTION, INITIAL_ACTION];

    if (this.options.dynamicallyLoaded !== true) {
    	this.init(world.brains.actor.newConfiguration(), null)
    }
    
};

agent.prototype.openSocket = function () {
    // text.html("Socket open");
    // socket.send("Hello server");
    this.sendSocketData = false;
    console.log('world-socket onopen'); 
};

agent.prototype.closeSocket = function () {
    this.sendSocketData = false;
    console.log('world-socket closed'); 
};

agent.prototype.getSocketData = function (result) {
    this.sendSocketData = false;
    console.log('world-getSocketData=' + result.data); 
};
agent.prototype.sendSocketData = function (data) {
    this.sendSocketData = true;
    this.socket.send(data);
    console.log('world-sendSocketData=' + data); 
};


agent.prototype.init = function (actor, critic) {
    var actions = 2
    var temporal = 1
    var states = this.car.sensors.dimensions

    var input = window.neurojs.Agent.getInputDimension(states, actions, temporal)

    this.brain = new window.neurojs.Agent({

        actor: actor,
        critic: critic,

        states: states,
        actions: actions,

        algorithm: 'ddpg',

        temporalWindow: temporal, 

        discount: 0.97, 

        experience: 75e3, 
        // buffer: window.neurojs.Buffers.UniformReplayBuffer,

        learningPerTick: 40, 
        startLearningAt: 900,

        theta: 0.05, // progressive copy

        alpha: 0.1 // advantage learning

    })

    this.world.brains.shared.add('actor', this.brain.algorithm.actor)
    this.world.brains.shared.add('critic', this.brain.algorithm.critic)

    this.brain.learning = false;
    this.actions = actions
    this.car.addToWorld(this.options.number)
	this.loaded = true


    this.socket.onopen = this.openSocket;
    this.socket.onclose = this.closeSocket;
    this.socket.onmessage = this.getSocketData;

};

agent.prototype.step = function (dt) {
	if (!this.loaded) {
		return 
	}
    this.timer++

    //  !!!!!!!debug only
    // this.car.sensorDataUpdated = true;  //debug only
    //  !!!!!!!debug only

    if ((!this.car.hardwareOn && this.timer % this.timerFrequency === 0) ||
        ( this.car.hardwareOn && this.car.sensorDataUpdated)) {

        this.car.update(); // update sensor data

        this.currentSensorsData = this.nextSensorsData;
        this.nextSensorsData = this.car.sensors.data;
        //this.action
        //this.reward

        var speed1 = this.car.speed.velocity1
        var speed2 = this.car.speed.velocity2

        this.rewardOnForce_0 =  speed1;
        this.rewardOnForce_1 =  speed2;

        var result = '';
        this.reward = 0.0
        this.car.contact.forEach( (current, i) => {
            if (current > 0.5) {
                this.reward += -1.0
            }
            result += current.toFixed(3) + '\t';
        });

        if (this.reward >= -3.0) {
            this.reward += Math.abs(this.action[0] - this.action[1]) > 0.1 ?   -0.5 : 0.5
            this.reward +=  (Math.abs(this.action[0]) < 1.0)?  -0.5 : 0.5
            this.reward +=  (Math.abs(this.action[1]) < 1.0)?  -0.5 : 0.5
        } else {
            if (this.reward < -1.0) {
                this.reward += ((Math.abs(speed1) > 1.0) || (Math.abs(speed2)  > 1.0)) ?  0.5 : -0.5;
            }
        }

        if (!this.car.manualControlOn) {
            if (this.brain.learning) {
                this.loss = this.brain.learn(this.reward)
                this.sendSocketData('oneStepLearn', this.reward);
            } else {
                this.loss = 0;
            }

            this.sendSocketData('getAction', this.car.sensors.data);
            // if (!this.car.hardwareOn) {
            //     this.action = this.actionArray.shift();
            //     this.actionArray.push(this.brain.policy(this.car.sensors.data));
            //     this.sendSocketData('need action \n\n');
            // } else {
            //     this.action = this.brain.policy(this.car.sensors.data);
            //     this.sendSocketData('hw:need action \n\n');
            // }

            // this.action[0] += 0.5
            // this.action[1] += 0.5
        

            // this.car.sensorDataUpdated = false;
            // this.car.handle(this.action[0], this.action[1])
        }


        this.car.impact = 0
        this.car.step() //only draw
    }

    return this.timer % this.timerFrequency === 0
};

agent.prototype.draw = function (context) {
};

module.exports = agent;