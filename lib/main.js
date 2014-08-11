(function() {

    var widgets = require("sdk/widget");
    var data = require("sdk/self").data;
    var timers = require("sdk/timers");
    var commonUtil = require('./commonUtil.js');
    var eventBreakConfigs = require('./search/eventBreakConfigs.js');

    // disable strict mode (some Jalangi-instrumented files aren't compliant)
    require("sdk/preferences/service").set("javascript.options.strict", false);

    // give scripts more time (Jalangi slowdown will trigger pop-up otherwise, default=10)
    require("sdk/preferences/service").set("dom.max_script_run_time", 60); // seconds

    var config = require('./config.js');
    var busy = require('./busy.js');

    busy.attachToMostRecentWindow();

    var driver = require("./driver.js");
    driver.registerTriggerReturn(triggerReturn);
//  var search = require("./search/random_search.js");
    var search = require("./search/perfGuidedSearch.js");
//  var search = require("./search/highlighterSearch.js");
//  var search = require("./search/swiftHandSearch.js");
//  var search = require("./search/prioritySearch.js");
    search.init(driver);

//  var manual = require('./manualTesting.js');
//  manual.init(driver);

//  require('./loops.js');
//  require('./typeAnalysis.js');

    var manualEventSelection = require('./manualEventSelection.js');
    manualEventSelection.setSearch(search);
    manualEventSelection.setDriver(driver);

    var benchmarks = require("./benchmarks.js");
    benchmarks.init(driver, busy, playPauseClicked, setSearch);

    var costTracer = require("./costTracer.js");

    var eventTriggeringEnabled = false;

    function setSearch(s) {
        search = s;
        search.init(driver);
    }

    function playPauseClicked() {
        if (eventTriggeringEnabled === undefined)
            throw "Error: eventTriggeringEnabled should always be defined";
        eventTriggeringEnabled = !eventTriggeringEnabled;
        if (eventTriggeringEnabled) {
            initiateNextEvent();
        }
    }

    function oneEventClicked() {
        if (!eventTriggeringEnabled) {
            initiateNextEvent();
        }
    }

    function tryToTrigger() {
        if (busy.isBusy()) {
            timers.setTimeout(tryToTrigger, config.delayWhenBusy);
        } else {
            if (eventTriggeringEnabled) {
                initiateNextEvent();
            }
        }
    }

    function nextEvent() {
        search.doNextEvent();
    }

    var initiateNextEvent = function() {
        if (benchmarks.isRunning()) {
            benchmarks.preEvent(nextEvent);
        } else {
            nextEvent();
        }
    };

    var lastTriggerReturn;
    function triggerReturn() {
        lastTriggerReturn = new Date().getTime();
        console.log("Receiving triggerReturn in main.js");
        if (eventTriggeringEnabled) {
            var interval = config.getMaxDelayBetweenEvents() - config.getMinDelayBetweenEvents();
            var randFromInterval = commonUtil.randInt(interval + 1);
            var delay = config.getMinDelayBetweenEvents() + randFromInterval;
            console.log("Will trigger next event after " + delay + " ms");
            timers.setTimeout(tryToTrigger, delay);
        }
    }

    function startTriggerReturnIfHanging() {
        timers.setInterval(function() {
            if (eventTriggeringEnabled) {
                var now = new Date().getTime();
                console.log("Checking if triggerReturn is hanging: now=" + now + ", lastTriggerReturn=" + lastTriggerReturn);
                if (!lastTriggerReturn || (lastTriggerReturn + (1000 * 2)) < now) {
                    console.log("Seems to hang -- calling triggerReturn()");
                    timers.setTimeout(triggerReturn, 0);
                }
            }
        }, 1000 * 1);
    }

    if (eventBreakConfigs.getConfig().triggerIfHanging) {
        startTriggerReturnIfHanging();
    }

    widgets.Widget({
        id:"controller",
        label:"Play/Pause WebAppWalker",
        contentURL:data.url("play.png"),
        onClick:playPauseClicked
    });

    widgets.Widget({
        id:"oneEven",
        label:"Trigger one event",
        contentURL:data.url("one.png"),
        onClick:oneEventClicked
    });

    widgets.Widget({
        id:"coverageMany",
        label:"Run coverage experiments",
        contentURL:data.url("test.png"),
        onClick:function() {
            benchmarks.runManyCoverageExperiments(0);
        }
    });

    widgets.Widget({
        id:"coverageSnapshot",
        label:"Take coverage snapshot (for manual testing)",
        contentURL:data.url("snap.png"),
        onClick:function() {
            manual.coverageSnapshot();
        }
    });

    widgets.Widget({
        id:"getAndResetCost",
        label:"Get and reset cost",
        contentURL:data.url("coin.png"),
        onClick:function() {
            driver.getAndResetCost(function(cost, costTrace) {
                console.log("Cost since last reset: " + cost);
                costTracer.addCostTrace(costTrace);
            });
        }
    });

    widgets.Widget({
        id:"prepareEventLogging",
        label:"Prepare for logging events from manual testing",
        contentURL:data.url("pen.png"),
        onClick:function() {
            driver.prepareEventLogging();
        }
    });

})();
