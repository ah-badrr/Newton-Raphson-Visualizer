// ========================================
// Newton-Raphson Solver - Main JavaScript
// ========================================

const form = document.getElementById('nrForm');
const banner = document.getElementById('banner');
const output = document.getElementById('output');
const fxDisplay = document.getElementById('fxDisplay');
const dfxDisplay = document.getElementById('dfxDisplay');
const iterationFormula = document.getElementById('iterationFormula');
const tableBody = document.getElementById('tableBody');
const conclusion = document.getElementById('conclusion');
const downloadCsvBtn = document.getElementById('downloadCsvBtn');

let nrChart = null;
let lastRows = [];
let lastConverged = false;
let lastFinalX = null;
let lastFinalIter = 0;

function showToast(type, message, duration = 5000) {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');

  const config = {
    success: {
      bg: 'bg-emerald-500',
      border: 'border-emerald-600',
      icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>'
    },
    error: {
      bg: 'bg-red-500',
      border: 'border-red-600',
      icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>'
    },
    warning: {
      bg: 'bg-amber-500',
      border: 'border-amber-600',
      icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01M4.93 19h14.14a2 2 0 001.74-3L13.74 4a2 2 0 00-3.48 0L3.2 16a2 2 0 001.73 3z"/>'
    },
    info: {
      bg: 'bg-indigo-600',
      border: 'border-indigo-700',
      icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>'
    }
  };

  const c = config[type] || config.info;

  toast.className = `pointer-events-auto relative overflow-hidden rounded-lg border ${c.border} ${c.bg} shadow-2xl toast-enter`;
  toast.innerHTML = `
    <div class="flex items-start gap-3 p-4 pr-10">
      <div class="flex-shrink-0 mt-0.5">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          ${c.icon}
        </svg>
      </div>
      <div class="flex-1 text-sm text-white font-medium leading-snug">${message}</div>
      <button class="toast-close absolute top-2 right-2 text-white/80 hover:text-white transition" aria-label="Tutup">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>
    <div class="h-1 bg-white/30 toast-progress" style="animation-duration: ${duration}ms"></div>
  `;

  container.appendChild(toast);

  const closeBtn = toast.querySelector('.toast-close');
  const dismiss = () => {
    toast.classList.remove('toast-enter');
    toast.classList.add('toast-exit');
    setTimeout(() => toast.remove(), 300);
  };
  closeBtn.addEventListener('click', dismiss);
  setTimeout(dismiss, duration);
}

function renderMath(element, latex, displayMode = false) {
  if (typeof katex === 'undefined') {
    element.textContent = latex;
    return;
  }
  try {
    katex.render(latex, element, {
      throwOnError: false,
      displayMode: displayMode,
      output: 'html'
    });
  } catch (err) {
    element.textContent = latex;
  }
}

function nodeToLatex(node) {
  let tex = node.toTex({ parenthesis: 'keep' });
  tex = tex.replace(/\\left\s*/g, '').replace(/\\right\s*/g, '');
  return tex;
}

function showBanner(type, message) {
  const styles = {
    error:   'bg-rose-50 border-rose-300 text-rose-800',
    warning: 'bg-amber-50 border-amber-300 text-amber-800',
    success: 'bg-emerald-50 border-emerald-300 text-emerald-800'
  };
  banner.className = `mt-6 px-5 py-4 rounded-xl border ${styles[type]} fade-in`;
  banner.innerHTML = message;
  banner.classList.remove('hidden');
}

function hideBanner() {
  banner.classList.add('hidden');
}

function fmt(n) {
  if (!isFinite(n)) return String(n);
  if (n === 0) return '0';
  const abs = Math.abs(n);
  if (abs < 1e-6 || abs >= 1e8) return n.toExponential(6);
  return parseFloat(n.toPrecision(8)).toString();
}

function fmtShort(n) {
  if (!isFinite(n)) return String(n);
  if (n === 0) return '0';
  const abs = Math.abs(n);
  if (abs < 1e-4 || abs >= 1e6) return n.toExponential(3);
  return parseFloat(n.toPrecision(5)).toString();
}

function escapeCsvValue(val) {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (/[";\n\r]/.test(str)) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

function formatNumber(num) {
  if (!isFinite(num)) return '';
  if (num === 0) return '0.00000000';
  return parseFloat(num).toFixed(8);
}

function downloadCSV(rows, fxRaw, x0, tol, converged, finalX, finalIter) {
  if (!rows || rows.length === 0) {
    showToast('warning', 'Tidak ada data iterasi untuk diunduh.');
    return;
  }

  const DELIM = ';';
  const BOM = '\uFEFF';
  const csvRows = [];

  csvRows.push('Laporan Analisis Newton-Raphson');
  csvRows.push('Tanggal' + DELIM + escapeCsvValue(new Date().toLocaleString('id-ID')));
  csvRows.push('Fungsi f(x)' + DELIM + escapeCsvValue(fxRaw));
  csvRows.push('Tebakan Awal (x0)' + DELIM + formatNumber(x0));
  csvRows.push('Toleransi Error' + DELIM + formatNumber(tol));

  let statusText;
  if (converged && finalX !== null && isFinite(finalX)) {
    statusText = `Akar ditemukan pada x = ${formatNumber(finalX)} dalam ${finalIter} iterasi`;
  } else {
    statusText = `Belum konvergen setelah ${rows.length} iterasi (maksimum tercapai)`;
  }
  csvRows.push('Status' + DELIM + escapeCsvValue(statusText));

  csvRows.push('');

  const headers = ['Iterasi (n)', 'x_n', 'f(x_n)', 'f\'(x_n)', 'x_{n+1}', 'Error'];
  csvRows.push(headers.map(escapeCsvValue).join(DELIM));

  rows.forEach(r => {
    const row = [
      r.n,
      formatNumber(r.xn),
      formatNumber(r.fx),
      formatNumber(r.dfx),
      formatNumber(r.xnext),
      formatNumber(r.err)
    ];
    csvRows.push(row.map(escapeCsvValue).join(DELIM));
  });

  const csvContent = BOM + csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `laporan-iterasi-${timestamp}.csv`;

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => URL.revokeObjectURL(url), 1000);

  showToast('success', `Laporan CSV berhasil diunduh: <span class="font-mono text-xs">${filename}</span>`);
}

downloadCsvBtn.addEventListener('click', () => {
  const fxRaw = document.getElementById('fx').value.trim();
  const x0 = parseFloat(document.getElementById('x0').value);
  const tol = parseFloat(document.getElementById('tol').value);
  downloadCSV(lastRows, fxRaw, x0, tol, lastConverged, lastFinalX, lastFinalIter);
});

function renderChart(rows, fEval, x0, finalX, converged) {
  const ctx = document.getElementById('nrChart').getContext('2d');

  const allX = rows.map(r => r.xn).concat(rows.map(r => r.xnext).filter(isFinite));
  if (finalX !== null && isFinite(finalX)) allX.push(finalX);
  allX.push(x0);

  let xMin = Math.min(...allX);
  let xMax = Math.max(...allX);
  if (xMin === xMax) { xMin -= 2; xMax += 2; }
  const margin = (xMax - xMin) * 0.25;
  xMin -= margin; xMax += margin;

  const steps = 300;
  const curveData = [];
  let yMin = Infinity, yMax = -Infinity;
  for (let i = 0; i <= steps; i++) {
    const x = xMin + (xMax - xMin) * i / steps;
    let y;
    try { y = fEval.evaluate({ x }); } catch { y = NaN; }
    if (isFinite(y)) {
      curveData.push({ x, y });
      if (y < yMin) yMin = y;
      if (y > yMax) yMax = y;
    }
  }

  if (yMax - yMin > 50) {
    const mid = (yMax + yMin) / 2;
    const span = 25;
    yMin = mid - span; yMax = mid + span;
  }
  const yMargin = (yMax - yMin) * 0.15;
  yMin -= yMargin; yMax += yMargin;

  const iterPoints = rows.map(r => ({ x: r.xn, y: r.fx }));

  const tangentDatasets = [];
  const maxTangents = Math.min(rows.length, 15);
  for (let i = 0; i < maxTangents; i++) {
    const r = rows[i];
    if (!isFinite(r.xnext)) continue;
    const alpha = 0.9 - (i / maxTangents) * 0.5;
    tangentDatasets.push({
      label: `Garis singgung iterasi ${r.n}`,
      data: [{ x: r.xn, y: r.fx }, { x: r.xnext, y: 0 }],
      borderColor: `rgba(249, 115, 22, ${alpha})`,
      backgroundColor: `rgba(249, 115, 22, ${alpha * 0.3})`,
      borderWidth: 1.5,
      borderDash: [5, 4],
      pointRadius: 0,
      showLine: true,
      fill: false,
      tension: 0
    });
  }

  const rootPoint = converged && finalX !== null && isFinite(finalX)
    ? [{ x: finalX, y: 0 }]
    : [];

  if (nrChart) nrChart.destroy();

  nrChart = new Chart(ctx, {
    type: 'scatter',
    data: {
      datasets: [
        {
          label: 'Kurva f(x)',
          data: curveData,
          borderColor: 'rgb(79, 70, 229)',
          backgroundColor: 'rgba(79, 70, 229, 0.1)',
          borderWidth: 2.5,
          pointRadius: 0,
          showLine: true,
          fill: false,
          tension: 0.2,
          order: 2
        },
        ...tangentDatasets,
        {
          label: 'Titik iterasi (xₙ, f(xₙ))',
          data: iterPoints,
          borderColor: 'rgb(249, 115, 22)',
          backgroundColor: 'rgba(249, 115, 22, 0.9)',
          borderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 9,
          showLine: false,
          order: 1
        },
        {
          label: 'Akar akhir',
          data: rootPoint,
          borderColor: 'rgb(225, 29, 72)',
          backgroundColor: 'rgba(225, 29, 72, 1)',
          borderWidth: 2.5,
          pointRadius: 9,
          pointHoverRadius: 12,
          pointStyle: 'rectRot',
          showLine: false,
          order: 0
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'nearest', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(255, 255, 255, 0.98)',
          borderColor: 'rgba(99, 102, 241, 0.3)',
          borderWidth: 1,
          titleColor: '#1e293b',
          bodyColor: '#475569',
          padding: 10,
          callbacks: {
            title: (items) => items[0].dataset.label,
            label: (ctx) => `x = ${fmtShort(ctx.parsed.x)}, y = ${fmtShort(ctx.parsed.y)}`
          }
        }
      },
      scales: {
        x: {
          type: 'linear', min: xMin, max: xMax,
          title: { display: true, text: 'Sumbu x', color: '#334155', font: { size: 12, weight: '600' } },
          grid: { color: 'rgba(148, 163, 184, 0.2)' },
          ticks: { color: '#475569' }
        },
        y: {
          type: 'linear', min: yMin, max: yMax,
          title: { display: true, text: 'f(x)', color: '#334155', font: { size: 12, weight: '600' } },
          grid: { color: 'rgba(148, 163, 184, 0.2)' },
          ticks: { color: '#475569' }
        }
      }
    },
    plugins: [{
      id: 'axisLines',
      beforeDraw: (chart) => {
        const { ctx, chartArea, scales } = chart;
        ctx.save();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = 'rgba(100, 116, 139, 0.4)';
        if (scales.y.min <= 0 && scales.y.max >= 0) {
          const y0 = scales.y.getPixelForValue(0);
          ctx.beginPath();
          ctx.moveTo(chartArea.left, y0);
          ctx.lineTo(chartArea.right, y0);
          ctx.stroke();
        }
        if (scales.x.min <= 0 && scales.x.max >= 0) {
          const x0 = scales.x.getPixelForValue(0);
          ctx.beginPath();
          ctx.moveTo(x0, chartArea.top);
          ctx.lineTo(x0, chartArea.bottom);
          ctx.stroke();
        }
        ctx.restore();
      }
    }]
  });
}

function renderAnalysis(rows, finalX, converged, fEval, dfEval, d2fEval, fxRaw, x0, tol, maxIter) {
  const summary = document.getElementById('summaryText');
  const convergence = document.getElementById('convergenceText');
  const characteristic = document.getElementById('characteristicText');
  const warning = document.getElementById('warningText');

  if (converged && finalX !== null && isFinite(finalX)) {
    let fAtRoot;
    try { fAtRoot = fEval.evaluate({ x: finalX }); } catch { fAtRoot = NaN; }
    summary.innerHTML = `
      <p>Akar yang diprediksi adalah <span class="mono text-indigo-700">x ≈ ${fmt(finalX)}</span> dalam
         <strong>${rows.length}</strong> iterasi.</p>
      <p>Nilai fungsi di akar: <span class="mono text-indigo-700">f(${fmtShort(finalX)}) ≈ ${fmt(fAtRoot)}</span>
         ${Math.abs(fAtRoot) < 1e-8 ? '— nilai ini <em>sangat mendekati nol</em> ✓' : '— mendekati nol.'}</p>
      <p>Tebakan awal <span class="mono text-indigo-700">x₀ = ${fmt(x0)}</span> dengan toleransi
         <span class="mono text-indigo-700">ε = ${tol}</span> berhasil menghasilkan konvergensi.</p>
    `;
  } else {
    summary.innerHTML = `
      <p>Metode <strong>belum konvergen</strong> setelah ${rows.length} iterasi (maksimum = ${maxIter}).</p>
      <p>Perkiraan terakhir: <span class="mono text-indigo-700">x ≈ ${fmt(rows[rows.length-1]?.xnext ?? x0)}</span>.</p>
      <p>Cobalah ubah tebakan awal atau naikkan batas iterasi.</p>
    `;
  }

  let convergenceHTML = '';
  if (converged && rows.length >= 2) {
    const errors = rows.map(r => r.err).filter(isFinite);
    const nIter = rows.length;

    const ratios = [];
    for (let i = 0; i < errors.length - 1; i++) {
      if (errors[i] > 1e-14) {
        ratios.push(errors[i+1] / (errors[i] * errors[i]));
      }
    }

    let orderType = '', orderDesc = '';
    if (nIter <= 4) {
      orderType = 'sangat cepat (konvergensi kuadratik)';
      orderDesc = `Hanya <strong>${nIter} iterasi</strong> dibutuhkan — ini adalah ciri khas konvergensi kuadratik Newton-Raphson, di mana jumlah digit benar kira-kira <em>berdua kali lipat</em> setiap iterasi.`;
    } else if (nIter <= 8) {
      orderType = 'cepat';
      orderDesc = `Dibutuhkan <strong>${nIter} iterasi</strong> — metode bekerja dengan baik, menunjukkan penurunan error yang signifikan di setiap langkah.`;
    } else {
      orderType = 'relatif lambat';
      orderDesc = `Dibutuhkan <strong>${nIter} iterasi</strong> — konvergensi lebih lambat dari biasanya. Hal ini bisa terjadi jika tebakan awal kurang ideal, akar bersifat multi (turunan mendekati nol di akar), atau fungsi memiliki kelengkungan tinggi.`;
    }

    convergenceHTML = `
      <p>Metode Newton-Raphson secara teori memiliki <strong>konvergensi kuadratik</strong> (orde 2) untuk akar sederhana. Untuk persamaan ini, laju konvergensinya tergolong <strong>${orderType}</strong>.</p>
      <p>${orderDesc}</p>
      ${ratios.length > 0 ? `
        <p>Rasio konvergensi kuadratik <span class="mono text-indigo-700">|e<sub>n+1</sub>| / |e<sub>n</sub>|²</span>
        pada iterasi akhir ≈ <span class="mono text-indigo-700">${fmtShort(ratios[ratios.length-1])}</span>
        ${ratios.length > 1 ? `(cenderung konstan ≈ ${fmtShort(ratios[ratios.length-1])})` : ''} —
        mengonfirmasi perilaku kuadratik.</p>
      ` : ''}
    `;
  } else if (!converged) {
    convergenceHTML = `
      <p>Metode <strong>tidak konvergen</strong> dalam batas iterasi yang diizinkan.</p>
      <p>Perhatikan pada tabel bahwa error tidak menurun secara monoton — ini mengindikasikan bahwa tebakan awal mungkin berada di wilayah yang kurang menguntungkan (misalnya dekat titik stasioner atau di luar basin of attraction akar).</p>
    `;
  } else {
    convergenceHTML = `<p>Konvergen dalam satu iterasi — tebakan awal sudah sangat dekat dengan akar.</p>`;
  }
  convergence.innerHTML = convergenceHTML;

  let charHTML = '';
  if (finalX !== null && isFinite(finalX)) {
    let dfAtRoot, d2fAtRoot;
    try { dfAtRoot = dfEval.evaluate({ x: finalX }); } catch { dfAtRoot = NaN; }
    try { d2fAtRoot = d2fEval ? d2fEval.evaluate({ x: finalX }) : NaN; } catch { d2fAtRoot = NaN; }

    const absDf = Math.abs(dfAtRoot);
    let slopeDesc, slopeColor;
    if (absDf < 0.05) { slopeDesc = 'sangat kecil (mendekati nol)'; slopeColor = 'text-rose-700'; }
    else if (absDf < 0.5) { slopeDesc = 'relatif kecil'; slopeColor = 'text-amber-700'; }
    else if (absDf < 3) { slopeDesc = 'sedang (ideal)'; slopeColor = 'text-emerald-700'; }
    else { slopeDesc = 'besar (curam)'; slopeColor = 'text-indigo-700'; }

    let curvatureDesc = '';
    if (isFinite(d2fAtRoot)) {
      if (Math.abs(d2fAtRoot) < 0.1) curvatureDesc = 'Kurva hampir linear di sekitar akar (turunan kedua ≈ 0) — kondisi ideal untuk Newton-Raphson.';
      else if (Math.abs(d2fAtRoot) < 2) curvatureDesc = 'Kurva memiliki kelengkungan sedang di sekitar akar — metode bekerja dengan baik.';
      else curvatureDesc = 'Kurva memiliki kelengkungan tinggi di sekitar akar — konvergensi bisa sedikit melambat karena pendekatan linear menjadi kurang akurat.';
    }

    charHTML = `
      <p>Nilai turunan pertama di akar: <span class="mono text-indigo-700">f'(${fmtShort(finalX)}) ≈ ${fmtShort(dfAtRoot)}</span>
         — tergolong <span class="${slopeColor} font-semibold">${slopeDesc}</span>.</p>
      <p>${absDf < 0.1
        ? '⚠️ Karena f\'(x) mendekati nol di akar, akar ini bersifat <em>ganda/multi</em>. Newton-Raphson pada akar multi hanya konvergen <strong>linear</strong>, bukan kuadratik. Pertimbangkan modifikasi metode jika akurasi tinggi dibutuhkan.'
        : 'Karena f\'(x) tidak mendekati nol, akar bersifat <em>sederhana</em> — syarat ideal untuk konvergensi kuadratik Newton-Raphson terpenuhi.'
      }</p>
      ${curvatureDesc ? `<p>${curvatureDesc}</p>` : ''}
    `;
  } else {
    charHTML = `<p>Tidak dapat menganalisis karakteristik karena metode tidak konvergen ke suatu akar.</p>`;
  }
  characteristic.innerHTML = charHTML;

  const warnHTML = `
    <p class="bullet">Newton-Raphson <strong>gagal</strong> jika <span class="mono text-indigo-700">f'(x<sub>n</sub>) = 0</span>
       pada iterasi manapun (terjadi pembagian dengan nol). Pada grafik, hal ini terlihat sebagai titik singgung horizontal.</p>
    <p class="bullet">Jika grafik menunjukkan kurva <strong>mendatar</strong> di sekitar tebakan awal,
       cobalah <span class="mono text-indigo-700">x₀</span> yang berbeda agar garis singgung memotong sumbu-x lebih dekat ke akar.</p>
    <p class="bullet">Untuk fungsi dengan <strong>banyak ekstrem lokal</strong> (seperti trigonometri atau polinomial derajat tinggi),
       metode bisa konvergen ke akar yang tidak diharapkan, atau bahkan <em>divergen</em> (berosilasi tak menentu).</p>
    <p class="bullet">Teorema konvergensi lokal menjamin Newton-Raphson konvergen jika
       <span class="mono text-indigo-700">x₀</span> cukup dekat ke akar sederhana dan <span class="mono text-indigo-700">f'(x) ≠ 0</span> di sekitar akar.</p>
  `;
  warning.innerHTML = warnHTML;
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  hideBanner();
  output.classList.add('hidden');
  tableBody.innerHTML = '';
  lastRows = [];
  downloadCsvBtn.disabled = true;

  const fxRaw = document.getElementById('fx').value.trim();
  const x0    = parseFloat(document.getElementById('x0').value);
  const tol   = parseFloat(document.getElementById('tol').value);
  const maxIter = parseInt(document.getElementById('maxIter').value, 10);

  if (!fxRaw) {
    showToast('error', 'Fungsi f(x) tidak boleh kosong. Silakan isi terlebih dahulu.');
    return;
  }
  if (isNaN(x0)) {
    showToast('error', 'Tebakan awal x₀ harus berupa angka yang valid.');
    return;
  }
  if (isNaN(tol) || tol <= 0) {
    showToast('error', 'Toleransi error harus berupa angka positif.');
    return;
  }
  if (isNaN(maxIter) || maxIter < 1) {
    showToast('error', 'Maksimum iterasi harus bilangan bulat ≥ 1.');
    return;
  }

  let expr, dExpr, d2Expr;
  try {
    expr = math.parse(fxRaw);
    dExpr = math.derivative(expr, 'x');
    try { d2Expr = math.derivative(dExpr, 'x'); } catch { d2Expr = null; }
  } catch (err) {
    showToast('error', `Fungsi tidak valid: <span class="font-mono text-xs">${err.message}</span>`);
    return;
  }

  const fEval  = expr.compile();
  const dfEval = dExpr.compile();
  const d2fEval = d2Expr ? d2Expr.compile() : null;

  const fxLatex  = `f(x) = ${nodeToLatex(expr)}`;
  const dfxLatex = `f'(x) = ${nodeToLatex(dExpr)}`;
  const iterLatex = `x_{n+1} = x_n - \\frac{f(x_n)}{f'(x_n)}`;

  renderMath(fxDisplay, fxLatex);
  renderMath(dfxDisplay, dfxLatex);
  renderMath(iterationFormula, iterLatex, true);

  const rows = [];
  let x = x0;
  let converged = false;
  let finalIter = 0;
  let stoppedReason = '';
  let finalX = null;
  let failureType = null;

  for (let n = 0; n < maxIter; n++) {
    let fx, dfx;
    try {
      fx  = fEval.evaluate({ x });
      dfx = dfEval.evaluate({ x });
    } catch (err) {
      stoppedReason = `Evaluasi fungsi gagal pada iterasi ke-${n+1}.`;
      failureType = 'eval_error';
      break;
    }

    if (!isFinite(fx) || !isFinite(dfx)) {
      stoppedReason = `Nilai tak hingga/NaN terdeteksi pada iterasi ke-${n+1}.`;
      failureType = 'nan';
      break;
    }

    if (Math.abs(dfx) < 1e-14) {
      stoppedReason = `Gradien mendatar (f'(x) ≈ 0) pada iterasi ke-${n+1} di x = ${fmt(x)}.`;
      failureType = 'zero_derivative';
      rows.push({ n: n+1, xn: x, fx, dfx, xnext: NaN, err: NaN });
      break;
    }

    const xnext = x - fx / dfx;
    const err = Math.abs(xnext - x);
    rows.push({ n: n+1, xn: x, fx, dfx, xnext, err });
    finalIter = n + 1;

    if (err < tol) {
      converged = true;
      finalX = xnext;
      break;
    }
    x = xnext;
  }

  if (!converged && !failureType) {
    failureType = 'max_iter';
    stoppedReason = `Maksimum iterasi (${maxIter}) tercapai tanpa memenuhi toleransi.`;
  }

  rows.forEach((r, idx) => {
    const tr = document.createElement('tr');
    tr.className = idx % 2 === 0 ? 'bg-white' : 'bg-slate-50';
    tr.classList.add('hover:bg-indigo-50', 'transition-colors');
    tr.innerHTML = `
      <td class="px-4 py-3 font-semibold text-indigo-700">${r.n}</td>
      <td class="px-4 py-3 mono text-slate-800">${fmt(r.xn)}</td>
      <td class="px-4 py-3 mono text-slate-700">${fmt(r.fx)}</td>
      <td class="px-4 py-3 mono text-slate-700">${fmt(r.dfx)}</td>
      <td class="px-4 py-3 mono text-slate-900 font-medium">${isFinite(r.xnext) ? fmt(r.xnext) : '—'}</td>
      <td class="px-4 py-3 mono ${r.err < tol ? 'text-emerald-700 font-semibold' : 'text-slate-600'}">${isFinite(r.err) ? fmt(r.err) : '—'}</td>
    `;
    tableBody.appendChild(tr);
  });

  lastRows = rows;
  lastConverged = converged;
  lastFinalX = finalX;
  lastFinalIter = finalIter;
  if (rows.length > 0) downloadCsvBtn.disabled = false;

  renderChart(rows, fEval, x0, finalX, converged);
  renderAnalysis(rows, finalX, converged, fEval, dfEval, d2fEval, fxRaw, x0, tol, maxIter);

  conclusion.classList.remove('hidden');
  if (converged) {
    conclusion.className = 'rounded-2xl p-6 border bg-emerald-50 border-emerald-300 text-emerald-900 fade-in';
    conclusion.innerHTML = `
      <div class="flex items-start gap-3">
        <div class="mt-1 w-6 h-6 rounded-full bg-emerald-100 border border-emerald-400 flex items-center justify-center flex-shrink-0">
          <svg class="w-4 h-4 text-emerald-700" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
        </div>
        <div>
          <div class="font-semibold text-emerald-900 text-lg">✓ Konvergen — Akar Ditemukan</div>
          <div class="mt-2 mono text-slate-900">
            x ≈ <span class="text-emerald-800 font-bold">${fmt(finalX)}</span>
          </div>
          <div class="text-sm text-emerald-800 mt-1">
            Dicapai setelah <span class="font-semibold">${finalIter}</span> iterasi dengan error ${fmt(rows[rows.length-1].err)} &lt; ε = ${tol}.
          </div>
        </div>
      </div>
    `;
    showToast('success', `Akar berhasil ditemukan pada <span class="font-mono">x ≈ ${fmtShort(finalX)}</span> setelah ${finalIter} iterasi.`);
  } else {
    conclusion.className = 'rounded-2xl p-6 border bg-amber-50 border-amber-300 text-amber-900 fade-in';
    conclusion.innerHTML = `
      <div class="flex items-start gap-3">
        <div class="mt-1 w-6 h-6 rounded-full bg-amber-100 border border-amber-400 flex items-center justify-center flex-shrink-0">
          <svg class="w-4 h-4 text-amber-700" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01M4.93 19h14.14a2 2 0 001.74-3L13.74 4a2 2 0 00-3.48 0L3.2 16a2 2 0 001.73 3z"/></svg>
        </div>
        <div>
          <div class="font-semibold text-amber-900 text-lg">⚠ Belum Konvergen</div>
          <div class="mt-1 text-sm text-amber-800">${stoppedReason}</div>
          <div class="text-sm text-amber-800 mt-1">
            Cobalah tebakan awal <span class="mono">x₀</span> yang lebih dekat ke akar, atau naikkan jumlah iterasi maksimum.
          </div>
        </div>
      </div>
    `;

    if (failureType === 'zero_derivative') {
      showToast('error', 'Kalkulasi terhenti: <strong>gradien mendatar</strong> (pembagian dengan nol). Silakan coba tebakan awal yang berbeda.', 6000);
    } else if (failureType === 'nan' || failureType === 'eval_error') {
      showToast('error', 'Kalkulasi terhenti: fungsi menghasilkan nilai tak terdefinisi. Periksa domain fungsi atau ubah x₀.', 6000);
    } else if (failureType === 'max_iter') {
      showToast('warning', `Belum konvergen setelah ${maxIter} iterasi. Metode mungkin divergen atau butuh x₀ yang lebih baik.`, 6000);
    }
  }

  output.classList.remove('hidden');
  setTimeout(() => output.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
});

window.addEventListener('load', () => {
  setTimeout(() => {
    showToast('info', 'Selamat datang! Masukkan fungsi f(x) dan klik <strong>Hitung & Visualisasikan</strong> untuk memulai.', 4500);
  }, 600);
});