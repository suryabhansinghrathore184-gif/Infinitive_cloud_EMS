/**
 * Export Helper Utility
 * CSV, Excel XML/XLS, and Printable PDF formatting utilities
 */

export function escapeCSV(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

export function generateCSV(headers: string[], rows: any[][]): string {
  const headerRow = headers.map(escapeCSV).join(',');
  const dataRows = rows.map((row) => row.map(escapeCSV).join(','));
  // Prepend UTF-8 BOM for Excel UTF-8 compatibility
  return '\uFEFF' + [headerRow, ...dataRows].join('\r\n');
}

export function generateExcelXML(
  title: string,
  filters: Record<string, string>,
  headers: string[],
  rows: any[][]
): string {
  const generatedAt = new Date().toLocaleString();
  const filterList = Object.entries(filters)
    .filter(([_, v]) => Boolean(v))
    .map(([k, v]) => `${k}: ${v}`)
    .join(' | ');

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Bottom"/>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#000000"/>
  </Style>
  <Style ss:ID="TitleStyle">
   <Font ss:FontName="Calibri" ss:Size="16" ss:Bold="1" ss:Color="#1E293B"/>
  </Style>
  <Style ss:ID="SubTitleStyle">
   <Font ss:FontName="Calibri" ss:Size="10" ss:Italic="1" ss:Color="#64748B"/>
  </Style>
  <Style ss:ID="HeaderStyle">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#1E293B" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="DataStyle">
   <Alignment ss:Vertical="Center"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="${title.slice(0, 30).replace(/[/\\?*:[\]]/g, '')}">
  <Table>
   <Row ss:Height="25">
    <Cell ss:StyleID="TitleStyle"><Data ss:Type="String">${escapeXml(title)}</Data></Cell>
   </Row>
   <Row ss:Height="18">
    <Cell ss:StyleID="SubTitleStyle"><Data ss:Type="String">Generated: ${escapeXml(generatedAt)}${filterList ? ' | Filters: ' + escapeXml(filterList) : ''}</Data></Cell>
   </Row>
   <Row ss:Height="10"></Row>
   <Row ss:Height="22">
${headers.map((h) => `    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">${escapeXml(h)}</Data></Cell>`).join('\n')}
   </Row>
`;

  rows.forEach((row) => {
    xml += `   <Row ss:Height="18">\n`;
    row.forEach((cell) => {
      const isNum = typeof cell === 'number' && !isNaN(cell);
      const cellVal = cell === null || cell === undefined ? '' : String(cell);
      xml += `    <Cell ss:StyleID="DataStyle"><Data ss:Type="${isNum ? 'Number' : 'String'}">${escapeXml(cellVal)}</Data></Cell>\n`;
    });
    xml += `   </Row>\n`;
  });

  xml += `  </Table>
 </Worksheet>
</Workbook>`;

  return xml;
}

function escapeXml(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function downloadFile(content: string, fileName: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function printReport(
  title: string,
  filters: Record<string, string>,
  summaryMetrics: { label: string; value: string | number }[],
  headers: string[],
  rows: any[][]
) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const generatedAt = new Date().toLocaleString();
  const filterList = Object.entries(filters)
    .filter(([_, v]) => Boolean(v))
    .map(([k, v]) => `<span class="tag"><strong>${k}:</strong> ${v}</span>`)
    .join(' ');

  const html = `<!DOCTYPE html>
<html>
<head>
  <title>${title} - Report</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 30px; color: #1e293b; }
    .header { border-b: 2px solid #e2e8f0; padding-bottom: 15px; margin-bottom: 20px; }
    h1 { margin: 0 0 5px 0; font-size: 22px; color: #0f172a; }
    .meta { font-size: 11px; color: #64748b; margin-top: 4px; }
    .tag { display: inline-block; background: #f1f5f9; border: 1px solid #cbd5e1; padding: 2px 8px; border-radius: 6px; margin-right: 5px; }
    .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px; margin-bottom: 25px; }
    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; }
    .card-label { font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: 600; }
    .card-val { font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 11px; }
    th { background: #0f172a; color: #ffffff; text-align: left; padding: 8px 10px; font-weight: 600; }
    td { border-bottom: 1px solid #e2e8f0; padding: 8px 10px; }
    tr:nth-child(even) { background: #f8fafc; }
    @media print {
      body { padding: 0; }
      button { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${title}</h1>
    <div class="meta">Generated on ${generatedAt}</div>
    ${filterList ? `<div class="meta" style="margin-top:8px;">${filterList}</div>` : ''}
  </div>

  ${
    summaryMetrics.length > 0
      ? `<div class="summary-grid">
          ${summaryMetrics
            .map(
              (m) => `
            <div class="card">
              <div class="card-label">${m.label}</div>
              <div class="card-val">${m.value}</div>
            </div>
          `
            )
            .join('')}
        </div>`
      : ''
  }

  <table>
    <thead>
      <tr>
        ${headers.map((h) => `<th>${h}</th>`).join('')}
      </tr>
    </thead>
    <tbody>
      ${rows
        .map(
          (row) => `
        <tr>
          ${row.map((c) => `<td>${c === null || c === undefined ? '' : String(c)}</td>`).join('')}
        </tr>
      `
        )
        .join('')}
    </tbody>
  </table>

  <script>
    window.onload = function() { window.print(); }
  </script>
</body>
</html>`;

  printWindow.document.write(html);
  printWindow.document.close();
}
