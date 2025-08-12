// Initial track color map for reset
export const INITIAL_TRACK_COLORS = [
  '#e57373', // Red
  '#64b5f6', // Blue
  '#81c784', // Green
  '#ffd54f', // Yellow
  '#ba68c8', // Purple
  '#4dd0e1', // Cyan
  '#f06292', // Pink
  '#a1887f', // Brown
];

// MIDI note mapping for export (General MIDI drum map)
export const MIDI_NOTE_MAP: { [key: string]: number } = {
  'Kick 1': 36, // Bass Drum 1
  'Snare 1': 38, // Acoustic Snare
  'Snare 2': 38, // Acoustic Snare
  'Semi Snare': 38, // Acoustic Snare
  'Closed HH 1': 42, // Closed Hi-Hat
  'Closed HH 2': 42, // Closed Hi-Hat
  'Open HH': 46, // Open Hi-Hat
  Crash: 49, // Crash Cymbal 1
};

// Sound file paths
export const SOUND_PATHS = {
  kick1: '/sounds/kick_1.wav',
  snare1: '/sounds/snare_1.wav',
  snare2: '/sounds/snare_2.wav',
  semiSnare2: '/sounds/semi_snare_2.wav',
  closedHihat1: '/sounds/closed_hi_hat_1.wav',
  closedHihat2: '/sounds/closed_hi_hat_2.wav',
  openHihat: '/sounds/open_hi_hat.wav',
  crash: '/sounds/crash.wav',
  click: '/sounds/click.wav',
} as const;

// Default track configurations
export const DEFAULT_TRACKS = [
  { name: 'Kick 1', sound: 'kick1' },
  { name: 'Snare 1', sound: 'snare1' },
  { name: 'Snare 2', sound: 'snare2' },
  { name: 'Semi Snare', sound: 'semiSnare2' },
  { name: 'Closed HH 1', sound: 'closedHihat1' },
  { name: 'Closed HH 2', sound: 'closedHihat2' },
  { name: 'Open HH', sound: 'openHihat' },
  { name: 'Crash', sound: 'crash' },
] as const;
