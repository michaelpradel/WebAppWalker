(function() {
  
  unwrapObject(window).$WAW_sendTypeAnalysisData = function(data) {
    self.port.emit("typeAnalysisData", data);
  };
  
  
  unwrapObject(window).$WAW_sendTypeAnalysisData2 = function(data) {
    self.port.emit("typeAnalysisData2", data);
  };

  function unwrapObject(object) {
    if (!object)
      return object;
    if (object.wrappedJSObject) {
      return object.wrappedJSObject;
    }
    return object;
  }
  
})();

