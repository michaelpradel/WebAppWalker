(function() {
  
  var util = require('../util.js');
  var commonUtil = require('../commonUtil.js');

  var driver;

  function init(d) {
    driver = d;
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
      availableEvents = util.shuffle(events);
//      console.log("Shuffled events (by type):\n"+availableEvents.map(function(e) { return e.type; }));
//      console.log("Shuffled events (by code):\n" + availableEvents.map(
//            function(e) {
//              var s = "";
//              s += Object.getOwnPropertyNames(e);
//              return s +
//                    "\n--||" +
//                    commonUtil.eventToString(e) +
//                    ", eventDetails = " +
//                    e.eventDetails +
//                    ", elemDetails = " +
//                    e.elemDetails +
//                    "(" + typeof e.elemDetails + ")" +
//                    ", handlerName = " +
//                    e.handlerName +
//                    ", handlerId = " +
//                    e.handlerId +
//                    ", src = " + e.src +
//                    " \n";
//            }));
    }
    
    selectedEvt = availableEvents.pop();
    driver.canTrigger(selectedEvt, triggerIfPossible);
  }

  function triggerIfPossible(possible) {
    if (!possible) {
      chooseAndTriggerEvent(); 
    } else {
      console.log("Random search triggers event: "+selectedEvt);
      driver.triggerEvent(selectedEvt);
    }
  }

  function getName() {
    return "random";
  }

  exports.init = init;
  exports.doNextEvent = doNextEvent;
  exports.getName = getName;

})();
