(function() {
  
  function unwrapObject(object) {
    if (!object)
      return object;
    if (object.wrappedJSObject) {
      return object.wrappedJSObject;
    }
    return object;
  }
  
  function sendAllCoverageData() {
    var coverageStr = JSON.stringify(unwrapObject(window)._$jscoverage)
    self.port.emit("allCoverageData", coverageStr);
  }
  
  self.port.on("sendAllCoverageData", sendAllCoverageData);

})();