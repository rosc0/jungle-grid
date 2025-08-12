import React from 'react';
import { TrackControlsProps } from '../../types/ui';
import ResetIcon from '../icons/ResetIcon';
import TrashIcon from '../icons/TrashIcon';
import Knob from '../ui/Knob';

const TrackControls = React.memo(({
  track,
  isEditing,
  editingName,
  onToggleMute,
  onToggleSolo,
  onDuplicate,
  onDelete,
  onPitchChange,
  onVelocityChange,
  onColorChange,
  onStartEditing,
  onFinishEditing,
  onNameChange,
}: TrackControlsProps) => {
  return (
    <div className='flex items-center gap-4'>
      <input
        type='color'
        value={track.color}
        onChange={(e) => onColorChange(e.target.value)}
        className='w-9 h-10 p-0 border-0 border-none outline-none cursor-pointer rounded-md focus:outline-none'
        title='Choose track color'
        style={{ background: 'none', border: 'none' }}
      />
      {isEditing ? (
        <input
          type='text'
          value={editingName}
          onChange={(e) => onNameChange(e.target.value)}
          onBlur={onFinishEditing}
          onKeyDown={(e) => e.key === 'Enter' && onFinishEditing()}
          className='w-24 px-2 py-1 bg-gray-800 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm'
          autoFocus
        />
      ) : (
        <div
          className='w-24 font-bold cursor-pointer hover:text-blue-400'
          onClick={onStartEditing}
          style={{ color: track.color }}
        >
          {track.name}
        </div>
      )}
      <div className='flex items-center gap-2'>
        <button
          onClick={onDuplicate}
          className='w-8 h-8 flex items-center justify-center bg-gray-700 rounded hover:bg-gray-600 transition-colors'
          title='Duplicate'
        >
          <ResetIcon />
        </button>
        <button
          onClick={onDelete}
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
          onClick={onToggleMute}
          className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${
            track.muted ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-700 hover:bg-gray-600'
          }`}
          title='Mute'
        >
          M
        </button>
        <button
          onClick={onToggleSolo}
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
          onChange={onPitchChange}
          label='Pitch'
        />
        <Knob
          value={track.velocity}
          min={-18}
          max={18}
          onChange={onVelocityChange}
          label='Velocity'
        />
      </div>
    </div>
  );
});

TrackControls.displayName = 'TrackControls';

export default TrackControls;
