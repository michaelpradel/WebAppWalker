(function() {

  var fs = require('fs');

  var inFile = process.argv[2];
  var outFile = process.argv[3];
  var maxLength = process.argv[4];
  
  var json = fs.readFileSync(inFile);
  var history = JSON.parse(json);
  var newHistory = history.slice(0, maxLength);
  fs.writeFileSync(outFile, JSON.stringify(newHistory, 0, 2));

})();

