const _ = require('lodash');
const mic = require('mic');
const WavDecoder = require('wav-decoder');
const header = require("waveheader");
const Gpio = require('onoff').Gpio;

let time = null;
let out = null;
const gpioNumber = process.argv[3] || 14;
try {
  console.log(`run on gpio [${gpioNumber}] with frequently ${freqArg} Hz (every ${frequently} microseconds) and ${timeONinPersent}% on.`);
  out = new Gpio(gpioNumber, 'out');
} catch (err) {
  console.log('Error -> GPIO is not detected!!!');
}

const config = {
  rate: 44100,
  channels: 2,
  exitOnSilence: 6,
  device: `plughw:${process.argv[2] || 0}`,
  fileType: 'wav',
};

const micInstance =  mic(config);
const stream = micInstance.getAudioStream();

let buffers = [];

stream.on('data', buffer => {
  const newTime = new Date().getTime();
  buffers.push(buffer)
  if(newTime - time > 500) {
    const headerBuf = header(config.rate, config);
    buffers.unshift(headerBuf);
    const length = _.sum(buffers.map(b => b.length));

    WavDecoder.decode(Buffer.concat(buffers, length))
      .then(audioData => {
        const wave = audioData.channelData[0];
        const maxAmplitude = _.max(wave);
        if (maxAmplitude > 0.7) {
         console.log('-----> clap');
          if (out) {
            out.writeSync(out.readSync() ^ 1);
          }
        }
      })
      .catch(console.log);

    time = newTime;
    buffers = [];
  }
});

time = new Date().getTime();
micInstance.start();