(function() {

  var fs = require('fs');
  var dict = require('dict');

  var handlerSummariesFile = "/tmp/jalangiWorkingDir/handlerSummaries.json";
  var targetHandlersFile = "/tmp/jalangiWorkingDir/targetHandlers.json";
  var priorityFile = "/tmp/jalangiWorkingDir/handlerPriorities.json";
  var sifPath = "/tmp/jalangiWorkingDir/readsWrites.sif";

  function readFile(fileName) {
    var data = fs.readFileSync(fileName);
    return JSON.parse(data);
  }

  function writeFile(data, fileName) {
    var json = JSON.stringify(data);
    fs.writeFileSync(fileName, json);
  }

  function createFullSifGraph(handlerSummaries) {
    var sifGraph = "";
    for (var iidInfo in handlerSummaries) {
      var summary = handlerSummaries[iidInfo];
      var handlerName = cleanName(summary.uniqueName);
      for (var r in summary.reads) {
        sifGraph += r + "XXX influences " + handlerName + "\n";
      }
      for (var w in summary.writes) {
        sifGraph += handlerName + " influences " + w + "XXX\n";
      }
    }
    return sifGraph;
  }

  function computeProp2ReadsWrites(handlerSummaries) {
    var prop2RW = dict();
    for (var iidInfo in handlerSummaries) {
      var summary = handlerSummaries[iidInfo];
      var handlerName = cleanName(summary.uniqueName);
      for (var r in summary.reads) {
        var rw = prop2RW.has(r) ? prop2RW.get(r) : {r: {}, w: {}};
        rw.r[handlerName] = true;
        prop2RW.set(r, rw);
      }
      for (var w in summary.writes) {
        var rw = prop2RW.has(w) ? prop2RW.get(w) : {r: {}, w: {}};
        rw.w[handlerName] = true;
        prop2RW.set(w, rw);
      }
    }
    return prop2RW;
  }

  function createHandlerOnlySifGraph(handlerSummaries) {
    var prop2RW = computeProp2ReadsWrites(handlerSummaries);

    var edge2InfluencingVars = dict();
    prop2RW.forEach(function(rw) {
      for (var r in rw.r) {
        for (var w in rw.w) {
          var edgeStr = w + "@@@" + r;
          var inflVars = edge2InfluencingVars.get(edgeStr);
          if (inflVars === undefined) {
            inflVars = {};
            edge2InfluencingVars.set(edgeStr, inflVars);
          }
          inflVars[p] = true;
        }
      }
    });

    var sifEntries = {};
    edge2InfluencingVars.forEach(function(edgeStr) {
      var inflVars = edge2InfluencingVars.get(edgeStr);
      var src = edgeStr.split("@@@")[0];
      var dest = edgeStr.split("@@@")[1];
      var relation = "VIA";
      for (var v in inflVars) {
        relation += "_" + v;
      }
      var entry = src + " " + relation + " " + dest + "\n";
      sifEntries[entry] = true;
    });

    var sifGraph = "";
    for (var entry in sifEntries) {
      sifGraph += entry;
    }

    return sifGraph;
  }

  function PHandler(name) { // handler with a priority
    this.name = name;
    this.incoming = []; // handlers that write a value read by this handler
    this.prio = 0;
  }

  PHandler.prototype.addIncoming = function(other) {
    if (this.incoming.indexOf(other) === -1) {
      this.incoming.push(other);
    }
  };

  PHandler.prototype.setPrio = function(p) {
    if (this.prio < p)
      this.prio = p;
  };

  function computeHandlerPriorities(handlerSummaries, targetHandlers) {
    var prop2RW = computeProp2ReadsWrites(handlerSummaries);
    var handlerName2PHandler = {};
    prop2RW.forEach(function(rw) {
      for (var r in rw.r) {
        var rPHandler = handlerName2PHandler[r] || new PHandler(r);
        handlerName2PHandler[r] = rPHandler;
        for (var w in rw.w) {
          var wPHandler = handlerName2PHandler[w] || new PHandler(w);
          handlerName2PHandler[w] = wPHandler;

          rPHandler.addIncoming(wPHandler);
        }
      }
    });

    var maxPrio = 1024;
    for (var target in targetHandlers) {
      var visited = {};
      var frontier = {};
      frontier[target] = true;
      var stepsToTarget = 0;
      while (Object.keys(frontier).length > 0) {
        var nextFrontier = {};
        for (var current in frontier) {
          if (!(current in visited)) {
            visited[current] = true;
            var prio = maxPrio / (stepsToTarget + 1);
            handlerName2PHandler[current].setPrio(prio);
            handlerName2PHandler[current].incoming.forEach(function(incoming) {
              if (!(incoming.name in visited)) {
                nextFrontier[incoming.name] = true;
              }
            });
          }
        }
        frontier = nextFrontier;
        stepsToTarget++;
      }
    }

    console.log("\nPriorities:");
    var handlerName2Prio = {};
    for (var handlerName in handlerName2PHandler) {
      var pHandler = handlerName2PHandler[handlerName];
      handlerName2Prio[handlerName] = pHandler.prio;
      console.log(handlerName + " --> " + pHandler.prio);
    }

    return handlerName2Prio;
  }

  function cleanName(fullName) {
    return fullName.replace("/tmp/jalangiWorkingDir/http127.0.0.18000teststizencalculator", "").replace("_loopsMarked_.js", "");
  }

  function writeSifGraph(sifGraph) {
    fs.writeFileSync(sifPath, sifGraph);
  }

  // main part
  var handlerSummaries = readFile(handlerSummariesFile);
  var targetHandlers = readFile(targetHandlersFile);
//  var sifGraph = createFullSifGraph(handlerSummaries);
  var sifGraph = createHandlerOnlySifGraph(handlerSummaries);
  writeSifGraph(sifGraph);
  var handlerName2Prio = computeHandlerPriorities(handlerSummaries, targetHandlers);
  writeFile(handlerName2Prio, priorityFile);

})();