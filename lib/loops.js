(function() {
  var pageMod = require("sdk/page-mod");
  var data = require("sdk/self").data;
  var ioFile = require("sdk/io/file");

  var portToPage;

  var loopDataFile = "/tmp/jalangiWorkingDir/loops.json";
  var callGraphFile = "/tmp/jalangiWorkingDir/callGraph.sif";
  var handlerSummariesFile = "/tmp/jalangiWorkingDir/handlerSummaries.json";

  pageMod.PageMod({
    include: "*",
    contentScriptFile: [ data.url("loopsPage.js") ],
    contentScriptWhen: 'start',
    attachTo: 'top',
    onAttach: function(worker) {
      if (worker.tab.title !== "JSCover") {
        portToPage = worker.port;
        console.log("Have attached pageMod with loopsPage.js");
        var existingLoopData = readLoopData();
        if (existingLoopData) {
          console.log("Found existing loop data, will send to page script");
          portToPage.emit("loopData", existingLoopData);
        }
        portToPage.on("loopData", receiveLoopData);
        portToPage.on("callGraph", receiveCallGraph);
        portToPage.on("handlerSummaries", receiveHandlerSummaries);
      }
    }
  });
  
  function readLoopData() {
    if (!ioFile.exists(loopDataFile)) return undefined;
    var data = ioFile.read(loopDataFile, "r");
    return data;
  }
  
  function receiveLoopData(loopData) {
    var f = ioFile.open(loopDataFile, "w");
    f.write(loopData);
    f.close();
//    console.log("Have written loop data to "+loopDataFile+" -- length of string: "+loopData.length);
  }

  function receiveCallGraph(data) {
    var f = ioFile.open(callGraphFile, "w");
    f.write(data);
    f.close();
    console.log("Have written call graph to "+callGraphFile);
  }
  
  function receiveHandlerSummaries(data) {
    var f = ioFile.open(handlerSummariesFile, "w");
    f.write(data);
    f.close();
    console.log("Have written handler summaries to "+handlerSummariesFile);
  }
  
})();

