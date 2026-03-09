import { useCallback, useRef, useState } from 'react';
import { ConfirmDialog } from '../app/components/ConfirmDialog';

interface ConfirmOptions {
  title?: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'default';
}

/**
 * Hook untuk menampilkan dialog konfirmasi (pengganti window.confirm).
 *
 * ```tsx
 * const { showConfirm, ConfirmDialogElement } = useConfirmDialog();
 *
 * const handleDelete = async () => {
 *   if (await showConfirm({ description: 'Hapus data ini?' })) {
 *     // lakukan delete
 *   }
 * };
 *
 * return <>{ConfirmDialogElement}</>;
 * ```
 */
export function useConfirmDialog() {
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const [state, setState] = useState<ConfirmOptions & { open: boolean }>({
    open: false,
    title: 'Konfirmasi',
    description: '',
    confirmText: 'Hapus',
    cancelText: 'Batal',
    variant: 'danger',
  });

  const showConfirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
      setState({
        open: true,
        title: options.title ?? 'Konfirmasi',
        description: options.description,
        confirmText: options.confirmText ?? 'Hapus',
        cancelText: options.cancelText ?? 'Batal',
        variant: options.variant ?? 'danger',
      });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    resolveRef.current?.(true);
    resolveRef.current = null;
    setState((s) => ({ ...s, open: false }));
  }, []);

  const handleCancel = useCallback(() => {
    resolveRef.current?.(false);
    resolveRef.current = null;
    setState((s) => ({ ...s, open: false }));
  }, []);

  const ConfirmDialogElement = (
    <ConfirmDialog
      open={state.open}
      title={state.title}
      description={state.description}
      confirmText={state.confirmText}
      cancelText={state.cancelText}
      variant={state.variant}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  );

  return { showConfirm, ConfirmDialog: ConfirmDialogElement };
}
