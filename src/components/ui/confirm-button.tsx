'use client';

import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from './button';
import { Dialog } from './dialog';

interface ConfirmButtonProps {
  label: string;
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => Promise<unknown>;
}

export function ConfirmButton({
  label,
  title,
  description,
  confirmLabel = 'Excluir',
  onConfirm,
}: ConfirmButtonProps) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)} className="text-danger">
        <Trash2 /> {label}
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={title}
        description={description}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Voltar
            </Button>
            <Button
              variant="danger"
              loading={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await onConfirm();
                  setOpen(false);
                } finally {
                  setBusy(false);
                }
              }}
            >
              {confirmLabel}
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted">Essa ação não pode ser desfeita.</p>
      </Dialog>
    </>
  );
}
