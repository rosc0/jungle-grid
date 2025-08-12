import { Track } from './sequencer';

export interface KnobProps {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  label: string;
}

export interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDestructive?: boolean;
}

export interface IconProps {
  className?: string;
  size?: number;
}

export interface TransportControlsProps {
  isPlaying: boolean;
  metronomeEnabled: boolean;
  bpm: number;
  steps: number;
  onPlayStop: () => void;
  onToggleMetronome: () => void;
  onBpmChange: (bpm: number) => void;
  onStepsChange: (steps: number) => void;
  onClearCells: () => void;
  onClearEverything: () => void;
  onExportMIDI: () => void;
}

export interface TrackControlsProps {
  track: Track;
  isEditing: boolean;
  editingName: string;
  onToggleMute: () => void;
  onToggleSolo: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onPitchChange: (value: number) => void;
  onVelocityChange: (value: number) => void;
  onColorChange: (color: string) => void;
  onStartEditing: () => void;
  onFinishEditing: () => void;
  onNameChange: (name: string) => void;
}

export interface StepGridProps {
  tracks: Track[];
  currentStep: number;
  isPlaying: boolean;
  onMouseDown: (trackIndex: number, stepIndex: number) => void;
  onMouseEnter: (trackIndex: number, stepIndex: number) => void;
}
