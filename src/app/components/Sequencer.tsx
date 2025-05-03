'use client';

import { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';

interface Cell {
  isActive: boolean;
}

interface Row {
  cells: Cell[];
  sound: Tone.Player;
  name: string;
}

export default function Sequencer() {
  const [rows, setRows] = useState<Row[]>([]);
  const [bpm, setBpm] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [steps, setSteps] = useState(16);
  const [sequence, setSequence] = useState<Tone.Sequence | null>(null);
  const [part, setPart] = useState<Tone.Part | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const rowsRef = useRef<Row[]>([]);

  // Update the ref when rows change
  useEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

  // Initialize the sequencer with default sounds
  useEffect(() => {
    const initSequencer = async () => {
      try {
        console.log('Loading sounds...');
        setIsLoading(true);
        setError(null);

        // Create initial rows with different drum sounds
        const kickPlayer = new Tone.Player();
        const snarePlayer = new Tone.Player();
        const hatPlayer = new Tone.Player();

        // Load each sound individually with error handling
        try {
          console.log('Loading kick...');
          await kickPlayer.load('/sounds/kick_1.wav');
          console.log('Kick loaded');

          console.log('Loading snare...');
          await snarePlayer.load('/sounds/snare_1.wav');
          console.log('Snare loaded');

          console.log('Loading hi-hat...');
          await hatPlayer.load('/sounds/closed_hi_hat_1.wav');
          console.log('Hi-hat loaded');
        } catch (loadError) {
          console.error('Error loading sounds:', loadError);
          throw new Error(
            `Failed to load sounds: ${
              loadError instanceof Error ? loadError.message : 'Unknown error'
            }`
          );
        }

        console.log('All sounds loaded successfully');

        // Connect players to the destination
        kickPlayer.toDestination();
        snarePlayer.toDestination();
        hatPlayer.toDestination();

        const initialRows = [
          {
            sound: kickPlayer,
            cells: Array(steps).fill({ isActive: false }),
            name: 'Kick',
          },
          {
            sound: snarePlayer,
            cells: Array(steps).fill({ isActive: false }),
            name: 'Snare',
          },
          {
            sound: hatPlayer,
            cells: Array(steps).fill({ isActive: false }),
            name: 'Hi-Hat',
          },
        ];

        setRows(initialRows);
        rowsRef.current = initialRows;
        setIsLoading(false);
      } catch (error) {
        console.error('Error initializing sequencer:', error);
        setError(error instanceof Error ? error.message : 'Failed to initialize sequencer');
        setIsLoading(false);
      }
    };

    initSequencer();
  }, [steps]);

  const initializeAudio = async () => {
    if (isInitialized) return;

    try {
      console.log('Initializing audio context...');
      await Tone.start();
      console.log('Audio context initialized');
      setIsInitialized(true);
    } catch (error) {
      console.error('Error initializing audio:', error);
      setError('Failed to initialize audio');
    }
  };

  const toggleCell = (rowIndex: number, cellIndex: number) => {
    console.log('Toggling cell:', rowIndex, cellIndex);
    setRows((prevRows) => {
      const newRows = [...prevRows];
      const newCells = [...newRows[rowIndex].cells];
      newCells[cellIndex] = {
        ...newCells[cellIndex],
        isActive: !newCells[cellIndex].isActive,
      };
      newRows[rowIndex] = {
        ...newRows[rowIndex],
        cells: newCells,
      };
      console.log('New cell state:', newCells[cellIndex].isActive);
      return newRows;
    });
  };

  const startSequencer = async () => {
    if (isPlaying || isLoading) return;

    // Initialize audio on first play
    if (!isInitialized) {
      await initializeAudio();
    }

    setIsPlaying(true);
    Tone.Transport.bpm.value = bpm;
    Tone.Transport.loop = true;
    Tone.Transport.loopStart = 0;
    Tone.Transport.loopEnd = `${steps * 4}n`; // 4 steps per beat

    // Stop and dispose of any existing sequence or part
    if (sequence) {
      sequence.stop();
      sequence.dispose();
      setSequence(null);
    }
    if (part) {
      part.stop();
      part.dispose();
      setPart(null);
    }

    console.log('Creating new part...');

    // Create events for each active cell
    interface PartEvent {
      time: string;
      callback: (time: number) => void;
    }

    const events: PartEvent[] = [];
    for (let step = 0; step < steps; step++) {
      rowsRef.current.forEach((row) => {
        if (row.cells[step].isActive) {
          events.push({
            time: `${step * 4}n`,
            callback: (time) => {
              console.log(`Playing ${row.name} at step ${step}`);
              row.sound.start(time);
            },
          });
        }
      });
    }

    console.log(`Created ${events.length} events`);

    // Create a new part with the events
    const newPart = new Tone.Part((time, event) => {
      event.callback(time);
    }, events);

    // Set part properties
    newPart.loop = true;
    newPart.loopEnd = `${steps * 4}n`;

    // Store the part in state
    setPart(newPart);

    // Start the part and transport
    console.log('Starting part and transport...');
    newPart.start(0);
    Tone.Transport.start();
    console.log('Part and transport started');
  };

  const stopSequencer = () => {
    if (!isPlaying) return;

    console.log('Stopping sequencer...');
    setIsPlaying(false);
    if (sequence) {
      sequence.stop();
      sequence.dispose();
      setSequence(null);
    }
    if (part) {
      part.stop();
      part.dispose();
      setPart(null);
    }
    Tone.Transport.stop();
    Tone.Transport.cancel();
    console.log('Sequencer stopped');
  };

  const handleStepsChange = (newSteps: number) => {
    setSteps(newSteps);
    setRows((prevRows) =>
      prevRows.map((row) => ({
        ...row,
        cells: Array(newSteps).fill({ isActive: false }),
      }))
    );
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sequence) {
        sequence.stop();
        sequence.dispose();
      }
      Tone.Transport.stop();
    };
  }, [sequence]);

  if (isLoading) {
    return (
      <div className='p-4'>
        <div className='text-center'>
          <div className='text-lg mb-2'>Loading sounds...</div>
          <div className='animate-pulse'>Please wait...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='p-4'>
        <div className='text-center text-red-500'>
          <div className='text-lg mb-2'>Error loading sounds</div>
          <div>{error}</div>
          <button
            onClick={() => window.location.reload()}
            className='mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600'
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='p-4'>
      <div className='mb-4 flex gap-4 items-center'>
        <button
          onClick={isPlaying ? stopSequencer : startSequencer}
          className='px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600'
          disabled={isLoading}
        >
          {isPlaying ? 'Stop' : 'Play'}
        </button>
        {!isInitialized && (
          <div className='text-sm text-gray-600'>Click play to initialize audio</div>
        )}
        <div className='flex items-center gap-2'>
          <input
            type='number'
            value={bpm}
            onChange={(e) => setBpm(Number(e.target.value))}
            className='border rounded px-2 py-1 w-16'
            min='60'
            max='200'
          />
          <span>BPM</span>
        </div>
        <div className='flex items-center gap-2'>
          <input
            type='number'
            value={steps}
            onChange={(e) => handleStepsChange(Number(e.target.value))}
            className='border rounded px-2 py-1 w-16'
            min='4'
            max='32'
          />
          <span>Steps</span>
        </div>
      </div>

      <div className='grid gap-1'>
        {rows.map((row, rowIndex) => (
          <div key={rowIndex} className='flex gap-2 items-center'>
            <span className='w-20 text-sm font-medium'>{row.name}</span>
            <div className='flex gap-1'>
              {row.cells.map((cell, cellIndex) => (
                <button
                  key={cellIndex}
                  onClick={() => toggleCell(rowIndex, cellIndex)}
                  className={`w-8 h-8 rounded transition-colors duration-200 ${
                    cell.isActive
                      ? 'bg-green-500 hover:bg-green-600'
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                  style={{
                    boxShadow: cell.isActive ? '0 0 5px rgba(0,0,0,0.2)' : 'none',
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
