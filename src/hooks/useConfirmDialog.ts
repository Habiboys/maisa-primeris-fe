import React, { useCallback, useRef, useState } from 'react';
import { ConfirmDialog } from '../app/components/ConfirmDialog';

interface ConfirmOptions {
  title?: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'default';
}

/**
 * Hook yang menyediakan `showConfirm()` — fungsi Promise-based
 * untuk menampilkan dialog konfirmasi tanpa window.confirm().
 *
 * @example
 * const { showConfirm, ConfirmDialog } = useConfirmDialog();
 *
 * const handleDelete = async (id: string) => {
 *   if (await showConfirm({ description: 'Hapus data ini?' })) {
 *     // user menekan "Hapus"
 *   }
 * };
 *
 * return <>{ConfirmDialog}</>
 */
export function useConfirmDialog() {
  const [state, setState] = useState<(ConfirmOptions & { open: boolean }) | null>(null);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const showConfirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
      setState({ ...options, open: true });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    resolveRef.current?.(true);
    resolveRef.current = null;
    setState(null);
  }, []);

  const handleCancel = useCallback(() => {
    resolveRef.current?.(false);
    resolveRef.current = null;
    setState(null);
  }, []);

  const element = state?.open
    ? React.createElement(ConfirmDialog, {
        open: true,
        title: state.title,
        description: state.description,
        confirmText: state.confirmText,
        cancelText: state.cancelText,
        variant: state.variant,
        onConfirm: handleConfirm,
        onCancel: handleCancel,
      })
    : null;

  return {
    showConfirm,
    ConfirmDialog: element,
  };
}
