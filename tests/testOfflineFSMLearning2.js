(function () {
  
  var learner = require('../lib/search/fsmLearner.js');

  // paper example
  var history = [];
  // phase 1
  history.push({ sdevt: {src: "Admin", dest: "Menu", asString: "E5@Admin>Menu"}}); 
  history.push({ sdevt: {src: "Menu", dest: "Admin", asString: "E6@Menu>Admin"}});
  history.push({ sdevt: {src: "Admin", dest: "Items", asString: "E1@Admin>Items"}});
  history.push({ sdevt: {src: "Items", dest: "New", asString: "E2@Items>New"}});
  history.push({ sdevt: {src: "New", dest: "New", asString: "E3@New>New"}});
  history.push({ sdevt: {src: "New", dest: "Admin", asString: "E4@New>Admin"}});
  history.push({ sdevt: {src: "Admin", dest: "Menu", asString: "E5@Admin>Menu"}});
  history.push({ sdevt: {src: "Menu", dest: "Admin", asString: "E6@Menu>Admin"}});
  history.push({ sdevt: {src: "Admin", dest: "Items", asString: "E1@Admin>Items"}});
  history.push({ sdevt: {src: "Items", dest: "New", asString: "E2@Items>New"}});
  history.push({ sdevt: {src: "New", dest: "Admin", asString: "E7@New>Admin"}});
  history.push({ sdevt: {src: "Admin", dest: "Menu", asString: "E5@Admin>Menu"}});
  history.push({ sdevt: {src: "Menu", dest: "Admin", asString: "E6@Menu>Admin"}});
  history.push({ sdevt: {src: "Admin", dest: "Items", asString: "E1@Admin>Items"}});
  history.push({ sdevt: {src: "Items", dest: "New", asString: "E2@Items>New"}});
  history.push({ sdevt: {src: "New", dest: "New", asString: "E3@New>New"}});
  history.push({ sdevt: {src: "New", dest: "Admin", asString: "E4@New>Admin"}});
  history.push({ sdevt: {src: "Admin", dest: "Menu", asString: "E5@Admin>Menu"}});
  history.push({ sdevt: {src: "Menu", dest: "Admin", asString: "E6@Menu>Admin"}});
  // phase 2
  history.push({ sdevt: {src: "Admin", dest: "Items", asString: "E1@Admin>Items"}});
  history.push({ sdevt: {src: "Items", dest: "New", asString: "E2@Items>New"}});  
  history.push({ sdevt: {src: "New", dest: "New", asString: "E4@New>New"}});
  
  var fsmAndState = learner.learnFSM(history);
  var learnedFsm = fsmAndState[0];
  var currentState = fsmAndState[1];
  
  console.log("\nLearned:");
  console.log(learnedFsm.toString());
  console.log("Current state: "+currentState.tag);

  
  
})();

