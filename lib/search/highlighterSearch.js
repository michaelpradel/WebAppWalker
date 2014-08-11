(function() {

  var driver;

  var allAvailableEvents;
  var selectedEvt;
  var xpath2NbEvents = {};

  function chooseAndTriggerEvent(events) {
    if (events) { // called from driver
      if (events.length === 0) {
        return;
      }
      xpath2NbEvents = {};
      allAvailableEvents = events;
    }

    if (allAvailableEvents.length === 0) {
      for (var xpath in xpath2NbEvents) {
        var nb = xpath2NbEvents[xpath];
        driver.highlight(xpath, nb);
      }
      return;
    }

    selectedEvt = allAvailableEvents.pop();
    driver.canTrigger(selectedEvt, triggerIfPossible);
  }

  function triggerIfPossible(possible) {
    if (possible) {
      if (selectedEvt.xpath) {
        var oldNb = xpath2NbEvents[selectedEvt.xpath] || 0;
        xpath2NbEvents[selectedEvt.xpath] = oldNb + 1;
      }
    }

    chooseAndTriggerEvent();
  }

  // API method
  function init(d) {
    driver = d;
  }

  // API method
  function doNextEvent() {
    driver.getPotentiallyEnabledEvents(chooseAndTriggerEvent);
  }

  // API method
  function getName() {
    return "highligher 'search'";
  }

  exports.init = init;
  exports.doNextEvent = doNextEvent;
  exports.getName = getName;


})();
