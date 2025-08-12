'use client';

import { useEffect, useCallback } from 'react';
import * as Tone from 'tone';
import { Track } from '../types/sequencer';
import { useAudioEngine } from '../hooks/useAudioEngine';
import { useSequencer } from '../hooks/useSequencer';
import { useMIDIExport } from '../hooks/useMIDIExport';
import TransportControls from './sequencer/TransportControls';
import TrackControls from './sequencer/TrackControls';
import StepGrid from './sequencer/StepGrid';
import ConfirmationModal from './ui/ConfirmationModal';
import LoadingSpinner from './ui/LoadingSpinner';
import { INITIAL_TRACK_COLORS } from '../constants/sequencer';

const DrumSequencer = () => {
  const { audioState, metronomeRef, initialize } = useAudioEngine(16);
  const {
    sequencerState,
    dragState,
    editingTrackName,
    showConfirmReset,
    sequenceRef,
    tracksRef,
    stepsRef,
    soloedTracksRef,
    setTracks,
    setBpm,
    setIsPlaying,
    setCurrentStep,
    setSteps,
    setMetronomeEnabled,
    setSoloedTracks,
    setDragState,
    setEditingTrackName,
    setShowConfirmReset,
  } = useSequencer(metronomeRef);
  
  const { exportToMIDI } = useMIDIExport();

  const handleInitialize = async () => {
    try {
      const tracks = await initialize();
      setTracks(tracks);
    } catch (error) {
      console.error('Error initializing sequencer:', error);
    }
  };

  // Create the sequencer
  useEffect(() => {
    if (!audioState.isInitialized || !sequencerState.isPlaying) return;

    if (sequenceRef.current) {
      sequenceRef.current.stop();
      sequenceRef.current.dispose();
    }

    const sequence = new Tone.Sequence(
      (time, step) => {
        try {
          setCurrentStep(step);

          tracksRef.current.forEach((track: Track) => {
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
      Tone.Transport.bpm.value = sequencerState.bpm;
      // Only reset position if we're starting from stopped state
      if (!sequencerState.isPlaying) {
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
  }, [sequencerState.isPlaying, sequencerState.bpm, audioState.isInitialized, setCurrentStep, setIsPlaying]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle metronome separately
  useEffect(() => {
    if (!audioState.isInitialized || !sequencerState.isPlaying || !sequencerState.metronomeEnabled || !metronomeRef.current) return;

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
  }, [sequencerState.isPlaying, sequencerState.metronomeEnabled, audioState.isInitialized]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePlayStop = useCallback(() => {
    try {
      if (!sequencerState.isPlaying) {
        Tone.Transport.position = 0;
      }
      setIsPlaying(!sequencerState.isPlaying);
    } catch (error) {
      console.error('Error toggling play state:', error);
      setIsPlaying(false);
    }
  }, [sequencerState.isPlaying, setIsPlaying]);

  const toggleMetronome = useCallback(() => {
    setMetronomeEnabled(!sequencerState.metronomeEnabled);
  }, [sequencerState.metronomeEnabled, setMetronomeEnabled]);

  const toggleStep = useCallback((trackIndex: number, stepIndex: number) => {
    if (!audioState.isInitialized) return;

    try {
      setTracks((prevTracks: Track[]) => {
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
        return newTracks;
      });
    } catch (error) {
      console.error('Error toggling step:', error);
    }
  }, [audioState.isInitialized, setTracks]);

  const handleStepsChange = useCallback((newSteps: number) => {
    if (newSteps < 4 || newSteps > 64) return; // Limit steps between 4 and 64

    setTracks((prevTracks: Track[]) => {
      return prevTracks.map((track: Track) => ({
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
    if (sequencerState.isPlaying && sequenceRef.current) {
      sequenceRef.current.stop();
      sequenceRef.current.dispose();

      const newSequence = new Tone.Sequence(
        (time, step) => {
          try {
            setCurrentStep(step);

            tracksRef.current.forEach((track: Track) => {
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
  }, [sequencerState.isPlaying, setTracks, setSteps, setCurrentStep]); // eslint-disable-line react-hooks/exhaustive-deps

  const duplicateTrack = useCallback((trackIndex: number) => {
    setTracks((prevTracks: Track[]) => {
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
  }, [setTracks]);

  const handlePitchChange = useCallback((trackIndex: number, newPitch: number) => {
    setTracks((prevTracks: Track[]) => {
      const newTracks = [...prevTracks];
      newTracks[trackIndex] = {
        ...newTracks[trackIndex],
        pitch: newPitch,
      };
      return newTracks;
    });
  }, [setTracks]);

  const deleteTrack = useCallback((trackIndex: number) => {
    // Only allow deletion of copied tracks
    if (!sequencerState.tracks[trackIndex]?.name.includes('(Copy)') || !sequencerState.tracks[trackIndex]?.sound) return;

    setTracks((prevTracks: Track[]) => {
      const newTracks = [...prevTracks];
      // Clean up the audio player before removing
      newTracks[trackIndex].sound.dispose();
      newTracks.splice(trackIndex, 1);
      return newTracks;
    });
  }, [sequencerState.tracks, setTracks]);

  const handleTrackNameChange = useCallback((trackIndex: number, newName: string) => {
    setTracks((prevTracks: Track[]) => {
      const newTracks = [...prevTracks];
      newTracks[trackIndex] = {
        ...newTracks[trackIndex],
        name: newName,
      };
      return newTracks;
    });
  }, [setTracks]);

  const startEditingTrackName = useCallback((trackIndex: number) => {
    setEditingTrackName({ trackIndex, name: sequencerState.tracks[trackIndex].name });
  }, [sequencerState.tracks, setEditingTrackName]);

  const finishEditingTrackName = useCallback(() => {
    if (editingTrackName) {
      handleTrackNameChange(editingTrackName.trackIndex, editingTrackName.name);
      setEditingTrackName(null);
    }
  }, [editingTrackName, handleTrackNameChange, setEditingTrackName]);

  const handleVelocityChange = useCallback((trackIndex: number, newVelocity: number) => {
    setTracks((prevTracks: Track[]) => {
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
  }, [setTracks]);

  const handleExportMIDI = useCallback(() => {
    exportToMIDI(sequencerState.tracks, sequencerState.bpm);
  }, [exportToMIDI, sequencerState.tracks, sequencerState.bpm]);

  const handleMouseDown = useCallback((trackIndex: number, stepIndex: number) => {
    setDragState({
      isDragging: true,
      lastDraggedStep: { trackIndex, stepIndex },
    });
    toggleStep(trackIndex, stepIndex);
  }, [setDragState, toggleStep]);

  const handleMouseEnter = useCallback((trackIndex: number, stepIndex: number) => {
    if (dragState.isDragging && dragState.lastDraggedStep && dragState.lastDraggedStep.trackIndex === trackIndex) {
      // Get the range of steps to toggle within the same track
      const startStep = Math.min(stepIndex, dragState.lastDraggedStep.stepIndex);
      const endStep = Math.max(stepIndex, dragState.lastDraggedStep.stepIndex);

      // Toggle all steps in the range
      for (let s = startStep; s <= endStep; s++) {
        if (
          sequencerState.tracks[trackIndex].steps[s].active !==
          sequencerState.tracks[dragState.lastDraggedStep.trackIndex].steps[dragState.lastDraggedStep.stepIndex].active
        ) {
          toggleStep(trackIndex, s);
        }
      }
    }
  }, [dragState.isDragging, dragState.lastDraggedStep, sequencerState.tracks, toggleStep]);

  const handleMouseUp = useCallback(() => {
    setDragState({
      isDragging: false,
      lastDraggedStep: null,
    });
  }, [setDragState]);

  // Add event listener for mouse up outside the grid
  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseUp]);

  const toggleMute = useCallback((trackIndex: number) => {
    setTracks((prevTracks: Track[]) => {
      const newTracks = [...prevTracks];
      newTracks[trackIndex] = {
        ...newTracks[trackIndex],
        muted: !newTracks[trackIndex].muted,
        soloed: newTracks[trackIndex].muted ? newTracks[trackIndex].soloed : false, // Disable solo when unmuting
      };
      return newTracks;
    });
  }, [setTracks]);

  const toggleSolo = useCallback((trackIndex: number) => {
    setTracks((prevTracks: Track[]) => {
      const newTracks = [...prevTracks];
      const isSoloed = !newTracks[trackIndex].soloed;
      newTracks[trackIndex] = {
        ...newTracks[trackIndex],
        soloed: isSoloed,
        muted: isSoloed ? false : newTracks[trackIndex].muted,
      };

      // Update soloed tracks list
      if (isSoloed) {
        setSoloedTracks((prev: number[]) => [...prev, trackIndex]);
      } else {
        setSoloedTracks((prev: number[]) => prev.filter((i: number) => i !== trackIndex));
      }

      return newTracks;
    });
  }, [setTracks, setSoloedTracks]);

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
  }, [handlePlayStop]);

  const handleTrackColorChange = useCallback((trackIndex: number, color: string) => {
    setTracks((prevTracks: Track[]) => {
      const newTracks = [...prevTracks];
      newTracks[trackIndex] = {
        ...newTracks[trackIndex],
        color,
      };
      return newTracks;
    });
  }, [setTracks]);

  const handleClearCells = useCallback(() => {
    setTracks((prevTracks: Track[]) =>
      prevTracks.map((track: Track) => ({
        ...track,
        steps: Array(sequencerState.steps).fill({ active: false, velocity: 1 }),
      }))
    );
  }, [setTracks, sequencerState.steps]);

  const handleClearEverything = useCallback(() => {
    setShowConfirmReset(true);
  }, [setShowConfirmReset]);

  const confirmClearEverything = useCallback(() => {
    // Remove all duplicated tracks, reset originals
    setTracks((prevTracks: Track[]) =>
      prevTracks
        .filter((track: Track, i: number) => i < INITIAL_TRACK_COLORS.length) // Only keep originals
        .map((track: Track, i: number) => ({
          ...track,
          color: INITIAL_TRACK_COLORS[i],
          pitch: 0,
          velocity: 0,
          steps: Array(sequencerState.steps).fill({ active: false, velocity: 1 }),
        }))
    );
    setShowConfirmReset(false);
  }, [setTracks, setShowConfirmReset, sequencerState.steps]);

  const cancelClearEverything = useCallback(() => {
    setShowConfirmReset(false);
  }, [setShowConfirmReset]);

  if (audioState.error) {
    return (
      <div className='p-4 bg-gray-900 text-white min-h-screen'>
        <div className='max-w-4xl mx-auto'>
          <div className='text-red-500'>
            <h2 className='text-xl font-bold mb-2'>Error</h2>
            <p>{audioState.error}</p>
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

  if (audioState.needsInteraction) {
    return (
      <div className='p-4 bg-gray-900 text-white min-h-screen'>
        <div className='max-w-4xl mx-auto'>
          <div className='text-center'>
            <h2 className='text-xl font-bold mb-2'>Drum Sequencer</h2>
            <p className='mb-4'>{audioState.loadingProgress}</p>
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

  if (!audioState.isInitialized) {
    return (
      <div className='p-4 bg-gray-900 text-white min-h-screen'>
        <div className='max-w-4xl mx-auto'>
          <div className='text-center'>
            <h2 className='text-xl font-bold mb-4'>Initializing Audio...</h2>
            <div className='flex items-center justify-center gap-3 mb-4'>
              <LoadingSpinner size="md" />
              <p>{audioState.loadingProgress}</p>
            </div>
            <p className='text-gray-400 text-sm'>Setting up audio context and loading sound files...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='p-4 bg-gray-900 text-white min-h-screen'>
      <div className='max-w-4xl mx-auto'>
        <TransportControls
          isPlaying={sequencerState.isPlaying}
          metronomeEnabled={sequencerState.metronomeEnabled}
          bpm={sequencerState.bpm}
          steps={sequencerState.steps}
          onPlayStop={handlePlayStop}
          onToggleMetronome={toggleMetronome}
          onBpmChange={setBpm}
          onStepsChange={handleStepsChange}
          onClearCells={handleClearCells}
          onClearEverything={handleClearEverything}
          onExportMIDI={handleExportMIDI}
        />

        <div className='grid gap-4'>
          {sequencerState.tracks.map((track: Track, trackIndex: number) => (
            <div key={`${track.name}-${trackIndex}`} className='flex items-center gap-4'>
              <TrackControls
                track={track}
                isEditing={editingTrackName?.trackIndex === trackIndex}
                editingName={editingTrackName?.name || ''}
                onToggleMute={() => toggleMute(trackIndex)}
                onToggleSolo={() => toggleSolo(trackIndex)}
                onDuplicate={() => duplicateTrack(trackIndex)}
                onDelete={() => deleteTrack(trackIndex)}
                onPitchChange={(value: number) => handlePitchChange(trackIndex, value)}
                onVelocityChange={(value: number) => handleVelocityChange(trackIndex, value)}
                onColorChange={(color: string) => handleTrackColorChange(trackIndex, color)}
                onStartEditing={() => startEditingTrackName(trackIndex)}
                onFinishEditing={finishEditingTrackName}
                onNameChange={(name: string) => setEditingTrackName({ trackIndex, name })}
              />
              <StepGrid
                tracks={[track]}
                currentStep={sequencerState.currentStep}
                isPlaying={sequencerState.isPlaying}
                onMouseDown={(_: number, stepIndex: number) => handleMouseDown(trackIndex, stepIndex)}
                onMouseEnter={(_: number, stepIndex: number) => handleMouseEnter(trackIndex, stepIndex)}
              />
            </div>
          ))}
        </div>
      </div>

      <ConfirmationModal
        isOpen={showConfirmReset}
        title="Reset Everything?"
        message="Are you sure you want to do this? This action cannot be undone."
        confirmText="Yes, Reset"
        cancelText="Cancel"
        onConfirm={confirmClearEverything}
        onCancel={cancelClearEverything}
        isDestructive={true}
      />
    </div>
  );
};

export default DrumSequencer;
