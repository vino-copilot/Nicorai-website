import React, { useRef, useEffect } from 'react';
import WhatWeDoView from './WhatWeDoView';
import WhatWeveDoneView from './WhatWeveDoneView';
import ConnectView from './ConnectView';
import AboutUsView from './AboutUsView';
import ResearchBlogView from './ResearchBlogView';

interface ViewProps {
  viewId: string;
  onClose: () => void;
  dynamicViewContent?: unknown;
}

const DynamicViewRenderer: React.FC<ViewProps> = ({ viewId, onClose, dynamicViewContent }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [viewId]);

  const renderContent = () => {
    if (viewId === 'dynamic-view' && dynamicViewContent) {
      return (
        <div className="min-h-screen bg-white flex items-center justify-center p-1">
          <div className="w-full max-w-4xl">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-2xl font-bold mb-4">Dynamic Content</h2>
              <p className="text-gray-600">
                {typeof dynamicViewContent === 'object'
                  ? JSON.stringify(dynamicViewContent, null, 2)
                  : String(dynamicViewContent)}
              </p>
            </div>
          </div>
        </div>
      );
    }
    switch (viewId) {
      case 'what-we-do':
        return <WhatWeDoView />;
      case 'what-weve-done':
        return <WhatWeveDoneView/>;
      case 'connect':
        return <ConnectView />;
      case 'us':
        return <AboutUsView />;
      case 'research-blog':
        return <ResearchBlogView />;
      default:
        return (
          <div className="flex items-center justify-center h-full">
            <p className="text-lg text-gray-700">Select a section from the sidebar to view content</p>
          </div>
        );
    }
  };

  return (
    <div ref={containerRef} className="relative flex-1 h-full overflow-auto bg-white pb-20 z-10">
      {viewId !== 'dynamic-view' && (
        <div className="sticky top-0 right-0 p-4 flex justify-end z-50 bg-transparent">
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 bg-white rounded-full shadow-lg"
            aria-label="Close view"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
      {renderContent()}
    </div>
  );
};

export default DynamicViewRenderer;