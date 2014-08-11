(function () {
  
  var ioFile = require("sdk/io/file");
  var commonUtil = require('./commonUtil.js');
  
  var filePrefix = "/tmp/jalangiWorkingDir/costTraces";
  var fileCtr = 0;
  
  function MultiTraceEntry(file, entries) { // represents multiple, subseqeuent trace entries in the same file
    this.file = file;
    this.entries = entries;
  }
  
  function indexesOf(c, s) {
    var result = [];
    var start = 0;
    while (true) {
      var i = s.indexOf(c, start);
      if (i === -1) return result;
      result.push(i);
      start = i + 1;
    }    
  }
  
  function addCostTrace(uncompressedCostTrace) {
    // transform into MultiTraceEntries
    var costTrace = []; // array of MultiTraceEntries
    var currentFile;
    var currentMultiEntry;
    uncompressedCostTrace.forEach(function (entry) {
      var colons = indexesOf(":", entry);
      commonUtil.assert(colons.length >= 2);
      var secondToLast = colons[colons.length - 2];
      var file = entry.slice(0, secondToLast);
      var shortEntry = entry.slice(secondToLast+1);
      if (currentFile !== file) {
        currentFile = file;
        currentMultiEntry = new MultiTraceEntry(file, []);
        costTrace.push(currentMultiEntry);
      }
      currentMultiEntry.entries.push(shortEntry);
    });
    
    // store
    fileCtr++;
    var f = ioFile.open(filePrefix+fileCtr+".json", "w");
    f.write(JSON.stringify(costTrace, 0, 2));
    f.close();
  }
  
  exports.addCostTrace = addCostTrace;
  
})();