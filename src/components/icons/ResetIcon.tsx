import { IconProps } from '../../types/ui';

const ResetIcon = ({ className, size = 20 }: IconProps) => (
  <svg 
    width={size} 
    height={size} 
    viewBox='0 0 20 20' 
    fill='none' 
    stroke='currentColor' 
    strokeWidth='2'
    className={className}
  >
    <path d='M4 4v5h5' />
    <path d='M19 11a8 8 0 1 1-7-7' />
  </svg>
);

export default ResetIcon;
