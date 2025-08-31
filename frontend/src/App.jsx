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
        padding: '12px',
        marginBottom: '8px',
        backgroundColor: '#e3f2fd',
        border: '1px solid #90caf9',
        borderRadius: '8px',
        textAlign: 'center',
        cursor: 'grab',
        userSelect: 'none',
        transition: 'all 0.2s ease',
        fontWeight: '500'
      }}
      onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
      onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
    >
      {content}
    </div>
  );
}

export default function App() {
  const [droppedComponents, setDroppedComponents] = useState([]);
  const [codeOutput, setCodeOutput] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [currentSection, setCurrentSection] = useState('header'); // header, body, footer
  const [showComponentSelector, setShowComponentSelector] = useState(false);
  const [draggedComponent, setDraggedComponent] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const canvasRef = useRef(null);

  // Component categories based on current section
  const getAvailableComponents = () => {
    switch(currentSection) {
      case 'header':
        return [
          { id: 'site-title', content: 'Site Title', type: 'site-title' },
          { id: 'navigation', content: 'Navigation Menu', type: 'navigation' },
          { id: 'logo', content: 'Logo', type: 'logo' },
          { id: 'search-bar', content: 'Search Bar', type: 'search-bar' }
        ];
      case 'body':
        return [
          { id: 'heading', content: 'Heading', type: 'heading' },
          { id: 'paragraph', content: 'Paragraph', type: 'paragraph' },
          { id: 'button', content: 'Button', type: 'button' },
          { id: 'image', content: 'Image', type: 'image' },
          { id: 'card', content: 'Card', type: 'card' },
          { id: 'list', content: 'List', type: 'list' }
        ];
      case 'footer':
        return [
          { id: 'copyright', content: 'Copyright', type: 'copyright' },
          { id: 'social-links', content: 'Social Links', type: 'social-links' },
          { id: 'contact-info', content: 'Contact Info', type: 'contact-info' },
          { id: 'newsletter', content: 'Newsletter', type: 'newsletter' }
        ];
      default:
        return [];
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    // Only show drag over effect if we're not dragging a canvas component
    if (!draggedComponent) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    // Don't handle drop if we're dragging a canvas component
    if (draggedComponent) return;
    
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
        section: currentSection
      };

      setDroppedComponents(prev => [...prev, newComponent]);
      setShowComponentSelector(false);
    } catch (error) {
      console.error('Error handling drop:', error);
    }
  };

  const handleAddComponent = () => {
    setShowComponentSelector(true);
  };

  const handleComponentSelect = (component) => {
    const canvasRect = canvasRef.current.getBoundingClientRect();
    
    // Position new components in a grid-like pattern
    const existingInSection = droppedComponents.filter(c => c.section === currentSection);
    const baseY = currentSection === 'header' ? 20 : currentSection === 'body' ? 200 : 600;
    const offsetY = existingInSection.length * 80;
    
    const newComponent = {
      id: Date.now(),
      type: component.type,
      content: component.content,
      position: { x: 50, y: baseY + offsetY },
      section: currentSection
    };

    setDroppedComponents(prev => [...prev, newComponent]);
    setShowComponentSelector(false);
  };

  const handleDeleteComponent = (componentId) => {
    setDroppedComponents(prev => prev.filter(comp => comp.id !== componentId));
  };

  const handleComponentMouseDown = (e, component) => {
    // Don't start dragging if clicking on the delete button
    if (e.target.tagName === 'BUTTON') return;
    
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Starting drag for component:', component.id); // Debug log
    
    setDraggedComponent(component);
    
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const componentRect = e.currentTarget.getBoundingClientRect();
    
    setDragOffset({
      x: e.clientX - componentRect.left,
      y: e.clientY - componentRect.top
    });
    
    // Add event listeners to document for mouse move and up
    const handleMouseMove = (moveEvent) => {
      if (!canvasRef.current) return;
      
      moveEvent.preventDefault();
      const canvasRect = canvasRef.current.getBoundingClientRect();
      const newX = Math.max(0, Math.min(moveEvent.clientX - canvasRect.left - dragOffset.x, canvasRect.width - 150));
      const newY = Math.max(0, Math.min(moveEvent.clientY - canvasRect.top - dragOffset.y, canvasRect.height - 80));
      
      setDroppedComponents(prev => 
        prev.map(comp => 
          comp.id === component.id 
            ? { ...comp, position: { x: newX, y: newY } }
            : comp
        )
      );
    };
    
    const handleMouseUp = (upEvent) => {
      upEvent.preventDefault();
      console.log('Ending drag for component:', component.id); // Debug log
      setDraggedComponent(null);
      setDragOffset({ x: 0, y: 0 });
      
      // Remove event listeners
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleNextSection = () => {
    if (currentSection === 'header') {
      setCurrentSection('body');
    } else if (currentSection === 'body') {
      setCurrentSection('footer');
    }
  };

  const handlePrevSection = () => {
    if (currentSection === 'body') {
      setCurrentSection('header');
    } else if (currentSection === 'footer') {
      setCurrentSection('body');
    }
  };

  const handleGenerateCode = () => {
    if (droppedComponents.length === 0) {
      alert("Please add some components first!");
      return;
    }
    
    const headerComponents = droppedComponents
      .filter(comp => comp.section === 'header')
      .map(comp => generateHTMLForComponent(comp))
      .join('\n    ');
    
    const bodyComponents = droppedComponents
      .filter(comp => comp.section === 'body')
      .map(comp => generateHTMLForComponent(comp))
      .join('\n    ');
    
    const footerComponents = droppedComponents
      .filter(comp => comp.section === 'footer')
      .map(comp => generateHTMLForComponent(comp))
      .join('\n    ');

    const fullCode = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Generated Website</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
    header { background-color: #f8f9fa; padding: 20px; border-bottom: 1px solid #dee2e6; }
    main { padding: 40px 20px; min-height: 400px; }
    footer { background-color: #343a40; color: white; padding: 20px; text-align: center; }
  </style>
</head>
<body>
  <header>
    ${headerComponents || '    <!-- Header components will appear here -->'}
  </header>
  
  <main>
    ${bodyComponents || '    <!-- Body components will appear here -->'}
  </main>
  
  <footer>
    ${footerComponents || '    <!-- Footer components will appear here -->'}
  </footer>
</body>
</html>`;

    setCodeOutput(fullCode);
  };

  const generateHTMLForComponent = (comp) => {
    switch(comp.type) {
      case 'site-title':
        return '<h1>Your Website Title</h1>';
      case 'navigation':
        return '<nav><a href="#home">Home</a> | <a href="#about">About</a> | <a href="#contact">Contact</a></nav>';
      case 'logo':
        return '<img src="logo.png" alt="Logo" style="height: 50px;">';
      case 'search-bar':
        return '<input type="search" placeholder="Search...">';
      case 'heading':
        return '<h2>Section Heading</h2>';
      case 'paragraph':
        return '<p>Your content text goes here...</p>';
      case 'button':
        return '<button>Click Me</button>';
      case 'image':
        return '<img src="placeholder.jpg" alt="Image" style="max-width: 300px;">';
      case 'card':
        return '<div style="border: 1px solid #ddd; padding: 15px; border-radius: 5px;"><h3>Card Title</h3><p>Card content...</p></div>';
      case 'list':
        return '<ul><li>List item 1</li><li>List item 2</li><li>List item 3</li></ul>';
      case 'copyright':
        return '<p>&copy; 2025 Your Website. All rights reserved.</p>';
      case 'social-links':
        return '<div><a href="#">Facebook</a> | <a href="#">Twitter</a> | <a href="#">Instagram</a></div>';
      case 'contact-info':
        return '<p>Email: info@example.com | Phone: (123) 456-7890</p>';
      case 'newsletter':
        return '<div><input type="email" placeholder="Enter your email"> <button>Subscribe</button></div>';
      default:
        return `<div>${comp.content}</div>`;
    }
  };

  const handleClearCanvas = () => {
    setDroppedComponents([]);
    setCodeOutput('');
    setCurrentSection('header');
  };

  const getSectionColor = (section) => {
    switch(section) {
      case 'header': return '#e3f2fd';
      case 'body': return '#f3e5f5';
      case 'footer': return '#e8f5e8';
      default: return '#f5f5f5';
    }
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
          Sequential Website Builder
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
        <div style={{ width: '280px', flexShrink: 0 }}>
          {/* Section Navigator */}
          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '1px solid #dee2e6'
          }}>
            <h3 style={{ margin: '0 0 15px 0', textAlign: 'center' }}>
              Website Sections
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button 
                onClick={() => setCurrentSection('header')}
                style={{
                  padding: '12px 16px',
                  backgroundColor: currentSection === 'header' ? '#007bff' : '#e9ecef',
                  color: currentSection === 'header' ? 'white' : '#495057',
                  border: currentSection === 'header' ? '2px solid #007bff' : '2px solid #dee2e6',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: currentSection === 'header' ? '600' : '500',
                  fontSize: '14px',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <span>📋 Header</span>
                {droppedComponents.filter(c => c.section === 'header').length > 0 && (
                  <span style={{
                    backgroundColor: currentSection === 'header' ? 'rgba(255,255,255,0.2)' : '#28a745',
                    color: currentSection === 'header' ? 'white' : 'white',
                    borderRadius: '10px',
                    padding: '2px 6px',
                    fontSize: '10px',
                    fontWeight: 'bold'
                  }}>
                    {droppedComponents.filter(c => c.section === 'header').length}
                  </span>
                )}
              </button>
              
              <button 
                onClick={() => setCurrentSection('body')}
                style={{
                  padding: '12px 16px',
                  backgroundColor: currentSection === 'body' ? '#6f42c1' : '#e9ecef',
                  color: currentSection === 'body' ? 'white' : '#495057',
                  border: currentSection === 'body' ? '2px solid #6f42c1' : '2px solid #dee2e6',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: currentSection === 'body' ? '600' : '500',
                  fontSize: '14px',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <span>📝 Body</span>
                {droppedComponents.filter(c => c.section === 'body').length > 0 && (
                  <span style={{
                    backgroundColor: currentSection === 'body' ? 'rgba(255,255,255,0.2)' : '#28a745',
                    color: currentSection === 'body' ? 'white' : 'white',
                    borderRadius: '10px',
                    padding: '2px 6px',
                    fontSize: '10px',
                    fontWeight: 'bold'
                  }}>
                    {droppedComponents.filter(c => c.section === 'body').length}
                  </span>
                )}
              </button>
              
              <button 
                onClick={() => setCurrentSection('footer')}
                style={{
                  padding: '12px 16px',
                  backgroundColor: currentSection === 'footer' ? '#28a745' : '#e9ecef',
                  color: currentSection === 'footer' ? 'white' : '#495057',
                  border: currentSection === 'footer' ? '2px solid #28a745' : '2px solid #dee2e6',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: currentSection === 'footer' ? '600' : '500',
                  fontSize: '14px',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <span>🦶 Footer</span>
                {droppedComponents.filter(c => c.section === 'footer').length > 0 && (
                  <span style={{
                    backgroundColor: currentSection === 'footer' ? 'rgba(255,255,255,0.2)' : '#28a745',
                    color: currentSection === 'footer' ? 'white' : 'white',
                    borderRadius: '10px',
                    padding: '2px 6px',
                    fontSize: '10px',
                    fontWeight: 'bold'
                  }}>
                    {droppedComponents.filter(c => c.section === 'footer').length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Add Component Button */}
          <button 
            onClick={handleAddComponent}
            style={{ 
              width: '100%',
              padding: '15px',
              fontSize: '16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              marginBottom: '20px',
              fontWeight: '600'
            }}
          >
            + Add {currentSection.charAt(0).toUpperCase() + currentSection.slice(1)} Component
          </button>

          {/* Component Selector Modal */}
          {showComponentSelector && (
            <div style={{
              position: 'fixed',
              top: '0',
              left: '0',
              right: '0',
              bottom: '0',
              backgroundColor: 'rgba(0,0,0,0.5)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <div style={{
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '12px',
                maxWidth: '400px',
                width: '90%',
                maxHeight: '80vh',
                overflowY: 'auto'
              }}>
                <h3 style={{ margin: '0 0 20px 0' }}>
                  Select {currentSection.charAt(0).toUpperCase() + currentSection.slice(1)} Component
                </h3>
                
                <div style={{ display: 'grid', gap: '10px' }}>
                  {getAvailableComponents().map(component => (
                    <button
                      key={component.id}
                      onClick={() => handleComponentSelect(component)}
                      style={{
                        padding: '12px',
                        backgroundColor: getSectionColor(currentSection),
                        border: '1px solid #ccc',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontWeight: '500'
                      }}
                    >
                      {component.content}
                    </button>
                  ))}
                </div>
                
                <button
                  onClick={() => setShowComponentSelector(false)}
                  style={{
                    marginTop: '20px',
                    padding: '10px 20px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    width: '100%'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <button 
            onClick={handleGenerateCode} 
            style={{ 
              marginTop: '10px', 
              padding: '12px', 
              width: '100%', 
              boxSizing: 'border-box',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Generate Website Code
          </button>

          <button 
            onClick={handleClearCanvas} 
            style={{ 
              marginTop: '10px', 
              padding: '12px', 
              width: '100%', 
              boxSizing: 'border-box',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Clear All
          </button>
          
          {/* Code Output */}
          {codeOutput && (
            <div style={{ marginTop: '20px' }}>
              <h4>Generated Code:</h4>
              <pre style={{ 
                fontSize: '10px', 
                backgroundColor: '#1a1a1a', 
                color: '#00ff00',
                padding: '12px', 
                overflow: 'auto', 
                maxHeight: '300px',
                border: '1px solid #333',
                borderRadius: '6px',
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
            flex: 1,
            height: '800px',
            border: isDragOver ? '3px dashed #28a745' : '2px dashed #999', 
            backgroundColor: isDragOver ? '#f8fff8' : '#ffffff',
            position: 'relative',
            transition: 'all 0.2s ease',
            borderRadius: '12px',
            overflow: 'hidden'
          }}
        >
          {/* Section Dividers */}
          <div style={{ 
            position: 'absolute', 
            top: '0', 
            left: '0', 
            right: '0', 
            height: '150px', 
            backgroundColor: getSectionColor('header'),
            opacity: '0.1',
            borderBottom: '2px dashed #ccc'
          }} />
          <div style={{ 
            position: 'absolute', 
            top: '150px', 
            left: '0', 
            right: '0', 
            height: '450px', 
            backgroundColor: getSectionColor('body'),
            opacity: '0.1',
            borderBottom: '2px dashed #ccc'
          }} />
          <div style={{ 
            position: 'absolute', 
            top: '600px', 
            left: '0', 
            right: '0', 
            bottom: '0', 
            backgroundColor: getSectionColor('footer'),
            opacity: '0.1'
          }} />

          {/* Section Labels */}
          <div style={{ position: 'absolute', top: '10px', left: '10px', fontSize: '12px', color: '#666', fontWeight: 'bold' }}>HEADER</div>
          <div style={{ position: 'absolute', top: '160px', left: '10px', fontSize: '12px', color: '#666', fontWeight: 'bold' }}>BODY</div>
          <div style={{ position: 'absolute', top: '610px', left: '10px', fontSize: '12px', color: '#666', fontWeight: 'bold' }}>FOOTER</div>

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
              <div>🏗️ Start Building Your Website</div>
              <div style={{ fontSize: '14px', marginTop: '10px' }}>
                Begin with Header components, then move to Body and Footer
              </div>
            </div>
          )}

          {/* Render dropped components */}
          {droppedComponents.map((comp) => (
            <div 
              key={comp.id} 
              onMouseDown={(e) => handleComponentMouseDown(e, comp)}
              style={{ 
                position: 'absolute', 
                left: comp.position.x, 
                top: comp.position.y, 
                padding: '12px 16px 12px 12px', 
                border: '2px solid #007bff', 
                backgroundColor: getSectionColor(comp.section),
                borderRadius: '8px',
                boxShadow: draggedComponent?.id === comp.id 
                  ? '0 8px 25px rgba(0,123,255,0.3)' 
                  : '0 4px 12px rgba(0,123,255,0.15)',
                cursor: 'grab',
                fontWeight: '500',
                minWidth: '120px',
                userSelect: 'none',
                transition: draggedComponent?.id === comp.id ? 'none' : 'all 0.2s ease',
                zIndex: draggedComponent?.id === comp.id ? 1000 : 1,
                transform: draggedComponent?.id === comp.id ? 'scale(1.05) rotate(2deg)' : 'scale(1)',
                opacity: draggedComponent?.id === comp.id ? 0.8 : 1
              }}
            >
              {/* Delete button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteComponent(comp.id);
                }}
                onMouseDown={(e) => e.stopPropagation()}
                style={{
                  position: 'absolute',
                  top: '-8px',
                  right: '-8px',
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  zIndex: 10
                }}
                title="Delete component"
              >
                ×
              </button>
              
              {/* Drag handle indicator */}
              <div style={{
                position: 'absolute',
                top: '4px',
                left: '4px',
                width: '16px',
                height: '16px',
                cursor: 'grab',
                opacity: 0.4,
                fontSize: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(0,0,0,0.1)',
                borderRadius: '3px'
              }}>
                ⋮⋮
              </div>
              
              <div style={{ marginLeft: '8px' }}>
                {comp.content}
                <div style={{ 
                  fontSize: '10px', 
                  color: '#666', 
                  marginTop: '4px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  {comp.section} • {comp.type}
                </div>
              </div>
            </div>
          ))}

          {/* Stats */}
          <div style={{
            position: 'absolute',
            bottom: '15px',
            right: '15px',
            backgroundColor: 'rgba(0,0,0,0.8)',
            color: 'white',
            padding: '10px',
            borderRadius: '6px',
            fontSize: '12px'
          }}>
            <div>Header: {droppedComponents.filter(c => c.section === 'header').length}</div>
            <div>Body: {droppedComponents.filter(c => c.section === 'body').length}</div>
            <div>Footer: {droppedComponents.filter(c => c.section === 'footer').length}</div>
          </div>
        </div>
      </div>
    </div>
  );
}