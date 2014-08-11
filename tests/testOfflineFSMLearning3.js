(function() {

  var fs = require('fs');
  var learner = require('../lib/search/fsmLearner.js');

  function readHistories(fileNames) {
    var histories = [];
    fileNames.forEach(function(fileName) {
      var json = fs.readFileSync(fileName);
      var history = JSON.parse(json);
      histories.push(history);
    });
    return histories;
  }

  var fileNames = process.argv.slice(2);
  var histories = readHistories(fileNames);
  if (histories.length !== 1)
    throw new Error("Only 1 history support currently");
  var history = histories[0];
  
  var fsmAndState = learner.learnFSM(history);
  
  console.log(fsmAndState[0].toString());
  console.log(fsmAndState[0].toIdString());
  console.log("\nCurrent state: "+fsmAndState[1].tag);

})();

