
function StateMachine(state) {
    this.currentState = state;
    this.prevState = '';
};

StateMachine.prototype.setState = function (state) {
    this.prevState = this.currentState;
    this.currentState = state;
    console.log('prevState = ' + this.prevState + ' newState = ' + this.currentState);
};

StateMachine.prototype.getState = function () {
    return this.currentState;
};

module.exports = StateMachine;