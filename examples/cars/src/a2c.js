var tf = require('@tensorflow/tfjs')
let zeros = (w, h, v=0) => Array.from(new Array(h), _ => Array(w).fill(v));

class A2CAgent {
    constructor(state_size, action_size) {
        this.render = false;
        this.state_size = state_size;
        this.action_size = action_size;
        this.value_size = 2;
        this.input_size = this.state_size + this.action_size;

        this.discount_factor = 0.99;
        this.actor_learningr = 0.001;
        this.critic_learningr = 0.005;

        this.actor = this.build_actor();
        this.critic = this.build_critic();
    
    }

    build_actor() {
        const model = tf.sequential();
        model.add(tf.layers.dense({units: 60,activation: 'relu',inputShape:[this.state_size]}));
        model.add(tf.layers.dense({units: 40,activation: 'relu'}));
        model.add(tf.layers.dropout({rate: 0.30}));
        model.add(tf.layers.dense({units: this.action_size,activation: 'tanh'}));

        model.summary();

        model.compile({
            optimizer: tf.train.adam(this.actor_learningr),
            loss:tf.losses.softmaxCrossEntropy
        });

        return model;
    }

    build_critic() {
        const model = tf.sequential();
        model.add(tf.layers.dense({units: 80,activation: 'relu',inputShape:[this.input_size]}));
        model.add(tf.layers.dense({units: 70,activation: 'relu'}));
        model.add(tf.layers.dense({units: 60,activation: 'relu'}));
        model.add(tf.layers.dense({units: 50,activation: 'relu'}));
        model.add(tf.layers.dense({units: 1}));
        
        model.summary();

        model.compile({
            optimizer: tf.train.adam(this.critic_learningr),
            loss:tf.losses.meanSquaredError,
        });

        return model;
    }

    format_state(state) {
        let copy_state = state.slice();
        for(let i=0; i < state.length; i++) {
            if(Array.isArray(copy_state[i])) {
                copy_state[i] = Math.ceil(state[i][1] / 10);
            }
        }

        return copy_state;

    }

    get_action(state, actions) {
        const math_utils = new app.math_utils();
        // const math_utils = require('../utils/math_utils');
        
        let oneHotState = tf.oneHot(tf.tensor1d(this.format_state(state)), 12);
        
        let policy = this.actor.predict(oneHotState.reshape([1,9,12]), {
            batchSize:1,
        });
        
        let policy_flat = policy.dataSync();
        
        return math_utils.weightedRandomItem(actions, policy_flat);
    }

    train_model(state, action, reward, next_state, done) {
        let target = zeros(1, this.value_size);
        let advantages = zeros(1, this.action_size);

        // let stateArray = Array.prototype.slice.call(state);
        // let stateTf = tf.tensor(stateArray);
        // let nextStateArray = Array.prototype.slice.call(next_state);
        // let nextStateTf = tf.tensor(nextStateArray);

        // let oneHotState = tf.oneHot(this.format_state(stateTf), 12);
        // let oneHotNextState = tf.oneHot(this.format_state(nextStateTf), 12);
        // oneHotState = oneHotState.reshape([1, 9, 12])
        // oneHotNextState = oneHotNextState.reshape([1, 9, 12])
        // let value = this.critic.predict(state).flatten().get(0);
        let value = this.critic.predict(state).flatten().dataSync();
        let next_value = this.critic.predict(next_state).flatten().dataSync();
        console.log(action) //Pb nbr d'actions dans advantages
        if(done) {
            advantages[action] = [reward - value];
            target[0] = reward;
        } else {
            advantages[0] = [reward +this.discount_factor * (next_value[0]) - value[0]];
            advantages[1] = [reward +this.discount_factor * (next_value[0]) - value[1]];
            target[0] = reward + this.discount_factor * next_value[0];
            target[1] = reward + this.discount_factor * next_value[1];
        }

        
        this.actor.fit(state, tf.tensor(advantages).reshape([1,2]), {
            epochs:1,
        });

        this.critic.fit(state, tf.tensor(target), {
            epochs:1,
        });
        
    }
}

module.exports = A2CAgent;