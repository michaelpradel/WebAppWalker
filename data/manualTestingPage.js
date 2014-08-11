(function() {

  var handlerEnterCtr = 0;

  unwrapObject(window).$WAW_fctEnter = function() {
    if (isEventHandler(fctEnter)) {
      console.log("entering event handler");
      handlerEnterCtr += 1;
      if (handlerEnterCtr % coverageIntervalEvents === 0) {
        console.log("manualTestingPage: sending coverageInterval");
        self.port.emit("coverageInterval");
      }
    }
  };

  unwrapObject(window).$WAW_fctExit = function() {
  };

  function isEventHandler(fct) {
    return (fct.caller.caller === null) || (fct.caller.caller.name.indexOf("on") === 0 && fct.caller.caller.caller === null);
  }

  var fctEnter = unwrapObject(window).$WAW_fctEnter;
  var fctExit = unwrapObject(window).$WAW_fctExit;

  function unwrapObject(object) {
    if (!object)
      return object;
    if (object.wrappedJSObject) {
      return object.wrappedJSObject;
    }
    return object;
  }

  var coverageIntervalEvents;

  function setCoverageIntervalEvents(i) {
    coverageIntervalEvents = i;
  }
  
  self.port.on("setCoverageIntervalEvents", setCoverageIntervalEvents);

})();

