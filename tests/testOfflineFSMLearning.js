(function () {
  
  var FSM = require('../lib/search/fsm.js').FSM;
  
  var traceFsm = new FSM();
  
  var s1 = traceFsm.addState("0", []);
  var s2 = traceFsm.addState("1", []);
  
  s1.addTransition(s2, "new");
  s2.addTransition(s2, "input");
  s2.addTransition(s1, "save");
  s1.addTransition(s2, "new");
  s2.addTransition(s2, "input");
  s2.addTransition(s1, "save");
  s1.addTransition(s2, "new");
  s2.addTransition(s2, "save");
  s2.addTransition(s2, "input");
  s2.addTransition(s1, "save");
  
  traceFsm.tagStates();
  
  console.log(traceFsm);

  var learnedFsm = traceFsm.deepCopy().learnFSM();
  learnedFsm.tagStates();
  
  console.log("\nLearned:");
  console.log(learnedFsm.toString());

  
  
})();

