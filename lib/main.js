(function() {

    const { ActionButton } = require("sdk/ui/button/action");
    const { ToggleButton } = require("sdk/ui/button/toggle");
    const { Toolbar } = require("sdk/ui/toolbar");

    const data = require("sdk/self").data;
    const timers = require("sdk/timers");
    const commonUtil = require('./commonUtil.js');
    const eventBreakConfigs = require('./search/eventBreakConfigs.js');

    // disable strict mode (some Jalangi-instrumented files aren't compliant)
    const prefs = require("sdk/preferences/service");
    prefs.set("javascript.options.strict", false);

    // give scripts more time (Jalangi slowdown will trigger pop-up otherwise, Firefox default=10)
    prefs.set("dom.max_script_run_time", 60); // seconds
    prefs.set("extensions.sdk.console.logLevel", "info");

    const config = require('./config.js');
    const busy = require('./busy.js');

    busy.attachToMostRecentWindow();

    const driver = require("./driver.js");
    driver.registerTriggerReturn(triggerReturn);
    var search = require("./search/random_search.js");
//  var search = require("./search/perfGuidedSearch.js"); // EventBreak
//  var search = require("./search/highlighterSearch.js");
//  var search = require("./search/swiftHandSearch.js");
//  var search = require("./search/prioritySearch.js");
    search.init(driver);

//  const manual = require('./manualTesting.js');
//  manual.init(driver);

//  require('./loops.js');
//  require('./typeAnalysis.js');

    const manualEventSelection = require('./manualEventSelection.js');
    manualEventSelection.setSearch(search);
    manualEventSelection.setDriver(driver);

    const benchmarks = require("./benchmarks.js");
    benchmarks.init(driver, busy, playPauseClicked, setSearch);

    const costTracer = require("./costTracer.js");

    var eventTriggeringEnabled = false;

    function setSearch(s) {
        search = s;
        search.init(driver);
    }

    function playPauseClicked() {
        eventTriggeringEnabled = !eventTriggeringEnabled;
        if (eventTriggeringEnabled) {
            btnController.icon = data.url("pause.png");
            initiateNextEvent();
        } else {
            btnController.icon = data.url("play.png");
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

    var btnController = ActionButton({
        id:"controller",
        label:"Play/Pause WebAppWalker",
        icon: data.url("play.png"),
        onClick: playPauseClicked
    });

    var btnOneEven = ActionButton({
        id:"oneEven",
        label:"Trigger one event",
        icon: data.url("one.png"),
        onClick: oneEventClicked
    });

    // old code -- TODO: revive or remove
    //widgets.Widget({
    //    id:"coverageMany",
    //    label:"Run coverage experiments",
    //    contentURL:data.url("test.png"),
    //    onClick:function() {
    //        benchmarks.runManyCoverageExperiments(0);
    //    }
    //});
    //
    //widgets.Widget({
    //    id:"coverageSnapshot",
    //    label:"Take coverage snapshot (for manual testing)",
    //    contentURL:data.url("snap.png"),
    //    onClick:function() {
    //        manual.coverageSnapshot();
    //    }
    //});
    //
    //widgets.Widget({
    //    id:"getAndResetCost",
    //    label:"Get and reset cost",
    //    contentURL:data.url("coin.png"),
    //    onClick:function() {
    //        driver.getAndResetCost(function(cost, costTrace) {
    //            console.log("Cost since last reset: " + cost);
    //            costTracer.addCostTrace(costTrace);
    //        });
    //    }
    //});
    //
    //widgets.Widget({
    //    id:"prepareEventLogging",
    //    label:"Prepare for logging events from manual testing",
    //    contentURL:data.url("pen.png"),
    //    onClick:function() {
    //        driver.prepareEventLogging();
    //    }
    //});

    Toolbar({
        title: "WebAppWalker",
        items: [
            btnController,
            btnOneEven
        ]
    });

})();
