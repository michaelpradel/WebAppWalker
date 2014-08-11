(function() {

  var FSM = require('./fsm.js').FSM;
  var commonUtil = require('../commonUtil.js');

  function learnFSM(history) {
    var traceFsm = new FSM();
    var sigma = [];
    history.forEach(function(historyTransition) {
      var sdevtStr = historyTransition.sdevt.asString;
      if (sigma.indexOf(sdevtStr) === -1) {
        sigma.push(sdevtStr);
      }
    });

    var currentState;
    history.forEach(function(historyTransition) {
      var srcState = traceFsm.addState(historyTransition.sdevt.src, sigma);
      if (currentState !== undefined) 
        commonUtil.assert(currentState.tag === srcState.tag);
      var transIdx = sigma.indexOf(historyTransition.sdevt.asString);
      var destState = traceFsm.addState(historyTransition.sdevt.dest, sigma);
      srcState.addTransition(destState, transIdx);
      currentState = destState;
    });

    var learnedFsm = traceFsm.deepCopy().learnFSM();
    learnedFsm.tagStates();
    var newCurrentState = learnedFsm.translate(currentState);

    return [learnedFsm, newCurrentState];
  }

  exports.learnFSM = learnFSM;

})();

