import React from "react";

function escapeRegExp(str = "") {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function HighlightText({ text = "", query = "" }) {
  if (!query?.trim()) return <>{text}</>;
  const safe = escapeRegExp(query.trim());
  const parts = String(text).split(new RegExp(`(${safe})`, "gi"));

  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.trim().toLowerCase() ? (
          <mark key={i} className="ap-mark">{part}</mark>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        )
      )}
    </>
  );
}

export function paginateRows(rows, page, pageSize) {
  const start = (page - 1) * pageSize;
  return rows.slice(start, start + pageSize);
}

export function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const go = (p) => {
    if (p < 1 || p > totalPages) return;
    onPageChange(p);
  };

  const pages = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);

  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className="ap-pagination">
      <button className="ap-page-btn" onClick={() => go(page - 1)} disabled={page === 1}>
        Prev
      </button>

      {start > 1 && (
        <>
          <button className={`ap-page-btn ${page === 1 ? "ap-page-btn-on" : ""}`} onClick={() => go(1)}>1</button>
          {start > 2 && <span className="ap-page-dots">…</span>}
        </>
      )}

      {pages.map((p) => (
        <button
          key={p}
          className={`ap-page-btn ${page === p ? "ap-page-btn-on" : ""}`}
          onClick={() => go(p)}
        >
          {p}
        </button>
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="ap-page-dots">…</span>}
          <button
            className={`ap-page-btn ${page === totalPages ? "ap-page-btn-on" : ""}`}
            onClick={() => go(totalPages)}
          >
            {totalPages}
          </button>
        </>
      )}

      <button className="ap-page-btn" onClick={() => go(page + 1)} disabled={page === totalPages}>
        Next
      </button>
    </div>
  );
}

export function exportRowsToCsv(filename, rows) {
  if (!rows?.length) return;

  const headers = Object.keys(rows[0]);

  const csv = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((h) => {
          const val = row[h] ?? "";
          const safe = String(val).replace(/"/g, '""');
          return `"${safe}"`;
        })
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function ConfirmModal({
  open,
  title = "Confirm Action",
  message = "Are you sure?",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  busy = false,
  onConfirm,
  onClose,
}) {
  if (!open) return null;

  return (
    <div className="ap-modal-overlay" onClick={() => !busy && onClose?.()}>
      <div className="ap-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ap-modal-title">{title}</div>
        <div className="ap-modal-text">{message}</div>

        <div className="ap-modal-actions">
          <button className="ap-btn ap-btn-secondary" onClick={onClose} disabled={busy}>
            {cancelLabel}
          </button>
          <button className="ap-btn ap-btn-danger" onClick={onConfirm} disabled={busy}>
            {busy ? "Working..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function StatCard({ title, value, subtitle = "", tone = "purple" }) {
  return (
    <div className={`ap-stat-card ap-stat-card-${tone}`}>
      <div className="ap-stat-label">{title}</div>
      <div className="ap-stat-value">{value}</div>
      <div className="ap-stat-sub">{subtitle}</div>
    </div>
  );
}

export function HorizontalBars({ title, items = [] }) {
  const max = Math.max(...items.map((i) => i.value || 0), 1);

  return (
    <div className="ap-card">
      <div className="ap-card-head">
        <div className="ap-card-title">{title}</div>
      </div>

      <div className="ap-form">
        <div className="ap-chart-list">
          {items.map((item) => {
            const pct = Math.max(6, ((item.value || 0) / max) * 100);
            return (
              <div className="ap-chart-row" key={item.label}>
                <div className="ap-chart-meta">
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
                <div className="ap-chart-track">
                  <div
                    className="ap-chart-fill"
                    style={{
                      width: `${pct}%`,
                      background: item.color || "#8b5cf6",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}