(function() {

  var fs = require('fs');
  var commonUtil = require('./commonUtil.js');

  function extendHistory(history, refererToInitialState) {
    var newHistory = history.slice(0);
    var firstState = history[0].sdevt.src;
    var lastTransition = history[history.length - 1];
    var lastState = lastTransition.sdevt.dest;
    commonUtil.assert(firstState);
    commonUtil.assert(lastTransition);
    commonUtil.assert(lastState);
    
    var addedEvt = new commonUtil.Event("backToReferer", undefined, undefined, refererToInitialState);
    var addedSDEvt = new commonUtil.SDEvent(lastState, addedEvt, firstState);
    var addedTransition = new commonUtil.Transition(addedSDEvt, 0);
    console.log("Adding transition:\n"+JSON.stringify(addedTransition, 0, 2));
    
    newHistory.push(addedTransition);
    
    return newHistory;
  }

  var inFile = process.argv[2];
  var outFile = process.argv[3];
  var refererToInitialState = process.argv[4];

  var json = fs.readFileSync(inFile);
  var history = JSON.parse(json);
  var newHistory = extendHistory(history, refererToInitialState);
  fs.writeFileSync(outFile, JSON.stringify(newHistory, 0, 2));

})();

