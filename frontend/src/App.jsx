import React, { useState, useRef } from 'react';
import './App.css'; // Import the new CSS file

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
      className="draggable-component"
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
    ${headerComponents || '    '}
  </header>
  
  <main>
    ${bodyComponents || '    '}
  </main>
  
  <footer>
    ${footerComponents || '    '}
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
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <h1 className="app-title">
          BuildAI
        </h1>
        <p className="app-subtitle">
          Sequential Website Builder
        </p>
      </header>

      <div className="main-content">
        {/* Sidebar */}
        <div className="sidebar">
          {/* Section Navigator */}
          <div className="section-navigator">
            <h3>
              Website Sections
            </h3>
            
            <div className="section-buttons">
              <button 
                onClick={() => setCurrentSection('header')}
                className={`section-btn ${currentSection === 'header' ? 'active' : ''}`}
              >
                <span>📋 Header</span>
                {droppedComponents.filter(c => c.section === 'header').length > 0 && (
                  <span className={`section-count ${currentSection === 'header' ? 'active' : ''}`}>
                    {droppedComponents.filter(c => c.section === 'header').length}
                  </span>
                )}
              </button>
              
              <button 
                onClick={() => setCurrentSection('body')}
                className={`section-btn ${currentSection === 'body' ? 'active' : ''}`}
              >
                <span>📝 Body</span>
                {droppedComponents.filter(c => c.section === 'body').length > 0 && (
                  <span className={`section-count ${currentSection === 'body' ? 'active' : ''}`}>
                    {droppedComponents.filter(c => c.section === 'body').length}
                  </span>
                )}
              </button>
              
              <button 
                onClick={() => setCurrentSection('footer')}
                className={`section-btn ${currentSection === 'footer' ? 'active' : ''}`}
              >
                <span>🦶 Footer</span>
                {droppedComponents.filter(c => c.section === 'footer').length > 0 && (
                  <span className={`section-count ${currentSection === 'footer' ? 'active' : ''}`}>
                    {droppedComponents.filter(c => c.section === 'footer').length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Add Component Button */}
          <button 
            onClick={handleAddComponent}
            className="add-component-btn"
          >
            + Add {currentSection.charAt(0).toUpperCase() + currentSection.slice(1)} Component
          </button>

          {/* Component Selector Modal */}
          {showComponentSelector && (
            <div className="modal-overlay">
              <div className="modal-content">
                <h3>
                  Select {currentSection.charAt(0).toUpperCase() + currentSection.slice(1)} Component
                </h3>
                
                <div className="component-list">
                  {getAvailableComponents().map(component => (
                    <button
                      key={component.id}
                      onClick={() => handleComponentSelect(component)}
                      className="component-select-btn"
                    >
                      {component.content}
                    </button>
                  ))}
                </div>
                
                <button
                  onClick={() => setShowComponentSelector(false)}
                  className="cancel-btn"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <button 
            onClick={handleGenerateCode} 
            className="generate-code-btn"
          >
            Generate Website Code
          </button>

          <button 
            onClick={handleClearCanvas} 
            className="clear-canvas-btn"
          >
            Clear All
          </button>
          
          {/* Code Output */}
          {codeOutput && (
            <div className="code-output-container">
              <h4>Generated Code:</h4>
              <pre className="code-output">
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
          className={`canvas ${isDragOver ? 'drag-over' : ''}`}
        >
          {/* Section Dividers */}
          <div className="section-divider header-divider" style={{ backgroundColor: getSectionColor('header') }} />
          <div className="section-divider body-divider" style={{ backgroundColor: getSectionColor('body') }} />
          <div className="section-divider footer-divider" style={{ backgroundColor: getSectionColor('footer') }} />

          {/* Section Labels */}
          <div className="section-label header-label">HEADER</div>
          <div className="section-label body-label">BODY</div>
          <div className="section-label footer-label">FOOTER</div>

          {droppedComponents.length === 0 && (
            <div className="canvas-placeholder">
              <div>🏗️ Start Building Your Website</div>
              <div className="placeholder-text">
                Begin with Header components, then move to Body and Footer
              </div>
            </div>
          )}

          {/* Render dropped components */}
          {droppedComponents.map((comp) => (
            <div 
              key={comp.id} 
              onMouseDown={(e) => handleComponentMouseDown(e, comp)}
              className={`dropped-component ${draggedComponent?.id === comp.id ? 'is-dragging' : ''}`}
              style={{ 
                left: comp.position.x, 
                top: comp.position.y, 
                backgroundColor: getSectionColor(comp.section),
                zIndex: draggedComponent?.id === comp.id ? 1000 : 1,
                opacity: draggedComponent?.id === comp.id ? 0.8 : 1,
                transition: draggedComponent?.id === comp.id ? 'none' : 'all 0.2s ease',
                transform: draggedComponent?.id === comp.id ? 'scale(1.05) rotate(2deg)' : 'scale(1)'
              }}
            >
              {/* Delete button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteComponent(comp.id);
                }}
                onMouseDown={(e) => e.stopPropagation()}
                className="delete-btn"
                title="Delete component"
              >
                ×
              </button>
              
              {/* Drag handle indicator */}
              <div className="drag-handle">
                ⋮⋮
              </div>
              
              <div className="component-content">
                {comp.content}
                <div className="component-meta">
                  {comp.section} • {comp.type}
                </div>
              </div>
            </div>
          ))}

          {/* Stats */}
          <div className="stats-box">
            <div>Header: {droppedComponents.filter(c => c.section === 'header').length}</div>
            <div>Body: {droppedComponents.filter(c => c.section === 'body').length}</div>
            <div>Footer: {droppedComponents.filter(c => c.section === 'footer').length}</div>
          </div>
        </div>
      </div>
    </div>
  );
}