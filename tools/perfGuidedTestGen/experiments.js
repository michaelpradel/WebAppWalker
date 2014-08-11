(function() {

  var fs = require('fs');
  var commonUtil = require('../commonUtil.js');

  var dir = "/home/m/research/projects/WebAppWalker/tools/perfGuidedTestGen/results/";

  function Experiment(config) {
    this.config = config;
    this.approach2Results = {}; // string -> array of numbers
  }

  Experiment.prototype = {
    addResult: function(approach, result) {
      var results = this.approach2Results[approach] || [];
      results.push(result);
      this.approach2Results[approach] = results;
    }
  };

  function writePlotData(experiments) {
    var approach2Data = {}; // string -> string
    experiments.forEach(function(experiment) {
      for (var approach in experiment.approach2Results) {
        var results = experiment.approach2Results[approach];
        var min = commonUtil.min(results);
        var max = commonUtil.max(results);
        var median = commonUtil.median(results);
        var line = experiment.config.label + " " + median + " " + min + " " + max;

        var data = approach2Data[approach] || "";
        data += line + "\n";
        approach2Data[approach] = data;
      }
    });

    for (var approach in approach2Data) {
      var fileName = dir + approach + ".data";
      fs.writeFileSync(fileName, approach2Data[approach]);
    }
  }

  exports.Experiment = Experiment;
  exports.writePlotData = writePlotData;

})();

