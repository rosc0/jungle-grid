import { ConfirmationModalProps } from '../../types/ui';

const ConfirmationModal = ({
  isOpen,
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  isDestructive = false,
}: ConfirmationModalProps) => {
  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50'>
      <div className='bg-gray-800 p-6 rounded-xl shadow-lg max-w-sm w-full text-white'>
        <h2 className='text-lg font-bold mb-2'>{title}</h2>
        <div className='mb-4 text-sm'>
          <div className='mb-2'>This will:</div>
          <ul className='list-disc ml-6 mb-4'>
            <li>Reset all track colors to their original values</li>
            <li>Reset all pitch and velocity to 0</li>
            <li>Remove all duplicated tracks</li>
            <li>Clear all steps (cells)</li>
          </ul>
          <div className={`font-bold mb-4 ${isDestructive ? 'text-red-400' : 'text-yellow-400'}`}>
            {message}
          </div>
        </div>
        <div className='flex justify-end gap-3 mt-2'>
          <button
            onClick={onCancel}
            className='px-4 py-1.5 bg-gray-600 rounded-md hover:bg-gray-700 mr-2'
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-1.5 rounded-md ${
              isDestructive
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
