'use client';

import { Editor } from '@tiptap/react';
import { Bold, Heading2, Heading3, Italic, List, ListOrdered, Pilcrow, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';

interface TiptapToolbarProps {
  editor: Editor | null;
}

const TiptapToolbar = ({ editor }: TiptapToolbarProps) => {
  if (!editor) {
    return null;
  }

  const ToggleButton = ({ isActive, onClick, children }: { isActive: boolean, onClick: () => void, children: React.ReactNode }) => (
    <button
      type="button"
      onClick={onClick}
      className={`p-2 rounded-md ${isActive ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-gray-100'}`}
    >
      {children}
    </button>
  );

  return (
    <div className="flex flex-wrap items-center gap-2 p-2 border border-gray-200 rounded-t-md bg-gray-50">
      <ToggleButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
      >
        <Bold className="h-5 w-5" />
      </ToggleButton>
      <ToggleButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive('heading', { level: 2 })}
      >
        <Heading2 className="h-5 w-5" />
      </ToggleButton>
      <ToggleButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        isActive={editor.isActive('heading', { level: 3 })}
      >
        <Heading3 className="h-5 w-5" />
      </ToggleButton>
      <ToggleButton
        onClick={() => editor.chain().focus().setParagraph().run()}
        isActive={editor.isActive('paragraph')}
      >
        <Pilcrow className="h-5 w-5" />
      </ToggleButton>
      <div className="w-px h-6 bg-gray-300 mx-1"></div>
      <ToggleButton
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        isActive={editor.isActive({ textAlign: 'left' })}
      >
        <AlignLeft className="h-5 w-5" />
      </ToggleButton>
      <ToggleButton
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        isActive={editor.isActive({ textAlign: 'center' })}
      >
        <AlignCenter className="h-5 w-5" />
      </ToggleButton>
      <ToggleButton
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        isActive={editor.isActive({ textAlign: 'right' })}
      >
        <AlignRight className="h-5 w-5" />
      </ToggleButton>
    </div>
  );
};

export default TiptapToolbar;
