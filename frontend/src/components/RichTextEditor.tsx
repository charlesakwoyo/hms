import React, { useEffect, useRef } from 'react';
import { Bold, Italic, Underline, Strikethrough, List, ListOrdered, RemoveFormatting } from 'lucide-react';
import { sanitizeRichText } from '../utils/richText';

const FONTS = ['Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Verdana', 'Tahoma', 'Courier New'];
const SIZES: [string, string][] = [
  ['1', 'Very small'],
  ['2', 'Small'],
  ['3', 'Normal'],
  ['4', 'Large'],
  ['5', 'Larger'],
  ['6', 'Very large'],
];

export const RichTextEditor: React.FC<{ value: string; onChange: (html: string) => void; placeholder?: string; minHeight?: number }> = ({
  value,
  onChange,
  placeholder,
  minHeight = 90,
}) => {
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (box.current && box.current.innerHTML !== value) box.current.innerHTML = sanitizeRichText(value || '');
  }, [value]);

  const emit = () => {
    if (box.current) onChange(sanitizeRichText(box.current.innerHTML));
  };
  const run = (command: string, arg?: string) => {
    box.current?.focus();
    document.execCommand('styleWithCSS', false, 'true');
    document.execCommand(command, false, arg);
    emit();
  };
  const btn = 'p-1.5 rounded hover:bg-gray-200 text-gray-700';

  const keep = (e: React.MouseEvent) => e.preventDefault();

  return (
    <div className="border border-gray-300 rounded-lg bg-white focus-within:ring-2 focus-within:ring-[#0088cc]">
      <div className="flex flex-wrap items-center gap-1 px-2 py-1 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <select
          title="Font"
          defaultValue=""
          onChange={(e) => {
            if (e.target.value) run('fontName', e.target.value);
            e.target.value = '';
          }}
          className="text-[11px] border rounded px-1 py-0.5 bg-white"
        >
          <option value="">Font</option>
          {FONTS.map((f) => (
            <option key={f} value={f} style={{ fontFamily: f }}>
              {f}
            </option>
          ))}
        </select>
        <select
          title="Size"
          defaultValue=""
          onChange={(e) => {
            if (e.target.value) run('fontSize', e.target.value);
            e.target.value = '';
          }}
          className="text-[11px] border rounded px-1 py-0.5 bg-white"
        >
          <option value="">Size</option>
          {SIZES.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <span className="w-px h-5 bg-gray-300 mx-0.5" />
        <button type="button" title="Bold" onMouseDown={keep} onClick={() => run('bold')} className={btn}>
          <Bold className="w-3.5 h-3.5" />
        </button>
        <button type="button" title="Italic" onMouseDown={keep} onClick={() => run('italic')} className={btn}>
          <Italic className="w-3.5 h-3.5" />
        </button>
        <button type="button" title="Underline" onMouseDown={keep} onClick={() => run('underline')} className={btn}>
          <Underline className="w-3.5 h-3.5" />
        </button>
        <button type="button" title="Strikethrough" onMouseDown={keep} onClick={() => run('strikeThrough')} className={btn}>
          <Strikethrough className="w-3.5 h-3.5" />
        </button>
        <span className="w-px h-5 bg-gray-300 mx-0.5" />
        <label title="Text colour" className="flex items-center gap-0.5 text-[11px] text-gray-600 cursor-pointer">
          A
          <input
            type="color"
            defaultValue="#003366"
            onMouseDown={keep}
            onChange={(e) => run('foreColor', e.target.value)}
            className="w-5 h-5 p-0 border-0 bg-transparent cursor-pointer"
          />
        </label>
        <label title="Highlight" className="flex items-center gap-0.5 text-[11px] text-gray-600 cursor-pointer">
          ▮
          <input
            type="color"
            defaultValue="#fff59d"
            onMouseDown={keep}
            onChange={(e) => run('hiliteColor', e.target.value)}
            className="w-5 h-5 p-0 border-0 bg-transparent cursor-pointer"
          />
        </label>
        <span className="w-px h-5 bg-gray-300 mx-0.5" />
        <button type="button" title="Bulleted list" onMouseDown={keep} onClick={() => run('insertUnorderedList')} className={btn}>
          <List className="w-3.5 h-3.5" />
        </button>
        <button type="button" title="Numbered list" onMouseDown={keep} onClick={() => run('insertOrderedList')} className={btn}>
          <ListOrdered className="w-3.5 h-3.5" />
        </button>
        <button type="button" title="Clear formatting" onMouseDown={keep} onClick={() => run('removeFormat')} className={btn}>
          <RemoveFormatting className="w-3.5 h-3.5" />
        </button>
      </div>
      <div
        ref={box}
        contentEditable
        suppressContentEditableWarning
        onInput={emit}
        onBlur={emit}
        data-placeholder={placeholder || ''}
        className="wc-rich-text px-3 py-2 text-xs text-gray-900 outline-none overflow-y-auto"
        style={{ minHeight, maxHeight: 260 }}
      />
    </div>
  );
};
