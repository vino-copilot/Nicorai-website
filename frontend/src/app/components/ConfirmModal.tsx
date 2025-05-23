import React from 'react';
 
interface ConfirmModalProps {
  open: boolean;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}
 
const ConfirmModal: React.FC<ConfirmModalProps> = ({
  open,
  title = 'Are you sure?',
  description = 'Do you really want to proceed with this action?',
  confirmText = 'Yes',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
}) => {
  if (!open) return null;
 
  return (
    <div className="fixed inset-0 z-80 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-11/12 sm:max-w-xs md:max-w-sm lg:max-w-md p-4 sm:p-6 mx-2 flex flex-col items-center border border-blue-100 animate-pop-in">
        <div className="flex flex-col items-center mb-4">
          {/* Warning Icon */}
          <svg className="w-12 h-12 text-red-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" />
          </svg>
          <h2 className="text-xl font-bold text-gray-900 mb-1 text-center" style={{ fontFamily: 'Arial, sans-serif' }}>{title}</h2>
        </div>
        <p className="text-gray-700 mb-6 text-center text-base" style={{ fontFamily: 'Arial, sans-serif' }}>{description}</p>
        <div className="flex w-full justify-center gap-3 flex-wrap">
          <button
            onClick={onCancel}
            className="px-5 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium transition-colors border border-gray-200"
            style={{ fontFamily: 'Arial, sans-serif' }}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 font-medium transition-colors border border-red-500 shadow-sm"
            style={{ fontFamily: 'Arial, sans-serif' }}
          >
            {confirmText}
          </button>
        </div>
      </div>
      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease;
        }
        @keyframes pop-in {
          0% { transform: scale(0.95); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-pop-in {
          animation: pop-in 0.2s cubic-bezier(0.4,0,0.2,1);
        }
      `}</style>
    </div>
  );
};
 
export default ConfirmModal;