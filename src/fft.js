const _ = require('lodash');
const fjs = require("frequencyjs");

function nearestPow2( aSize ){
  return Math.pow( 2, Math.round( Math.log( aSize ) / Math.log( 2 ) ) );
}

const fft = wave => {
  let waveLength = wave.length;
  let index = nearestPow2(waveLength);

  while (!(index <= wave.length)) {
    waveLength = waveLength - 2;
    index = nearestPow2(waveLength)
  }

  const cutedWave = wave.slice(0, index);
  const spectrum = fjs.Transform.toSpectrum(cutedWave, { method: 'fft'} );

  const max = _.maxBy(spectrum, s => s.amplitude);
  return { spectrum, max };
};

module.exports = { fft };