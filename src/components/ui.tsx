"use client";

import { useEffect, type ReactNode } from "react";

export function Modal({
  title,
  onClose,
  children,
  footer,
  width,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  width?: number;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="modal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-mgmt" style={width ? { maxWidth: width } : undefined} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-header-mgmt">
          <h2>{title}</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Tutup">
            ✕
          </button>
        </div>
        <div className="modal-body-mgmt">{children}</div>
        {footer && <div className="modal-footer-mgmt">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  onCancel,
  onConfirm,
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="modal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="modal-mgmt confirm-dialog" role="alertdialog" aria-modal="true" aria-label={title}>
        <div className="confirm-body">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
            <circle cx="24" cy="24" r="20" fill="#fef2f2" stroke="#fecaca" strokeWidth="2" />
            <path d="M16 16l16 16M32 16l-16 16" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
          <h3>{title}</h3>
          <p>{message}</p>
        </div>
        <div className="confirm-footer">
          <button className="btn btn-secondary" onClick={onCancel}>
            Batal
          </button>
          <button className="btn btn-danger-solid" onClick={onConfirm}>{confirmLabel ?? "Hapus"}</button>
        </div>
      </div>
    </div>
  );
}