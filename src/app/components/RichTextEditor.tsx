import BlotFormatter from 'quill-blot-formatter';
import { useMemo, useRef } from 'react';
import ReactQuill, { Quill } from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

const quillRegistry = Quill as unknown as {
  imports?: Record<string, unknown>;
  register: (path: string, moduleDef: unknown) => void;
};

if (!quillRegistry.imports?.['modules/blotFormatter']) {
  quillRegistry.register('modules/blotFormatter', BlotFormatter);
}

interface RichTextEditorProps {
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  readOnly,
}: RichTextEditorProps) {
  const quillRef = useRef<ReactQuill | null>(null);

  const modules = useMemo(() => {
    if (readOnly) return { toolbar: false };

    return {
      blotFormatter: {},
      toolbar: {
        container: [
          [{ header: [1, 2, 3, false] }],
          ['bold', 'italic', 'underline'],
          [{ list: 'ordered' }, { list: 'bullet' }],
          ['link', 'image'],
          ['clean'],
        ],
        handlers: {
          image: () => {
            const input = document.createElement('input');
            input.setAttribute('type', 'file');
            input.setAttribute('accept', 'image/*');
            input.click();

            input.onchange = () => {
              const file = input.files?.[0];
              if (!file) return;

              const reader = new FileReader();
              reader.onload = () => {
                const editor = quillRef.current?.getEditor();
                if (!editor) return;

                const range = editor.getSelection(true);
                const index = range?.index ?? editor.getLength();
                const imageUrl = String(reader.result || '');
                editor.insertEmbed(index, 'image', imageUrl, 'user');
                editor.setSelection(index + 1, 0, 'user');
              };
              reader.readAsDataURL(file);
            };
          },
        },
      },
    };
  }, [readOnly]);

  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden bg-white">
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value || ''}
        onChange={(html: string) => onChange?.(html)}
        placeholder={placeholder}
        readOnly={readOnly}
        modules={modules}
      />
    </div>
  );
}
