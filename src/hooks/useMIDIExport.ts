'use client';

import { useCallback } from 'react';
import { saveAs } from 'file-saver';
import { Midi } from '@tonejs/midi';
import { Step, Track } from '../types/sequencer';
import { MIDI_NOTE_MAP } from '../constants/sequencer';

export const useMIDIExport = () => {
  const exportToMIDI = useCallback((tracks: Track[], bpm: number) => {
    // Create a MIDI file with the current pattern
    const midi = new Midi();

    // Set the tempo
    midi.header.setTempo(bpm);

    // Add notes for each track
    tracks.forEach((track) => {
      if (track.muted) return; // Skip muted tracks

      const midiNote = MIDI_NOTE_MAP[track.name.replace(/ \(Copy\)$/, '')];
      if (midiNote) {
        const midiTrack = midi.addTrack();
        midiTrack.name = track.name;

        track.steps.forEach((step: Step, stepIndex: number) => {
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
  }, []);

  return { exportToMIDI };
};
