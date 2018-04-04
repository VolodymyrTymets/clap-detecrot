const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const WavDecoder = require('wav-decoder');
const { fft } = require("./src/fft");

const readFile = filepath =>
  new Promise((resolve, reject) => {
    fs.readFile(filepath, (err, buffer) => {
      if (err) {
        return reject(err);
      }
      return resolve(buffer);
    });
  });

fs.readdirSync(path.resolve(__dirname, './assets')).forEach(async file => {
  try {
    const filePath = path.resolve(__dirname, './assets', `./${file}`);
    const buffer = await readFile(filePath);
    const audioData = await WavDecoder.decode(buffer);
    const wave = audioData.channelData[0];

    const { max } = fft(wave);
    console.log('file name ->', file)
    console.log(`max -> f:[${max.frequency}] a:[${max.amplitude}]`)

  } catch (error) {
    console.log(error)
  }
});