import React from 'react';
import { StepGridProps } from '../../types/ui';

const StepGrid = React.memo(({
  tracks,
  currentStep,
  isPlaying,
  onMouseDown,
  onMouseEnter,
}: StepGridProps) => {
  return (
    <div className='grid gap-4'>
      {tracks.map((track, trackIndex) => (
        <div key={`${track.name}-${trackIndex}`} className='flex items-center gap-4'>
          <div className='flex gap-1'>
            {track.steps.map((step, stepIndex) => (
              <button
                key={stepIndex}
                onMouseDown={() => onMouseDown(trackIndex, stepIndex)}
                onMouseEnter={() => onMouseEnter(trackIndex, stepIndex)}
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
                aria-label={`${track.name} step ${stepIndex + 1}, ${step.active ? 'active' : 'inactive'}`}
                aria-pressed={step.active}
                title={`Step ${stepIndex + 1} for ${track.name}`}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
});

StepGrid.displayName = 'StepGrid';

export default StepGrid;
