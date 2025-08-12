import * as Tone from 'tone';

export interface Step {
  active: boolean;
  velocity: number;
}

export interface Track {
  name: string;
  steps: Step[];
  sound: Tone.Player;
  pitch: number;
  velocity: number;
  muted: boolean;
  soloed: boolean;
  color: string; // HEX color
}

export interface EditingTrackName {
  trackIndex: number;
  name: string;
}

export interface LastDraggedStep {
  trackIndex: number;
  stepIndex: number;
}

export interface SequencerState {
  tracks: Track[];
  bpm: number;
  isPlaying: boolean;
  currentStep: number;
  steps: number;
  metronomeEnabled: boolean;
  soloedTracks: number[];
}

export interface AudioState {
  isInitialized: boolean;
  error: string | null;
  loadingProgress: string;
  needsInteraction: boolean;
}

export interface DragState {
  isDragging: boolean;
  lastDraggedStep: LastDraggedStep | null;
}
