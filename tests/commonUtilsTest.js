(function() {
  
  var cu = require('../lib/commonUtil.js');
  
  function testContains() {
    assert(cu.contains([],[]));
    assert(cu.contains([1,2,3],[2,3]));
    assert(cu.contains([1,2,3],[1,3]));
    assert(cu.contains([1,2,3],[1]));
    assert(cu.contains([1,2,3],[3]));
    assert(cu.contains([1,2,3],[2]));
    assert(!cu.contains([1,2,3],[3,2]));
    assert(!cu.contains([1,2],[1,2,3]));
    assert(!cu.contains([],[1,2]));
    assert(!cu.contains([1,2,3],[1,2,2]));
    console.log("ok");
  }
  
  function testRepeats() {
    assert(!cu.repeats([],[]));
    assert(cu.repeats([2,3],[2,3,2,3,2,3]));
    assert(cu.repeats([1,2,3],[1,2,3]));
    assert(cu.repeats([1],[1,1,1,1]));
    assert(!cu.repeats([1,2],[1,2,1,3]));
    assert(!cu.repeats([1,2,3,1,2,3],[1,2,3]));
    assert(!cu.repeats([3,4],[]));
    assert(!cu.repeats([],[1,2]));
    console.log("ok");
  }
  
  function testRemoveRepetitions() {
    assert(cu.same(cu.removeRepetitions([]), []));
    assert(cu.same(cu.removeRepetitions([1,2,3,4,4]), [1,2,3,4]));
    assert(cu.same(cu.removeRepetitions([1,2,3,4,1,2,6,1,2]), [1,2,3,4,1,2,6,1,2]));
    assert(cu.same(cu.removeRepetitions([1,2,3,3,3,4]), [1,2,3,4]));
    assert(cu.same(cu.removeRepetitions([1,2,3,4,3,4,5]), [1,2,3,4,5]));
    assert(cu.same(cu.removeRepetitions([1,2,2,1,2,2,3]), [1,2,3]));
    assert(cu.same(cu.removeRepetitions([1,2,3,4]), [1,2,3,4]));
    assert(cu.same(cu.removeRepetitions([1]), [1]));
    console.log("ok");
  }
  
  function assert(b) {
    if (!b) throw new Error();
  }
  
  testContains();
  testRepeats();
  testRemoveRepetitions();
  
})();

