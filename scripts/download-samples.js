import fs from 'fs';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const samples = [
  {
    name: 'kick.wav',
    url: 'https://raw.githubusercontent.com/Tonejs/Tone.js/dev/examples/audio/drum-samples/kick.mp3'
  },
  {
    name: 'snare.wav',
    url: 'https://raw.githubusercontent.com/Tonejs/Tone.js/dev/examples/audio/drum-samples/snare.mp3'
  },
  {
    name: 'hihat.wav',
    url: 'https://raw.githubusercontent.com/Tonejs/Tone.js/dev/examples/audio/drum-samples/hihat.mp3'
  }
];

const samplesDir = path.join(__dirname, '../public/samples');

if (!fs.existsSync(samplesDir)) {
  fs.mkdirSync(samplesDir, { recursive: true });
}

samples.forEach(sample => {
  const filePath = path.join(samplesDir, sample.name);
  const file = fs.createWriteStream(filePath);
  
  https.get(sample.url, response => {
    response.pipe(file);
    
    file.on('finish', () => {
      file.close();
      console.log(`Downloaded ${sample.name}`);
    });
  }).on('error', err => {
    fs.unlink(filePath, () => {});
    console.error(`Error downloading ${sample.name}:`, err.message);
  });
}); 