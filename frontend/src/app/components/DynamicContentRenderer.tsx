import React from 'react';
import { DynamicView } from '../services/api';

interface DynamicContentRendererProps {
  view: DynamicView;
  onClose: () => void;
}

const DynamicContentRenderer: React.FC<DynamicContentRendererProps> = ({ view, onClose }) => {
  // Function to render different view types
  const renderContent = () => {
    switch (view.type) {
      case 'chart':
        return renderChart(view.data);
      case 'card':
        return renderCard(view.data);
      case 'table':
        return renderTable(view.data);
      case 'custom':
        return renderCustom(view.data);
      default:
        return <div>Unsupported view type</div>;
    }
  };

  // Chart Renderer
  const renderChart = (data: any) => {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-xl font-semibold mb-4">{data.title}</h3>
        <div className="h-64 bg-gray-50 rounded border border-gray-200 p-4 flex items-center justify-center">
          {/* In a real app, you'd use a chart library like Chart.js, Recharts, etc. */}
          <div className="w-full h-full relative">
            <div className="absolute inset-0 flex items-end justify-around">
              {data.values.map((value: number, index: number) => (
                <div 
                  key={index} 
                  className="bg-blue-500 w-10 transition-all duration-500"
                  style={{ height: `${(value / Math.max(...data.values)) * 100}%` }}
                >
                  <div className="h-full w-full relative">
                    <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-sm font-medium text-gray-700">
                      {value}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-4 flex justify-center space-x-4">
          {data.labels.map((label: string, index: number) => (
            <div key={index} className="text-sm text-gray-700">
              {label}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Card Renderer
  const renderCard = (data: any) => {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-xl font-semibold mb-3">{data.title}</h3>
        <p className="text-gray-700 mb-4">{data.content}</p>
        {data.actions && (
          <div className="flex space-x-2">
            {data.actions.map((action: any, index: number) => (
              <a
                key={index}
                href={action.url}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {action.label}
              </a>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Table Renderer
  const renderTable = (data: any) => {
    if (!data.headers || !data.rows) {
      return <div>Invalid table data</div>;
    }

    return (
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <h3 className="text-xl font-semibold p-6 pb-4">{data.title}</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {data.headers.map((header: string, index: number) => (
                  <th
                    key={index}
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.rows.map((row: any[], rowIndex: number) => (
                <tr key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Custom Content Renderer
  const renderCustom = (data: any) => {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-xl font-semibold mb-4">{data.title}</h3>
        <div 
          className="prose max-w-none text-gray-700" 
          dangerouslySetInnerHTML={{ __html: data.content }}
        />
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-auto">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold">
            {view.data.title || 'Dynamic Content'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-4">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default DynamicContentRenderer; 