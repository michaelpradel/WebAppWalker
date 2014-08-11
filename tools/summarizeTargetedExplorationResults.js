(function() {

    var fs = require('fs');

    var eventsTotal = 0, reachedTargetsTotal = 0, missedTargetsTotal = 0;
    console.log("### Format of the following CSVs: Benchmark, Nb events, Nb target events, Percentage reached targets");
    function summarize(bm, events, reachedTargets, missedTargets) {
        eventsTotal += events;
        reachedTargetsTotal += reachedTargets;
        missedTargetsTotal += missedTargets;
        var targetEvents = reachedTargets + missedTargets;
        var reachedPercentage = reachedTargets * 100 / targetEvents;
        console.log(bm + ", " + events + ", " + targetEvents + ", " + reachedPercentage);
    }

    var data = fs.readFileSync(process.argv[2], {encoding:'utf8'});
    var lines = data.split("\n");
    var benchmark;
    var eventsTotal = 0, reachedTargetsTotal = 0, missedTargetsTotal = 0;
    var events = 0, reachedTargets = 0, missedTargets = 0;
    lines.forEach(function(line) {
        if (line.indexOf("###") === 0) {
            if (benchmark) {
                summarize(benchmark, events, reachedTargets, missedTargets);
            }
            benchmark = line.slice(4);
            events = 0, reachedTargets = 0, missedTargets = 0;
        } else if (line.indexOf("Nb of reached targets") !== -1) {
            reachedTargets += parseFloat(line.split(": ")[1]);
        } else if (line.indexOf("Total nb of triggered events") !== -1) {
            events += parseFloat(line.split("events: ")[1]);
        } else if (line.indexOf("targets not reached") !== -1) {
            missedTargets += parseFloat(line.split(": ")[1]);
        }
    });
    if (benchmark) {
        summarize(benchmark, events, reachedTargets, missedTargets);
    }
    summarize("Total", eventsTotal, reachedTargetsTotal, missedTargetsTotal);

})();