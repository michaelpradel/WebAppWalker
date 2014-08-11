(function() {
  unwrapObject(window).alert = function(msg) {
    console.log("Emulating alert popup: "+msg+" -- Closing it.");
  };
  
  unwrapObject(window).confirm = function(msg) {
    var ret = Math.random() >= 0.5 ? true : false;
    console.log("Emulating confirmation popup: "+msg+" -- Randomly selecting "+(ret ? "OK" : "Cancel"));
    return ret;
  };
  
  unwrapObject(window).prompt = function(msg) {
    var ret = Math.random() >= 0.5 ? true : false;
    if (ret) {
      console.log("Emulating prompt popup: "+msg+" -- Randomly selecting Cancel");
      return null;
    } else {
      var input = "abc";
      console.log("Emulating prompt popup: "+msg+" -- Randomly entering '"+input+"'");
      return input;
      }    
  };
  
  unwrapObject(window).open = function(url, name, specs, replace) {
    console.log("Blocking window.open with "+url);
  };

  unwrapObject(window).onbeforeunload = null;
  
  function unwrapObject(object) {
    if (!object)
      return object;
    if (object.wrappedJSObject) {
      return object.wrappedJSObject;
    }
    return object;
  }
})();

