# EARLY WIP - Jungle Grid

A modern drum sequencer built with Next.js, React, TypeScript, and Tone.js. Create beats with an intuitive step sequencer interface featuring multiple drum tracks, real-time playback, and MIDI export capabilities.

## ✨ Features

- **8-Track Step Sequencer**: Individual controls for kick, snare, hi-hats, and crash
- **Real-time Audio**: Powered by Tone.js for high-quality audio playback
- **Track Controls**: 
  - Individual mute/solo for each track
  - Pitch and velocity adjustment with visual knobs
  - Custom track colors
  - Track duplication and deletion
- **Transport Controls**: Play/stop, metronome, BPM adjustment (40-300)
- **Flexible Grid**: Adjustable step count (4-64 steps)
- **MIDI Export**: Export your patterns as MIDI files
- **Keyboard Shortcuts**: Spacebar to play/stop
- **Responsive Design**: Works on desktop and mobile devices

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm, yarn, pnpm, or bun

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

```bash
npm run build
npm start
```

## 🎵 Usage

1. **Initialize Audio**: Click "Initialize Audio" to start the audio engine
2. **Create Patterns**: Click on the grid to activate/deactivate steps
3. **Adjust Tracks**: Use the knobs to control pitch and velocity
4. **Control Playback**: Use transport controls to play, stop, and adjust BPM
5. **Export**: Save your patterns as MIDI files for use in DAWs

## 🛠 Tech Stack

- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **Tone.js** - Web Audio API wrapper
- **Tailwind CSS** - Styling
- **React Hooks** - State management
- **Web Audio API** - Audio processing

## 📁 Project Structure

```
src/
├── app/                    # Next.js app directory
├── components/
│   ├── icons/             # SVG icon components
│   ├── sequencer/         # Sequencer-specific components
│   ├── ui/                # Reusable UI components
│   └── DrumSequencer.tsx  # Main sequencer component
├── hooks/                 # Custom React hooks
├── types/                 # TypeScript type definitions
└── constants/             # Application constants
```

## 🎹 Keyboard Shortcuts

- **Spacebar**: Play/Stop toggle

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is open source and available under the [MIT License](LICENSE).
