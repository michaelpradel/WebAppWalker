(function() {

  var commonUtil = require('../commonUtil.js');
  var simpleFSM = require('../../lib/search/simpleFSM.js');
  var appModel = require('./appModel.js');

  function randomHubBasedModel(id, modelConfig) {
    var fsm = new simpleFSM.FSM();
    // create states
    var states = [];
    for (var stateIdx = 0; stateIdx < modelConfig.nbStates; stateIdx++) {
      var state = fsm.getOrCreateState("s" + stateIdx, (stateIdx === 0));
      states.push(state);
    }
    var transitionLabels = [];
    // random transitions
    for (var transIdx = 0; transIdx < modelConfig.nbTransitions; transIdx++) {
      var src = commonUtil.randElem(states);
      var dest;
      if (commonUtil.rand() < modelConfig.selfTransitionRatio)
        dest = src;
      else
        dest = commonUtil.randElem(states);
      src.addOutgoing("t" + transIdx, dest);
      transitionLabels.push("t" + transIdx);
    }
    // transitions back to initial state
    states.forEach(function(src) {
      src.addOutgoing("t" + transIdx, states[0]);
      transIdx++;
    });

    // select hubs and add transitions to/from them
    var hubStates = [states[0]];
    while (hubStates.length < modelConfig.nbStates * modelConfig.hubStateRatio) {
      var s = commonUtil.randElem(states);
      if (hubStates.indexOf(s) === -1) {
        hubStates.push(s);
        // initial node --> hub
        if (states[0].transitionsToStateId(s.id).length === 0) {
          states[0].addOutgoing("t" + transIdx, s);
          transIdx++;
        }
      }
    }
    states.forEach(function(state, idx) {
      var hubForState = hubStates[idx % hubStates.length];
      // hub --> state
      if (hubForState.transitionsToStateId(state.id).length === 0) {
        hubForState.addOutgoing("t" + transIdx, state);
        transIdx++;
      }
    });

    var perfEffects = [];
    for (var perfEffectIdx = 0; perfEffectIdx < modelConfig.nbTransitions * modelConfig.perfInfluencingRatio; perfEffectIdx++) {
      var costDiff = commonUtil.randInt(2) ? 1 : -1;
      var effect = new appModel.PerfEffect(commonUtil.randElem(transitionLabels), commonUtil.randElem(transitionLabels), costDiff);
      perfEffects.push(effect);
    }
    return new appModel.Model(fsm, perfEffects, id);
  }

  function randomHubBasedModelWithCycles(id, modelConfig) {
    var fsm = new simpleFSM.FSM();
    // create states
    var states = [];
    for (var stateIdx = 0; stateIdx < modelConfig.nbStates; stateIdx++) {
      var state = fsm.getOrCreateState("s" + stateIdx, (stateIdx === 0));
      states.push(state);
    }

    var transIdx = 0;

    function getOrCreateTransition(src, dest) {
      var existingTransitions = src.transitionsToStateId(dest.id);
      var trans;
      if (existingTransitions.length > 0) {
        trans = commonUtil.randElem(existingTransitions);
      } else {
        trans = src.addOutgoing("t" + transIdx, dest);
        transIdx++;
      }
      return trans;
    }

    // create slowdown cycles
    var perfEffects = [];
    var nbCycles = modelConfig.nbTransitions * modelConfig.perfInfluencingRatio;
    for (var cycleIdx = 0; cycleIdx < nbCycles; cycleIdx++) {
      var cycleLength = commonUtil.randInt(modelConfig.maxCyclesLength);
      var firstState = commonUtil.randElem(states);
      var src = firstState;
      var  cycleTransitions = [];
      for (var inCycleTransIdx = 0; inCycleTransIdx < cycleLength - 1; inCycleTransIdx++) {
        var dest = commonUtil.randElem(states);
        cycleTransitions.push(getOrCreateTransition(src, dest));
        src = dest;
      }
      cycleTransitions.push(getOrCreateTransition(src, firstState)); // close the cycle
      
      var perfEffect = new appModel.PerfEffect(commonUtil.randElem(cycleTransitions).label, cycleTransitions[0].label, 1);
      perfEffects.push(perfEffect);
      
//      console.log("Created cycle "+cycleTransitions.map(function(t) {return t.label; })+" with effect "+perfEffect);
    }

    // random transitions
    while (transIdx < modelConfig.nbTransitions) {
      var src = commonUtil.randElem(states);
      var dest;
      if (commonUtil.rand() < modelConfig.selfTransitionRatio)
        dest = src;
      else
        dest = commonUtil.randElem(states);
      src.addOutgoing("t" + transIdx, dest);
      transIdx++;
    }

    // transitions back to initial state
    states.forEach(function(src) {
      if (src !== states[0]) {
        getOrCreateTransition(src, states[0]);
      }
    });

    // select hubs and add transitions to/from them
    var hubStates = [states[0]];
    while (hubStates.length < modelConfig.nbStates * modelConfig.hubStateRatio) {
      var s = commonUtil.randElem(states);
      if (hubStates.indexOf(s) === -1) {
        hubStates.push(s);
        getOrCreateTransition(states[0], s); // initial node --> hub
      }
    }
    states.forEach(function(state, idx) {
      var hubForState = hubStates[idx % hubStates.length];
      getOrCreateTransition(hubForState, state); // hub --> state
    });

    return new appModel.Model(fsm, perfEffects, id);
  }

  exports.randomHubBasedModel = randomHubBasedModel;
  exports.randomHubBasedModelWithCycles = randomHubBasedModelWithCycles;

})();

