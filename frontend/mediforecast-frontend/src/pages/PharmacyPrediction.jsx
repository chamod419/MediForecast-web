import React, { useState, useRef, useMemo, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import { getPrediction } from "../api/pharmacyApi";
import "./PharmacyPrediction.css";

/* ── Fonts ── */
if (!document.getElementById("mf-pred-fonts")) {
  const l = document.createElement("link");
  l.id = "mf-pred-fonts"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600&display=swap";
  document.head.appendChild(l);
}

/* ── Chart.js lazy loader ── */
function loadChartJS() {
  return new Promise((resolve) => {
    if (window.Chart) return resolve(window.Chart);
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js";
    s.onload = () => resolve(window.Chart);
    document.head.appendChild(s);
  });
}

const CHART_COLORS = [
  "#06b6d4","#22c55e","#f59e0b","#ef4444",
  "#8b5cf6","#3b82f6","#f97316","#ec4899",
  "#60a5fa","#4ade80","#fbbf24","#f472b6",
];

/* ════════════════════════════════════════
   DONUT CHART
════════════════════════════════════════ */
function DonutChart({ title, subtitle, labels, values, colors }) {
  const canvasRef = useRef(null);
  const chartRef  = useRef(null);

  useEffect(() => {
    let destroyed = false;
    loadChartJS().then((Chart) => {
      if (destroyed || !canvasRef.current) return;
      if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; }
      chartRef.current = new Chart(canvasRef.current.getContext("2d"), {
        type: "doughnut",
        data: {
          labels,
          datasets: [{
            data: values,
            backgroundColor: colors || CHART_COLORS,
            borderColor: "transparent",
            borderWidth: 0,
            hoverOffset: 8,
          }],
        },
        options: {
          responsive: false, cutout: "64%",
          plugins: {
            legend: {
              position: "bottom",
              labels: {
                color: "rgba(221,228,240,0.40)",
                font: { size: 11, family: "'Outfit',sans-serif" },
                boxWidth: 10, padding: 10,
              },
            },
            tooltip: {
              backgroundColor: "#070c18",
              titleColor: "#dde4f0",
              bodyColor: "#06b6d4",
              borderColor: "rgba(255,255,255,0.12)",
              borderWidth: 1, padding: 12,
              callbacks: {
                label: (ctx) => {
                  const t = ctx.dataset.data.reduce((a, b) => a + b, 0);
                  return `  ${ctx.parsed.toLocaleString()} (${t > 0 ? Math.round(ctx.parsed / t * 100) : 0}%)`;
                },
              },
            },
          },
        },
      });
    });
    return () => {
      destroyed = true;
      if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; }
    };
  }, [labels, values, colors]);

  return (
    <div className="pred-donut-card">
      <div className="pred-chart-title">{title}</div>
      <div className="pred-chart-sub">{subtitle}</div>
      <div className="pred-donut-center">
        <canvas ref={canvasRef} width={240} height={210} />
      </div>
    </div>
  );
}

/* ════════════════════════════════════════
   BAR CHART
════════════════════════════════════════ */
function BarChart({ title, subtitle, labels, datasets }) {
  const canvasRef = useRef(null);
  const chartRef  = useRef(null);

  useEffect(() => {
    let destroyed = false;
    loadChartJS().then((Chart) => {
      if (destroyed || !canvasRef.current) return;
      if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; }
      chartRef.current = new Chart(canvasRef.current.getContext("2d"), {
        type: "bar",
        data: { labels, datasets },
        options: {
          responsive: false,
          interaction: { mode: "index", intersect: false },
          scales: {
            x: {
              ticks: { color: "rgba(221,228,240,0.22)", font: { size: 10, family: "'JetBrains Mono',monospace" }, maxRotation: 40 },
              grid:  { color: "rgba(255,255,255,0.04)" },
              border: { color: "rgba(255,255,255,0.07)" },
            },
            y: {
              ticks: { color: "rgba(221,228,240,0.22)", font: { size: 10, family: "'JetBrains Mono',monospace" } },
              grid:  { color: "rgba(255,255,255,0.045)" },
              border: { color: "rgba(255,255,255,0.07)" },
            },
          },
          plugins: {
            legend: {
              labels: { color: "rgba(221,228,240,0.45)", font: { size: 11, family: "'Outfit',sans-serif" }, boxWidth: 12, padding: 12 },
            },
            tooltip: {
              backgroundColor: "#070c18",
              titleColor: "#dde4f0",
              bodyColor: "rgba(221,228,240,0.65)",
              borderColor: "rgba(255,255,255,0.12)",
              borderWidth: 1, padding: 12,
            },
          },
        },
      });
    });
    return () => {
      destroyed = true;
      if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; }
    };
  }, [labels, datasets]);

  return (
    <div className="pred-chart-bar">
      <div className="pred-chart-title">{title}</div>
      <div className="pred-chart-sub">{subtitle}</div>
      <div className="pred-chart-scroll">
        <canvas ref={canvasRef} width={Math.max(labels.length * 38, 620)} height={270} />
      </div>
    </div>
  );
}

/* ════════════════════════════════════════
   ANALYTICS TAB
════════════════════════════════════════ */
function Analytics({ data, nextMonth }) {
  const { catLabels, catValues } = useMemo(() => {
    const map = {};
    data.forEach(r => { const c = r.category || "Other"; map[c] = (map[c] || 0) + Number(r.predicted || 0); });
    const s = Object.entries(map).sort((a, b) => b[1] - a[1]);
    return { catLabels: s.map(e => e[0]), catValues: s.map(e => e[1]) };
  }, [data]);

  const { bandLabels, bandValues, bandColors } = useMemo(() => {
    let high = 0, med = 0, low = 0, zero = 0;
    data.forEach(r => {
      const p = Number(r.predicted || 0);
      if (p === 0) zero++; else if (p <= 10) low++; else if (p <= 50) med++; else high++;
    });
    const e = [
      ["High >50",  high, "#22c55e"],
      ["Mid 11–50", med,  "#06b6d4"],
      ["Low 1–10",  low,  "#f59e0b"],
      ["Zero",      zero, "rgba(221,228,240,0.22)"],
    ].filter(e => e[1] > 0);
    return { bandLabels: e.map(x => x[0]), bandValues: e.map(x => x[1]), bandColors: e.map(x => x[2]) };
  }, [data]);

  const { stockLabels, stockValues, stockColors } = useMemo(() => {
    let ok = 0, low = 0, crit = 0;
    data.forEach(r => {
      const c = Number(r.current || 0), p = Number(r.predicted || 0);
      if (p === 0 || c >= p * 1.2) ok++; else if (c >= p * 0.5) low++; else crit++;
    });
    const e = [
      ["Sufficient", ok,   "#22c55e"],
      ["Low Stock",  low,  "#f59e0b"],
      ["Critical",   crit, "#ef4444"],
    ].filter(e => e[1] > 0);
    return { stockLabels: e.map(x => x[0]), stockValues: e.map(x => x[1]), stockColors: e.map(x => x[2]) };
  }, [data]);

  const { barLabels, barCurrent, barReduced, barPredicted } = useMemo(() => {
    const top = [...data].sort((a, b) => Number(b.predicted || 0) - Number(a.predicted || 0)).slice(0, 15);
    return {
      barLabels:    top.map(r => r.brand_name?.slice(0, 14) || "—"),
      barCurrent:   top.map(r => Number(r.current   || 0)),
      barReduced:   top.map(r => Number(r.reduced    || 0)),
      barPredicted: top.map(r => Number(r.predicted  || 0)),
    };
  }, [data]);

  const totalPredicted = useMemo(() => data.reduce((s, r) => s + Number(r.predicted || 0), 0), [data]);
  const totalReduced   = useMemo(() => data.reduce((s, r) => s + Number(r.reduced   || 0), 0), [data]);
  const highDemand     = useMemo(() => data.filter(r => Number(r.predicted || 0) > Number(r.reduced || 0) * 1.2).length, [data]);

  const statCards = [
    { label: "Total Drugs",     value: data.length,                    color: "#06b6d4", icon: "💊", accent: "#06b6d4" },
    { label: "Total Predicted", value: totalPredicted.toLocaleString(), color: "#22c55e", icon: "📈", accent: "#22c55e" },
    { label: "Dispensed",       value: totalReduced.toLocaleString(),   color: "#f59e0b", icon: "📦", accent: "#f59e0b" },
    { label: "Reorder Needed",  value: highDemand,                      color: "#ef4444", icon: "⚠️", accent: "#ef4444" },
  ];

  return (
    <div>
      {/* Stat cards */}
      <div className="pred-stat-cards">
        {statCards.map(c => (
          <div key={c.label} className="pred-stat-card" style={{ "--card-color": c.accent }}>
            <div className="pred-stat-card-icon">{c.icon}</div>
            <div className="pred-stat-card-val" style={{ color: c.color }}>{c.value}</div>
            <div className="pred-stat-card-lbl">{c.label}</div>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <BarChart
        title="Top 15 Drugs — Stock vs Dispensed vs Predicted"
        subtitle={`Current stock · Dispensed last period · Predicted for ${nextMonth}`}
        labels={barLabels}
        datasets={[
          { label: "Current Stock",    data: barCurrent,   backgroundColor: "rgba(59,130,246,0.65)",  borderRadius: 4 },
          { label: "Dispensed (Last)", data: barReduced,   backgroundColor: "rgba(245,158,11,0.65)",  borderRadius: 4 },
          { label: "Predicted",        data: barPredicted, backgroundColor: "rgba(34,197,94,0.75)",   borderRadius: 4 },
        ]}
      />

      {/* Three donuts */}
      <div className="pred-donuts">
        <DonutChart title="Demand by Category"  subtitle={`Predicted units · ${nextMonth}`}    labels={catLabels}   values={catValues}   colors={CHART_COLORS} />
        <DonutChart title="Demand Distribution" subtitle="Drugs by predicted quantity range"   labels={bandLabels}  values={bandValues}  colors={bandColors}  />
        <DonutChart title="Stock Readiness"     subtitle="Current stock vs predicted need"     labels={stockLabels} values={stockValues} colors={stockColors} />
      </div>
    </div>
  );
}

/* ════════════════════════════════════════
   CSV EXPORT
════════════════════════════════════════ */
function exportToCSV(data, nextMonth) {
  const headers = ["#", "Brand Name", "Generic", "Category", "Last Stock", "Current", "Reduced", "Predicted", "Month"];
  const rows = data.map((r, i) => [i + 1, r.brand_name ?? "", r.generic_name ?? "", r.category ?? "", r.last ?? 0, r.current ?? 0, r.reduced ?? 0, r.predicted ?? 0, nextMonth]);
  const csv  = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement("a"), { href: url });
  a.setAttribute("download", `prediction_${(nextMonth || "export").replace(" ", "_")}.csv`);
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

/* ════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════ */
export default function PharmacyPrediction() {
  const [file,       setFile]       = useState(null);
  const [predicting, setPredicting] = useState(false);
  const [data,       setData]       = useState([]);
  const [nextMonth,  setNextMonth]  = useState("");
  const [error,      setError]      = useState(null);
  const [progress,   setProgress]   = useState(0);
  const [activeTab,  setActiveTab]  = useState("table");

  const cancelToken = useRef(null);
  const progressRef = useRef(null);

  const onDrop = (accepted) => {
    if (accepted.length) { setFile(accepted[0]); setError(null); setData([]); setNextMonth(""); }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"],
    },
    multiple: false,
  });

  const handlePredict = async () => {
    if (!file) { setError("Please upload a sales history file first."); return; }
    setPredicting(true); setError(null); setData([]); setNextMonth(""); setProgress(0);
    let p = 0;
    progressRef.current = setInterval(() => { p = Math.min(p + Math.random() * 8, 90); setProgress(Math.round(p)); }, 400);
    cancelToken.current = axios.CancelToken.source();
    try {
      const res = await getPrediction(file, cancelToken.current.token);
      setProgress(100);
      setData(res.predictions || res.data || []);
      setNextMonth(res.next_month || "");
      setActiveTab("table");
    } catch (err) {
      if      (axios.isCancel(err))          setError("Prediction cancelled.");
      else if (err.response?.status === 401) setError("Session expired. Please log in again.");
      else if (err.response?.data?.detail)   setError(err.response.data.detail);
      else                                    setError("An error occurred. Check your file format and try again.");
    } finally {
      clearInterval(progressRef.current); setPredicting(false); cancelToken.current = null;
    }
  };

  const handleCancel = () => {
    if (cancelToken.current) { cancelToken.current.cancel(); clearInterval(progressRef.current); setProgress(0); }
  };

  const formatDate = () => new Date().toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });

  const totalPredicted = data.reduce((s, r) => s + Number(r.predicted || 0), 0);
  const totalReduced   = data.reduce((s, r) => s + Number(r.reduced   || 0), 0);
  const reorderNeeded  = data.filter(r => Number(r.predicted || 0) > Number(r.reduced || 0) * 1.2).length;

  /* ──────────────── RENDER ──────────────── */
  return (
    <div className="pred-root">

      {/* ══ PAGE HEADER ══ */}
      <header className="pi-header" style={{ position: "relative" }}>
        {/* Cyan → Emerald left accent */}
        <div style={{
          position: "absolute", left: 0, top: 0, bottom: 0, width: 3,
          background: "linear-gradient(180deg,#06b6d4,#22c55e)", borderRadius: "0 2px 2px 0",
        }}/>

        <div className="pi-header-left">
          <div className="pi-breadcrumb">
            <span>Pharmacy</span>
            <span className="pi-bc-chevron">›</span>
            <span className="pi-bc-active">Drug Demand Prediction</span>
          </div>
          <h1 className="pi-title">
            <span className="pi-title-icon" style={{ background: "linear-gradient(135deg,rgba(6,182,212,0.2),rgba(34,197,94,0.15))", borderColor: "rgba(6,182,212,0.3)", color: "#06b6d4" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
            </span>
            Drug Demand Prediction
          </h1>
          <div className="pi-identity">
            <span style={{ fontSize: 12, color: "rgba(221,228,240,0.4)" }}>ML-powered forecast</span>
            <span className="pi-id-sep">·</span>
            <span className="pi-id-name">XGBoost Model</span>
            <span className="pi-id-sep">·</span>
            <code className="pi-id-code">{formatDate()}</code>
          </div>
        </div>

        <div className="pi-header-right">
          {/* Stats — visible after prediction */}
          {data.length > 0 && (
            <div className="pi-stat-row">
              {[
                { label: "Drugs",     val: data.length,                     color: "#06b6d4" },
                { label: "Predicted", val: totalPredicted.toLocaleString(),  color: "#22c55e" },
                { label: "Dispensed", val: totalReduced.toLocaleString(),    color: "#f59e0b" },
                { label: "Reorder",   val: reorderNeeded,                    color: "#ef4444" },
              ].map(s => (
                <div className="pi-stat" key={s.label}>
                  <span className="pi-stat-val" style={{ color: s.color }}>{s.val}</span>
                  <span className="pi-stat-lbl">{s.label}</span>
                </div>
              ))}
            </div>
          )}

          <div className="pi-actions">
            {data.length > 0 && (
              <button className="pi-btn pi-btn-green" onClick={() => exportToCSV(data, nextMonth)}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Export CSV
              </button>
            )}
            {file && !predicting && (
              <button className="pi-btn pi-btn-ghost" onClick={() => { setFile(null); setData([]); setNextMonth(""); setError(null); }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
                Clear
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ══ BANNERS ══ */}
      {error && (
        <div className="pred-banner pred-banner-error">
          <span className="pred-banner-ico">!</span>
          <span style={{ flex: 1 }}>{error}</span>
          <button className="pred-banner-close" onClick={() => setError(null)}>✕</button>
        </div>
      )}
      {data.length > 0 && nextMonth && !error && (
        <div className="pred-banner pred-banner-success">
          <span className="pred-banner-ico">✓</span>
          <span style={{ flex: 1 }}>
            Forecast complete — predicted demand for <strong>{nextMonth}</strong> · {data.length} drugs analysed
          </span>
          <button className="pred-banner-close" onClick={() => {}}>✕</button>
        </div>
      )}

      {/* ══ UPLOAD CARD ══ */}
      <div className="pred-upload-section">
        <div className="pred-upload-card">
          <div className="pred-upload-card-inner">

            {/* LEFT: Dropzone */}
            <div className="pred-dropzone-wrap">
              <div
                {...getRootProps()}
                className={`pred-dropzone ${isDragActive ? "pred-dropzone-active" : file ? "pred-dropzone-filled" : ""}`}
              >
                <input {...getInputProps()} />
                {isDragActive ? (
                  <>
                    <span className="pred-dropzone-icon">📂</span>
                    <p className="pred-dropzone-title pred-dropzone-title-cyan">Drop the file here…</p>
                  </>
                ) : file ? (
                  <>
                    <span className="pred-dropzone-icon">✅</span>
                    <p className="pred-dropzone-title pred-dropzone-title-green">{file.name}</p>
                    <p className="pred-dropzone-sub">{(file.size / 1024).toFixed(1)} KB · Click to change file</p>
                  </>
                ) : (
                  <>
                    <span className="pred-dropzone-icon">📊</span>
                    <p className="pred-dropzone-title">Drag & drop your sales history file</p>
                    <p className="pred-dropzone-sub">Supports .xlsx, .xls, .csv · Click to browse</p>
                  </>
                )}
              </div>
            </div>

            {/* RIGHT: Predict controls */}
            <div className="pred-predict-side">
              {/* Predict button */}
              <button
                className={`pred-predict-main-btn ${predicting ? "pred-predict-main-btn-predicting" : ""}`}
                onClick={handlePredict}
                disabled={predicting || !file}
              >
                {predicting ? (
                  <><span className="pred-spin"/>Predicting…</>
                ) : (
                  <>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                    </svg>
                    Predict Next Month
                  </>
                )}
              </button>

              {/* Cancel */}
              {predicting && (
                <button className="pred-cancel-btn" onClick={handleCancel}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                  Cancel
                </button>
              )}

              {/* File info */}
              {file && !predicting && (
                <div className="pred-file-info">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, color: "#22c55e" }}>
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                  </svg>
                  <span className="pred-file-name">{file.name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Progress bar */}
          {predicting && (
            <div className="pred-progress-wrap">
              <div className="pred-progress-label">
                <span>Running XGBoost prediction model…</span>
                <span className="pred-progress-pct">{progress}%</span>
              </div>
              <div className="pred-progress-track">
                <div className="pred-progress-bar" style={{ width: `${progress}%` }}/>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ══ RESULTS ══ */}
      {data.length > 0 && (
        <div className="pred-results">

          {/* Results header */}
          <div className="pred-results-head">
            <div>
              <h2 className="pred-results-title">Forecast Results</h2>
              {nextMonth && (
                <p className="pred-results-sub">
                  Predicted demand for&nbsp;
                  <span className="pred-results-sub-month">{nextMonth}</span>
                  &nbsp;·&nbsp;Generated {formatDate()}
                </p>
              )}
            </div>

            {/* Tabs */}
            <div className="pred-tabs">
              <button
                className={`pred-tab ${activeTab === "table" ? "pred-tab-active" : ""}`}
                onClick={() => setActiveTab("table")}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <line x1="3" y1="9" x2="21" y2="9"/>
                  <line x1="3" y1="15" x2="21" y2="15"/>
                  <line x1="9" y1="3" x2="9" y2="21"/>
                </svg>
                Table
              </button>
              <button
                className={`pred-tab ${activeTab === "analytics" ? "pred-tab-active" : ""}`}
                onClick={() => setActiveTab("analytics")}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="2" y1="12" x2="22" y2="12"/>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                </svg>
                Analytics
              </button>
            </div>
          </div>

          {/* ── TABLE TAB ── */}
          {activeTab === "table" && (
            <>
              <div className="pred-table-wrap">
                {/* Column headers */}
                <div className="pred-table-cols">
                  <span>#</span>
                  <span>Brand Name</span>
                  <span>Generic</span>
                  <span>Category</span>
                  <span>Last</span>
                  <span>Current</span>
                  <span>Reduced</span>
                  <span style={{ textAlign: "center" }}>Predicted ▲</span>
                </div>

                {/* Rows */}
                <div className="pred-table-body">
                  {data.map((row, idx) => {
                    const predicted = Number(row.predicted ?? 0);
                    const reduced   = Number(row.reduced   ?? 0);
                    const isHigh    = predicted > reduced * 1.2;
                    const isZero    = predicted === 0;

                    return (
                      <div
                        key={idx}
                        className={`pred-row ${idx % 2 === 0 ? "pred-row-even" : ""} ${isHigh ? "pred-row-high" : ""}`}
                        style={{ animationDelay: `${idx * 14}ms` }}
                      >
                        <span className="pred-row-num">{idx + 1}</span>
                        <span className="pred-row-brand">{row.brand_name ?? "—"}</span>
                        <span className="pred-row-generic">{row.generic_name ?? "—"}</span>
                        <span><span className="pred-cat-badge">{row.category ?? "—"}</span></span>
                        <span className="pred-row-num-val">{row.last ?? 0}</span>
                        <span className="pred-row-num-val">{row.current ?? 0}</span>
                        <span className={`pred-row-reduced ${reduced === 0 ? "pred-row-reduced-zero" : ""}`}>
                          {reduced > 0 ? `−${reduced}` : "0"}
                        </span>
                        <div className="pred-predicted-cell">
                          <span className={`pred-predicted-badge ${isZero ? "pred-predicted-zero" : isHigh ? "pred-predicted-high" : "pred-predicted-normal"}`}>
                            {isHigh && <span className="pred-arrow">▲</span>}
                            {predicted}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Legend */}
              <div className="pred-legend">
                <span><span className="pred-legend-green">▲</span> Higher than dispensed — reorder recommended</span>
                <span><span className="pred-legend-amber">−</span> Units consumed last period</span>
              </div>
            </>
          )}

          {/* ── ANALYTICS TAB ── */}
          {activeTab === "analytics" && <Analytics data={data} nextMonth={nextMonth} />}
        </div>
      )}

      {/* ── NO DATA EMPTY STATE ── */}
      {!predicting && data.length === 0 && !error && (
        <div className="pred-empty-state">
          <div className="pred-empty-icon">🧬</div>
          <p className="pred-empty-title">No Forecast Generated</p>
          <p className="pred-empty-sub">Upload your sales history file above and click "Predict Next Month" to generate an AI-powered demand forecast.</p>
        </div>
      )}

    </div>
  );
}