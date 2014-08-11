(function() {

  unwrapObject(window).$WAW_sendLoopData = function(data) {
//    console.log("Sending loop data to add on script -- length of string: "+data.length);
    self.port.emit("loopData", data);
  };

  unwrapObject(window).$WAW_sendCallGraph = function(data) {
    self.port.emit("callGraph", data);
  };
  
  unwrapObject(window).$WAW_sendHandlerSummaries = function(data) {
    console.log("loopsPage: sending handler summaries of length "+data.length);
    self.port.emit("handlerSummaries", data);
  };

  self.port.on("loopData", receiveLoopData);
  
  function receiveLoopData(data) {
    unwrapObject(window).$WAW_existingLoopData = data;
  }

  function unwrapObject(object) {
    if (!object)
      return object;
    if (object.wrappedJSObject) {
      return object.wrappedJSObject;
    }
    return object;
  }
})();

