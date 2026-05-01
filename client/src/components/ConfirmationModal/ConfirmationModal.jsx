import { useEffect } from 'react';

function ConfirmationModal({ isOpen, onClose, title, message }) {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border-2 border-gray-200">
        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full">
          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        
        <h2 className="text-2xl font-black text-center mb-3 text-gray-900">
          {title}
        </h2>
        
        <p className="text-center text-gray-600 mb-6 leading-relaxed">
          {message}
        </p>
        
        <button
          onClick={onClose}
          className="w-full bg-black text-white py-3 rounded-xl font-bold text-sm uppercase tracking-wider hover:bg-gray-800 transition-all"
        >
          OK
        </button>
      </div>
    </div>
  );
}

export default ConfirmationModal;
