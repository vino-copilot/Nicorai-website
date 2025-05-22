import React from 'react';
import { DynamicView } from '../services/api';
import DynamicScreen from './DynamicScreen';

interface DynamicContentRendererProps {
  view: DynamicView;
  onClose: () => void;
}

const DynamicContentRenderer: React.FC<DynamicContentRendererProps> = ({ view, onClose }) => {
  // Function to render content - now simplified since we only support dynamicScreen
  const renderContent = () => {
    try {
      return <DynamicScreen content={view.data} />;
    } catch (error) {
      console.warn(`Error rendering dynamic content:`, error);
      return (
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="bg-red-50 border-l-4 border-red-400 p-4 text-red-700 rounded-md">
            <p className="text-base">There was an error displaying this content.</p>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="w-full mb-4 max-h-full overflow-hidden relative max-h-[80vh] overflow-y-auto">
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-white hover:bg-blue-100 transition-colors shadow-md"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="black" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="overflow-auto text-gray-800">
        {renderContent()}
      </div>
    </div>
  );
};

export default DynamicContentRenderer; 