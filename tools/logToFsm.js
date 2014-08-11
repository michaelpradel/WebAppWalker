(function() {

  var fs = require('fs');
  var fsmLearner = require('../lib/search/fsmLearner.js');

  function SEvent(state, evtString) {
    this.state = state;
    this.evt = {asString: evtString};
    this.asString = this.state + this.evt.asString;
  }

  function readFile(fileName) {
    var data = fs.readFileSync(fileName);
    var lines = data.toString().split("\n");
    console.log("Lines: " + lines.length);
    var result = [];
    lines.forEach(function(line) {
      if (line) {
        var splitted = line.split("@@@");
        if (splitted.length !== 2)
          throw "Unexpected line: " + line;
        var sevt = new SEvent(splitted[1].replace(/ /g, "_"), splitted[0].replace(/ /g, "_"));
        result.push(sevt);
      }
    });
    return result;
  }

  function logToFsmAndState(logFile) {
    var trace = readFile(logFile);
    return fsmLearner.learnFSM(trace);
  }

  // main part
  var fsmAndState = logToFsmAndState("/tmp/v");
  console.log(fsmAndState[0].toString());
  console.log("Current state :" + fsmAndState[1].tag);

  exports.logToFsmAndState = logToFsmAndState;

})();

