import React, { useState, useRef } from 'react';

// Simple draggable component without external libraries
function DraggableComponent({ id, content, onDragStart }) {
  const handleDragStart = (e) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ id, content, type: content.toLowerCase() }));
    onDragStart && onDragStart();
  };

  return (
    <div 
      draggable="true"
      onDragStart={handleDragStart}
      style={{
        padding: '10px',
        marginBottom: '10px',
        backgroundColor: '#e0e0e0',
        border: '1px solid #ccc',
        borderRadius: '5px',
        textAlign: 'center',
        cursor: 'grab',
        userSelect: 'none'
      }}
    >
      {content}
    </div>
  );
}

export default function App() {
  const [droppedComponents, setDroppedComponents] = useState([]);
  const [codeOutput, setCodeOutput] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const canvasRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault(); // This is crucial for allowing drop
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    // Only set to false if we're actually leaving the canvas
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      const canvasRect = canvasRef.current.getBoundingClientRect();
      
      // Calculate drop position relative to canvas
      const dropX = Math.max(0, Math.min(e.clientX - canvasRect.left - 50, canvasRect.width - 100));
      const dropY = Math.max(0, Math.min(e.clientY - canvasRect.top - 25, canvasRect.height - 50));

      const newComponent = {
        id: Date.now(),
        type: data.type,
        content: data.content,
        position: { x: dropX, y: dropY },
      };

      setDroppedComponents(prev => [...prev, newComponent]);
      console.log('Component dropped:', newComponent); // Debug log
    } catch (error) {
      console.error('Error handling drop:', error);
    }
  };

  const handleGenerateCode = () => {
    if (droppedComponents.length === 0) {
      alert("Please drag a component onto the canvas first!");
      return;
    }
    
    const htmlComponents = droppedComponents.map(comp => {
      switch(comp.type) {
        case 'heading':
          return `<h1>${comp.content}</h1>`;
        case 'body':
          return `<p>${comp.content} text goes here...</p>`;
        case 'button':
          return `<button>${comp.content}</button>`;
        default:
          return `<div>${comp.content}</div>`;
      }
    }).join('\n  ');

    const fullCode = `<!DOCTYPE html>
<html>
<head>
  <title>Generated Page</title>
</head>
<body>
  ${htmlComponents}
</body>
</html>`;

    setCodeOutput(fullCode);
  };

  const handleClearCanvas = () => {
    setDroppedComponents([]);
    setCodeOutput('');
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <header style={{
        backgroundColor: '#2c3e50',
        color: 'white',
        padding: '20px',
        textAlign: 'center',
        marginBottom: '0'
      }}>
        <h1 style={{ 
          margin: '0', 
          fontSize: '2.5rem',
          fontWeight: '700',
          letterSpacing: '1px'
        }}>
          BuildAI
        </h1>
        <p style={{ 
          margin: '5px 0 0 0', 
          fontSize: '1rem',
          opacity: '0.9'
        }}>
          Visual Website Builder
        </p>
      </header>

      <div style={{ 
        display: 'flex', 
        gap: '20px', 
        padding: '20px', 
        boxSizing: 'border-box', 
        height: 'calc(100vh - 120px)'
      }}>
        {/* Sidebar */}
        <div style={{ width: '200px', flexShrink: 0 }}>
          <h3 style={{ margin: '0 0 15px 0' }}>Components</h3>
          <DraggableComponent id="heading-01" content="Heading" />
          <DraggableComponent id="body-01" content="Body" />
          <DraggableComponent id="button-01" content="Button" />
          
          <button 
            onClick={handleGenerateCode} 
            style={{ 
              marginTop: '20px', 
              padding: '10px', 
              width: '100%', 
              boxSizing: 'border-box',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Generate Code
          </button>

          <button 
            onClick={handleClearCanvas} 
            style={{ 
              marginTop: '10px', 
              padding: '10px', 
              width: '100%', 
              boxSizing: 'border-box',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Clear Canvas
          </button>
          
          {/* Code Output */}
          {codeOutput && (
            <div style={{ marginTop: '20px' }}>
              <h4>Generated Code:</h4>
              <pre style={{ 
                fontSize: '10px', 
                backgroundColor: '#01050aff', 
                padding: '10px', 
                overflow: 'auto', 
                maxHeight: '300px',
                border: '1px solid #dee2e6',
                borderRadius: '4px',
                whiteSpace: 'pre-wrap'
              }}>
                {codeOutput}
              </pre>
            </div>
          )}
        </div>

        {/* Canvas */}
        <div 
          ref={canvasRef}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={{ 
            width: '1200px',
            height: '800px',
            border: isDragOver ? '3px dashed #28a745' : '2px dashed #999', 
            backgroundColor: isDragOver ? '#f8fff8' : '#f9f9f9',
            position: 'relative',
            transition: 'all 0.2s ease',
            borderRadius: '8px'
          }}
        >
          {droppedComponents.length === 0 && (
            <div 
              style={{
                textAlign: 'center', 
                color: '#6c757d', 
                padding: '20px', 
                position: 'absolute', 
                top: '50%', 
                left: '50%', 
                transform: 'translate(-50%, -50%)', 
                pointerEvents: 'none',
                fontSize: '18px'
              }}
            >
              <div>📋 Drop Zone</div>
              <div style={{ fontSize: '14px', marginTop: '10px' }}>
                Drag components from the sidebar here
              </div>
            </div>
          )}

          {/* Render dropped components */}
          {droppedComponents.map((comp) => (
            <div 
              key={comp.id} 
              style={{ 
                position: 'absolute', 
                left: comp.position.x, 
                top: comp.position.y, 
                padding: '12px 16px', 
                border: '2px solid #333', 
                backgroundColor: 'white',
                borderRadius: '6px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                cursor: 'default',
                fontWeight: '500'
              }}
            >
              {comp.content}
              <div style={{ 
                fontSize: '10px', 
                color: '#666', 
                marginTop: '4px' 
              }}>
                {comp.type}
              </div>
            </div>
          ))}

          {/* Debug info */}
          {droppedComponents.length > 0 && (
            <div style={{
              position: 'absolute',
              bottom: '10px',
              right: '10px',
              backgroundColor: 'rgba(0,0,0,0.7)',
              color: 'white',
              padding: '8px',
              borderRadius: '4px',
              fontSize: '12px'
            }}>
              Components on canvas: {droppedComponents.length}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
