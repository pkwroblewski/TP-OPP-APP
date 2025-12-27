import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import Excel from 'exceljs';

export const dynamic = 'force-dynamic';

export async function GET(_: Request, { params }: { params: { filingId: string } }) {
  const supabase = createRouteHandlerClient({ cookies });
  const filingId = Number(params.filingId);

  const { data: lines, error: lErr } = await supabase
    .from('statement_line')
    .select('id, caption, ref_code, period, value, unit, status, statement:statement_id(filing_id)')
    .eq('statement.filing_id', filingId);
  if (lErr) return new Response(lErr.message, { status: 500 });

  const { data: evid, error: eErr } = await supabase
    .from('datum_anchor')
    .select('datum_id, anchor:anchor_id(page, snippet, bbox)')
    .in('datum_table', ['statement_line']);
  if (eErr) return new Response(eErr.message, { status: 500 });

  const wb = new Excel.Workbook();
  const f = wb.addWorksheet('Findings');
  f.columns = [
    { header: 'Caption', key: 'caption' },
    { header: 'Ref Code', key: 'ref' },
    { header: 'Period', key: 'period' },
    { header: 'Value', key: 'value' },
    { header: 'Unit', key: 'unit' },
    { header: 'Status', key: 'status' }
  ];
  f.addRows((lines || []).map((r: any) => ({
    caption: r.caption, ref: r.ref_code, period: r.period === 0 ? 'current' : 'previous',
    value: r.value, unit: r.unit, status: r.status
  })));

  const e = wb.addWorksheet('Evidence');
  e.columns = [
    { header: 'Line ID', key: 'lineId' },
    { header: 'Page', key: 'page' },
    { header: 'Snippet', key: 'snippet' },
    { header: 'BBox', key: 'bbox' }
  ];
  (evid || []).forEach((row: any) => {
    e.addRow({ lineId: row.datum_id, page: row.anchor.page, snippet: row.anchor.snippet, bbox: JSON.stringify(row.anchor.bbox) });
  });

  const buf = await wb.xlsx.writeBuffer();
  return new Response(buf, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="filing-${filingId}.xlsx"`
    }
  });
}

