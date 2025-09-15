'use client';

import React, { useEffect, useRef } from 'react';

interface NativeEditorProps {
  content: string;
  onChange: (newContent: string) => void;
}

const NativeEditor = ({ content, onChange }: NativeEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);

  // Load initial content into the editor
  useEffect(() => {
    if (editorRef.current && content !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = content;
    }
  }, [content]);

  const handleContentChange = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const execCmd = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleContentChange(); // Ensure changes are propagated immediately
  };

  const ToolbarButton = ({ onClick, children }: { onClick: () => void, children: React.ReactNode }) => (
    <button type="button" onMouseDown={e => e.preventDefault()} onClick={onClick} className="p-2 rounded-md hover:bg-gray-200">
      {children}
    </button>
  );

  return (
    <div className="border border-gray-300 rounded-lg">
      <div className="flex flex-wrap items-center gap-2 p-2 border-b border-gray-300 bg-gray-50">
        <ToolbarButton onClick={() => execCmd('bold')}><b>B</b></ToolbarButton>
        <ToolbarButton onClick={() => execCmd('formatBlock', '<h2>')}><b>H2</b></ToolbarButton>
        <ToolbarButton onClick={() => execCmd('formatBlock', '<h3>')}><b>H3</b></ToolbarButton>
        <ToolbarButton onClick={() => execCmd('formatBlock', '<p>')}>P</ToolbarButton>
        <div className="w-px h-6 bg-gray-300 mx-1"></div>
        
        <select 
          className="p-1 border border-gray-200 rounded-md" 
          onChange={e => execCmd('fontSize', e.target.value)}
        >
          <option value="3">Normal</option>
          <option value="4">Large</option>
          <option value="5">XL</option>
          <option value="6">XXL</option>
          <option value="7">Huge</option>
        </select>

        <input 
          type="color" 
          className="w-8 h-8 p-0 border-none rounded-md cursor-pointer" 
          onChange={e => execCmd('foreColor', e.target.value)} 
        />
      </div>
      <div
        ref={editorRef}
        contentEditable={true}
        onInput={handleContentChange}
        className="p-4 min-h-[400px] focus:outline-none prose max-w-none"
        suppressContentEditableWarning={true}
      />
    </div>
  );
};

export default NativeEditor;
