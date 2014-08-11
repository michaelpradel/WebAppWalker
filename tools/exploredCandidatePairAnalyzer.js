(function() {

  var fs = require('fs');

  // parameters
  var maxDataPointsPerCandidatePair = 2;

  function readCandidatePairs(fileName) {
    var json = fs.readFileSync(fileName);
    var pairs = JSON.parse(json);
    return pairs;
  }

  function prepareForPlotting(candidatePairs /*string->candidatePair*/) {
    var dataColumns = []; // array of arrays of string/number
    for (var candidatePairStr in candidatePairs) {
      var candidatePair = candidatePairs[candidatePairStr];
      if (candidatePair.costs.length >= maxDataPointsPerCandidatePair) {
        var column = [candidatePair.id];
        candidatePair.costs.forEach(function(cost) {
          column.push(cost);
        });
        dataColumns.push(column);
      }
    }
    ;

    var output = "";
    // header row
//    output += '""';
//    dataColumns.forEach(function(column) {
//      output += (" " + column[0]);
//    });
//    output += "\n";

    // data rows
    for (var idx = 1; idx <= maxDataPointsPerCandidatePair; idx++) {
      output += idx;
      dataColumns.forEach(function(column) {
        output += (" " + column[idx]);
      });
      output += "\n";
    }

    return output;
  }

  var fileName = process.argv[2];
  var candidatePairs = readCandidatePairs(fileName);
  var plotData = prepareForPlotting(candidatePairs);
  fs.writeFileSync("plots.dat", plotData);

})();

