(function() {

  // template for new search algorithms

  var driver;

  function init(d) {
    driver = d;
  }

  function doNextEvent() {

  }
  
  function getName() {
    return "NameOfTheSearchAlgorithm";
  }
  
  exports.init = init;
  exports.doNextEvent = doNextEvent;
  exports.getName = getName;
  
})();
