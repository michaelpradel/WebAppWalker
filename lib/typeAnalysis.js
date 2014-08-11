(function() {

  var pageMod = require("sdk/page-mod");
  var data = require("sdk/self").data;
  var ioFile = require("sdk/io/file");

  var portToPage;

  var typeAnalysisDataFile = "/tmp/jalangiWorkingDir/typeAnalysisData.json";
  var typeAnalysisData2File = "/tmp/jalangiWorkingDir/typeAnalysisData2.json";

  pageMod.PageMod({
    include: "*",
    contentScriptFile: [data.url("typeAnalysisPage.js")],
    contentScriptWhen: 'start',
    attachTo: 'top',
    onAttach: function(worker) {
      portToPage = worker.port;
      console.log("Have attached pageMod with typeAnalysisPage.js");
      portToPage.on("typeAnalysisData", receiveTypeAnalysisData);
      portToPage.on("typeAnalysisData2", receiveTypeAnalysis2Data);
    }
  });

  var allLocation2TypeHistogram = {}; // string --> (string --> number)
  var allLocation2TypePairs = {}; // string --> array of TypePairs

  function mergeIntoAllData(location2TypeHistogram) {
    for (var location in location2TypeHistogram) {
      var typeHistogram = location2TypeHistogram[location];
      var allTypeHistogram = allLocation2TypeHistogram[location] || {};
      for (var type in typeHistogram) {
        var nb = typeHistogram[type];
        var oldNb = allTypeHistogram[type] || 0;
        allTypeHistogram[type] = oldNb + nb;
      }
      allLocation2TypeHistogram[location] = allTypeHistogram;
    }
  }
  
  function mergeIntoAllData2(location2TypePairs) {
    for (var location in location2TypePairs) {
      var typePairs = location2TypePairs[location];
      var allTypePairs = allLocation2TypePairs[location] || [];
      allTypePairs.push.apply(allTypePairs, typePairs);
      allLocation2TypePairs[location] = allTypePairs;
    }
  }

  function receiveTypeAnalysisData(data) {
    var location2TypeHistogram = JSON.parse(data);
    mergeIntoAllData(location2TypeHistogram);
    var allData = JSON.stringify(allLocation2TypeHistogram);
    var f = ioFile.open(typeAnalysisDataFile, "w");
    f.write(allData);
    f.close();
  }
  
  function receiveTypeAnalysis2Data(data) {
    console.log("Received type analysis data..")
    var location2TypePairs = JSON.parse(data);
    mergeIntoAllData2(location2TypePairs);
    var allData = JSON.stringify(allLocation2TypePairs);
    var f = ioFile.open(typeAnalysisData2File, "w");
    f.write(allData);
    f.close();
  }

})();

