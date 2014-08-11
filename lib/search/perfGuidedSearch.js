(function() {

//  var perfGuidance = require('./randomPerfGuidance.js');
  var perfGuidance = require('./eventBreak.js');
  var commonUtil = require('../commonUtil.js');
  
  // parameter
  var formWithHintProbability = 0.5;

  // global state
  var driver;
  var selectedEvt;

  var lastState;
  var lastEvent;

  var preselectedEvt; // for manual selection of events

  function chooseAndTriggerEvent(events, accumulatedCosts, costTrace) {
    if (events.length === 0) {
      console.log("No available event!");
      return;
    }

    if (perfGuidance.isEventPreselectionAllowed())
      preselectedEvt = modifyPreselection(lastEvent, events);

    var newState = driver.getCurrentState().toString();
    if (lastState !== undefined && lastEvent !== undefined) {
      perfGuidance.addTransition(lastState, lastEvent, newState, accumulatedCosts);
      lastEvent = undefined;
    }
    lastState = newState;

    if (preselectedEvt !== undefined) {
      selectedEvt = events.find(function(evt) {
        return evt.asString === preselectedEvt.asString;
      });
      if (selectedEvt === undefined)
        throw new Error("Could not find preselected event " + preselectedEvt.asString);
      preselectedEvt = undefined;
    } else {
      var state = driver.getCurrentState();
      selectedEvt = perfGuidance.selectNextEvent(state, events);
      if (selectedEvt === undefined) {
        console.log("EEEE selectNextEvent() returns undefined -- stopping test generation");
        return;
      }
    }

    console.log("RRRRR perfGuidance chooses: " + selectedEvt.asString);

    driver.canTrigger(selectedEvt, triggerIfPossible);
  }

  function modifyPreselection(lastEvt, availableEvts) {
    if (preselectedEvt !== undefined)
      return preselectedEvt; // don't override manual selection

    // trigger 'submit' if last event filled a form
    if (lastEvt && (lastEvt.type === "input" || lastEvt.type === "form" || lastEvt.type === "formWithHint")) {
      console.log("Last event was 'input' -- trying to trigger 'submit' in next event..");
      // if last event was filling input into form, try to submit the form
      var submitEvts = availableEvts.filter(function(evt) {
        return evt.type === "submit";
      });
      if (submitEvts.length > 0) {
        var evt = commonUtil.randElem(submitEvts);
        console.log(".. setting submit event as preselected event: "+evt.asString);
        return evt;
      }
    }
    
    // fill a form if we have a hint on how to fill it
    var formWithHintEvts = availableEvts.filter(function(evt) {
      return evt.type === "formWithHint";
    });
    if (formWithHintEvts.length > 0 && commonUtil.rand() < formWithHintProbability) {
      console.log("Preselecting to fill a form with a hint."); // TODO RAD
      return commonUtil.randElem(formWithHintEvts);
    }
  }

  var statsCtr = 0;
  function triggerIfPossible(possible) {
    if (!possible) {
      console.log("RRRRR  .. cannot trigger event");
      perfGuidance.evtImpossible(lastState, selectedEvt);
      driver.getPotentiallyEnabledEvents(chooseAndTriggerEvent);
    } else {
      console.log("RRRRR  .. will trigger event");
      lastEvent = selectedEvt;
      statsCtr++;
      if (statsCtr % 100 === 0)
        perfGuidance.printStats();
      driver.triggerEvent(selectedEvt);
    }
  }

  // API method
  function init(d) {
    driver = d;
    perfGuidance.init(function(knownReferers) {
      driver.setKnownReferers(knownReferers);
    });
    driver.setAddTransition(perfGuidance.addTransition);
  }

  // API method
  function doNextEvent() {
    console.log("doNextEvent() called");
    driver.getPotentiallyEnabledEvents(chooseAndTriggerEvent);
  }

  // API method
  function getName() {
    return "simpleStateSearch";
  }

  // API method (not for all search implementations)
  function preselectEvt(evt) {
    console.log("PerfGuidedSearch: have received preselection: " + evt.asString);
    preselectedEvt = evt;
  }

  exports.init = init;
  exports.doNextEvent = doNextEvent;
  exports.getName = getName;
  exports.preselectEvt = preselectEvt;

})();
