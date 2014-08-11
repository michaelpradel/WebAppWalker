(function() {

  var pageMod = require("sdk/page-mod");
  var data = require("sdk/self").data;
  var eventService = require('./eventService.js');
  var timers = require("sdk/timers");

  var appState = require('./search/appState.js');

  var pageWorker;
  var nbEventsTriggeredOnPage;
  var nbEventsTriggeredTotal = 0;

  var storedCosts = 0;
  var storedCostTrace = [];

  // hook to install the content script parts of the driver
  pageMod.PageMod({
    include: "*",
    contentScriptFile: [
      data.url("commonUtil.js"),
      data.url("eventWhitelist.js"),
      data.url("eventBreakConfigs.js"),
      data.url("formHints.js"),
      data.url("pageDriver.js"),
      data.url("jquery-2.0.3_functionsMarked_.js"),
      data.url("visibility.js"),
      data.url("popupBlocker.js"),
      data.url("coverage.js")
    ],
    contentScriptWhen: 'start',
    attachTo: 'top',
    onAttach: function(worker) {
      if (worker.tab.title !== "JSCover") {
        pageWorker = worker;
        nbEventsTriggeredOnPage = 0; // reset for every new page
        console.log("Have attached pageMod with pageDriver.js to " + worker.tab.url);
        worker.port.emit("restoreCosts", storedCosts, storedCostTrace);
      }
      worker.port.on("storeCosts", function(costs, costTrace) {
        storedCosts = costs;
        storedCostTrace = costTrace;
      });
      worker.on("pagehide", function() {
        console.log("pagehide");
        pageWorker = undefined;
      });
      worker.on("pageshow", function() {
        console.log("pageshow");
        pageWorker = this;
      });
    }
  });

  // hook to install css style for highlighting elements
  pageMod.PageMod({
    include: "*",
    contentStyleFile: data.url("waw_style.css"),
    contentScriptWhen: 'start',
    attachTo: ['top', 'frame']
  });

  // execute fct as soon as page worker is available
  function getPageWorkerAnd(fct) {
    if (pageWorker === undefined) {
      timers.setTimeout(getPageWorkerAnd.bind(null, fct), 500);
      console.log("pageWorker undefined -- trying again soon..");
      return;
    }

    fct(pageWorker);
  }

  // returns AppState
  function getCurrentState() {
    var s = appState.currentState();
    if (s === undefined)
      throw "Current state is undefined!?";
    return s;
  }

  function cleanKnownReferers() {
    knownReferers = {};
  }

  function setKnownReferers(referers) {
    console.log("Setting known referers: " + Object.keys(knownReferers).length);
    knownReferers = referers;
  }

  var knownReferers = {};

  // returns nothing
  function getPotentiallyEnabledEvents(callback /* expects an array of events and the accumulated costs */) {
    getPageWorkerAnd(function(pageWorker) {
      eventService.markElementsWithHandlers();

      pageWorker.port.once("addExtraEventsReturn", function(availablePseudoEvents, newKnownReferers, accumulatedCosts, costTrace) {
        knownReferers = newKnownReferers;
        var allAvailableEvents = [];
        availablePseudoEvents.forEach(function(e) {
          allAvailableEvents.push(e);
        });
        var availableJSEvents = eventService.getAvailableEvents();
        availableJSEvents.forEach(function(e) {
          allAvailableEvents.push(e);
        });
        console.log("Real events: " + availableJSEvents.length + ". Pseudo events: " + availablePseudoEvents.length + ". Known referers: " + Object.keys(knownReferers).length + " -- Costs: " + accumulatedCosts);

        callback(allAvailableEvents, accumulatedCosts, costTrace);
      });
      console.log("Calling addExtraEvents -- pageWorker: " + pageWorker);
      pageWorker.port.emit("addExtraEvents", knownReferers);
    });
  }

  function prepareEventLogging() {
    getPageWorkerAnd(function(pageWorker) {
      eventService.markElementsWithHandlers();

      pageWorker.port.once("logSEvent", function(sevt) {
        timers.setTimeout(function() {
          pageWorker.port.once("eventCost", function(cost, costTrace) {
            console.log("Received cost from pageDriver: " + cost);
            var dest = getCurrentState().toString();
            addTransition(sevt.state, sevt.evt, dest, cost, costTrace);
          });
          console.log("Asking pageDriver to send cost");
          pageWorker.port.emit("sendCost");
        }, 5000);
      });

      pageWorker.port.once("addExtraEventsReturn", function(availablePseudoEvents, newKnownReferers, accumulatedCosts, costTrace) {
        knownReferers = newKnownReferers;
        var allAvailableEvents = [];
        availablePseudoEvents.forEach(function(e) {
          allAvailableEvents.push(e);
        });
        var availableJSEvents = eventService.getAvailableEvents();
        availableJSEvents.forEach(function(e) {
          allAvailableEvents.push(e);
        });
        console.log("Real events: " + availableJSEvents.length + ". Pseudo events: " + availablePseudoEvents.length + ". Known referers: " + Object.keys(knownReferers).length + " -- Costs: " + accumulatedCosts);

        pageWorker.port.emit("attachEventLoggers", allAvailableEvents, getCurrentState().toString());
      });
      pageWorker.port.emit("addExtraEvents", knownReferers);

      console.log("Resetting cost to prepare to manually triggered event");
      pageWorker.port.emit("resetCost");
    });
  }

  // returns nothing
  function canTrigger(evt, callback /* expects a boolean */) {
    getPageWorkerAnd(function(pageWorker) {
      pageWorker.port.once("canTriggerReturn", callback);
      pageWorker.port.emit("canTrigger", evt);
    });
  }

  // returns nothing
  function triggerEvent(evt) {
    getPageWorkerAnd(function(pageWorker) {
      nbEventsTriggeredOnPage++;
      nbEventsTriggeredTotal++;
      pageWorker.port.once("triggerReturn", triggerReturn);
      pageWorker.port.emit("trigger", evt);

      if (nbEventsTriggeredOnPage % 100 === 0) {
        console.log("Nb of triggered events: " + nbEventsTriggeredOnPage);
      }
      console.log("Total nb of triggered events: " + nbEventsTriggeredTotal);

      if (nbEventsTriggeredOnPage in nbEvents2Callback) {
        nbEvents2Callback[nbEventsTriggeredOnPage]();
      }
    });
  }

  var triggerReturn;

  function registerTriggerReturn(callback) {
    triggerReturn = callback;
  }

  // returns nothing
  function goToURL(url /*string*/) {
    getPageWorkerAnd(function(pageWorker) {
      pageWorker.port.once("triggerReturn", triggerReturn);
      pageWorker.port.emit("goToURL", url);
    });
  }

  function requestCoverageData(callback) {
    getPageWorkerAnd(function(pageWorker) {
      pageWorker.port.once("allCoverageData", callback);
      pageWorker.port.emit("sendAllCoverageData");
    });
  }

  function getNbEventsTriggered() {
    return nbEventsTriggeredOnPage;
  }

  var nbEvents2Callback = {};
  function setAtEventNbCallback(nbEvents, callback) {
    nbEvents2Callback[nbEvents] = callback;
  }

  function highlight(xpath, nb) {
    getPageWorkerAnd(function(pageWorker) {
      pageWorker.port.emit("highlight", xpath, nb);
    });
  }

  function getAndResetCost(callback) {
    getPageWorkerAnd(function(pageWorker) {
      pageWorker.port.emit("sendAndResetCost");
      pageWorker.port.once("eventCost", function(cost, costTrace) {
        callback(cost, costTrace);
      });
    });
  }

  var addTransition;
  function setAddTransition(f) {
    addTransition = f;
  }

  exports.getCurrentState = getCurrentState;
  exports.getPotentiallyEnabledEvents = getPotentiallyEnabledEvents;
  exports.canTrigger = canTrigger;
  exports.triggerEvent = triggerEvent;
  exports.goToURL = goToURL;
  exports.registerTriggerReturn = registerTriggerReturn;
  exports.cleanKnownReferers = cleanKnownReferers;
  exports.setKnownReferers = setKnownReferers;
  exports.requestCoverageData = requestCoverageData;
  exports.getNbEventsTriggered = getNbEventsTriggered;
  exports.setAtEventNbCallback = setAtEventNbCallback;
  exports.highlight = highlight;
  exports.getAndResetCost = getAndResetCost;
  exports.prepareEventLogging = prepareEventLogging;
  exports.setAddTransition = setAddTransition;

})();
