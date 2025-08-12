'use client';

import { useRef, useCallback } from 'react';
import { KnobProps } from '../../types/ui';

const Knob = ({ value, min, max, onChange, label }: KnobProps) => {
  const knobRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const startValue = useRef(0);
  const dragStateRef = useRef(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    dragStateRef.current = true;
    startY.current = e.clientY;
    startValue.current = value;

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStateRef.current) return;
      
      e.preventDefault();
      const deltaY = startY.current - e.clientY;
      const valueDiff = (deltaY / 100) * (max - min);
      const newValue = Math.min(max, Math.max(min, startValue.current + valueDiff));
      onChange(Math.round(newValue * 10) / 10);
    };

    const stopDragging = () => {
      if (dragStateRef.current) {
        dragStateRef.current = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', stopDragging);
        document.removeEventListener('mouseleave', stopDragging);
        window.removeEventListener('blur', stopDragging);
        document.removeEventListener('visibilitychange', stopDragging);
      }
    };

    // Add event listeners immediately
    document.addEventListener('mousemove', handleMouseMove, { passive: false });
    document.addEventListener('mouseup', stopDragging);
    document.addEventListener('mouseleave', stopDragging);
    window.addEventListener('blur', stopDragging);
    document.addEventListener('visibilitychange', stopDragging);
  }, [value, max, min, onChange]);

  const handleDoubleClick = useCallback(() => {
    onChange(0);
  }, [onChange]);

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

export default Knob;
