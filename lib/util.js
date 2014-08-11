(function() {
  
  var chrome = require("chrome");
  var currentDir = chrome.Cc["@mozilla.org/file/directory_service;1"]
      .getService(chrome.Ci.nsIDirectoryServiceProvider)
      .getFile("CurWorkD", {}).path;
  
  function shuffle(array) {
    return array.sort(function(x, y) {
      if (Math.random() > 0.5)
        return -1;
      else
        return 1;
    });
  }

  function unwrapObject(object) {
    if (!object)
      return object;

    try {
      if (object.wrappedJSObject) {
        return object.wrappedJSObject;
      }
    } catch (e) {
      console.log("Problem w/ unwrapping: " + e.trace);
    }

    return object;
  }
  
  function getCurrentDir() {
    return currentDir;
  }

  exports.shuffle = shuffle;
  exports.unwrapObject = unwrapObject;
  exports.getCurrentDir = getCurrentDir;

})();
