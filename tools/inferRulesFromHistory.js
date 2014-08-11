(function() {

    var fs = require('fs');
    var perfInfluenceRules = require('../lib/search/perfInfluenceRules.js');

    var minSupport = 2;  // 3
    var minConfidence = 0.7; // 0.8

    function readHistory(fileName) {
        var json = fs.readFileSync(fileName);
        return JSON.parse(json);
    }

    function writeRules(rules, rulesOutFile) {
        var data = JSON.stringify(rules, 0, 2);
        fs.writeFileSync(rulesOutFile, data);
    }

    var historyFile= process.argv[2];
    var rulesFile = process.argv[3];
    var history = readHistory(historyFile);

    var rules = perfInfluenceRules.computeRules([ history ], minSupport, minConfidence);

    console.log("==== Sorted rules: ======================");
    rules.forEach(function(r) {
        console.log(r.toString());
    });

    writeRules(rules, rulesFile);

})();