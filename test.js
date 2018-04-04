const Gpio = require('onoff').Gpio;

let out = null;
const gpioNumber = process.argv[3] || 14;
try {
  out = new Gpio(parseInt(gpioNumber), 'out');
} catch (err) {
  console.log('Error -> GPIO is not detected!!!');
}
console.log(`${ gpioNumber} was ->`, out.readSync());
console.log('will *->', out.readSync() ^ 1);
console.log('will ->', parseInt(process.argv[2]));
out.writeSync(parseInt(process.argv[2]));
