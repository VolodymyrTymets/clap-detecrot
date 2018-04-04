const Gpio = require('onoff').Gpio;

let out = null;
const gpioNumber = process.argv[3] || 14;
try {
  out = new Gpio(gpioNumber, 'out');
} catch (err) {
  console.log('Error -> GPIO is not detected!!!');
}

out.writeSync(process.argv[2]);
