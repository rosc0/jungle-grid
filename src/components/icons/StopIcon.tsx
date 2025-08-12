import { IconProps } from '../../types/ui';

const StopIcon = ({ className, size = 20 }: IconProps) => (
  <svg 
    width={size} 
    height={size} 
    viewBox='0 0 20 20' 
    fill='none' 
    stroke='currentColor' 
    strokeWidth='2'
    className={className}
  >
    <rect x='5' y='5' width='10' height='10' fill='currentColor' />
  </svg>
);

export default StopIcon;
