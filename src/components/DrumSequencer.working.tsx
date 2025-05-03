'use client';

import { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';

interface Step {
  active: boolean;
  velocity: number;
}

interface Track {
  name: string;
  steps: Step[];
  sound: Tone.Player;
}

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

  // Update refs when state changes
  useEffect(() => {
    tracksRef.current = tracks;
    stepsRef.current = steps;
  }, [tracks, steps]);

  // Initialize audio context and tracks
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
        },
        {
          name: 'Snare 1',
          steps: Array(steps).fill({ active: false, velocity: 1 }),
          sound: snare1,
        },
        {
          name: 'Snare 2',
          steps: Array(steps).fill({ active: false, velocity: 1 }),
          sound: snare2,
        },
        {
          name: 'Semi Snare',
          steps: Array(steps).fill({ active: false, velocity: 1 }),
          sound: semiSnare2,
        },
        {
          name: 'Closed HH 1',
          steps: Array(steps).fill({ active: false, velocity: 1 }),
          sound: closedHihat1,
        },
        {
          name: 'Closed HH 2',
          steps: Array(steps).fill({ active: false, velocity: 1 }),
          sound: closedHihat2,
        },
        {
          name: 'Open HH',
          steps: Array(steps).fill({ active: false, velocity: 1 }),
          sound: openHihat,
        },
        {
          name: 'Crash',
          steps: Array(steps).fill({ active: false, velocity: 1 }),
          sound: crash,
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

    // Clean up previous sequence if it exists
    if (sequenceRef.current) {
      sequenceRef.current.stop();
      sequenceRef.current.dispose();
    }

    const sequence = new Tone.Sequence(
      (time, step) => {
        try {
          setCurrentStep(step);

          // Play all tracks at exactly the same time
          tracksRef.current.forEach((track) => {
            if (track.steps[step].active) {
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
      Tone.Transport.start();
      // Start from current position instead of 0
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
  }, [isPlaying, bpm, isInitialized, steps]);

  // Handle metronome separately
  useEffect(() => {
    if (!isInitialized || !isPlaying || !metronomeEnabled || !metronomeRef.current) return;

    const metronomeSequence = new Tone.Sequence(
      (time) => {
        try {
          metronomeRef.current?.start(time);
        } catch (error) {
          console.error('Error in metronome callback:', error);
        }
      },
      [...Array(4).keys()], // 4 beats per bar
      '4n' // quarter note timing
    );

    metronomeSequence.start(Tone.Transport.position);

    return () => {
      metronomeSequence.stop();
      metronomeSequence.dispose();
    };
  }, [isPlaying, metronomeEnabled, isInitialized, steps]);

  const handlePlayStop = () => {
    try {
      if (!isPlaying) {
        Tone.Transport.position = 0;
      }
      setIsPlaying(!isPlaying);
    } catch (error) {
      console.error('Error toggling play state:', error);
      setIsPlaying(false);
    }
  };

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
        <div className='flex justify-between items-center mb-4'>
          <h1 className='text-2xl font-bold'>Drum Sequencer</h1>
          <div className='flex items-center gap-4'>
            <button
              onClick={handlePlayStop}
              className='px-4 py-2 bg-blue-500 rounded hover:bg-blue-600 transition-colors'
            >
              {isPlaying ? 'Stop' : 'Play'}
            </button>
            <button
              onClick={toggleMetronome}
              className={`px-4 py-2 rounded transition-colors ${
                metronomeEnabled
                  ? 'bg-green-500 hover:bg-green-600'
                  : 'bg-gray-500 hover:bg-gray-600'
              }`}
            >
              Metronome {metronomeEnabled ? 'On' : 'Off'}
            </button>
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
        </div>

        <div className='grid gap-4'>
          {tracks.map((track, trackIndex) => (
            <div key={track.name} className='flex items-center gap-4'>
              <div className='w-24 font-bold'>{track.name}</div>
              <div className='flex gap-1'>
                {track.steps.map((step, stepIndex) => (
                  <button
                    key={stepIndex}
                    onClick={() => toggleStep(trackIndex, stepIndex)}
                    className={`
                      w-10 h-10 rounded transition-all duration-200
                      transform active:scale-95
                      ${
                        step.active
                          ? 'bg-blue-500 hover:bg-blue-600 scale-105 shadow-lg'
                          : 'bg-gray-700 hover:bg-gray-600 hover:scale-105'
                      }
                      ${
                        currentStep === stepIndex && isPlaying
                          ? 'ring-4 ring-yellow-500 scale-110 shadow-xl'
                          : ''
                      }
                      cursor-pointer
                    `}
                    style={{
                      boxShadow: step.active ? '0 0 10px rgba(59, 130, 246, 0.5)' : 'none',
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DrumSequencer;
