(function() {

  var commonUtil = require('../commonUtil.js');

  function addTransition(src, evt, dest, cost) {
    // ignore, we take stateless, random decisions
  }

  function selectNextEvent(currentState, availableEvents) {
    return commonUtil.randElem(availableEvents);
  }

  function reset() {
    // nothing to do (stateless)
  }

  function printStats() {
    
  }

  exports.addTransition = addTransition;
  exports.selectNextEvent = selectNextEvent;
  exports.reset = reset;
  exports.printStats = printStats;

})();

