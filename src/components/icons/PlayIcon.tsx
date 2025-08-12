import { IconProps } from '../../types/ui';

const PlayIcon = ({ className, size = 20 }: IconProps) => (
  <svg 
    width={size} 
    height={size} 
    viewBox='0 0 20 20' 
    fill='none' 
    stroke='currentColor' 
    strokeWidth='2'
    className={className}
  >
    <polygon points='5,3 19,10 5,17' fill='currentColor' />
  </svg>
);

export default PlayIcon;
