(function() {

  var timers = require("sdk/timers");
  var windowUtils = require("window/utils");

  var chrome = require("chrome");
  var watcher = chrome.Cc["@mozilla.org/embedcomp/window-watcher;1"]
      .getService(chrome.Ci.nsIWindowWatcher);

  function checkWindows() {
    var enumerator = watcher.getWindowEnumerator();
    while (enumerator.hasMoreElements()) {
      var chromeWin = enumerator.getNext();
      if (chromeWin.Dialog !== undefined && chromeWin.Dialog.args !== undefined &&
          chromeWin.Dialog.args.title === "Warning: Unresponsive script") {
        var activeBrowserWindow = windowUtils.getMostRecentBrowserWindow();
        if (chromeWin.opener.document === activeBrowserWindow.content.document) {
          console.log("Most recent browser window has unresponsive script");
          if (dialogAppearedCallback !== undefined) {
            console.log("Will stop both script and experiment.");

            // stop script by 'clicking' button
            chromeWin.Dialog.ui.button1.click();

            // stop experiment by calling the callback
            timers.setTimeout(dialogAppearedCallback, 0);
            dialogAppearedCallback = undefined; // to ensure that called only once
          } else {
            console.log("dialogAppearedCallback is undefined -- won't close pop-up");
          }
        }
      }
    }
    timers.setTimeout(checkWindows, 1000);
  }

  function startChecking() {
    timers.setTimeout(checkWindows, 1000);
  }

  var dialogAppearedCallback;
  function setDialogAppearedCallback(callback) {
    dialogAppearedCallback = callback;
  }

  exports.startChecking = startChecking;
  exports.onceDialogAppearedCallback = setDialogAppearedCallback;

})();

