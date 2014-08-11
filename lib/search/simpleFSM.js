(function() {

  function FSM() {
    this.id2State = {};
    this.idOfInitialState = undefined;
  }

  FSM.prototype = {
    getOrCreateState: function(id, isInitial) {
      var s = this.id2State[id];
      if (s === undefined) {
        s = new State(id);
        this.id2State[id] = s;
      }
      if (isInitial)
        this.idOfInitialState = id;
      return s;
    },
    nbStates: function() {
      return Object.keys(this.id2State).length;
    },
    nbTransitions: function() {
      var sum = 0;
      for (var stateId in this.id2State) {
        var state = this.id2State[stateId];
        sum += Object.keys(state.ids2Transition);
      }
      return sum;
    },
    states: function() {
      var result = [];
      for (var id in this.id2State) {
        result.push(this.id2State[id]);
      }
      return result;
    },
    transitionsWithLabel: function(label) {
      var result = [];
      this.states().forEach(function(state) {
        state.transitions().forEach(function(transition) {
          if (transition.label === label)
            result.push(transition);
        });
      });
      return result;
    }
  };

  function State(id) {
    this.id = id;
    this.id2Transition = {}; // maps transitionLabel+"-->"+destId to a Transition
  }

  State.prototype = {
    addOutgoing: function(transitionLabel, dest) {
      if (transitionLabel === undefined)
        throw new Error("Undefined transition label");
      if (dest === undefined)
        throw new Error("Undefined destination state");
      var transId = transitionLabel + "-->" + dest.id;
      var transition = this.id2Transition[transId];
      if (transition === undefined) {
        transition = new Transition(transitionLabel, dest.id, transId);
        this.id2Transition[transId] = transition;
      }
      return transition;
    },
    transitions: function() {
      var result = [];
      for (var id in this.id2Transition) {
        result.push(this.id2Transition[id]);
      }
      return result;
    },
    transitionsToStateId: function(destId) {
      var result = [];
      for (var id in this.id2Transition) {
        if (this.id2Transition[id].destId === destId) {
          result.push(this.id2Transition[id]);
        }
      }
      return result;
    }
  };

  function Transition(label, destId, transId) {
    this.label = label;
    this.destId = destId; // id of destination state
    this.id = transId;
  }

  exports.FSM = FSM;
  exports.State = State;

})();

