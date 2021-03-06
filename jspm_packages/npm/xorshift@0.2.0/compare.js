/* */ 
(function(process) {
  var MersenneTwister = require('mersenne-twister');
  var generator = new MersenneTwister();
  var n = process.argv[2] || 5e7;
  var tick = process.hrtime();
  while (n--) {
    generator.random_int();
  }
  var tock = process.hrtime(tick);
  console.log('mersenne-twister: ' + (tock[0] * 1e3 + tock[1] * 1e-6) + "ms");
})(require('process'));
