var tf = require('@tensorflow/tfjs')
// import * as tf from '@tensorflow/tfjs';
// import {maybeRenderDuringTraining, onGameEnd, setUpUI} from './ui';

Float32Array.prototype.concat = function() {
    var bytesPerIndex = 4,
        buffers = Array.prototype.slice.call(arguments);

    // add self
    buffers.unshift(this);

    buffers = buffers.map(function (item) {
        if (item instanceof Float32Array) {
            return item.buffer;
        } else if (item instanceof ArrayBuffer) {
            if (item.byteLength / bytesPerIndex % 1 !== 0) {
                throw new Error('One of the ArrayBuffers is not from a Float32Array');  
            }
            return item;
        } else {
            throw new Error('You can only concat Float32Array, or ArrayBuffers');
        }
    });

    var concatenatedByteLength = buffers
        .map(function (a) {return a.byteLength;})
        .reduce(function (a,b) {return a + b;}, 0);

    var concatenatedArray = new Float32Array(concatenatedByteLength / bytesPerIndex);

    var offset = 0;
    buffers.forEach(function (buffer, index) {
        concatenatedArray.set(new Float32Array(buffer), offset);
        offset += buffer.byteLength / bytesPerIndex;
    });

    return concatenatedArray;
};

export class PolicyNetwork {
  constructor(hiddenLayerSizesOrModel) {
    if (hiddenLayerSizesOrModel instanceof tf.LayersModel) {
      this.policyNet = hiddenLayerSizesOrModel;
    } else {
      this.createPolicyNetwork(hiddenLayerSizesOrModel);
    }
  }

  createPolicyNetwork(hiddenLayerSizes) {
    if (!Array.isArray(hiddenLayerSizes)) {
      hiddenLayerSizes = [hiddenLayerSizes];
    }
    this.policyNet = tf.sequential();
    hiddenLayerSizes.forEach((hiddenLayerSize, i) => {
      this.policyNet.add(tf.layers.dense({
        units: hiddenLayerSize,
        activation: 'elu',
        // `inputShape` is required only for the first layer.
        inputShape: i === 0 ? [4] : undefined
      }));
    });
    // The last layer has only one unit. The single output number will be
    // converted to a probability of selecting the leftward-force action.
    this.policyNet.add(tf.layers.dense({units: 1}));
  }

  async train(
      cartPoleSystem, optimizer, discountRate, numGames, maxStepsPerGame) {
    const allGradients = [];
    const allRewards = [];
    const gameSteps = [];
    onGameEnd(0, numGames);
    for (let i = 0; i < numGames; ++i) {
      // Randomly initialize the state of the cart-pole system at the beginning
      // of every game.
      cartPoleSystem.setRandomState();
      const gameRewards = [];
      const gameGradients = [];
      for (let j = 0; j < maxStepsPerGame; ++j) {
        // For every step of the game, remember gradients of the policy
        // network's weights with respect to the probability of the action
        // choice that lead to the reward.
        const gradients = tf.tidy(() => {
          const inputTensor = cartPoleSystem.getStateTensor();
          return this.getGradientsAndSaveActions(inputTensor).grads;
        });

        this.pushGradients(gameGradients, gradients);
        const action = this.currentActions_[0];
        const isDone = cartPoleSystem.update(action);

        await maybeRenderDuringTraining(cartPoleSystem);

        if (isDone) {
          // When the game ends before max step count is reached, a reward of
          // 0 is given.
          gameRewards.push(0);
          break;
        } else {
          // As long as the game doesn't end, each step leads to a reward of 1.
          // These reward values will later be "discounted", leading to
          // higher reward values for longer-lasting games.
          gameRewards.push(1);
        }
      }
      onGameEnd(i + 1, numGames);
      gameSteps.push(gameRewards.length);
      this.pushGradients(allGradients, gameGradients);
      allRewards.push(gameRewards);
      await tf.nextFrame();
    }

    tf.tidy(() => {

      const normalizedRewards =
          discountAndNormalizeRewards(allRewards, discountRate);

      optimizer.applyGradients(
          scaleAndAverageGradients(allGradients, normalizedRewards));
    });
    tf.dispose(allGradients);
    return gameSteps;
  }

  getGradientsAndSaveActions(inputTensor) {
    const f = () => tf.tidy(() => {
      const [logits, actions] = this.getLogitsAndActions(inputTensor);
      this.currentActions_ = actions.dataSync();
      const labels =
          tf.sub(1, tf.tensor2d(this.currentActions_, actions.shape));
      return tf.losses.sigmoidCrossEntropy(labels, logits).asScalar();
    });
    return tf.variableGrads(f);
  }

  getCurrentActions() {
    return this.currentActions_;
  }

  getLogitsAndActions(inputs) {
    return tf.tidy(() => {
      const logits = this.policyNet.predict(inputs);

      // Get the probability of the leftward action.
      const leftProb = tf.sigmoid(logits);
      // Probabilites of the left and right actions.
      const leftRightProbs = tf.concat([leftProb, tf.sub(1, leftProb)], 1);
      const actions = tf.multinomial(leftRightProbs, 1, null, true);
      return [logits, actions];
    });
  }

  getActions(inputs) {
    return this.getLogitsAndActions(inputs)[1].dataSync();
  }

  pushGradients(record, gradients) {
    for (const key in gradients) {
      if (key in record) {
        record[key].push(gradients[key]);
      } else {
        record[key] = [gradients[key]];
      }
    }
  }
}
