import BlotFormatter from 'quill-blot-formatter';
import { useMemo, useRef } from 'react';
import ReactQuill, { Quill } from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { toast } from 'sonner';
import { getErrorMessage, resolveAssetUrl } from '../../lib/utils';
import { mediaService } from '../../services';
import '../../styles/rich-text-editor.css';

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
          image: async () => {
            const input = document.createElement('input');
            input.setAttribute('type', 'file');
            input.setAttribute('accept', 'image/*');
            input.click();

            input.onchange = async () => {
              const file = input.files?.[0];
              if (!file) return;

              try {
                const uploaded = await mediaService.upload({ file, category: 'editor' });
                const uploadedUrl = resolveAssetUrl(uploaded.file_path);
                if (!uploadedUrl) return;

                const editor = quillRef.current?.getEditor();
                if (!editor) return;

                const range = editor.getSelection(true);
                const index = range?.index ?? editor.getLength();
                editor.insertEmbed(index, 'image', uploadedUrl, 'user');
                editor.setSelection(index + 1, 0, 'user');
              } catch (err) {
                toast.error(getErrorMessage(err));
              }
            };
          },
        },
      },
    };
  }, [readOnly]);

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
    </div>
  );
}
