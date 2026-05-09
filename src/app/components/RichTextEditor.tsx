import BlotFormatter from 'quill-blot-formatter';
import { useMemo, useRef, useState } from 'react';
import ReactQuill, { Quill } from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { toast } from 'sonner';
import { resolveAssetUrl } from '../../lib/utils';
import type { MediaAsset } from '../../types';
import '../../styles/rich-text-editor.css';
import { MediaPickerModal } from './MediaPickerModal';

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
  const pendingRangeRef = useRef<{ index: number; length: number } | null>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

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
          image: function () {
            const editor = quillRef.current?.getEditor();
            const range = editor?.getSelection(true);
            pendingRangeRef.current = range
              ? { index: range.index, length: range.length }
              : { index: editor?.getLength() ?? 0, length: 0 };
            setIsPickerOpen(true);
          },
        },
      },
    };
  }, [readOnly]);

  const handleMediaSelect = (asset: MediaAsset) => {
    setIsPickerOpen(false);
    const editor = quillRef.current?.getEditor();
    if (!editor) return;

    if (!asset.mime_type?.startsWith('image/')) {
      toast.error('Hanya file gambar yang bisa disisipkan ke editor. Untuk PDF, lampirkan via tombol upload file.');
      return;
    }

    const url = resolveAssetUrl(asset.file_path);
    if (!url) return;

    const range = pendingRangeRef.current ?? { index: editor.getLength(), length: 0 };
    editor.insertEmbed(range.index, 'image', url, 'user');
    editor.setSelection(range.index + 1, 0, 'user');
    pendingRangeRef.current = null;
  };

  return (
    <div className="rich-text-editor rounded-lg border border-gray-200 bg-white">
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value || ''}
        onChange={(html: string) => onChange?.(html)}
        placeholder={placeholder}
        readOnly={readOnly}
        modules={modules}
      />
      <MediaPickerModal
        open={isPickerOpen}
        onClose={() => {
          setIsPickerOpen(false);
          pendingRangeRef.current = null;
        }}
        onSelect={handleMediaSelect}
        category="editor"
        accept="image/*"
      />
    </div>
  );
}
