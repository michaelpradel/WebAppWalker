(function() {

  var fs = require('fs');

  function read(file) {
    var json = fs.readFileSync(file);
    return JSON.parse(json);
  }

  function diff(trace1, trace2) {
    for (var multiIdx = 0; multiIdx < trace1.length; multiIdx++) {
      var multi1 = trace1[multiIdx];
      // TODO CONT if necessary
    }
  }


  var file1 = process.argv[2];
  var file2 = process.argv[3];
  var trace1 = read(file1);
  var trace2 = read(file2);
  diff(trace1, trace2);

})();