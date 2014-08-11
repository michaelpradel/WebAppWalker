(function() {

  var fs = require('fs');
  var commonUtil = require('./commonUtil.js');

  function translateHistory(history) {
    var newHistory = [];

    history.forEach(function(oldTrans) {
      var oldSEvt = oldTrans.sevt;
      var sdevt = new commonUtil.SDEvent(oldSEvt.state, oldSEvt.evt, oldTrans.dest);
      var newTrans = new commonUtil.Transition(sdevt, oldTrans.cost);
      newHistory.push(newTrans);
    });
    
    return newHistory;
  }

  var inFile = process.argv[2];
  var outFile = process.argv[3];

  var json = fs.readFileSync(inFile);
  var history = JSON.parse(json);
  var newHistory = translateHistory(history);
  fs.writeFileSync(outFile, JSON.stringify(newHistory, 0, 2));

})();

