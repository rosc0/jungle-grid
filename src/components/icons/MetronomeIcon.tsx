import { IconProps } from '../../types/ui';

const MetronomeIcon = ({ className, size = 20 }: IconProps) => (
  <svg 
    width={size} 
    height={size} 
    viewBox='0 0 20 20' 
    fill='none' 
    stroke='currentColor' 
    strokeWidth='2'
    className={className}
  >
    <path d='M10 2 L15 18 H5 L10 2 Z' />
    <circle cx='10' cy='13' r='2' fill='currentColor' />
  </svg>
);

export default MetronomeIcon;
