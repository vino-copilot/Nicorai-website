// The file is responsible for converting and rendering HTML string output from the backend into proper React components.

import React from 'react';

interface DynamicResponseRendererProps {
  output: string;
}

const DynamicResponseRenderer: React.FC<DynamicResponseRendererProps> = ({ output }) => {
  // Utility function to convert CSS property name to React style property
  const toCamelCase = (str: string): string => {
    return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
  };

  // Utility function to validate and format style value
  const formatStyleValue = (property: string, value: string): string | number => {
    value = value.trim(); // Value from new regex is already unquoted

    if (/^-?\d*\.?\d+(?:px|em|rem|%|vh|vw)?$/.test(value)) {
      if (/^\d+$/.test(value)) {
        const needsUnit = [
          'width', 'height', 'margin', 'padding', 'top', 'right', 'bottom', 'left',
          'fontSize', 'lineHeight', 'borderRadius', 'gap', 'minWidth', 'maxWidth'
        ].some(prop => property.toLowerCase().includes(prop.toLowerCase()));
        // lineHeight is often unitless, but if it's in needsUnit list, it gets px.
        // Let's refine: if property is exactly 'lineHeight' and value is numeric, it should be unitless.
        if (property === 'lineHeight') return Number(value);
        return needsUnit ? `${value}px` : Number(value);
      }
      return value;
    }
    if (value.startsWith('#') && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value)) {
      return value;
    }
    if (/^rgba?\([\d\s,%.]+\)$/.test(value)) {
      return value;
    }
    const specialValues = ['auto', 'none', 'inherit', 'initial', 'unset', 'center', 'flex', 'block', 'relative', 'absolute', 'bold', 'normal'];
    if (specialValues.includes(value.toLowerCase())) {
      return value.toLowerCase();
    }
    // For composite values like "0 auto" or font families "Arial, sans-serif"
    // these are typically passed as a single string value from backend, so we trust them.
    if (value.includes(' ') || value.includes(',')) {
        // If it's a known property that takes complex strings, pass it.
        // Otherwise, this might indicate an issue or a value we don't specifically handle.
        // For now, pass complex strings through.
        return value;
    }
    return value; // Default pass-through for unhandled cases
  };

  // Parse the output string to extract style objects and content
  const parseStyleString = (styleString: string): React.CSSProperties => {
    try {
      // 1. Correctly extract the content inside {{ and }}
      const innerContent = styleString.replace(/^{{|}}$/g, '').trim();
      if (!innerContent) return {};

      const styleObject: { [key: string]: string | number } = {};

      // 2. Robustly parse key-value pairs.
      // Regex for: propertyName: "propertyValue"
      // It handles escaped quotes within the value.
      const propertyRegex = /([a-zA-Z$_][a-zA-Z0-9$_]*)\s*:\s*"((?:\\.|[^"\\])*)"/g;
      let match;

      while ((match = propertyRegex.exec(innerContent)) !== null) {
        const rawProperty = match[1]; // e.g., backgroundColor
        // match[2] is the content *inside* the quotes, with escaped chars still escaped (e.g. \" if backend sent that)
        // We need to unescape common sequences like \"
        const rawValue = match[2].replace(/\\"/g, '"').replace(/\\\\/g, '\\');

        const reactProperty = toCamelCase(rawProperty); // Handles if backend ever sends kebab-case
        const formattedValue = formatStyleValue(reactProperty, rawValue);

        if (formattedValue !== undefined && formattedValue !== null && formattedValue !== '') {
          styleObject[reactProperty] = formattedValue;
        }
      }
      return styleObject as React.CSSProperties;
    } catch (error) {
      console.error('Error parsing style string:', styleString, error);
      return {};
    }
  };

  // Convert the string output to JSX
  const renderContent = () => {
    try {
      const styleStore: { [key: string]: string } = {};
      let styleIdCounter = 0;

      // Corrected regex to find style={{...}} attributes
      const processedOutput = output.replace(/style=({{[^}}]*}})/g, (match, styleContent) => {
        const id = `styleplaceholder-${styleIdCounter++}`;
        styleStore[id] = styleContent; // Store the original {{...}} content
        return `data-style-id="${id}"`;
      });

      const container = document.createElement('div');
      container.innerHTML = processedOutput; // Use processed HTML

      const convertNodeToReact = (node: Node): React.ReactNode => {
        if (node.nodeType === Node.TEXT_NODE) {
          return node.textContent;
        }

        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as Element;
          const tagName = element.tagName.toLowerCase();

          // Skip body and html tags
          if (tagName === 'body' || tagName === 'html') {
            return Array.from(element.childNodes).map((child, index) => (
              <React.Fragment key={index}>{convertNodeToReact(child)}</React.Fragment>
            ));
          }

          const attributes: { [key: string]: any } = {};
          
          // Process attributes
          element.getAttributeNames().forEach(name => {
            let value = element.getAttribute(name);
            if (value === null) return; // Skip null attributes

            if (name === 'data-style-id') {
              const originalStyleString = styleStore[value]; // value is the id, e.g., "styleplaceholder-0"
              if (originalStyleString) {
                const styles = parseStyleString(originalStyleString);
                if (Object.keys(styles).length > 0) {
                  attributes.style = styles;
                } else {
                  // console.warn("No styles parsed for placeholder:", value, "Original:", originalStyleString);
                }
              }
            } else if (name === 'class') {
              attributes.className = value;
            } else {
              // Convert attribute names to React format
              const reactAttrName = name === 'classname' ? 'className' : name;
              // Only add attribute if it's not the placeholder we handled
              if(name !== 'style') { // also explicitly ignore original style attributes if any somehow survived
                 attributes[reactAttrName] = value;
              }
            }
          });

          const children = Array.from(element.childNodes).map((child, index) => (
            <React.Fragment key={index}>{convertNodeToReact(child)}</React.Fragment>
          ));

          return React.createElement(
            tagName,
            { 
              key: `${tagName}-${Math.random().toString(36).slice(2)}`,
              ...attributes 
            },
            children
          );
        }

        return null;
      };

      return Array.from(container.childNodes).map((node, index) => (
        <React.Fragment key={index}>{convertNodeToReact(node)}</React.Fragment>
      ));
    } catch (error) {
      console.error('Error rendering dynamic content:', error);
      return <div className="text-red-500">Error rendering content</div>;
    }
  };

  return (
    <div className="dynamic-response">
      {renderContent()}
    </div>
  );
};

export default DynamicResponseRenderer; 