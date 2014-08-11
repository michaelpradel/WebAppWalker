(function() {

  var fs = require('fs');

  var Transition = function(src, dest, transition, cost) {
    this.src = src;
    this.dest = dest;
    this.transition = transition;
    this.cost = cost;
  };

  function readTransitions(fileName) {
    var result = [];
    var data = fs.readFileSync(fileName);
    data.split("\n").forEach(function (line) {
      var splitted = line.split(" ");
      if (splitted.length !== 4) throw "Illegal line: "+line;
      var transition = new Transition(splitted[0], splitted[1], splitted[2], splitted[3]);
      result.push(transition);
    });
    console.log("Have read "+result.length+" transitions");
    return result;
  }

  // main part
  var transitions = readTransitions(process.argv[2]);

})();

