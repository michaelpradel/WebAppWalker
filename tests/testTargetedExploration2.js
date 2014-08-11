(function() {

  var fs = require('fs');
  var learner = require('../lib/search/fsmLearner.js');
  var commonUtil = require('../lib/commonUtil.js');
  var perfInfluenceRules = require('../lib/search/perfInfluenceRules.js');
  var targetedExploration = require('../lib/search/targetedExploration.js');

  function readHistory(fileName) {
    var json = fs.readFileSync(fileName);
    return JSON.parse(json);
  }

  function filterAndSort(rules) {
    var filteredRules = rules.filter(function(rule) {
      return (rule.support >= 3 && rule.confidence >= 0.8);
    });

    var sorted = filteredRules.sort(function(r1, r2) {
      if (r1.confidence === r2.confidence) {
        return r2.support - r1.support;
      }
      return r2.confidence - r1.confidence;
    });

    return sorted;
  }

  // main part
  var fileName = process.argv[2];
  var history = readHistory(fileName);

  console.log("Length of history: "+history.length);

  var fsmAndState = learner.learnFSM(history);

  var fsm = fsmAndState[0];
  var currentState = fsmAndState[1];
  var impossibleEvts = [];
  var targetEvt = commonUtil.randElem(history).sdevt.asString;

  console.log("Current state: " + currentState.tag);

  var sequence = targetedExploration.computeEventSequence(fsm, currentState, targetEvt, impossibleEvts, 10);
  console.log("Found sequence of length "+sequence.length+":\n" + sequence);



})();

