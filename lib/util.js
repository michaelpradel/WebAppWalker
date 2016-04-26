(function() {

  var chrome = require("chrome");
  var currentDir = chrome.Cc["@mozilla.org/file/directory_service;1"]
      .getService(chrome.Ci.nsIDirectoryServiceProvider)
      .getFile("CurWorkD", {}).path;

  function shuffle(array) {
    for (var i = array.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = array[i];
      array[i] = array[j];
      array[j] = temp;
    }
    return array;
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
