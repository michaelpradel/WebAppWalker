(function() {

  var fs = require('fs');
  
  var inFile = process.argv[2];
  var outFile = process.argv[3];
  var nb = process.argv[4];
  var json = fs.readFileSync(inFile);
  var rules = JSON.parse(json);
  var newRules = rules.slice(nb);
  fs.writeFileSync(outFile, JSON.stringify(newRules, 0, 2));

})();