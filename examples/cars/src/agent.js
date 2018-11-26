var car = require('./car.js');

function agent(opt, world) {
    this.car = new car(world, {})
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
    this.action = [0.5, 0.5]

    if (this.options.dynamicallyLoaded !== true) {
    	this.init(world.brains.actor.newConfiguration(), null)
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

    // this.world.brains.shared.add('actor', this.brain.algorithm.actor)
    this.world.brains.shared.add('critic', this.brain.algorithm.critic)

    this.brain.learning = false;
    this.actions = actions
    this.car.addToWorld(this.options.number)
	this.loaded = true
};

agent.prototype.step = function (dt) {
	if (!this.loaded) {
		return 
	}

    this.timer++

    if (this.timer % this.timerFrequency === 0) {
        this.car.update()

        var vel = this.car.speed.local

        // console.log('vel=' + vel);
        // var speed = this.car.speed.velocity * 3.6
        var speed1 = this.car.speed.velocity1
        var speed2 = this.car.speed.velocity2
        // console.log('speed=' + speed1 + '\t' + speed2);

//         // this.reward = Math.pow(vel[1], 2) - 0.10 * Math.pow(vel[0], 2) - this.car.contact * 10 - this.car.impact * 20
//         // this.reward = (Math.abs(speed) < 10 ? Math.abs(speed) : 10) - this.car.contact - this.car.impact * 2

//         // this.reward =  speed * 0.01 - this.car.contact * 0.1 - this.car.impact * 0.2

//         // let rewardOnForce_0 = (this.action[0] - 0.5) + 0.3
//         // let rewardOnForce_1 = (this.action[1] - 0.5) + 0.3
//         let x = (this.action[0] - 0.5)
//         let y = (this.action[1] - 0.5)
//         // this.rewardOnForce_0 =  x * (1 - this.car.contact.topRight) - x * (1 - this.car.contact.backRight)
//         // this.rewardOnForce_1 =  y * (1 - this.car.contact.topLeft) - y * (1 - this.car.contact.backLeft) 
//         // this.rewardOnForce_0 =  (x * (1 - 1/this.car.contact.topRight)) - (x *(1-1/this.car.contact.backRight))
//         // this.rewardOnForce_1 =  (y * (1 - 1/this.car.contact.topLeft)) - (y *(1-1/this.car.contact.backLeft))
//         this.rewardOnForce_0 =  ((x * x * this.car.contact.backLeft) - (2 * x * this.car.contact.topLeft)) + x + 0.05
//         this.rewardOnForce_1 =  ((y * y * this.car.contact.backRight) - (2 * y * this.car.contact.topRight)) + y + 0.05
//         // this.rewardOnForce_0 = Math.pow((1.3*x+0.8),3) + (-1)*(Math.pow((1.3*x+0.8),2) + (1.3*x + 0.8) - 0.8)
//         // this.rewardOnForce_1 = Math.pow((1.3*y+0.8),3) + (-1)*(Math.pow((1.3*y+0.8),2) + (1.3*y + 0.8) - 0.8)
// // z=((1.3*x+0.8)^3 + (-1)*((1.3*x+0.8)^2 + (1.3*x + 0.8) - 0.8)) + ((1.3*y+0.8)^3 + (-1)*((1.3*y+0.8)^2 + (1.3*y + 0.8) - 0.8))

//         // let rewardOnForce_0 = (this.action[0]+0.5) * (this.action[0]+0.5)
//         // let rewardOnForce_1 = (this.action[1]+0.5) * (this.action[1]+0.5)
//         // let rewardOnForce_0 = (this.action[0]) * (this.action[0])
//         // let rewardOnForce_1 = (this.action[1]) * (this.action[1])
//         this.rewardOnSpin = Math.abs(x - y)
//         // this.rewardOnContact = (this.rewardOnContact + this.car.contact) * 0.8
//         // if (this.car.contact > 0) {
//             console.log('car.contact=' + this.car.contact.topLeft + '\t' + this.car.contact.topRight + '\t' + 
//                 this.car.contact.backLeft+ '\t' + this.car.contact.backRight);
//         // }
//         // console.log('car.contact=' + this.car.contact)
//         // let forceReward = this.action[0] + this.action[1]
//         // this.reward =  (rewardOnForce_0 + rewardOnForce_1) - (rewardOnContact + rewardOnSpin);
//         // this.reward =  this.rewardOnForce_0 * 0.001 + this.rewardOnForce_1 * 0.001 - this.rewardOnContact * 0.0001 - rewardOnSpin * 0.0001;
//         // this.reward =  this.rewardOnForce_0 * 0.001 + this.rewardOnForce_1 * 0.001 - this.rewardOnSpin * 0.001;
//         this.reward =  (this.rewardOnForce_0 + this.rewardOnForce_1) * 0.0001 - this.rewardOnSpin * 0.0001;
//         // this.reward =  forceReward * 0.1 - this.car.contact * 0.2;// - this.car.impact * 0.2

//         // if (Math.abs(speed) < 1e-2) { // punish no movement; it harms exploration
//         //     this.reward -= 1.0 
//         // }

//         // if (Math.abs(forceReward) <= 0.5) { // punish back movement
//         //     // console.log("-------speed * 3.6 <= -15 km/h")
//         //     this.reward -= 0.05 
//         // }

//         // if ((speed) > -5) { // punish back movement
//         //     // console.log("-------speed * 3.6 <= -15 km/h")
//         //     this.reward += Math.abs(speed) * 0.05
//         // }
//////////////////////////////////////////////////////////////////////////////////////////////////

        let x = (this.action[0] - 0.5)
        let y = (this.action[1] - 0.5)

        // this.rewardOnForce_0 =  ((x * x * this.car.contact.backLeft) - (2 * x * this.car.contact.topLeft)) + x + 0.05
        // this.rewardOnForce_1 =  ((y * y * this.car.contact.backRight) - (2 * y * this.car.contact.topRight)) + y + 0.05

        this.rewardOnForce_0 =  speed1;
        this.rewardOnForce_1 =  speed2;
        // this.rewardOnContactTop = (this.car.contact.topLeft + this.car.contact.topRight) / 2;
        // this.rewardOnContactBack = (this.car.contact.backLeft + this.car.contact.backRight) / 2;


        // this.rewardOnSpin = Math.abs(x - y)
       // if (this.car.contact > 0) {
        //     console.log('car.contact=' + this.car.contact.topLeft + '\t' + this.car.contact.topRight + '\t' + 
        //         this.car.contact.backLeft+ '\t' + this.car.contact.backRight);
        // // }

        // this.reward =  (this.rewardOnForce_0 + this.rewardOnForce_1) * 0.01 + this.rewardOnContactTop * -0.01 + this.rewardOnContactBack * -0.01;
        var result = this.car.contact.reduce((all, current) => all + current + '\t');
        console.log('car.contact=' + result);
        this.reward = 0.0
        this.car.contact.forEach( (current, i) => {
            this.reward -= current * 0.1 * this.car.contactKoeff[i]
            // this.reward -= Math.pow(current, 2) * this.car.contactKoeff[i] * 0.1
        });
        this.reward += (speed1 + speed2 ) * 0.01;
//////////////////////////////////////////////////////////////////////////////////////////////////
        if (this.brain.learning) {
            this.loss = this.brain.learn(this.reward)
        } else {
            this.loss = 0;
        }
        if (!this.car.manualControlOn) {
            this.action = this.brain.policy(this.car.sensors.data)
            this.action[0] += 0.5
            this.action[1] += 0.5
       }
        
        this.car.impact = 0
        this.car.step()
    }
    
    if (!isNaN(this.action[0]) && !isNaN(this.action[1])) {
      if (!this.car.manualControlOn) {
        this.car.handle(this.action[0], this.action[1])
      }
    }

    return this.timer % this.timerFrequency === 0
};

agent.prototype.draw = function (context) {
};

module.exports = agent;