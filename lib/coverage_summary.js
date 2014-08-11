(function() {
  var iofile = require("sdk/io/file");

  var tabularPrintout = iofile.open("/tmp/test_out_file", "w");
  var summary_count = 0;
  exports.finished = function(coverageData) {
    tabularPrintout.close();
  };
  exports.print_summary = function(coverageData) {
    coverageData = JSON.parse(coverageData);
    var nbBranchTotal = 0;
    var nbCovBranchTotal = 0;
    summary_count += 1;
    for (var filename in coverageData) {
      var nbCoveredBranchesInFile = 0;
      var nbUncoveredBranchesInFile = 0;
      if (coverageData.hasOwnProperty(filename)) {
        var branchDataByLine = coverageData[filename].branchData;
        for (var branchLine in branchDataByLine) {
          if (branchDataByLine.hasOwnProperty(branchLine)) {
            var branchDataArray = branchDataByLine[branchLine];
            for (var branchIdx = 0; branchIdx < branchDataArray.length; branchIdx++) {
              var branchData = branchDataArray[branchIdx];
              if (branchData) {
                branchData = JSON.parse(branchData);
                if (branchData.evalFalse === 0) {
                  nbUncoveredBranchesInFile++;
                } else {
                  nbCoveredBranchesInFile++;
                }
                if (branchData.evalTrue === 0) {
                  nbUncoveredBranchesInFile++;
                } else {
                  nbCoveredBranchesInFile++;
                }
              }
            }
          }
        }
        console.log("   " + filename + ": " + covString(nbCoveredBranchesInFile, nbUncoveredBranchesInFile));
        nbCovBranchTotal += nbCoveredBranchesInFile;
        nbBranchTotal += nbCoveredBranchesInFile + nbUncoveredBranchesInFile;
      }
    }
    tabularPrintout.write(summary_count + " " + nbCovBranchTotal + " " + nbBranchTotal + "\n");
  };
  function covString(covered, uncovered) {
    return covered + "/" + (covered + uncovered) + " = " + percCovered(covered, uncovered) + "%";
  }

  function percCovered(covered, uncovered) {
    return Math.round((100 * covered) / (covered + uncovered));
  }
  var Summarizer = function(coverageInterval, currentDir, baseName) {
    this.log_dir = currentDir + "/" + baseName;
    this.event_counter = -1;
    this.log_counter = 0;
    this.coverageInterval = coverageInterval;
    this.startTime = new Date().getTime();
    iofile.mkpath(this.log_dir);
  };
  Summarizer.prototype = {
    tick: function(nextEvent, driver) {
      var summarizer = this;
      this.event_counter++;
//      console.log("event counter: "+this.event_counter);
      if (this.event_counter % this.coverageInterval === 0) {
//        console.log(" .. taking coverage snapshot");
        driver.requestCoverageData(function(coverageDataJSON) {
          var coverageData = JSON.parse(coverageDataJSON);
          summarizer.writeMoreData(coverageData);
          nextEvent();
        });
      } else {
        nextEvent();
      }
    },
    writeMoreData: function(coverageData) {
      var stamp = new Date().getTime() - this.startTime;
      var data = {
        t_stamp: stamp,
        eventNum: this.event_counter,
        data: coverageData
      };
      var json = JSON.stringify(data);
      var file = iofile.open(this.log_dir + "/" + "cov" + this.log_counter, "w");
      file.write(json);
      file.close();
      var stamp2 = (new Date().getTime() - this.startTime) - stamp;
//      console.log("time to write cov data: " + stamp2);
      this.log_counter++;
    },
    finish: function() {
    }
  };
  exports.Summarizer = Summarizer;

})();
