(function() {

  var data = require("sdk/self").data;

  var search;
  var driver;

  var panel = require("sdk/panel").Panel({
    width: 1000,
    height: 800,
    contentURL: data.url("manualEventSelectionPanel.html"),
    contentScriptFile: [
      data.url("commonUtil.js"),
      data.url("manualEventSelectionPanel.js")      
    ]
  });

  panel.on("show", function() {
    eventsToCheck = [];
    enabledEvts = [];
    driver.getPotentiallyEnabledEvents(processPotentiallyEnabledEvts);
  });

  require("sdk/ui/button/action").ActionButton({
    label: "Preselect the next event manually",
    id: "manualPreselect",
    icon: data.url("hand.png"),
    panel: panel
  });

  panel.port.on("evtSelected", function(selectedEvt) {
    panel.hide();
    search.preselectEvt(selectedEvt);
  });

  var eventsToCheck = [];
  function processPotentiallyEnabledEvts(potentiallyEnabledEvts) {
    eventsToCheck = potentiallyEnabledEvts;
    checkNextEvt();
  }

  var evtCheckedNow;
  function checkNextEvt() {
    if (eventsToCheck.length > 0) {
      evtCheckedNow = eventsToCheck.pop();
      driver.canTrigger(evtCheckedNow, isPossible);
    } else {
      // have checked all events -- send available events to panel
      panel.port.emit("show", enabledEvts);
    }
  }

  var enabledEvts = [];
  function isPossible(possible) {
    if (possible) {
      enabledEvts.push(evtCheckedNow);
    }
    checkNextEvt();
  }

  function setSearch(s) {
    search = s;
  }

  function setDriver(d) {
    driver = d;
  }

  exports.setSearch = setSearch;
  exports.setDriver = setDriver;

})();

