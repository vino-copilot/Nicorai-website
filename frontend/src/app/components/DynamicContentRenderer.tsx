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
    // Unwrap nested data if present
    const chartData = data.data || data;
    
    // Extract values from datasets if present
    let values: number[] = [];
    let labels: string[] = [];
    
    if (chartData.datasets && chartData.datasets.length > 0) {
      values = chartData.datasets[0].data || [];
      labels = chartData.labels || [];
    } else {
      values = chartData.values || [];
      labels = chartData.labels || [];
    }
    
    const title = chartData.title || 'Chart';
    const chartType = chartData.chartType || 'bar';

    // Validate data
    if (!values.length || !labels.length) {
      return (
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="text-xl font-semibold mb-4">{title}</h3>
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 text-blue-700">
            <p className="text-sm">No data available to display in the chart.</p>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h3 className="text-xl font-semibold mb-4">{title}</h3>
        <div className="h-64 bg-blue-50 rounded border border-blue-200 p-4 flex items-center justify-center">
          <div className="w-full h-full relative">
            <div className="absolute inset-0 flex items-end justify-around">
              {values.map((value: number, index: number) => (
                <div
                  key={index}
                  className="bg-blue-600 w-10 transition-all duration-500"
                  style={{ height: `${(value / Math.max(...values)) * 100}%` }}
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
        <div className="mt-4 flex flex-wrap justify-center gap-4">
          {labels.map((label: string, index: number) => (
            <div key={index} className="text-sm text-gray-700 text-center max-w-[150px]">
              {label}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Card Renderer
  const renderCard = (data: any) => {
    // Unwrap nested data if present (for backend responses with data.data)
    const cardData = data.data || data;
    const cards = cardData.cards || [cardData];

    return (
      <div className="bg-white rounded-lg p-6 shadow-lg max-w-4xl w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card: any, index: number) => (
            <div key={index} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex flex-col h-full">
                <h3 className="text-xl font-semibold mb-3 text-gray-900">{card.title}</h3>
                <p className="text-gray-700 mb-4 flex-grow">{card.content}</p>
                {card.actions && (
                  <div className="flex space-x-2 mt-auto pt-4">
                    {card.actions.map((action: any, actionIndex: number) => (
                      <a
                        key={actionIndex}
                        href={action.url}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        {action.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Table Renderer - Enhanced for Day 6 (Flexible data handling)
  const renderTable = (data: any) => {
    // Unwrap nested data if present (for backend responses with data.data)
    if (data && data.data && (data.data.columns || data.data.rows)) {
      data = data.data;
    }
    // Support different data formats from backend
    const title = data.title || 'Data Table';
    const description = data.description || '';

    // Support various header/column naming conventions
    const headers: string[] = data.headers || data.columns || [];

    // Support various row data formats
    let rows: any[][] = [];

    if (Array.isArray(data.rows)) {
      // Standard rows format
      rows = data.rows;
    } else if (Array.isArray(data.data)) {
      // Data array format
      rows = data.data;
    } else if (data.items && Array.isArray(data.items)) {
      // Items format (convert objects to arrays if needed)
      rows = data.items.map((item: any) => {
        if (Array.isArray(item)) return item;

        // If items are objects, extract values based on headers
        if (typeof item === 'object' && headers.length > 0) {
          return headers.map(header => {
            // Try to match header with an object property (case insensitive)
            const key = Object.keys(item).find(k =>
              k.toLowerCase() === header.toLowerCase()
            );
            return key ? item[key] : '';
          });
        }

        return [item]; // Fallback for primitive values
      });
    }

    // Validate data structure
    if (headers.length === 0 || rows.length === 0) {
      return (
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="text-xl font-semibold mb-4">{title}</h3>
          {description && <p className="text-gray-600 mb-4">{description}</p>}
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 text-blue-700">
            <p className="text-sm">No data available to display in the table.</p>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-6 pb-4 border-b border-gray-100">
          <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
          {description && (
            <p className="text-sm text-gray-500 mt-1">{description}</p>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-blue-50">
              <tr>
                {headers.map((header: string, index: number) => (
                  <th
                    key={index}
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rows.map((row: any[], rowIndex: number) => (
                <tr
                  key={rowIndex}
                  className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-blue-50'}
                >
                  {row.map((cell, cellIndex) => (
                    <td
                      key={cellIndex}
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-700"
                    >
                      {typeof cell === 'object' ? JSON.stringify(cell) : cell?.toString() || ''}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination or additional controls could go here */}
        {data.footer && (
          <div className="px-6 py-4 border-t border-gray-100 bg-blue-50 text-sm text-gray-500">
            {data.footer}
          </div>
        )}
      </div>
    );
  };

  // Custom Content Renderer
  const renderCustom = (data: any) => {
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h3 className="text-xl font-semibold mb-4">{data.title}</h3>
        <div
          className="prose max-w-none text-gray-700"
          dangerouslySetInnerHTML={{ __html: data.content }}
        />
      </div>
    );
  };

  return (
    <div className="rounded-2xl shadow-sm w-full mb-4 overflow-hidden bg-blue-100">
      <div className="flex justify-between items-center p-4 border-b border-blue-200">
        <h2 className="text-lg font-semibold text-gray-800">
          {view.data.title || 'Dynamic Content'}
        </h2>
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-blue-200 hover:bg-blue-300 transition-colors"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="black" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="p-4 max-h-96 overflow-auto text-gray-800">
        {renderContent()}
      </div>
    </div>
  );
};

export default DynamicContentRenderer; 