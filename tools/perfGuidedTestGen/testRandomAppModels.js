(function () {
  
  var commonUtil = require('../commonUtil.js');
  var randomAppModels = require('./randomAppModels.js');
  var seedrandom = require('seedrandom');
  
//  var randomNbGenerator = seedrandom(23);
//  commonUtil.setRandomFct(randomNbGenerator);
  
  var model = randomAppModels.randomHubBasedModelWithCycles("model1");
  console.log(model.toString());
  
})();

