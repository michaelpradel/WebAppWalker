(function() {

  var fs = require('fs');
  var dict = require('dict');

  var handlerSummariesFile = "/tmp/jalangiWorkingDir/handlerSummaries.json";
  var callGraphFile = "/tmp/callGraph.sif";
  var targetFunctionsFile = "/tmp/jalangiWorkingDir/targetFunctions.json";
  var targetHandlersFile = "/tmp/jalangiWorkingDir/targetHandlers.json";

  function readJSONFile(fileName) {
    var data = fs.readFileSync(fileName);
    return JSON.parse(data);
  }

  function writeJSONFile(data, fileName) {
    var json = JSON.stringify(data);
    fs.writeFileSync(fileName, json);
  }

  function readCallGraph(fileName) {
    var data = fs.readFileSync(fileName);
    var lines = data.split("\n");
    var allNodes = dict(); // maps node names to nodes
    lines.forEach(function(line) {
      var splitted = line.split(" ");
      if (splitted.length !== 3 || splitted[1] !== "<calls>") 
        throw "Unexpected line " + line;
      var fromNode = allNodes.has(splitted[0]) ? allNodes.get(splitted[0]) : new Node(splitted[0]);
      var toNode = allNodes.has(splitted[2]) ? allNodes.get(splitted[2]) : new Node(splitted[2]);
      fromNode.calls[toNode.name] = true;
      allNodes.set(fromNode.name, fromNode);
      allNodes.set(toNode.name, toNode);
    });
    return allNodes;
  }

  function computeTargetHandlers(handlerSummaries, callGraph, targetFunctions) {
    // TODO continue here once the call graph uses the same unique fct names as the handler summaries
    // (see TODO in LoopFinderEngine)
  }

  var Node = function(name) {
    this.name = name;
    this.calls = dict(); // maps node names to true
  };
  
  // main part
  // 1) read input data
  var handlerSummaries = readJSONFile(handlerSummariesFile);
  var callGraph = readCallGraph(callGraphFile);
  var targetFunctions = readJSONFile(targetFunctionsFile);
  
  // 2) compute and output result
  var targetHandlers = computeTargetHandlers(handlerSummaries, callGraph, targetFunctions);
  writeJSONFile(targetHandlers, targetFunctionsFile);

})();


