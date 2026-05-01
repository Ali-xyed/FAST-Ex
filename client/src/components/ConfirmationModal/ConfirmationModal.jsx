import { useEffect } from 'react';

function ConfirmationModal({ isOpen, onClose, onConfirm, title, message, confirmText = "OK", cancelText = "Cancel", type = "info" }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
  };

  const getIconAndColor = () => {
    switch (type) {
      case 'danger':
        return {
          bgColor: 'bg-red-100',
          iconColor: 'text-red-600',
          icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
        };
      case 'warning':
        return {
          bgColor: 'bg-yellow-100',
          iconColor: 'text-yellow-600',
          icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
        };
      default:
        return {
          bgColor: 'bg-blue-100',
          iconColor: 'text-blue-600',
          icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
        };
    }
  };

  const { bgColor, iconColor, icon } = getIconAndColor();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border-2 border-gray-200 animate-fadeIn">
        <div className={`flex items-center justify-center w-16 h-16 mx-auto mb-4 ${bgColor} rounded-full`}>
          <svg className={`w-8 h-8 ${iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={icon} />
          </svg>
        </div>
        
        <h2 className="text-2xl font-black text-center mb-3 text-gray-900">
          {title}
        </h2>
        
        <p className="text-center text-gray-600 mb-6 leading-relaxed">
          {message}
        </p>
        
        <div className="flex gap-3">
          {onConfirm && (
            <button
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold text-sm uppercase tracking-wider hover:bg-gray-200 transition-all"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={handleConfirm}
            className={`flex-1 py-3 rounded-xl font-bold text-sm uppercase tracking-wider transition-all ${
              type === 'danger' 
                ? 'bg-red-600 text-white hover:bg-red-700' 
                : 'bg-black text-white hover:bg-gray-800'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmationModal;
