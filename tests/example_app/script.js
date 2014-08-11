function accumulate() {
  var ctr = localStorage.getItem("ctr") || 1;
  ctr++;
  localStorage.setItem("ctr", ctr);
  console.log("new ctr = "+ctr);
  document.location = "index.html";
}

function process() {
  var max = localStorage.getItem("ctr") * 10;
  console.log("Will repeat "+max+" times");
  for (var i = 0; i < max; i++) {
    runCryptoAES();
  }
}
