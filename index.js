const _ = require('lodash');
const mic = require('mic');
const WavDecoder = require('wav-decoder');
const header = require("waveheader");

let time = null;

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
        }
      })
      .catch(console.log);

    time = newTime;
    buffers = [];
  }
});

time = new Date().getTime();
micInstance.start();