(function() {

  var fs = require('fs');
  var perfInfluenceRules = require('../lib/search/perfInfluenceRules.js');
  var commonUtil = require('../lib/commonUtil.js');

  var minSupport = 3;  // 3
  var minConfidence = 0.8; // 0.8

  var rulesOutFile = "/tmp/perfRules.json";

  function readHistories(fileNames) {
    var histories = [];
    fileNames.forEach(function(fileName) {
      var json = fs.readFileSync(fileName);
      var history = JSON.parse(json);  
      // for rewriting "old" (prior to March 17) histories to Events w/o elementDetails
//      var rawHistory = JSON.parse(json);  // TODO remove event rewriting when done w/ SugarCRM experiment
//      var history = rawHistory.map(function(t) {
//        var oldEvt = t.sevt.evt;
//        var evt = { xpath: oldEvt.xpath, type: oldEvt.type, handlerName: oldEvt.handlerName };
//        if (oldEvt.eventDetails) evt.eventDetails = oldEvt.eventDetails;
//        if (oldEvt.id) evt.id = oldEvt.id;
//        if (oldEvt.class) evt.class = oldEvt.class;
//        evt.asString = commonUtil.eventToString(evt);
//        var sevt = new commonUtil.SEvent(t.sevt.state, evt);
//        return new commonUtil.Transition(sevt, t.cost, t.dest);
//      });
      histories.push(history);
    });
    return histories;
  }
  
  function writeRules(rules) {
    var data = JSON.stringify(rules, 0, 2);
    fs.writeFileSync(rulesOutFile, data);
  }

  function manualHistories() {
    var history = [];
    history.push({sevt: {asString: "a"}, cost: 1});
    history.push({sevt: {asString: "b"}, cost: 0});
    history.push({sevt: {asString: "a"}, cost: 2});
    history.push({sevt: {asString: "b"}, cost: 0});
    history.push({sevt: {asString: "a"}, cost: 4});
    history.push({sevt: {asString: "a"}, cost: 8});
    history.push({sevt: {asString: "a"}, cost: 8});
    history.push({sevt: {asString: "b"}, cost: 0});
    history.push({sevt: {asString: "a"}, cost: 4});

    return [history];
  }

  var fileNames = process.argv.slice(2);
  var histories = readHistories(fileNames);
//  var histories = manualHistories();

  var rules = perfInfluenceRules.computeRules(histories, minSupport, minConfidence);

  console.log("==== Sorted rules: ======================");
  rules.forEach(function(r) {
    console.log(r.toString());
  });
  
  writeRules(rules);
  

})();
