(function() {

  var fs = require('fs');

//var benchmarks = [ "annex", "tenframe", "go", "calculator", "box2d", "galleria", "mancala", "memory-game", "reveal.js", "sweetspot" ];
  var benchmarks = ["annex", "go", "calculator", "galleria", "memory-game", "reveal.js", "tenframe"];
  var durations = [10, 600, 3600, 36000];
  var nbReps = 10;
  var searches = ["random", "SwiftHand", "manual"];

  var covBaseDir = "/home/m/research/experiments/webTestGen/coverage_data";

  function findAllFiles(benchmark, baseDirOpt) {
    var result = [];
    var baseDir = baseDirOpt || covBaseDir;
    fs.readdirSync(baseDir).forEach(function(path) {
      if (fs.lstatSync(baseDir + "/" + path).isDirectory() && path.indexOf(benchmark) === 0) {
        var inSub = findAllFiles(benchmark, baseDir + "/" + path);
        result = result.concat(inSub);
      } else if (path.indexOf(benchmark) === 0 && path.indexOf(".json") > 0) {
        result.push(baseDir + "/" + path);
      }
    });
    return result;
  }

  function mergeAllFiles() {
    benchmarks.forEach(function(bm) {
      var bmSummary = undefined;
      var allFiles = findAllFiles(bm);
      allFiles.forEach(function(covFile) {
        var covJSON = fs.readFileSync(covFile);
        var covData = JSON.parse(covJSON);
        if (!bmSummary)
          bmSummary = covData;
        else
          mergeCov(bmSummary, covData);
      });
      var jsonData = jscoverage_serializeCoverageToJSON(bmSummary);
      var summaryPath = covBaseDir + "/summary_" + bm + ".json";
      fs.writeFileSync(summaryPath, jsonData);
      console.log("Have written summary of " + allFiles.length + " to " + summaryPath);
    });
  }

  function mergeCov(dest, other) {
    for (file in other) {
      if (!(file in dest)) {
        dest[file] = other[file];
      } else { // merge file
        // merge line data
        if (dest[file].lineData.length !== other[file].lineData.length)
          throw "Line data doesn't match for file " + file + " (" + dest[file].lineData.length + " vs " + other[file].lineData.length + ")" + "\n" + dest[file].lineData + "\n" + other[file].lineData + " -- " + (typeof dest[file].lineData);
        for (var lineIdx = 0; lineIdx < dest[file].lineData.length; lineIdx++) {
          var otherLineCovered = other[file].lineData[lineIdx];
          dest[file].lineData[lineIdx] += otherLineCovered;
        }
        // merge function data
        if (dest[file].functionData.length !== other[file].functionData.length)
          throw "Function data doesn't match";
        for (var fctIdx = 0; fctIdx < dest[file].functionData.length; fctIdx++) {
          var otherFctCovered = other[file].functionData[fctIdx];
          dest[file].functionData[fctIdx] += otherFctCovered;
        }
        // merge branch data
        if (dest[file].branchData.length !== other[file].branchData.length)
          throw "Branch data doesn't match";
        var destBranchData = dest[file].branchData;
        var otherBranchData = other[file].branchData;
        for (branchLine in destBranchData) {
          if (otherBranchData[branchLine] === undefined)
            throw "Branch file numbers don't match";
          for (var branchIdx = 0; branchIdx < destBranchData[branchLine].length; branchIdx++) {
            if (otherBranchData[branchLine][branchIdx]) {
              if (!destBranchData[branchLine][branchIdx])
                throw "Branch item doesn't match";
              var otherBranchDataItem = jsonToBranchData(otherBranchData[branchLine][branchIdx]);
              var destBranchDataItem = jsonToBranchData(destBranchData[branchLine][branchIdx]);
              if (otherBranchDataItem.position !== destBranchDataItem.position ||
                  otherBranchDataItem.nodeLength !== destBranchDataItem.nodeLength ||
                  otherBranchDataItem.src !== destBranchDataItem.src)
                throw "Branch item doesn't match";
              destBranchDataItem.evalFalse += otherBranchDataItem.evalFalse;
              destBranchDataItem.evalTrue += otherBranchDataItem.evalTrue;
              destBranchData[branchLine][branchIdx] = destBranchDataItem.toJSON();
            }
          }
        }
      }
    }
  }


  function test1() {
    var cov1JSON = fs.readFileSync("coverage_test_data/cov1.json");
    var cov2JSON = fs.readFileSync("coverage_test_data/cov2.json");
    var cov3JSON = fs.readFileSync("coverage_test_data/cov3.json");
    var cov1 = JSON.parse(cov1JSON);
    var cov2 = JSON.parse(cov2JSON);
    var cov3 = JSON.parse(cov3JSON);
    mergeCov(cov1, cov2);
    mergeCov(cov1, cov3);
    console.log(jscoverage_serializeCoverageToJSON(cov1));
  }

  function test2() {
    var cov1 = JSON.parse(fs.readFileSync("/home/m/research/experiments/webTestGen/coverage_data/annex_10seconds_rep0.json"));
    var cov2 = JSON.parse(fs.readFileSync("/home/m/research/experiments/webTestGen/coverage_data/annex_36000seconds_rep2.json"));
    mergeCov(cov1, cov2);
    console.log(JSON.stringify(cov1, 0, 2));
  }

  function debug() {
    var cov1 = JSON.parse(fs.readFileSync("/home/m/research/experiments/webTestGen/coverage_data/box2d_10seconds_rep0.json"));
    var cov2 = JSON.parse(fs.readFileSync("/home/m/research/experiments/webTestGen/coverage_data/box2d_10seconds_rep1.json"));
    mergeCov(cov1, cov2);
    console.log(JSON.stringify(cov1, 0, 2));
    console.log("XXXXXXXXXXXXXXXXXXXXXXXXXX");
    console.log(JSON.stringify(cov2, 0, 2));
  }

  function pickUncoveredBranch() {
    var allUncoveredBranches = [];
    var nbCovered = 0;
    for (var bmIdx = 0; bmIdx < benchmarks.length; bmIdx++) {
      var bm = benchmarks[bmIdx];
      var summaryPath = covBaseDir + "/summary_" + bm + ".json";
      var covJSON = fs.readFileSync(summaryPath);
      var covData = JSON.parse(covJSON);
      for (file in covData) {
        if (covData.hasOwnProperty(file)) {
          var allBranchData = covData[file].branchData;
          for (branchLine in allBranchData) {
            if (allBranchData.hasOwnProperty(branchLine)) {
              var branchDataArray = allBranchData[branchLine];
              for (var branchIdx = 0; branchIdx < branchDataArray.length; branchIdx++) {
                var branchData = branchDataArray[branchIdx];
                if (branchData) {
                  if (branchData.evalFalse === 0) {
                    addUncoveredBranch(bm, file, allUncoveredBranches, "false", branchData, branchLine);
                  } else if (branchData.evalTrue === 0) {
                    addUncoveredBranch(bm, file, allUncoveredBranches, "true", branchData, branchLine);
                  } else {
                    nbCovered += 2;
                  }
                }
              }
            }
          }
        }
      }
    }

    console.log("Total uncovered branches: " + allUncoveredBranches.length + " / " + (nbCovered + allUncoveredBranches.length));
    for (var i = 0; i < 20; i++) {
      var pick = allUncoveredBranches[randInt(allUncoveredBranches.length)];
      console.log("Random pick:\n" + pick + "\n");
    }
  }

  function addUncoveredBranch(benchmark, file, allUncoveredBranches, condition, branchData, line) {
    var s = benchmark + ", " + file + ", line " + line + "\n  has never evaluated to " + condition + "\n  " + branchData.position + " .. " + (branchData.position + branchData.nodeLength) + " : " + branchData.src;
    allUncoveredBranches.push(s);
  }

  function summarizeMergedData() {
    for (var bmIdx = 0; bmIdx < benchmarks.length; bmIdx++) {
      var bm = benchmarks[bmIdx];
      console.log("\nCovered branches for " + bm + ":");
      var summaryPath = covBaseDir + "/summary_" + bm + ".json";
      var covJSON = fs.readFileSync(summaryPath);
      var covData = JSON.parse(covJSON);
      var totalCoverage = branchCovAllFiles(covData, true);
      console.log("\n Total: " + totalCoverage);
    }
  }

  function branchCovAllFiles(covData, print) {
    var nbCoveredBranches = 0;
    var nbUncoveredBranches = 0;
    for (var file in covData) {
      if (covData.hasOwnProperty(file)) {
        var nbCoveredBranchesInFile = 0;
        var nbUncoveredBranchesInFile = 0;
        var allBranchData = covData[file].branchData;
        for (var branchLine in allBranchData) {
          if (allBranchData.hasOwnProperty(branchLine)) {
            var branchDataArray = allBranchData[branchLine];
            branchDataArray.forEach(function(branchDataStr) {
              if (branchDataStr) {
                var branchData = jsonToBranchData(branchDataStr);
                if (branchData.evalFalse === 0) {
                  nbUncoveredBranches++;
                  nbUncoveredBranchesInFile++;
                } else {
                  nbCoveredBranches++;
                  nbCoveredBranchesInFile++;
                }
                if (branchData.evalTrue === 0) {
                  nbUncoveredBranches++;
                  nbUncoveredBranchesInFile++;
                } else {
                  nbCoveredBranches++;
                  nbCoveredBranchesInFile++;
                }
              }
            });
          }
        }
        if (print && (nbCoveredBranchesInFile + nbUncoveredBranchesInFile > 0)) {
          console.log("  " + file + ": " + covString(nbCoveredBranchesInFile, nbUncoveredBranchesInFile));
        }
      }
    }
    if (nbCoveredBranches + nbUncoveredBranches > 0) {
      if (print) {
        console.log("\n Total: " + covString(nbCoveredBranches, nbUncoveredBranches));
      }
      return percCovered(nbCoveredBranches, nbUncoveredBranches);
    } else {
      return undefined;
    }
  }

  function CovAtPoint(point) {
    this.point = point;
    this.values = [];
  }

  CovAtPoint.prototype.mean = function() {
    var sum = 0;
    this.values.forEach(function(v) {
      sum += v
    });
    return sum / this.values.length;
  };

  CovAtPoint.prototype.max = function() {
    var max = 0;
    this.values.forEach(function(v) {
      if (v > max)
        max = v;
    });
    return max;
  };

  CovAtPoint.prototype.min = function() {
    var min = 100;
    this.values.forEach(function(v) {
      if (v < min)
        min = v;
    });
    return min;
  };

  function prepareCoverageDataForPlotting() {
    var baseDir = covBaseDir + "/over_time/";
    benchmarks.forEach(function(bm) {
      searches.forEach(function(search) {
        var allDirsForBmAndSearch = fs.readdirSync(baseDir).filter(function(path) {
          return (fs.lstatSync(baseDir + path).isDirectory() &&
              path.indexOf(bm) === 0 &&
              path.indexOf(search) === path.length - search.length);
        }).map(function(relDir) {
          return baseDir + relDir;
        });
        var event2Cov = {};
        allDirsForBmAndSearch.forEach(function(dir) {
          console.log("Reading directory " + dir);
          // assumption: all dirs are from experiments of same length (e.g., all 10 seconds)
          fs.readdirSync(dir).forEach(function(covFile) {
            var json = fs.readFileSync(dir + "/" + covFile);
            var allData = JSON.parse(json);
            var existingCovAtEvt = event2Cov[allData.eventNum];
            if (existingCovAtEvt === undefined) {
              existingCovAtEvt = new CovAtPoint(allData.eventNum);
              event2Cov[allData.eventNum] = existingCovAtEvt;
            }
            var coverage = branchCovAllFiles(allData.data);
            existingCovAtEvt.values.push(coverage);
          });
        });
        var plotData = producePlotData(event2Cov);
        fs.writeFileSync(baseDir + "/" + bm + "_" + search + ".data", plotData);
      });
    });
  }

  function producePlotData(event2Cov) {
    var result = "";
    for (var evt in event2Cov) {
      if (event2Cov.hasOwnProperty(evt)) {
        var cov = event2Cov[evt];
        var line = evt + ", " + cov.mean() + ", " + cov.min() + ", " + cov.max();
        result += line + "\n";
      }
    }
    return result;
  }

  function covString(covered, uncovered) {
    return covered + "/" + (covered + uncovered) + " = " + percCovered(covered, uncovered) + "%";
  }

  function percCovered(covered, uncovered) {
    return Math.round((100 * covered) / (covered + uncovered));
  }

// copied and adapted from JSCoverage:
  function BranchData() {
    this.position = -1;
    this.nodeLength = -1;
    this.src = null;
    this.evalFalse = 0;
    this.evalTrue = 0;

    this.init = function(position, nodeLength, src) {
      this.position = position;
      this.nodeLength = nodeLength;
      this.src = src;
      return this;
    }

    this.ranCondition = function(result) {
      if (result)
        this.evalTrue++;
      else
        this.evalFalse++;
    };

    this.pathsCovered = function() {
      var paths = 0;
      if (this.evalTrue > 0)
        paths++;
      if (this.evalFalse > 0)
        paths++;
      return paths;
    };

    this.covered = function() {
      return this.evalTrue > 0 && this.evalFalse > 0;
    };

    this.toJSON = function() {
      return '{"position":' + this.position
          + ',"nodeLength":' + this.nodeLength
          + ',"src":' + jscoverage_quote(this.src)
          + ',"evalFalse":' + this.evalFalse
          + ',"evalTrue":' + this.evalTrue + '}';
    };

    this.message = function() {
      if (this.evalTrue === 0 && this.evalFalse === 0)
        return 'Condition never evaluated         :\t' + this.src;
      else if (this.evalTrue === 0)
        return 'Condition never evaluated to true :\t' + this.src;
      else if (this.evalFalse === 0)
        return 'Condition never evaluated to false:\t' + this.src;
      else
        return 'Condition covered';
    };
  }

  function jsonToBranchData(jsonString) {
    var json = eval('(' + jsonString + ')');
    var branchData = new BranchData();
    branchData.init(json.position, json.nodeLength, json.src);
    branchData.evalFalse = json.evalFalse;
    branchData.evalTrue = json.evalTrue;
    return branchData;
  }
  ;

  function branchDataToJson(branchData) {
    return '{"position":' + branchData.position
        + ',"nodeLength":' + branchData.nodeLength
        + ',"src":' + jscoverage_quote(branchData.src)
        + ',"evalFalse":' + branchData.evalFalse
        + ',"evalTrue":' + branchData.evalTrue + '}';
  }

  function jscoverage_quote(s) {
    return '"' + s.replace(/[\u0000-\u001f"\\\u007f-\uffff]/g, function(c) {
      switch (c) {
        case '\b':
          return '\\b';
        case '\f':
          return '\\f';
        case '\n':
          return '\\n';
        case '\r':
          return '\\r';
        case '\t':
          return '\\t';
          // IE doesn't support this
          /*
           case '\v':
           return '\\v';
           */
        case '"':
          return '\\"';
        case '\\':
          return '\\\\';
        default:
          return '\\u' + jscoverage_pad(c.charCodeAt(0).toString(16));
      }
    }) + '"';
  }

  function jscoverage_serializeCoverageToJSON(covData) {
    var json = [];
    for (var file in covData) {
      var lineArray = getArrayJSON(covData[file].lineData);
      var fnArray = getArrayJSON(covData[file].functionData);

      json.push(jscoverage_quote(file) + ':{"lineData":[' + lineArray.join(',') + '],"functionData":[' + fnArray.join(',') + '],"branchData":' + convertBranchDataLinesToJSON(covData[file].branchData) + '}');
    }
    return '{' + json.join(',') + '}';
  }

  function getArrayJSON(coverage) {
    var array = [];
    if (coverage === undefined)
      return array;

    var length = coverage.length;
    for (var line = 0; line < length; line++) {
      var value = coverage[line];
      if (value === undefined || value === null) {
        value = 'null';
      }
      array.push(value);
    }
    return array;
  }

  function convertBranchDataLinesToJSON(branchData) {
    if (branchData === undefined) {
      return '{}'
    }
    var json = '';
    for (var line in branchData) {
      if (json !== '')
        json += ','
      json += '"' + line + '":' + convertBranchDataConditionArrayToJSON(branchData[line]);
    }
    return '{' + json + '}';
  }

  function convertBranchDataConditionArrayToJSON(branchDataConditionArray) {
    var array = [];
    var length = branchDataConditionArray.length;
    for (var condition = 0; condition < length; condition++) {
      var branchDataObject = branchDataConditionArray[condition];
      if (branchDataObject === undefined || branchDataObject === null) {
        value = 'null';
      } else {
        //value = branchDataToJson(branchDataObject);
        value = branchDataObject;
      }
      array.push(value);
    }
    return '[' + array.join(',') + ']';
  }



  function randInt(maxPlusOne) { // random int between zero and maxPlusOne
    return Math.floor((Math.random() * maxPlusOne));
  }

  // main

  //test1();
//test2();
//debug();

  if (process.argv[2] === "merge") {
    mergeAllFiles();
  } else if (process.argv[2] === "inspect") {
    pickUncoveredBranch();
  } else if (process.argv[2] === "summarize") {
    summarizeMergedData();
  } else if (process.argv[2] === "preparePlot") {
    prepareCoverageDataForPlotting();
  } else {
    console.log("Unknown command: " + process.argv[2]);
  }



})();