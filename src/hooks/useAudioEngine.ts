'use client';

import { useState, useRef, useCallback } from 'react';
import * as Tone from 'tone';
import { Track, AudioState } from '../types/sequencer';
import { SOUND_PATHS, DEFAULT_TRACKS, INITIAL_TRACK_COLORS } from '../constants/sequencer';

export const useAudioEngine = (steps: number) => {
  const [audioState, setAudioState] = useState<AudioState>({
    isInitialized: false,
    error: null,
    loadingProgress: 'Click to initialize audio',
    needsInteraction: true,
  });
  
  const metronomeRef = useRef<Tone.Player | null>(null);

  const createInitialTracks = useCallback(async (): Promise<Track[]> => {
    const players: { [key: string]: Tone.Player } = {};
    
    // Create all players
    Object.entries(SOUND_PATHS).forEach(([key]) => {
      players[key] = new Tone.Player();
    });

    // Load all sounds
    await Promise.all(
      Object.entries(SOUND_PATHS).map(([key, path]) => 
        players[key].load(path)
      )
    );

    // Connect to destination
    Object.values(players).forEach(player => player.toDestination());
    
    // Set metronome reference
    metronomeRef.current = players.click;

    // Create tracks
    return DEFAULT_TRACKS.map((trackConfig, index) => ({
      name: trackConfig.name,
      steps: Array(steps).fill({ active: false, velocity: 1 }),
      sound: players[trackConfig.sound],
      pitch: 0,
      velocity: 0,
      muted: false,
      soloed: false,
      color: INITIAL_TRACK_COLORS[index],
    }));
  }, [steps]);

  const initialize = useCallback(async (): Promise<Track[]> => {
    if (!audioState.needsInteraction) {
      throw new Error('Audio already initialized');
    }

    try {
      setAudioState((prev: AudioState) => ({ 
        ...prev, 
        loadingProgress: 'Initializing audio context...' 
      }));

      await Tone.start();
      
      setAudioState((prev: AudioState) => ({ 
        ...prev, 
        needsInteraction: false,
        loadingProgress: 'Creating audio players...' 
      }));

      const tracks = await createInitialTracks();
      
      setAudioState((prev: AudioState) => ({
        ...prev,
        isInitialized: true,
        error: null,
        loadingProgress: 'Ready!',
      }));

      return tracks;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to initialize audio';
      setAudioState((prev: AudioState) => ({
        ...prev,
        error: errorMessage,
        loadingProgress: 'Error occurred',
      }));
      throw error;
    }
  }, [audioState.needsInteraction, createInitialTracks]);

  return {
    audioState,
    metronomeRef,
    initialize,
  };
};
