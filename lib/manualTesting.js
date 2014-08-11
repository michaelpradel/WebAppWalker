(function() {

  var ioFile = require("sdk/io/file");
  var pageMod = require("sdk/page-mod");
  var data = require("sdk/self").data;

  var util = require("./util.js");
  var config = require("./config.js");

  var portToPage;

  if (config.autoEventCounting) {
    // hook to install the content script part of the driver
    pageMod.PageMod({
      include: "*",
      contentScriptFile: [data.url("manualTestingPage.js")],
      contentScriptWhen: 'start',
      attachTo: 'top',
      onAttach: function(worker) {
        if (worker.tab.title !== "JSCover") {
          portToPage = worker.port;
          portToPage.on("coverageInterval", coverageIntervalPassed);
          portToPage.emit("setCoverageIntervalEvents", config.coverageIntervalEvents);
          console.log("Have attached pageMod with manualTestingPage.js");
        }
      }
    });
  }

  function coverageIntervalPassed() {
    console.log("manualTesting: coverageIntervalPassed called");
    driver.requestCoverageData(receiveCoverageData);
  }

  function coverageSnapshot() {
    driver.requestCoverageData(receiveCoverageData);
  }

  var startTime = new Date().getTime();

  var snapshotCtr = -1;

  function receiveCoverageData(covDataStr) {
    console.log("manualTesting: receiveCoverageData called");
    snapshotCtr += 1;
    var covData = JSON.parse(covDataStr);
    var stamp = new Date().getTime() - startTime;
    var evtCtr = snapshotCtr * config.coverageIntervalEvents;
    var data = {
      t_stamp: stamp,
      eventNum: evtCtr,
      data: covData
    };
    var fileName = util.getCurrentDir() + "/manual_testing" + snapshotCtr;
    var f = ioFile.open(fileName, "w");
    f.write(JSON.stringify(data));
    f.close();
  }

  var driver;
  function init(d) {
    driver = d;
  }

  exports.init = init;
  exports.coverageSnapshot = coverageSnapshot;

})();