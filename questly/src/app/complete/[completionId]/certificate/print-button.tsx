"use client";

export function PrintButton({ label }: { label: string }) {
  return (
    <button type="button" className="q-btn q-btn--primary print:hidden" onClick={() => window.print()}>
      <span aria-hidden="true">🖨️</span>
      {label}
    </button>
  );
}
