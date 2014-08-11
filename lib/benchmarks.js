(function() {

  var tabs = require("sdk/tabs");
  var timers = require("sdk/timers");
  var iofile = require("sdk/io/file");
  var coverage_summary = require("./coverage_summary.js");
  var config = require("./config.js");

  var util = require("./util.js");

  var scriptObserver = require('./unresponsiveScriptObserver.js');
//  scriptObserver.startChecking();

  var Benchmark = function(name, url) {
    this.name = name;
    this.url = url;
  };

  var benchmarks = [//new Benchmark("annex", "http://127.0.0.1:8000/tests/tizen/annex/")
//    new Benchmark("calculator", "http://127.0.0.1:8000/tests/tizen/calculator_fixed_JSCover/"),
//    new Benchmark("calculator", "http://127.0.0.1:8000/tests/tizen/calculator/")
        new Benchmark("joomla", "http://127.0.0.1/joomla/")
//    new Benchmark("tenframe", "http://127.0.0.1:8000/tests/tizen/tenframe/"),
//new Benchmark("go", "http://127.0.0.1:8000/tests/tizen/go/")
//new Benchmark("box2d", "http://127.0.0.1:8000/tests/box2d_JSCover/"),
//new Benchmark("jqueryWidgetDemos", "http://127.0.0.1:8000/tests/jquery-ui-1.10.3_JSCover/development-bundle/demos/"),
//    new Benchmark("reveal.js", "http://127.0.0.1:8000/tests/reveal.js_JSCover"),
//    new Benchmark("galleria", "http://127.0.0.1:8000/tests/galleria_JSCover/themes/classic/classic-demo.html"),
//new Benchmark("mancala", "http://127.0.0.1:8000/tests/tizen/mancala_JSCover/"),
//    new Benchmark("memory-game", "http://127.0.0.1:8000/tests/tizen/memory-game/"),
//new Benchmark("sweetspot", "http://127.0.0.1:8000/tests/tizen/sweetspot/")
//        new Benchmark("touchstone", "http://touchstone.conviva.com/"),
//    new Benchmark("test", "http://127.0.0.1:8000/tests/loops/simple_unresp.html")
  ];

//  var searches = [require("./search/prioritySearch.js")/*, require("./search/random_search.js"), require("./search/swiftHandSearch.js")*/];
  var searches = [require("./search/perfGuidedSearch.js")];

  var Experiment = function(benchmark, timeout /*seconds*/, repetition, search) {
    this.search = search;
    this.benchmark = benchmark;
    this.timeout = timeout;
    this.repetition = repetition;
    this.stopped = false;
  };

  Experiment.prototype.toString = function() {
    return this.benchmark.name + "_" + this.timeout + "seconds_rep" + this.repetition + "_" + this.search.getName();
  };

  var experiments;
  var maxReps = 1;
  var stopAtNbEvents = 10000;
  function setUpExperiments() {
    experiments = [];
    //var timeouts = [10, 60, 60 * 10, 60 * 60, 60 * 600]; //seconds
    var timeouts = [60]; //seconds
    for (var rep = 0; rep < maxReps; rep++) {
      timeouts.forEach(function(timeout) {
        benchmarks.forEach(function(bm) {
          searches.forEach(function(search) {
            experiments.push(new Experiment(bm, timeout, rep, search));
          });
        });
      });
    }
  }

  var delayBeforeStart = 5; // seconds
  var delayBeforeNext = 5; // seconds

  function runManyCoverageExperiments(experimentsDone) {
    if (!experiments)
      setUpExperiments();
    if (experimentsDone < experiments.length) {
      var exp = experiments[experimentsDone];
      console.log(">>>>>>>>>>>>>> There are " + (experiments.length - experimentsDone) + " experiments left...");
      console.log(">>>>>>>>>>>>>> Starting experiment " + experimentsDone + ": " + exp + " <<<<<<<<<");
      setSearch(exp.search);
      driver.cleanKnownReferers();
      tabs.open(exp.benchmark.url);
      busy.attachToMostRecentWindow();
      console.log("Opened benchmark site: " + exp.benchmark.url);
      console.log(">>>> Starting experiment in " + delayBeforeStart + " seconds... <<<<");
      timers.setTimeout(function() {
        isRunning = true;
        exp.startTime = new Date();
        playPauseClicked();
      }, delayBeforeStart * 1000);
      summarizer = new coverage_summary.Summarizer(config.coverageIntervalEvents, util.getCurrentDir(), exp.toString());
      scriptObserver.onceDialogAppearedCallback(function() {
        stopExperiment(exp, experimentsDone, "Unresponsive script");
      });
      driver.setAtEventNbCallback(stopAtNbEvents, function() {
        stopExperiment(exp, experimentsDone, "Max events reached");
      });
      if (exp.timeout > 0) {
        timers.setTimeout(function() {
          stopExperiment(exp, experimentsDone, "Reached timeout of " + exp.timeout + " seconds");
        }, (delayBeforeStart + exp.timeout) * 1000);
      }
    } else {
      console.log(">>>>>>>>>>> Done with all experiments! <<<<<<< ");
    }
  }

  // called after timeout or when "unresponsive script" dialog appears
  function stopExperiment(exp, experimentsDone, reason) {
    if (!exp.stopped) {
      exp.stopped = true;
      var millisTaken = new Date() - exp.startTime;
      var nbEventsTriggered = driver.getNbEventsTriggered();
      console.log(">>>> Stopping experiment after " + millisTaken + "ms and " + nbEventsTriggered + " events: " + reason + " <<<<");
      isRunning = false;
      playPauseClicked();
      var filename = util.getCurrentDir() + "/" + exp + ".json";
      console.log(">>>> Waiting " + delayBeforeNext + " seconds before writing coverage data to file " + filename);
      timers.setTimeout(function() {
        writeCoverageToFile(filename);
      }, delayBeforeNext * 1000);
      console.log(">>>> Will start next experiment (if one left) in " + (delayBeforeNext * 2) + " seconds");
      timers.setTimeout(function() {
        summarizer.finish();
        summarizer = null;
        runManyCoverageExperiments(experimentsDone + 1);
      }, delayBeforeNext * 2 * 1000);
    }
  }

  function writeCoverageToFile(filename) {
    console.log("writeCoverageToFile");
    driver.requestCoverageData(function(coverageData) {
      var stream = iofile.open(filename, "w");
      stream.write(coverageData);
      stream.close();
    });
  }

  var driver;
  var busy;
  var playPauseClicked;
  var summarizer = null;
  var setSearch;
  function init(driver_, busy_, playPauseClicked_, setSearch_) {
    driver = driver_;
    busy = busy_;
    playPauseClicked = playPauseClicked_;
    setSearch = setSearch_;
  }

  exports.runManyCoverageExperiments = runManyCoverageExperiments;
  exports.init = init;
  var isRunning = false;
  exports.isRunning = function() {
    return isRunning;
  };

  exports.preEvent = function(nextEvent) {
    summarizer.tick(nextEvent, driver);
  };

})();
