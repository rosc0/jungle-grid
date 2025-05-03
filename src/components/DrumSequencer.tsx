'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import * as Tone from 'tone';
import { saveAs } from 'file-saver';
import { Midi } from '@tonejs/midi';

interface Step {
  active: boolean;
  velocity: number;
}

interface Track {
  name: string;
  steps: Step[];
  sound: Tone.Player;
  pitch: number;
  velocity: number;
  muted: boolean;
  soloed: boolean;
  color: string; // HEX color
}

interface KnobProps {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  label: string;
}

const Knob = ({ value, min, max, onChange, label }: KnobProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const knobRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const startValue = useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    startY.current = e.clientY;
    startValue.current = value;
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaY = startY.current - e.clientY; // Invert Y axis (up = increase)
      const valueDiff = (deltaY / 100) * (max - min); // 100px movement = full range
      const newValue = Math.min(max, Math.max(min, startValue.current + valueDiff));
      onChange(Math.round(newValue * 10) / 10);
    },
    [isDragging, max, min, onChange]
  );

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleDoubleClick = () => {
    onChange(0);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove]);

  const rotation = ((value - min) / (max - min)) * 270 - 135;

  return (
    <div className='flex flex-col items-center gap-0.5' title={label} style={{ width: '2rem' }}>
      <div
        ref={knobRef}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
        className='w-8 h-8 rounded-full bg-gray-700 cursor-pointer relative flex items-center justify-center select-none'
        style={{
          transform: `rotate(${rotation}deg)`,
        }}
      >
        <div className='absolute top-1 left-1/2 w-1 h-3 bg-white rounded-full transform -translate-x-1/2' />
      </div>
      <div className='text-xs'>{value}</div>
      <span className='text-[10px] text-gray-400'>{label}</span>
    </div>
  );
};

// Add initial track color map for reset
const INITIAL_TRACK_COLORS = [
  '#e57373', // Red
  '#64b5f6', // Blue
  '#81c784', // Green
  '#ffd54f', // Yellow
  '#ba68c8', // Purple
  '#4dd0e1', // Cyan
  '#f06292', // Pink
  '#a1887f', // Brown
];

// SVG ICONS
const PlayIcon = () => (
  <svg width='20' height='20' viewBox='0 0 20 20' fill='none' stroke='currentColor' strokeWidth='2'>
    <polygon points='5,3 19,10 5,17' fill='currentColor' />
  </svg>
);
const StopIcon = () => (
  <svg width='20' height='20' viewBox='0 0 20 20' fill='none' stroke='currentColor' strokeWidth='2'>
    <rect x='5' y='5' width='10' height='10' fill='currentColor' />
  </svg>
);
const MetronomeIcon = () => (
  <svg width='20' height='20' viewBox='0 0 20 20' fill='none' stroke='currentColor' strokeWidth='2'>
    <path d='M10 2 L15 18 H5 L10 2 Z' />
    <circle cx='10' cy='13' r='2' fill='currentColor' />
  </svg>
);
const ResetIcon = () => (
  <svg width='20' height='20' viewBox='0 0 20 20' fill='none' stroke='currentColor' strokeWidth='2'>
    <path d='M4 4v5h5' />
    <path d='M19 11a8 8 0 1 1-7-7' />
  </svg>
);
const TrashIcon = () => (
  <svg
    width='20'
    height='20'
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
    strokeLinecap='round'
    strokeLinejoin='round'
  >
    <path d='M3 6h18' />
    <path d='M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6' />
    <path d='M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2' />
    <line x1='10' y1='11' x2='10' y2='17' />
    <line x1='14' y1='11' x2='14' y2='17' />
  </svg>
);
const ExportIcon = () => (
  <svg width='20' height='20' viewBox='0 0 20 20' fill='none' stroke='currentColor' strokeWidth='2'>
    <path d='M10 3v10' />
    <path d='M5 10l5 5 5-5' />
    <rect x='3' y='17' width='14' height='2' fill='currentColor' />
  </svg>
);

const DrumSequencer = () => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [bpm, setBpm] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState<string>('Click to initialize audio');
  const [needsInteraction, setNeedsInteraction] = useState(true);
  const [metronomeEnabled, setMetronomeEnabled] = useState(false);
  const [steps, setSteps] = useState(16);
  const sequenceRef = useRef<Tone.Sequence | null>(null);
  const metronomeRef = useRef<Tone.Player | null>(null);
  const tracksRef = useRef(tracks);
  const stepsRef = useRef(steps);
  const [isDragging, setIsDragging] = useState(false);
  const [lastDraggedStep, setLastDraggedStep] = useState<{
    trackIndex: number;
    stepIndex: number;
  } | null>(null);
  const [soloedTracks, setSoloedTracks] = useState<number[]>([]);
  const soloedTracksRef = useRef(soloedTracks);
  const [editingTrackName, setEditingTrackName] = useState<{
    trackIndex: number;
    name: string;
  } | null>(null);
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  // Update refs when state changes
  useEffect(() => {
    tracksRef.current = tracks;
    stepsRef.current = steps;
  }, [tracks, steps]);

  // Update ref when soloedTracks changes
  useEffect(() => {
    soloedTracksRef.current = soloedTracks;
  }, [soloedTracks]);

  const handleInitialize = async () => {
    if (!needsInteraction) return;

    try {
      setLoadingProgress('Initializing audio context...');
      console.log('Starting audio initialization...');

      // Start the audio context
      await Tone.start();
      console.log('Audio context started');
      setNeedsInteraction(false);

      // Create and load players
      setLoadingProgress('Creating audio players...');
      const kick1 = new Tone.Player();
      const snare1 = new Tone.Player();
      const snare2 = new Tone.Player();
      const semiSnare2 = new Tone.Player();
      const closedHihat1 = new Tone.Player();
      const closedHihat2 = new Tone.Player();
      const openHihat = new Tone.Player();
      const crash = new Tone.Player();
      const metronome = new Tone.Player();

      // Load each sound individually with error handling
      try {
        setLoadingProgress('Loading sounds...');
        console.log('Loading sounds...');

        await Promise.all([
          kick1.load('/sounds/kick_1.wav'),
          snare1.load('/sounds/snare_1.wav'),
          snare2.load('/sounds/snare_2.wav'),
          semiSnare2.load('/sounds/semi_snare_2.wav'),
          closedHihat1.load('/sounds/closed_hi_hat_1.wav'),
          closedHihat2.load('/sounds/closed_hi_hat_2.wav'),
          openHihat.load('/sounds/open_hi_hat.wav'),
          crash.load('/sounds/crash.wav'),
          metronome.load('/sounds/click.wav'),
        ]);

        console.log('All sounds loaded');
      } catch (loadError) {
        console.error('Error loading sounds:', loadError);
        throw new Error(
          `Failed to load sounds: ${
            loadError instanceof Error ? loadError.message : 'Unknown error'
          }`
        );
      }

      // Connect players to the destination
      setLoadingProgress('Setting up audio routing...');
      kick1.toDestination();
      snare1.toDestination();
      snare2.toDestination();
      semiSnare2.toDestination();
      closedHihat1.toDestination();
      closedHihat2.toDestination();
      openHihat.toDestination();
      crash.toDestination();
      metronome.toDestination();

      metronomeRef.current = metronome;

      const initialTracks: Track[] = [
        {
          name: 'Kick 1',
          steps: Array(steps).fill({ active: false, velocity: 1 }),
          sound: kick1,
          pitch: 0,
          velocity: 0,
          muted: false,
          soloed: false,
          color: '#e57373', // Red
        },
        {
          name: 'Snare 1',
          steps: Array(steps).fill({ active: false, velocity: 1 }),
          sound: snare1,
          pitch: 0,
          velocity: 0,
          muted: false,
          soloed: false,
          color: '#64b5f6', // Blue
        },
        {
          name: 'Snare 2',
          steps: Array(steps).fill({ active: false, velocity: 1 }),
          sound: snare2,
          pitch: 0,
          velocity: 0,
          muted: false,
          soloed: false,
          color: '#81c784', // Green
        },
        {
          name: 'Semi Snare',
          steps: Array(steps).fill({ active: false, velocity: 1 }),
          sound: semiSnare2,
          pitch: 0,
          velocity: 0,
          muted: false,
          soloed: false,
          color: '#ffd54f', // Yellow
        },
        {
          name: 'Closed HH 1',
          steps: Array(steps).fill({ active: false, velocity: 1 }),
          sound: closedHihat1,
          pitch: 0,
          velocity: 0,
          muted: false,
          soloed: false,
          color: '#ba68c8', // Purple
        },
        {
          name: 'Closed HH 2',
          steps: Array(steps).fill({ active: false, velocity: 1 }),
          sound: closedHihat2,
          pitch: 0,
          velocity: 0,
          muted: false,
          soloed: false,
          color: '#4dd0e1', // Cyan
        },
        {
          name: 'Open HH',
          steps: Array(steps).fill({ active: false, velocity: 1 }),
          sound: openHihat,
          pitch: 0,
          velocity: 0,
          muted: false,
          soloed: false,
          color: '#f06292', // Pink
        },
        {
          name: 'Crash',
          steps: Array(steps).fill({ active: false, velocity: 1 }),
          sound: crash,
          pitch: 0,
          velocity: 0,
          muted: false,
          soloed: false,
          color: '#a1887f', // Brown
        },
      ];

      setTracks(initialTracks);
      setIsInitialized(true);
      setError(null);
      setLoadingProgress('Ready!');
      console.log('Sequencer initialized successfully');
    } catch (error) {
      console.error('Error initializing audio:', error);
      setError(error instanceof Error ? error.message : 'Failed to initialize audio');
      setLoadingProgress('Error occurred');
    }
  };

  // Create the sequencer
  useEffect(() => {
    if (!isInitialized || !isPlaying) return;

    if (sequenceRef.current) {
      sequenceRef.current.stop();
      sequenceRef.current.dispose();
    }

    const sequence = new Tone.Sequence(
      (time, step) => {
        try {
          setCurrentStep(step);

          tracksRef.current.forEach((track) => {
            if (track.steps[step].active) {
              // Skip if track is muted
              if (track.muted) return;

              // Skip if other tracks are soloed and this one isn't
              if (
                soloedTracksRef.current.length > 0 &&
                !soloedTracksRef.current.includes(tracksRef.current.indexOf(track))
              )
                return;

              // Apply pitch shift and velocity
              track.sound.playbackRate = Math.pow(2, track.pitch / 12);
              track.sound.volume.value = track.velocity;
              track.sound.start(time);
            }
          });
        } catch (error) {
          console.error('Error in sequence callback:', error);
        }
      },
      [...Array(stepsRef.current).keys()],
      '16n'
    );

    sequenceRef.current = sequence;

    try {
      Tone.Transport.bpm.value = bpm;
      // Only reset position if we're starting from stopped state
      if (!isPlaying) {
        Tone.Transport.position = 0;
      }
      Tone.Transport.start();
      sequence.start(Tone.Transport.position);
    } catch (error) {
      console.error('Error starting sequence:', error);
      setIsPlaying(false);
    }

    return () => {
      if (sequenceRef.current) {
        sequenceRef.current.stop();
        sequenceRef.current.dispose();
        sequenceRef.current = null;
      }
      Tone.Transport.stop();
    };
  }, [isPlaying, bpm, isInitialized]);

  // Handle metronome separately
  useEffect(() => {
    if (!isInitialized || !isPlaying || !metronomeEnabled || !metronomeRef.current) return;

    const metronomeSequence = new Tone.Sequence(
      (time) => {
        try {
          // Set metronome to higher pitch and volume
          metronomeRef.current!.playbackRate = 1.5; // Higher pitch
          metronomeRef.current!.volume.value = 6; // Louder (6dB)
          metronomeRef.current?.start(time);
        } catch (error) {
          console.error('Error in metronome callback:', error);
        }
      },
      [...Array(4).keys()], // 4 beats per bar
      '4n' // quarter note timing
    );

    metronomeSequence.start(0);

    return () => {
      metronomeSequence.stop();
      metronomeSequence.dispose();
    };
  }, [isPlaying, metronomeEnabled, isInitialized]);

  const handlePlayStop = useCallback(() => {
    try {
      if (!isPlaying) {
        Tone.Transport.position = 0;
      }
      setIsPlaying(!isPlaying);
    } catch (error) {
      console.error('Error toggling play state:', error);
      setIsPlaying(false);
    }
  }, [isPlaying]);

  const toggleMetronome = () => {
    setMetronomeEnabled(!metronomeEnabled);
  };

  const toggleStep = (trackIndex: number, stepIndex: number) => {
    if (!isInitialized) return;

    try {
      console.log('Toggling step:', trackIndex, stepIndex);
      setTracks((prevTracks) => {
        const newTracks = [...prevTracks];
        const newSteps = [...newTracks[trackIndex].steps];
        newSteps[stepIndex] = {
          ...newSteps[stepIndex],
          active: !newSteps[stepIndex].active,
        };
        newTracks[trackIndex] = {
          ...newTracks[trackIndex],
          steps: newSteps,
        };
        console.log('New track state:', newTracks[trackIndex].steps[stepIndex].active);
        return newTracks;
      });
    } catch (error) {
      console.error('Error toggling step:', error);
    }
  };

  const handleStepsChange = (newSteps: number) => {
    if (newSteps < 4 || newSteps > 64) return; // Limit steps between 4 and 64

    setTracks((prevTracks) => {
      return prevTracks.map((track) => ({
        ...track,
        steps: Array(newSteps)
          .fill({ active: false, velocity: 1 })
          .map((_, index) =>
            index < track.steps.length ? track.steps[index] : { active: false, velocity: 1 }
          ),
      }));
    });

    setSteps(newSteps);

    // If playing, update the sequence immediately
    if (isPlaying && sequenceRef.current) {
      sequenceRef.current.stop();
      sequenceRef.current.dispose();

      const newSequence = new Tone.Sequence(
        (time, step) => {
          try {
            setCurrentStep(step);

            tracksRef.current.forEach((track) => {
              if (track.steps[step].active) {
                track.sound.start(time);
              }
            });
          } catch (error) {
            console.error('Error in sequence callback:', error);
          }
        },
        [...Array(newSteps).keys()],
        '16n'
      );

      sequenceRef.current = newSequence;
      newSequence.start(Tone.Transport.position);
    }
  };

  const duplicateTrack = (trackIndex: number) => {
    setTracks((prevTracks) => {
      const trackToDuplicate = prevTracks[trackIndex];
      // Remove "(Copy)" from the name if it exists
      const baseName = trackToDuplicate.name.replace(/ \(Copy\)$/, '');
      const newTrack = {
        ...trackToDuplicate,
        name: `${baseName} (Copy)`,
        sound: new Tone.Player(trackToDuplicate.sound.buffer),
        steps: trackToDuplicate.steps.map((step) => ({ ...step })),
      };
      newTrack.sound.toDestination();

      const newTracks = [...prevTracks];
      newTracks.splice(trackIndex + 1, 0, newTrack);
      return newTracks;
    });
  };

  const handlePitchChange = (trackIndex: number, newPitch: number) => {
    setTracks((prevTracks) => {
      const newTracks = [...prevTracks];
      newTracks[trackIndex] = {
        ...newTracks[trackIndex],
        pitch: newPitch,
      };
      return newTracks;
    });
  };

  const deleteTrack = (trackIndex: number) => {
    // Only allow deletion of copied tracks
    if (!tracks[trackIndex].name.includes('(Copy)') || !tracks[trackIndex].sound) return;

    setTracks((prevTracks) => {
      const newTracks = [...prevTracks];
      // Clean up the audio player before removing
      newTracks[trackIndex].sound.dispose();
      newTracks.splice(trackIndex, 1);
      return newTracks;
    });
  };

  const handleTrackNameChange = (trackIndex: number, newName: string) => {
    setTracks((prevTracks) => {
      const newTracks = [...prevTracks];
      newTracks[trackIndex] = {
        ...newTracks[trackIndex],
        name: newName,
      };
      return newTracks;
    });
  };

  const startEditingTrackName = (trackIndex: number) => {
    setEditingTrackName({ trackIndex, name: tracks[trackIndex].name });
  };

  const finishEditingTrackName = () => {
    if (editingTrackName) {
      handleTrackNameChange(editingTrackName.trackIndex, editingTrackName.name);
      setEditingTrackName(null);
    }
  };

  const handleVelocityChange = (trackIndex: number, newVelocity: number) => {
    setTracks((prevTracks) => {
      const newTracks = [...prevTracks];
      newTracks[trackIndex] = {
        ...newTracks[trackIndex],
        velocity: newVelocity,
      };
      // Update the audio player's volume
      // 0 = normal volume, positive = louder, negative = softer
      newTracks[trackIndex].sound.volume.value = newVelocity;
      return newTracks;
    });
  };

  const exportToMIDI = () => {
    // Create a MIDI file with the current pattern
    const midi = new Midi();

    // Set the tempo
    midi.header.setTempo(bpm);

    // Map our tracks to MIDI notes (using General MIDI drum map)
    const midiNoteMap: { [key: string]: number } = {
      'Kick 1': 36, // Bass Drum 1
      'Snare 1': 38, // Acoustic Snare
      'Snare 2': 38, // Acoustic Snare
      'Semi Snare': 38, // Acoustic Snare
      'Closed HH 1': 42, // Closed Hi-Hat
      'Closed HH 2': 42, // Closed Hi-Hat
      'Open HH': 46, // Open Hi-Hat
      Crash: 49, // Crash Cymbal 1
    };

    // Add notes for each track
    tracks.forEach((track) => {
      if (track.muted) return; // Skip muted tracks

      const midiNote = midiNoteMap[track.name.replace(/ \(Copy\)$/, '')];
      if (midiNote) {
        const midiTrack = midi.addTrack();
        midiTrack.name = track.name;

        track.steps.forEach((step, stepIndex) => {
          if (step.active) {
            // Calculate time in ticks (based on note division)
            const ticksPerStep = midi.header.ppq * 0.25;
            const time = stepIndex * ticksPerStep;

            // Add the note with velocity
            midiTrack.addNote({
              midi: midiNote,
              time: time,
              duration: ticksPerStep,
              velocity: Math.max(0, Math.min(127, Math.round((track.velocity + 60) * 2.12))), // Convert dB to MIDI velocity
            });
          }
        });
      }
    });

    // Save the MIDI file
    const buffer = midi.toArray();
    const blob = new Blob([buffer], { type: 'audio/midi' });
    saveAs(blob, 'drum-pattern.mid');
  };

  const handleMouseDown = (trackIndex: number, stepIndex: number) => {
    setIsDragging(true);
    setLastDraggedStep({ trackIndex, stepIndex });
    toggleStep(trackIndex, stepIndex);
  };

  const handleMouseEnter = (trackIndex: number, stepIndex: number) => {
    if (isDragging && lastDraggedStep && lastDraggedStep.trackIndex === trackIndex) {
      // Get the range of steps to toggle within the same track
      const startStep = Math.min(stepIndex, lastDraggedStep.stepIndex);
      const endStep = Math.max(stepIndex, lastDraggedStep.stepIndex);

      // Toggle all steps in the range
      for (let s = startStep; s <= endStep; s++) {
        if (
          tracks[trackIndex].steps[s].active !==
          tracks[lastDraggedStep.trackIndex].steps[lastDraggedStep.stepIndex].active
        ) {
          toggleStep(trackIndex, s);
        }
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setLastDraggedStep(null);
  };

  // Add event listener for mouse up outside the grid
  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  const toggleMute = (trackIndex: number) => {
    setTracks((prevTracks) => {
      const newTracks = [...prevTracks];
      newTracks[trackIndex] = {
        ...newTracks[trackIndex],
        muted: !newTracks[trackIndex].muted,
        soloed: newTracks[trackIndex].muted ? newTracks[trackIndex].soloed : false, // Disable solo when unmuting
      };
      return newTracks;
    });
  };

  const toggleSolo = (trackIndex: number) => {
    setTracks((prevTracks) => {
      const newTracks = [...prevTracks];
      const isSoloed = !newTracks[trackIndex].soloed;
      newTracks[trackIndex] = {
        ...newTracks[trackIndex],
        soloed: isSoloed,
        muted: isSoloed ? false : newTracks[trackIndex].muted,
      };

      // Update soloed tracks list
      if (isSoloed) {
        setSoloedTracks((prev) => [...prev, trackIndex]);
      } else {
        setSoloedTracks((prev) => prev.filter((i) => i !== trackIndex));
      }

      return newTracks;
    });
  };

  // Add spacebar handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault(); // Prevent page scroll
        handlePlayStop();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, handlePlayStop]);

  const handleTrackColorChange = (trackIndex: number, color: string) => {
    setTracks((prevTracks) => {
      const newTracks = [...prevTracks];
      newTracks[trackIndex] = {
        ...newTracks[trackIndex],
        color,
      };
      return newTracks;
    });
  };

  const handleClearCells = () => {
    setTracks((prevTracks) =>
      prevTracks.map((track) => ({
        ...track,
        steps: Array(steps).fill({ active: false, velocity: 1 }),
      }))
    );
  };

  const handleClearEverything = () => {
    setShowConfirmReset(true);
  };

  const confirmClearEverything = () => {
    // Remove all duplicated tracks, reset originals
    setTracks((prevTracks) =>
      prevTracks
        .filter((track, i) => i < INITIAL_TRACK_COLORS.length) // Only keep originals
        .map((track, i) => ({
          ...track,
          color: INITIAL_TRACK_COLORS[i],
          pitch: 0,
          velocity: 0,
          steps: Array(steps).fill({ active: false, velocity: 1 }),
        }))
    );
    setShowConfirmReset(false);
  };

  const cancelClearEverything = () => {
    setShowConfirmReset(false);
  };

  if (error) {
    return (
      <div className='p-4 bg-gray-900 text-white min-h-screen'>
        <div className='max-w-4xl mx-auto'>
          <div className='text-red-500'>
            <h2 className='text-xl font-bold mb-2'>Error</h2>
            <p>{error}</p>
            <button
              onClick={() => window.location.reload()}
              className='mt-4 px-4 py-2 bg-blue-500 rounded hover:bg-blue-600'
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (needsInteraction) {
    return (
      <div className='p-4 bg-gray-900 text-white min-h-screen'>
        <div className='max-w-4xl mx-auto'>
          <div className='text-center'>
            <h2 className='text-xl font-bold mb-2'>Drum Sequencer</h2>
            <p className='mb-4'>{loadingProgress}</p>
            <button
              onClick={handleInitialize}
              className='px-4 py-2 bg-blue-500 rounded hover:bg-blue-600 transition-colors'
            >
              Initialize Audio
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className='p-4 bg-gray-900 text-white min-h-screen'>
        <div className='max-w-4xl mx-auto'>
          <div className='text-center'>
            <h2 className='text-xl font-bold mb-2'>Initializing Audio...</h2>
            <p className='mb-4'>{loadingProgress}</p>
            <div className='animate-pulse'>Please wait...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='p-4 bg-gray-900 text-white min-h-screen'>
      <div className='max-w-4xl mx-auto'>
        <div className='flex justify-center mb-4 gap-6'>
          {/* Title center */}
          <h1 className='text-2xl font-bold flex-grow text-left'>Drum Sequencer</h1>
          {/* BPM & Steps on left */}
          <div className='flex items-center gap-4'>
            <div className='flex items-center gap-2'>
              <label className='font-medium'>BPM:</label>
              <input
                type='number'
                value={bpm}
                onChange={(e) => setBpm(Number(e.target.value))}
                className='w-20 px-2 py-1 bg-gray-800 rounded focus:outline-none focus:ring-2 focus:ring-blue-500'
                min='40'
                max='300'
              />
            </div>
            <div className='flex items-center gap-2'>
              <label className='font-medium'>Steps:</label>
              <input
                type='number'
                value={steps}
                onChange={(e) => handleStepsChange(Number(e.target.value))}
                className='w-20 px-2 py-1 bg-gray-800 rounded focus:outline-none focus:ring-2 focus:ring-blue-500'
                min='4'
                max='64'
              />
            </div>
          </div>

          {/* Buttons right */}
          <div className='flex items-center gap-4 justify-end'>
            <button
              onClick={handlePlayStop}
              className='min-h-[48px] px-4 bg-blue-500 rounded-md hover:bg-blue-600 transition-colors flex items-center justify-center text-center gap-2'
              style={{ minWidth: '48px' }}
              title={isPlaying ? 'Stop' : 'Play'}
            >
              {isPlaying ? <StopIcon /> : <PlayIcon />}
            </button>
            <button
              onClick={toggleMetronome}
              className={`min-h-[48px] px-4 rounded-md transition-colors flex items-center justify-center text-center gap-2 ${
                metronomeEnabled
                  ? 'bg-green-500 hover:bg-green-600'
                  : 'bg-gray-500 hover:bg-gray-600'
              }`}
              title='Metronome'
            >
              <MetronomeIcon />
            </button>
            <button
              onClick={handleClearCells}
              className='min-h-[48px] px-4 bg-yellow-500 rounded-md hover:bg-yellow-600 transition-colors flex items-center justify-center text-center gap-2'
              title='Clear Cells'
            >
              <ResetIcon />
            </button>
            <button
              onClick={handleClearEverything}
              className='min-h-[48px] px-4 bg-red-500 rounded-md hover:bg-red-600 transition-colors flex items-center justify-center text-center gap-2'
              title='Clear Everything'
            >
              <TrashIcon />
            </button>
            <button
              onClick={exportToMIDI}
              className='min-h-[48px] px-4 bg-purple-500 rounded-md hover:bg-purple-600 transition-colors flex items-center justify-center text-center gap-2'
              title='Export MIDI'
            >
              <ExportIcon />
            </button>
          </div>
        </div>

        <div className='grid gap-4'>
          {tracks.map((track, trackIndex) => (
            <div key={`${track.name}-${trackIndex}`} className='flex items-center gap-4'>
              <div className='flex items-center gap-4'>
                <input
                  type='color'
                  value={track.color}
                  onChange={(e) => handleTrackColorChange(trackIndex, e.target.value)}
                  className='w-9 h-10 p-0 border-0 border-none outline-none cursor-pointer rounded-md focus:outline-none'
                  title='Choose track color'
                  style={{ background: 'none', border: 'none' }}
                />
                {editingTrackName?.trackIndex === trackIndex ? (
                  <input
                    type='text'
                    value={editingTrackName.name}
                    onChange={(e) => setEditingTrackName({ trackIndex, name: e.target.value })}
                    onBlur={finishEditingTrackName}
                    onKeyDown={(e) => e.key === 'Enter' && finishEditingTrackName()}
                    className='w-24 px-2 py-1 bg-gray-800 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm'
                    autoFocus
                  />
                ) : (
                  <div
                    className='w-24 font-bold cursor-pointer hover:text-blue-400'
                    onClick={() => startEditingTrackName(trackIndex)}
                    style={{ color: track.color }}
                  >
                    {track.name}
                  </div>
                )}
                <div className='flex items-center gap-2'>
                  <button
                    onClick={() => duplicateTrack(trackIndex)}
                    className='w-8 h-8 flex items-center justify-center bg-gray-700 rounded hover:bg-gray-600 transition-colors'
                    title='Duplicate'
                  >
                    <ResetIcon />
                  </button>
                  <button
                    onClick={() => deleteTrack(trackIndex)}
                    disabled={!track.name.includes('(Copy)')}
                    className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${
                      track.name.includes('(Copy)')
                        ? 'bg-gray-700 hover:bg-gray-600'
                        : 'bg-gray-800 cursor-not-allowed opacity-50'
                    }`}
                    title='Delete'
                  >
                    <TrashIcon />
                  </button>
                  <button
                    onClick={() => toggleMute(trackIndex)}
                    className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${
                      track.muted ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                    title='Mute'
                  >
                    M
                  </button>
                  <button
                    onClick={() => toggleSolo(trackIndex)}
                    className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${
                      track.soloed
                        ? 'bg-yellow-500 hover:bg-yellow-600'
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                    title='Solo'
                  >
                    S
                  </button>
                  <Knob
                    value={track.pitch}
                    min={-18}
                    max={18}
                    onChange={(value) => handlePitchChange(trackIndex, value)}
                    label='Pitch'
                  />
                  <Knob
                    value={track.velocity}
                    min={-18}
                    max={18}
                    onChange={(value) => handleVelocityChange(trackIndex, value)}
                    label='Velocity'
                  />
                </div>
              </div>
              <div className='flex gap-1'>
                {track.steps.map((step, stepIndex) => (
                  <button
                    key={stepIndex}
                    onMouseDown={() => handleMouseDown(trackIndex, stepIndex)}
                    onMouseEnter={() => handleMouseEnter(trackIndex, stepIndex)}
                    className={`
                      w-10 h-10 rounded
                      transform active:scale-95
                      ${step.active ? '' : 'bg-gray-700 hover:bg-gray-600'}
                      ${
                        currentStep === stepIndex && isPlaying
                          ? 'border-2 border-gray-300'
                          : 'border-2 border-transparent'
                      }
                      cursor-pointer
                    `}
                    style={step.active ? { background: track.color } : {}}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmReset && (
        <div className='fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50'>
          <div className='bg-gray-800 p-6 rounded-xl shadow-lg max-w-sm w-full text-white'>
            <h2 className='text-lg font-bold mb-2'>Reset Everything?</h2>
            <div className='mb-4 text-sm'>
              <div className='mb-2'>This will:</div>
              <ul className='list-disc ml-6 mb-4'>
                <li>Reset all track colors to their original values</li>
                <li>Reset all pitch and velocity to 0</li>
                <li>Remove all duplicated tracks</li>
                <li>Clear all steps (cells)</li>
              </ul>
              <div className='font-bold text-red-400 mb-4'>
                Are you sure you want to do this? This action cannot be undone.
              </div>
            </div>
            <div className='flex justify-end gap-3 mt-2'>
              <button
                onClick={cancelClearEverything}
                className='px-4 py-1.5 bg-gray-600 rounded-md hover:bg-gray-700 mr-2'
              >
                Cancel
              </button>
              <button
                onClick={confirmClearEverything}
                className='px-4 py-1.5 bg-red-600 rounded-md hover:bg-red-700'
              >
                Yes, Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DrumSequencer;
