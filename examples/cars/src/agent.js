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
        var speed = this.car.speed.velocity * 3.6

        // this.reward = Math.pow(vel[1], 2) - 0.10 * Math.pow(vel[0], 2) - this.car.contact * 10 - this.car.impact * 20
        // this.reward = (Math.abs(speed) < 10 ? Math.abs(speed) : 10) - this.car.contact - this.car.impact * 2

        // this.reward =  speed * 0.01 - this.car.contact * 0.1 - this.car.impact * 0.2

        let action_0 = (this.action[0] - 0.5)
        let action_1 = (this.action[1] - 0.5)
        let rewardOnForce_0 = action_0 + 0.3
        let rewardOnForce_1 = action_1 + 0.3
        // let rewardOnForce_0 = Math.abs(this.action[0] - 0.5)
        // let rewardOnForce_1 = Math.abs(this.action[1] - 0.5)
        // let rewardOnForce_0 = (this.action[0]+0.5) * (this.action[0]+0.5)
        // let rewardOnForce_1 = (this.action[1]+0.5) * (this.action[1]+0.5)
        // let rewardOnForce_0 = (this.action[0]) * (this.action[0])
        // let rewardOnForce_1 = (this.action[1]) * (this.action[1])
        let rewardOnSpin = Math.abs(action_0 - action_1)
        let rewardOnContact = this.car.contact / (this.car.sensors.sensors.length - 1)
        if (this.car.contact > 0) {
            console.log('car.contact=' + this.car.contact)
        }
        // console.log('car.contact=' + this.car.contact)
        // let forceReward = this.action[0] + this.action[1]
        // this.reward =  (rewardOnForce_0 + rewardOnForce_1) - (rewardOnContact + rewardOnSpin);
        this.reward = (rewardOnForce_0 * 0.0001) +
                      (rewardOnForce_1 * 0.0001) -
                      (rewardOnContact * 0.0005 ) * (Math.abs(action_0) + Math.abs(action_1)) -
                      ((rewardOnSpin * 0.001) * (1 - rewardOnContact));
        // this.reward =  forceReward * 0.1 - this.car.contact * 0.2;// - this.car.impact * 0.2

        // if (Math.abs(speed) < 1e-2) { // punish no movement; it harms exploration
        //     this.reward -= 1.0 
        // }

        // if (Math.abs(forceReward) <= 0.5) { // punish back movement
        //     // console.log("-------speed * 3.6 <= -15 km/h")
        //     this.reward -= 0.05 
        // }

        // if ((speed) > -5) { // punish back movement
        //     // console.log("-------speed * 3.6 <= -15 km/h")
        //     this.reward += Math.abs(speed) * 0.05
        // }
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