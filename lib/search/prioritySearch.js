(function() {

  var ioFile = require("sdk/io/file");
  var priorityFile = "/tmp/jalangiWorkingDir/handlerPriorities_computed.json";
  var fctMarkerPrefix = "#WAW_NAME_";
  var fctMarkerSuffix = "_WAW_NAME#";
  var pseudoEventName = "$WAW_pseudoEvent";

  var driver;
  function init(d) {
    driver = d;
    loadPriorities();
  }

  var handler2Priority; // map from unique handler name to its priority

  var prio2NbEvents = {}; // only for understanding what happens

  function loadPriorities() {
    try {
      var raw = ioFile.read(priorityFile);
      handler2Priority = JSON.parse(raw);
      console.log("prioritySearch.loadPriorities: nb of handlers with priorities: " + Object.keys(handler2Priority).length);
    } catch (e) {
      console.log("Could not load priorities -- prioritySearch will not work");
    }
  }

  function doNextEvent() {
    driver.getPotentiallyEnabledEvents(chooseAndTriggerEvent);
  }

  var availableEvents;
  var selectedEvt;

  function chooseAndTriggerEvent(events) {
    if (events) {
      if (events.length === 0) {
        console.log("No available event!");
        return;
      }
      availableEvents = events;
      console.log("prioritySearch.chooseAndTriggerEvent: total available events: " + events.length);
    }

    selectedEvt = pickByPriority(availableEvents);
    console.log("prioritySearch.chooseAndTriggerEvent has picked " + selectedEvt);
    driver.canTrigger(selectedEvt, triggerIfPossible);
  }

  function priorityForUnknown(avg) {
//    return avg; // if priority is unknown: use average of others
//    return 0; // if priority is unknown: use zero
    return 1; // if priority is unknown: use one
  }

  function pickByPriority(events) {
    var sumOfPrios = 0;
    var nbUnknownPrios = 0;
    var nbKnownPrios = 0;
    events.forEach(function(evt) {
      var handlerName = findHandlerName(evt);
      var prio = handler2Priority[handlerName];
//      console.log("prioritySearch.pickByPriority: Found event with handler " + handlerName + " and priority " + prio);
      if (prio === undefined) {
        nbUnknownPrios++;
      } else {
        sumOfPrios += prio;
        nbKnownPrios++;
      }
    });

//    console.log("prioritySearch.pickByPriority: Events with known/unknown priority: " + nbKnownPrios + "/" + nbUnknownPrios);

    var avgPrio = nbKnownPrios > 0 ? sumOfPrios / nbKnownPrios : 0;
    sumOfPrios += nbUnknownPrios * priorityForUnknown(avgPrio);

//    console.log("prioritySearch.pickByPriority: Sum of priorities = " + sumOfPrios);

    var rand = Math.random() * sumOfPrios;

//    console.log("prioritySearch.pickByPriority: rand = " + rand);

    var runningSum = 0;
    var picked;
    events.forEach(function(evt) {
      var handlerName = findHandlerName(evt);
      var prio = handler2Priority[handlerName];
      if (prio === undefined) {
        prio = priorityForUnknown(avgPrio); 
      }

      // update prio2NbEvents: only for understanding what happens
      var oldNbEvents = prio2NbEvents[prio] || 0;
      prio2NbEvents[prio] = oldNbEvents + 1;

      var newRunningSum = runningSum + prio;
      if (rand >= runningSum && rand < newRunningSum) {
        if (picked !== undefined)
          throw "Have already picked an event -- priority picking is buggy";
        picked = evt;
        console.log("prioritySearch.pickByPriority: picking " + handlerName + ", " + evt + " which has priority " + prio);
      }
      runningSum = newRunningSum;
    });

//    console.log("prioritySearch.pickByPriority: prio2NbEvents:\n" + JSON.stringify(prio2NbEvents));

    if (picked === undefined)
      throw "Could not pick event by priority";

    return picked;
  }

  function findHandlerName(evt) {
    if (evt.isPseudoEvent)
      return pseudoEventName;

    if (!evt.src) return undefined;
    
    var m1 = evt.src.indexOf(fctMarkerPrefix);
    if (m1 < 0) {
//      console.log("Warning: Cannot find handler name in src:\n"+evt.src);
      return undefined;
    }
    var croppedLeft = evt.src.slice(m1 + fctMarkerPrefix.length);
    var m2 = croppedLeft.indexOf(fctMarkerSuffix);
    if (m2 < 0) {
//      console.log("Warning: Cannot find handler name in src:\n"+evt.src);
      return undefined;
    }
    var croppedBoth = croppedLeft.slice(0, m2);
    return croppedBoth;
  }

  function triggerIfPossible(possible) {
    if (!possible) {
      chooseAndTriggerEvent();
    } else {
      driver.triggerEvent(selectedEvt);
    }
  }

  function getName() {
    return "PrioritySearch";
  }

  exports.init = init;
  exports.doNextEvent = doNextEvent;
  exports.getName = getName;

})();
