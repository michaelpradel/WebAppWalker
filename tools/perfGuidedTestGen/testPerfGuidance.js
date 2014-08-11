(function() {
  var commonUtil = require('../commonUtil.js');
  var simpleFSM = require('../../lib/search/simpleFSM.js');
  var fs = require('fs');
  var seedrandom = require('seedrandom');
  var appModel = require('./appModel.js');
  var randomAppModels = require('./randomAppModels.js');
  var experimentsModule = require('./experiments.js');
  var debug = true;

  // evaluation setup
  var maxEvts = 500;
  var nbRepetitions = 1;

  function Algorithm(id, implementation) {
    this.id = id;
    this.implementation = implementation;
  }

  var algorithms = [
    new Algorithm("random", require('../../lib/search/randomPerfGuidance.js')),
//    new Algorithm("cycles1", require('../../lib/search/cyclePerfGuidance.js')),
//    new Algorithm("cycles2", require('../../lib/search/cyclePerfGuidance2.js'))
    new Algorithm("cycles3", require('../../lib/search/cyclePerfGuidance3.js'))
  ]; // add alternative algorithms here

  // parameters for randomly created app models
  var modelConfigs = [
    {
      label: "baseConfig",
      nbStates: 8,
      hubStateRatio: 0.3,
      nbTransitions: 32, // + transitions from all states back to initial state + transitions to/from hubs
      selfTransitionRatio: 0.3,
      perfInfluencingRatio: 0.05,
      maxCyclesLength: 10
    }
  ];

  function createModelConfigs() {
    var result = [];
    // vary both nb states and nb transitions
//    for (var nbStates = 8; nbStates <= 1024; nbStates *= 2) {
//        var config = JSON.parse(JSON.stringify(modelConfigs[0]));
//        config.label = nbStates+"_states";
//        config.nbStates = nbStates;
//        config.nbTransitions = nbStates * 2;
//        result.push(config);
//    }
    // vary nb transitions
//    for (var nbTransitions = 2; nbTransitions <= 2048; nbTransitions *= 2) {
//        var config = JSON.parse(JSON.stringify(modelConfigs[0]));
//        config.label = nbTransitions+"_transitions";
//        config.nbTransitions = nbTransitions;
//        result.push(config);
//    }
    // vary perf-influencing ratio
    for (var perfInfluencingRatio = 0.01; perfInfluencingRatio <= 0.2; perfInfluencingRatio += 0.02) {
        var config = JSON.parse(JSON.stringify(modelConfigs[0]));
        config.label = perfInfluencingRatio+"_perfInfluenceRatio";
        config.perfInfluencingRatio = perfInfluencingRatio;
        result.push(config);
    }
    return result;
  }

  function createModel(modelConfig) {
//    var m = readManualModel("../../testData/manualModel1.txt");
//    var m = readManualModel("../../testData/manualModel2.txt");
//      var m = randomAppModels.randomHubBasedModel("random" + modelIdx);
    var m = randomAppModels.randomHubBasedModelWithCycles("random", modelConfig);
//      console.log(m.toString());
    return m;
  }

  function readManualModel(fileName) {
    var data = fs.readFileSync(fileName, {encoding: "utf8"});
    var allLines = data.split("\n");
    var divideIndex = allLines.indexOf("---");
    var transitionLines = allLines.slice(0, divideIndex).filter(function(l) {
      return l;
    }); // ignore empty lines
    var perfEffectLines = allLines.slice(divideIndex + 1).filter(function(l) {
      return l;
    });  // ignore empty lines

    var fsm = new simpleFSM.FSM();
    transitionLines.forEach(function(line, idx) {
      var splitted = line.split(" ");
      if (splitted.length !== 3)
        throw "Illegal transition line: " + line;
      var src = fsm.getOrCreateState(splitted[0], (idx === 0) /*isInitial*/);
      var dest = fsm.getOrCreateState(splitted[2]);
      src.addOutgoing(splitted[1], dest);
    });

    var perfEffects = [];
    perfEffectLines.forEach(function(line) {
      var splitted = line.split(" ");
      if (splitted.length !== 3)
        throw "Illegal performance effect line: " + line;
      perfEffects.push(new appModel.PerfEffect(splitted[0], splitted[1], parseInt(splitted[2])));
    });

    return new appModel.Model(fsm, perfEffects, fileName);
  }

  // returns the number of events triggered until a bug is found, or undefined if maxEvts reached
  function runAlgorithm(model, perfGuidance) {
    for (var nbEvtsTriggered = 0; nbEvtsTriggered < maxEvts; nbEvtsTriggered++) {
      var evt = perfGuidance.selectNextEvent(model.currentState(), model.availableTransitions());
      if (!evt)
        throw "selectNextEvent() returned " + evt;
      var dest = model.destination(evt);
      var cost = model.evt2Cost[evt.asString];

      if (debug)
        console.log("RRRR " + evt.asString + " with cost " + cost);

      // advance model and perfGuidance in lock-step
      perfGuidance.addTransition(model.currentState(), evt, dest, cost);
      var unresponsive = model.transition(evt);

      if (unresponsive) {
//        console.log("Unresponsive");
        return nbEvtsTriggered;
      }
    }
  }

  function Results() {
    this.modelId2NbEvents = {}; // string --> array of number/string
  }

  Results.prototype = {
    average: function() {
      return commonUtil.average(this.allNbEvents());
    },
    median: function() {
      return commonUtil.median(this.allNbEvents());
    },
    min: function() {
      return commonUtil.min(this.allNbEvents());
    },
    max: function() {
      return commonUtil.max(this.allNbEvents());
    },
    allNbEvents: function() {
      var allNbEvents = [];
      for (var modelId in this.modelId2NbEvents) {
        var nbEvents = this.modelId2NbEvents[modelId];
        allNbEvents = allNbEvents.concat(nbEvents);
      }
      allNbEvents = allNbEvents.map(function(n) {
        if (n === "max")
          return maxEvts;
        else
          return n;
      });
      return allNbEvents;
    }
  };

  // main part
//  var randomNbGenerator = seedrandom(23);  // enable to make testing deterministic
//  commonUtil.setRandomFct(randomNbGenerator);

  var algo2Results = {}; // string -> Results

  modelConfigs = createModelConfigs();

  var experiments = [];
  modelConfigs.forEach(function(modelConfig) {
    var exp = new experimentsModule.Experiment(modelConfig);
    experiments.push(exp);
  });

  for (var rep = 0; rep < nbRepetitions; rep++) {
    modelConfigs.forEach(function(modelConfig, expIdx) {
      var experiment = experiments[expIdx];
      algorithms.forEach(function(algorithm) {
        var perfGuidance = algorithm.implementation;
        perfGuidance.reset();

        // 1) set up model of application
        var model = createModel(modelConfig);

        // 2) run performance-guided event generation algorithm and measure its effectiveness
        var nbEventsToBug = runAlgorithm(model, perfGuidance) || maxEvts;
        
        var results = algo2Results[algorithm.id] || new Results();
        var allNbEventsForModel = results.modelId2NbEvents[model.id] || [];
        allNbEventsForModel.push(nbEventsToBug);
        results.modelId2NbEvents[model.id] = allNbEventsForModel;
        algo2Results[algorithm.id] = results;

        experiment.addResult(algorithm.id, nbEventsToBug);
        
        if (debug)
          perfGuidance.printStats();
      });
    });
    experimentsModule.writePlotData(experiments);
    console.log("Done with repetition " + rep);
  }

  // 3) print results
  console.log("\n---------------------------");
  for (var algo in algo2Results) {
    console.log(algo + ":");
    var results = algo2Results[algo];
    for (var modelId in results.modelId2NbEvents) {
      var nbEvents = results.modelId2NbEvents[modelId];
//        console.log("  " + modelId + ", " + nbEvents);
    }
    console.log("  avg: " + results.average() + ", median: " + results.median() + ", min: " + results.min() + ", max: " + results.max());
  }

})();
