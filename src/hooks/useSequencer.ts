'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import * as Tone from 'tone';
import { Track, SequencerState, DragState, EditingTrackName } from '../types/sequencer';

export const useSequencer = () => {
  const [sequencerState, setSequencerState] = useState<SequencerState>({
    tracks: [],
    bpm: 120,
    isPlaying: false,
    currentStep: 0,
    steps: 16,
    metronomeEnabled: false,
    soloedTracks: [],
  });

  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    lastDraggedStep: null,
  });

  const [editingTrackName, setEditingTrackName] = useState<EditingTrackName | null>(null);
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  const sequenceRef = useRef<Tone.Sequence | null>(null);
  const tracksRef = useRef<Track[]>([]);
  const stepsRef = useRef(16);
  const soloedTracksRef = useRef<number[]>([]);

  // Update refs when state changes
  useEffect(() => {
    tracksRef.current = sequencerState.tracks;
    stepsRef.current = sequencerState.steps;
    soloedTracksRef.current = sequencerState.soloedTracks;
  }, [sequencerState.tracks, sequencerState.steps, sequencerState.soloedTracks]);

  const setTracks = useCallback((tracks: Track[] | ((prevTracks: Track[]) => Track[])) => {
    setSequencerState((prev: SequencerState) => ({ 
      ...prev, 
      tracks: typeof tracks === 'function' ? tracks(prev.tracks) : tracks 
    }));
  }, []);

  const setBpm = useCallback((bpm: number) => {
    setSequencerState((prev: SequencerState) => ({ ...prev, bpm }));
  }, []);

  const setIsPlaying = useCallback((isPlaying: boolean) => {
    setSequencerState((prev: SequencerState) => ({ ...prev, isPlaying }));
  }, []);

  const setCurrentStep = useCallback((currentStep: number) => {
    setSequencerState((prev: SequencerState) => ({ ...prev, currentStep }));
  }, []);

  const setSteps = useCallback((steps: number) => {
    setSequencerState((prev: SequencerState) => ({ ...prev, steps }));
  }, []);

  const setMetronomeEnabled = useCallback((metronomeEnabled: boolean) => {
    setSequencerState((prev: SequencerState) => ({ ...prev, metronomeEnabled }));
  }, []);

  const setSoloedTracks = useCallback((soloedTracks: number[] | ((prev: number[]) => number[])) => {
    setSequencerState((prev: SequencerState) => ({ 
      ...prev, 
      soloedTracks: typeof soloedTracks === 'function' ? soloedTracks(prev.soloedTracks) : soloedTracks 
    }));
  }, []);

  return {
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
  };
};
