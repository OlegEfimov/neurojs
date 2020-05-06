var car = require('./car.js');
var StateMachine = require('./state.js');


var INITIAL_ACTION = 0.0;
var ACTIONS_DELAY = 0;


function agent(opt, world) {
    this.socket = new WebSocket("ws://localhost:9001/");
    // this.socket = new ReconnectingWebSocket("ws://localhost:9001/");

    this.car = new car(world, opt)
    this.statemachine = new StateMachine('start');
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
    this.sendStateCounter = 0;
    this.sendRewardCounter = 0;
    this.getActionCounter = 0;

    for (i = 0; i < ACTIONS_DELAY; i++) {
      // this.actionArray.push([INITIAL_ACTION, INITIAL_ACTION]);
      this.actionArray.push(INITIAL_ACTION);
    }

    this.action = this.car.action = [INITIAL_ACTION, INITIAL_ACTION];

    if (this.options.dynamicallyLoaded !== true) {
    	this.init(world.brains.actor.newConfiguration(), null)
    }
    
    this.sendSocketData = (op, param) => {
        console.log('------>>>>>>>>>>>>>>>> sendSocketData');
        let data = ''
        if (op === 'sendState') {
            // data = 'state:' + param.join(',');
            data = '' + param.join(',');
            this.socket.send(data);
            this.sendStateCounter += 1
            // console.log('sendStateCounter = ' + this.sendStateCounter)
            this.statemachine.setState('request_action');
        }
        if (op === 'sendReward') {
            // data = 'reward:' + param;
            data = '' + param.join(',');
            this.socket.send(data);
            this.sendRewardCounter += 1
            // console.log('-------------sendRewardCounter = ' + this.sendRewardCounter)
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

agent.prototype.doReset = function () {
    let self = window.gcd.world.agents[0];
        console.log('agent---doReset');
        self.car.setInitialPosition(0);
        self.action = self.car.action = [INITIAL_ACTION, INITIAL_ACTION];
};

agent.prototype.doStop = function () {
    let self = window.gcd.world.agents[0];
        console.log('agent---doStop');
        self.car.setInitialPosition(0);
        self.action = self.car.action = [INITIAL_ACTION, INITIAL_ACTION];
        window.gcd.doStop();
};
agent.prototype.getSocketData = function(result) {
    // console.log('------<<<<<<<<<<<<<<<<< getSocketData');
    let self = window.gcd.world.agents[0];
    // console.log('getSocketData -- ' + result.data);
    if (result.data === 'register_done') {
        // console.log('------<<<<<<<<<<<<<<<<< getSocketData data === register_done');
        self.action = self.car.action = [INITIAL_ACTION, INITIAL_ACTION];
        self.action_ready = true;
        // console.log('self.action_ready = true -- action = ' + self.action);
        return; 
    } 
    let args = new Array();
    args = result.data.split(":");

    //TBD - !!! need handle args[1] as array
    
    let tmpAct = new Array();
    if (args[0] === 'action') {
        tmpAct = args[1].split(",");
        for (let a in tmpAct ) {
            tmpAct[a] = parseFloat(tmpAct[a], 10);
        }
    }


    // let tmpAct2 = '';
    // tmpAct2 = '0.0';
    // // console.log('tmpAct2_1 = ' + tmpAct2); 
    // tmpAct2 = args[1];
    // // console.log('tmpAct2_2 = ' + tmpAct2); 
    // let tmpAct2Float = parseFloat(tmpAct2, 10);
    // // console.log('tmpAct2Float = ' + tmpAct2Float); 

    // let tmpAct = '0.0';
    // // console.log('tmpAct = ' + tmpAct); 
    // let tmpActFloat = parseFloat(tmpAct, 10);
    // // console.log('tmpActFloat = ' + tmpActFloat); 

    // tmpActFloat = tmpActFloat + tmpAct2Float;
    // // console.log('tmpActFloat + tmpAct2Float = ' + tmpActFloat); 
    // let tmpAction_0 = tmpActFloat * 0.5 + 1.0;
    // let tmpAction_1 = -tmpActFloat * 0.5 + 1.0;
    self.action[0] = tmpAct[0];
    self.action[1] = tmpAct[1];
    self.action[0] += 1.0;
    self.action[1] += 1.0;

    // // console.log('tmpAction_0 = ' + tmpAction_0); 
    // // console.log('tmpAction_1 = ' + tmpAction_1); 
    // self.action[0] = tmpAction_0
    // self.action[1] = tmpAction_1
    // // self.action[0] = 0.5
    // // self.action[1] = 0.5

    // console.log('self.action[0] = ' + self.action[0]); 
    // console.log('self.action[1] = ' + self.action[1]); 










    // self.car.sensorDataUpdated = false;
    self.action_ready = true;
    console.log('action = ' + self.action); 
    // self.nextStateReady = false;
    // self.car.handle(self.action[0], self.action[1])
    // } else {
    //     var str = result.data;
    //     var temp = new Array();
    //     // this will return an array with strings "1", "2", etc.
    //     temp = str.split(":");

    //     if (temp[0] === 'loss') {
    //         self.loss = parseFloat(temp[1], 10);
    //     }
    // }
    // if (self.statemachine.currentState === 'start_learn') {
    //     // console.log('---!!! getSocketData currentState === start_learn');
    //     // console.log('---!!! getSocketData result.data =' + result.data);
    //     self.statemachine.setState('end_learn');
    // }
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

        if (this.action_ready) {
            this.actionHandler();
        }
    }
    this.car.step() //only draw
    return this.timer % this.timerFrequency === 0
};

agent.prototype.actionHandler = function () {
    this.action_ready = false;
    this.car.handle(this.action[0], this.action[1])

    // this.car.step() //only draw

    this.done = 0
    this.car.update(); // update sensor data

    this.reward = 0.0
    this.car.contact.forEach( (current, i) => {
        if (current > 0.95) {
            this.done = 1
        }
    });
    if (this.done === 0) {
        this.reward = 0
    } else {
        this.reward = -1
    }
    // this.car.contact.forEach( (current, i) => {
    //     if (current > 0.8) {
    //         this.reward += -1.0
    //     }
    //     if (current > 0.95) {
    //         this.done = 1
    //     }
    // });
    // // if (this.reward >= -3.0) {
    //     const action_diff = Math.abs(this.action[0] - this.action[1]);
    //     this.reward += action_diff > 0.1 ?   -action_diff : 0.5
    //     this.reward +=  (Math.abs(this.action[0]) < 0.5)?  -0.3 : 0.5
    //     this.reward +=  (Math.abs(this.action[1]) < 0.5)?  -0.3 : 0.5
    // // }
    // if (this.done !== 0) {
    //      this.reward += -5
    // }
    if (!this.car.manualControlOn) {
        const data = this.car.sensors.data;
        let sendData = 'state:' + data.join(',');
        sendData += ',' + this.reward + ',' + this.done;
        console.log('actionHandler socket.send(sendData=' + sendData); 
        this.socket.send(sendData);
    }
    if (this.done === 1) {
        this.doReset();
    }
}

agent.prototype.handleState = function (state) {
    console.log('handleState -- ' + state); 
    switch (state) {
        case 'action_received':
            this.done = 0
            this.car.update(); // update sensor data
            this.statemachine.setState('end_env_step');

            // var speed1 = this.car.speed.velocity1
            // var speed2 = this.car.speed.velocity1
            var speed1 = 0
            var speed2 = 0

            this.rewardOnForce_0 =  speed1;
            this.rewardOnForce_1 =  speed2;

            var result = '';
            this.reward = 0.0
            this.car.contact.forEach( (current, i) => {
                if (current > 0.5) {
                    this.reward += -1.0
                }
                if (current > 0.8) {
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
            if (this.done === 0) {
                this.reward = 0
            } else {
                this.reward = -1
            }
            if (!this.car.manualControlOn) {
                if (this.brain.learning) {
                    // this.statemachine.setState('reward_ready');
                    console.log('handleState sendSocketData( sendReward ...)'); 
                    this.sendSocketData('sendReward', [this.reward, this.done]);
                }
            }
            // if (this.done === 0) {
            //     this.reward = 0
            // } else {
            //     this.reward = -1
            // }
            break;
        // case 'reward_ready':
        //     if (!this.car.manualControlOn) {
        //         if (this.brain.learning) {
        //             this.sendSocketData('sendReward', [this.reward, this.done]);
        //         }
        //     }
        //     break;
        case 'start':
        case 'end_learn':
        case 'end_env_step':
             console.log('handleState sendSocketData( sendState ...)'); 
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