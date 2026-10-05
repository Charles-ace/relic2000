/**
 * Relic Dig 3026 — Client-Side Dig Certificate Generator
 * Generates an exportable archaeological certificate card entirely in the browser canvas.
 * Zero external libraries, zero backend requests.
 */

export function renderCertificateOnCanvas(canvas, relic, sealedMessage) {
  const width = 1200;
  const height = 800;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // 1. Background (Obsidian & Archeological Stratum)
  ctx.fillStyle = '#111116';
  ctx.fillRect(0, 0, width, height);

  // Subtle background survey grid
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
  ctx.lineWidth = 1;
  const gridSize = 40;
  for (let x = gridSize; x < width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = gridSize; y < height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // 2. Borders & Corner Datum Crosshairs
  const pad = 36;
  ctx.strokeStyle = '#e5a953';
  ctx.lineWidth = 2;
  ctx.strokeRect(pad, pad, width - pad * 2, height - pad * 2);

  // Inner accent line
  ctx.strokeStyle = 'rgba(229, 169, 83, 0.3)';
  ctx.lineWidth = 1;
  ctx.strokeRect(pad + 8, pad + 8, width - (pad + 8) * 2, height - (pad + 8) * 2);

  // Corner datum crosshairs
  const drawCornerCross = (x, y) => {
    ctx.strokeStyle = '#e5a953';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 12, y);
    ctx.lineTo(x + 12, y);
    ctx.moveTo(x, y - 12);
    ctx.lineTo(x, y + 12);
    ctx.stroke();
  };
  drawCornerCross(pad, pad);
  drawCornerCross(width - pad, pad);
  drawCornerCross(pad, height - pad);
  drawCornerCross(width - pad, height - pad);

  // 3. Header Section
  ctx.fillStyle = '#e5a953';
  ctx.font = '600 13px ui-monospace, Menlo, Monaco, Consolas, monospace';
  ctx.letterSpacing = '2px';
  ctx.fillText('EARTH SECTOR 7 // ARCHAEOLOGICAL SURVEY EXPEDITION', 72, 78);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 34px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('RELIC DIG 3026 — DISCOVERY CERTIFICATE', 72, 122);

  // Header separator line
  ctx.strokeStyle = 'rgba(229, 169, 83, 0.6)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(72, 142);
  ctx.lineTo(width - 72, 142);
  ctx.stroke();

  // 4. Specimen Metadata Block (Left Column)
  const colLeft = 72;
  const colWidth = 660;

  // Specimen ID Badge
  ctx.fillStyle = '#50d2e6';
  ctx.font = '700 13px ui-monospace, Menlo, Monaco, Consolas, monospace';
  ctx.fillText(`SPECIMEN ID: ${relic.specimenId || 'SPEC-3026'}`, colLeft, 175);

  // Discovered Relic Title
  ctx.fillStyle = '#f5f5f7';
  ctx.font = 'bold 26px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(relic.name || 'Recovered Relic', colLeft, 206);

  // Provenance
  ctx.fillStyle = '#9d9da8';
  ctx.font = '12px ui-monospace, Menlo, Monaco, Consolas, monospace';
  ctx.fillText(`PROVENANCE: ${relic.provenance || 'Tripo v3.1 Static Asset'}`, colLeft, 228);

  // Field Note Sub-block
  const fnBoxTop = 246;
  const fnBoxHeight = 152;
  ctx.fillStyle = 'rgba(20, 20, 26, 0.7)';
  ctx.fillRect(colLeft, fnBoxTop, colWidth, fnBoxHeight);
  ctx.strokeStyle = 'rgba(80, 210, 230, 0.5)';
  ctx.lineWidth = 1;
  ctx.strokeRect(colLeft, fnBoxTop, colWidth, fnBoxHeight);

  // Left colored vertical indicator bar
  ctx.fillStyle = '#50d2e6';
  ctx.fillRect(colLeft, fnBoxTop, 4, fnBoxHeight);

  ctx.fillStyle = '#50d2e6';
  ctx.font = '600 11px ui-monospace, Menlo, Monaco, Consolas, monospace';
  ctx.fillText('3026 FIELD NOTE // ANNOTATION:', colLeft + 16, fnBoxTop + 24);

  ctx.fillStyle = '#dfdfe6';
  ctx.font = 'italic 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  wrapText(ctx, relic.fieldNote || '', colLeft + 16, fnBoxTop + 48, colWidth - 32, 22);

  // 5. Sealed Message Block (Below Field Note)
  const msgBoxTop = 414;
  const msgBoxHeight = 175;

  ctx.fillStyle = 'rgba(25, 23, 18, 0.85)';
  ctx.fillRect(colLeft, msgBoxTop, colWidth, msgBoxHeight);
  ctx.strokeStyle = 'rgba(229, 169, 83, 0.6)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(colLeft, msgBoxTop, colWidth, msgBoxHeight);

  // Accent header tag for message
  ctx.fillStyle = '#e5a953';
  ctx.fillRect(colLeft, msgBoxTop, 4, msgBoxHeight);

  ctx.fillStyle = '#e5a953';
  ctx.font = '700 12px ui-monospace, Menlo, Monaco, Consolas, monospace';
  ctx.fillText('SEALED MESSAGE FROM THE GIVER // RECOVERED IN SITU', colLeft + 18, msgBoxTop + 26);

  // Sealed Message Text (Safe text wrapping)
  ctx.fillStyle = '#fffdfa';
  ctx.font = '500 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  wrapText(ctx, sealedMessage || '', colLeft + 18, msgBoxTop + 54, colWidth - 36, 24);

  // 6. Right Column: Archaeological Seal & Verification Stamp
  const sealCenterX = 960;
  const sealCenterY = 370;
  const sealRadius = 110;

  // Outer circular rings
  ctx.strokeStyle = '#e5a953';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(sealCenterX, sealCenterY, sealRadius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(229, 169, 83, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(sealCenterX, sealCenterY, sealRadius - 10, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(229, 169, 83, 0.2)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(sealCenterX, sealCenterY, sealRadius - 20, 0, Math.PI * 2);
  ctx.stroke();

  // Seal center emblem (Archaeological Sun / Compass Star)
  ctx.fillStyle = '#e5a953';
  const drawStar = (cx, cy, spikes, outerRadius, innerRadius) => {
    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y);
      rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.fill();
  };
  drawStar(sealCenterX, sealCenterY, 8, 32, 14);

  // Seal inner typography
  ctx.fillStyle = '#e5a953';
  ctx.font = '700 11px ui-monospace, Menlo, Monaco, Consolas, monospace';
  ctx.textAlign = 'center';
  ctx.fillText('• EARTH SECTOR 7 •', sealCenterX, sealCenterY - 55);
  ctx.fillText('AUTHENTIC RECOVERY', sealCenterX, sealCenterY + 65);
  ctx.font = '600 10px ui-monospace, Menlo, Monaco, Consolas, monospace';
  ctx.fillText('YEAR 3026 // EXPEDITION VERIFIED', sealCenterX, sealCenterY + 80);
  ctx.textAlign = 'left'; // Reset

  // In-situ excavation details below seal
  ctx.fillStyle = '#9d9da8';
  ctx.font = '11px ui-monospace, Menlo, Monaco, Consolas, monospace';
  const vLeft = 820;
  ctx.fillText('EXCAVATION DEPTH: 4.8 METERS // SECTOR 7', vLeft, 530);
  ctx.fillText('GEOLOGICAL STRATUM: SILTSTONE MATRIX', vLeft, 552);
  ctx.fillText('STATUS: EXPEDITION LOG SEALED', vLeft, 574);
  ctx.fillText('AUTHENTICITY: TRIPO 3.1 PBR GEOMETRY', vLeft, 596);

  // 7. Footer Bar
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(72, height - 85);
  ctx.lineTo(width - 72, height - 85);
  ctx.stroke();

  ctx.fillStyle = '#9d9da8';
  ctx.font = '11px ui-monospace, Menlo, Monaco, Consolas, monospace';
  ctx.fillText(`DISCOVERY CERTIFICATE // RELIC: ${relic.id.toUpperCase()} // 3026.10`, 72, height - 58);
  ctx.textAlign = 'right';
  ctx.fillText('OFFICIAL CERTIFICATE CARD — CLIENT-SIDE EXPORT ONLY', width - 72, height - 58);
  ctx.textAlign = 'left';
}

/**
 * Utility to wrap text cleanly within a bounding width on HTML5 canvas.
 */
function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  if (!text) return;
  const words = String(text).split(' ');
  let line = '';
  let curY = y;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line.trim(), x, curY);
      line = words[n] + ' ';
      curY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line.trim(), x, curY);
}

/**
 * Client-side download trigger for the certificate canvas image.
 */
export function downloadCertificateCanvas(canvas, filename = 'relic-dig-3026-certificate.png') {
  const dataUrl = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
