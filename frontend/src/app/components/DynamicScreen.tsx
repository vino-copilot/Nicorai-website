import React from 'react';
import DynamicResponseRenderer from './DynamicResponseRenderer';

interface DynamicScreenProps {
  content: {
    output: string;
    // Potentially other fields if the backend sends more under content for "view" type
  };
  // any other props DynamicScreen might need, e.g., from the main response object
}

const DynamicScreen: React.FC<DynamicScreenProps> = ({ content }) => {
  if (!content || !content.output) {
    return <div className="text-red-500 w-full h-full flex-1 flex items-center justify-center p-4 md:p-6">Error: No content to display for DynamicScreen.</div>;
  }

  return (
    <div className="dynamic-screen-container w-full flex-1 flex flex-col overflow-auto p-4 md:p-6">
      <DynamicResponseRenderer output={content.output} />
    </div>
  );
};

export default DynamicScreen; 