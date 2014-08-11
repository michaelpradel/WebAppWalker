(function() {
  
  var minDelayBetweenEvents = 2000; // ms
  var maxDelayBetweenEvents = 2000; // ms

  function getMinDelayBetweenEvents() {
    return minDelayBetweenEvents;
  }
  
  function getMaxDelayBetweenEvents() {
    return maxDelayBetweenEvents;
  }

  function setMinDelayBetweenEvents(d) {
    minDelayBetweenEvents = d;
    console.log("minDelayBetweenEvents = "+minDelayBetweenEvents);
  }
  
  function setMaxDelayBetweenEvents(d) {
    maxDelayBetweenEvents = d;
    console.log("maxDelayBetweenEvents = "+maxDelayBetweenEvents);
  }
  
  exports.getMinDelayBetweenEvents = getMinDelayBetweenEvents;
  exports.getMaxDelayBetweenEvents = getMaxDelayBetweenEvents;
  exports.setMinDelayBetweenEvents = setMinDelayBetweenEvents;
  exports.setMaxDelayBetweenEvents = setMaxDelayBetweenEvents;
  exports.delayWhenBusy = 10; // milliseconds
  exports.coverageIntervalEvents = 10; // nb of events between coverage measurements
  exports.autoEventCounting = false; // whether to count events automatically (for plots of manual testing)
})();