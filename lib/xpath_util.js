(function() {

  var windowUtils = require('sdk/window/utils');
  
  var util = require('./util.js');
  
  function getByXPath(xpath) {
    var active = windowUtils.getMostRecentBrowserWindow();
    var window = active.content;
    var document = window.document;
    var wrapped = document.evaluate(xpath, document, null, 9, null).singleNodeValue;
    return util.unwrapObject(wrapped);
  }

  exports.getByXPath = getByXPath;

})();
