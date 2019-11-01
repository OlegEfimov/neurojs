var car = require('./car.js');
var StateMachine = require('./state.js');


var INITIAL_ACTION = 0.0;
var ACTIONS_DELAY = 2;


function agent(opt, world) {
    this.socket = new WebSocket("ws://localhost:9001/");
    // this.socket = new ReconnectingWebSocket("ws://localhost:9001/");

    this.car = new car(world, opt)
    this.statemachine = new StateMachine('initial');
    this.options = opt
    this.done = 0

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
    this.socketOpened = false;

    for (i = 0; i < ACTIONS_DELAY; i++) {
      this.actionArray.push([INITIAL_ACTION, INITIAL_ACTION]);
    }

    this.action = this.car.action = [INITIAL_ACTION, INITIAL_ACTION];

    if (this.options.dynamicallyLoaded !== true) {
    	this.init(world.brains.actor.newConfiguration(), null)
    }
    
    this.sendSocketData = (op, param) => {
        let data = ''
        if (op === 'sendState') {
            // data = 'state:' + param.join(',');
            data = '' + param.join(',');
            this.socket.send(data);
            this.statemachine.setState('request_action');
        }
        if (op === 'sendReward') {
            // data = 'reward:' + param;
            data = '' + param.join(',');
            this.socket.send(data);
            this.statemachine.setState('start_learn');
        }
        // console.log('agent-sendSocketData=' + data); 
    };

};

agent.prototype.openSocket = function () {
    let self = window.gcd.world.agents[0];
    console.log('world-socket onopen');
    self.socketOpened = true;
    // self.sendSocketData('sendState', self.car.sensors.data);
};

agent.prototype.closeSocket = function () {
    let self = window.gcd.world.agents[0];
    self.socketOpened = false;
    console.log('world-socket closed'); 
};

agent.prototype.getSocketData = function(result) {
    let self = window.gcd.world.agents[0];
    // console.log('agent-getSocketData result.data=' + result.data); 
    // console.log('agent-getSocketData state=' + self.statemachine.currentState);
    if (result.data === 'reset') {
        console.log('agent-getSocketData reset');
        self.car.setInitialPosition(0);
    }
    if (result.data === 'stop') {
        console.log('agent-getSocketData stop');
        self.car.setInitialPosition(0);
        window.gcd.doStop();
    }
    if (self.statemachine.currentState === 'request_action') {
        let act = new Array();
        act = result.data.split(",");
        for (let a in act ) {
            act[a] = parseFloat(act[a], 10);
        }
        self.action = act;
        self.statemachine.setState('action_received');
        if (!self.car.hardwareOn) {
            self.action = self.actionArray.shift();
            self.actionArray.push(act);
        } else {
            self.action = act;
        }

        self.action[0] += 0.5
        self.action[1] += 0.5


        self.car.sensorDataUpdated = false;
        self.nextStateReady = false;
        self.car.handle(self.action[0], self.action[1])

    } else if (self.statemachine.currentState === 'start_learn') {
        // console.log('---!!! getSocketData currentState === start_learn');
        // console.log('---!!! getSocketData result.data =' + result.data);
        self.statemachine.setState('end_learn');
    } else {
        // console.log('---!!! getSocketData unknown statemachine')
    }
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
    if (!this.loaded || !this.socketOpened) {
        return 
    }
    this.timer++
    if ((!this.car.hardwareOn && this.timer % this.timerFrequency === 0) ||
        ( this.car.hardwareOn && this.car.sensorDataUpdated)) {

        this.handleState(this.statemachine.getState());
        this.car.step() //only draw
    }

    return this.timer % this.timerFrequency === 0
};


agent.prototype.handleState = function (state) {
    // console.log('handleState -- ' + state); 
    switch (state) {
        case 'action_received':
            this.done = 0
            this.car.update(); // update sensor data
            this.statemachine.setState('end_env_step');

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
                if (current > 0.9) {
                    this.done = 1
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
                    this.statemachine.setState('reward_ready');
                }
            }
            if (this.done === 0) {
                this.reward = 0
            } else {
                this.reward = -1
            }
            break;
        case 'reward_ready':
            if (!this.car.manualControlOn) {
                if (this.brain.learning) {
                    this.sendSocketData('sendReward', [this.reward, this.done]);
                }
            }
            break;
        case 'initial':
        case 'end_learn':
        case 'end_env_step':
            this.sendSocketData('sendState', this.car.sensors.data);
            break;
        default:
    }


        // this.car.impact = 0
        // this.car.step() //only draw
}


agent.prototype.draw = function (context) {
};

module.exports = agent;