import { IconProps } from '../../types/ui';

const ExportIcon = ({ className, size = 20 }: IconProps) => (
  <svg 
    width={size} 
    height={size} 
    viewBox='0 0 20 20' 
    fill='none' 
    stroke='currentColor' 
    strokeWidth='2'
    className={className}
  >
    <path d='M10 3v10' />
    <path d='M5 10l5 5 5-5' />
    <rect x='3' y='17' width='14' height='2' fill='currentColor' />
  </svg>
);

export default ExportIcon;
