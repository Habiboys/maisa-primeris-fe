import React from 'react';
import { X } from 'lucide-react';

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  wide,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  // wide dipakai untuk modal yang lebih lebar (mis. DataMaster detail kavling)
  wide?: boolean;
}) {
  if (!isOpen) return null;

  const sizeClass = wide ? 'max-w-3xl' : 'max-w-lg';

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className={`bg-white rounded-2xl w-full ${sizeClass} shadow-2xl overflow-hidden text-left max-h-[90vh] overflow-y-auto`}>
        <div className="p-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

