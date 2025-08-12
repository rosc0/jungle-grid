import { TransportControlsProps } from '../../types/ui';
import PlayIcon from '../icons/PlayIcon';
import StopIcon from '../icons/StopIcon';
import MetronomeIcon from '../icons/MetronomeIcon';
import ResetIcon from '../icons/ResetIcon';
import TrashIcon from '../icons/TrashIcon';
import ExportIcon from '../icons/ExportIcon';

const TransportControls = ({
  isPlaying,
  metronomeEnabled,
  bpm,
  steps,
  onPlayStop,
  onToggleMetronome,
  onBpmChange,
  onStepsChange,
  onClearCells,
  onClearEverything,
  onExportMIDI,
}: TransportControlsProps) => {
  return (
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
            onChange={(e) => onBpmChange(Number(e.target.value))}
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
            onChange={(e) => onStepsChange(Number(e.target.value))}
            className='w-20 px-2 py-1 bg-gray-800 rounded focus:outline-none focus:ring-2 focus:ring-blue-500'
            min='4'
            max='64'
          />
        </div>
      </div>

      {/* Buttons right */}
      <div className='flex items-center gap-4 justify-end'>
        <button
          onClick={onPlayStop}
          className='min-h-[48px] px-4 bg-blue-500 rounded-md hover:bg-blue-600 transition-colors flex items-center justify-center text-center gap-2'
          style={{ minWidth: '48px' }}
          title={isPlaying ? 'Stop' : 'Play'}
        >
          {isPlaying ? <StopIcon /> : <PlayIcon />}
        </button>
        <button
          onClick={onToggleMetronome}
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
          onClick={onClearCells}
          className='min-h-[48px] px-4 bg-yellow-500 rounded-md hover:bg-yellow-600 transition-colors flex items-center justify-center text-center gap-2'
          title='Clear Cells'
        >
          <ResetIcon />
        </button>
        <button
          onClick={onClearEverything}
          className='min-h-[48px] px-4 bg-red-500 rounded-md hover:bg-red-600 transition-colors flex items-center justify-center text-center gap-2'
          title='Clear Everything'
        >
          <TrashIcon />
        </button>
        <button
          onClick={onExportMIDI}
          className='min-h-[48px] px-4 bg-purple-500 rounded-md hover:bg-purple-600 transition-colors flex items-center justify-center text-center gap-2'
          title='Export MIDI'
        >
          <ExportIcon />
        </button>
      </div>
    </div>
  );
};

export default TransportControls;
