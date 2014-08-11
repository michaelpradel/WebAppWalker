(function () {
  
  var targetedExploration = require('../lib/search/targetedExploration.js');
  var logToFsm = require('../tools/logToFsm.js');
  
  function findTargetTransition(fsm) {
    for (var sId in fsm.states) {
      var s = fsm.states[sId];
      for (var eId in s.edges) {
        var transLabel = s.events[eId];
        if (transLabel.indexOf("Module") !== -1 && transLabel.indexOf("Save") !== -1) {
          return transLabel;
        }
      }
    }
  }
  
  var fsmAndState = logToFsm.logToFsmAndState("/tmp/v");
  var fsm = fsmAndState[0];
  var currentState = fsmAndState[1];
  var targetEvt = findTargetTransition(fsm);
  var impossibleEvts = [];
  
  var sequence = targetedExploration.computeEventSequence(fsm, currentState, targetEvt, impossibleEvts);
  
  
  
})();

