const Gpio = require('onoff').Gpio;


const gpioNumber = process.argv[3] || 14;
const out = new Gpio(parseInt(gpioNumber), 'out');


console.log('will *->', out.readSync() ^ 1);
console.log('will ->', parseInt(process.argv[3]));
out.writeSync(parseInt(process.argv[3]));

setInterval(function () {
  console.log(`${ gpioNumber} was ->`, out.readSync());
  out.writeSync(out.readSync() ^ 1);
}, 2000);