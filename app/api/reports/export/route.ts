import { NextRequest } from 'next/server';
import ExcelJS from 'exceljs';
import { connectDB } from '@/lib/db';
import Asset from '@/models/Asset';
import Transfer from '@/models/Transfer';
import Maintenance from '@/models/Maintenance';
import { requireAuth } from '@/lib/auth';

const PRIMARY = '336633';   // dark green
const ACCENT  = 'c9e268';   // lime
const HEADER_BG = '2d3a30';
const ALT_ROW = 'f0f5e8';
const WHITE = 'FFFFFF';

function headerStyle(wb: ExcelJS.Workbook): Partial<ExcelJS.Style> {
  void wb;
  return {
    font: { bold: true, color: { argb: `FF${WHITE}` }, size: 11, name: 'Calibri' },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${HEADER_BG}` } },
    alignment: { vertical: 'middle', horizontal: 'center', wrapText: true },
    border: {
      top: { style: 'thin', color: { argb: `FF${ACCENT}` } },
      bottom: { style: 'thin', color: { argb: `FF${ACCENT}` } },
      left: { style: 'thin', color: { argb: `FF${ACCENT}` } },
      right: { style: 'thin', color: { argb: `FF${ACCENT}` } },
    },
  };
}

function cellStyle(alt: boolean): Partial<ExcelJS.Style> {
  return {
    fill: alt
      ? { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${ALT_ROW}` } }
      : { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${WHITE}` } },
    alignment: { vertical: 'middle', wrapText: true },
    border: {
      top: { style: 'hair', color: { argb: 'FFdddddd' } },
      bottom: { style: 'hair', color: { argb: 'FFdddddd' } },
      left: { style: 'hair', color: { argb: 'FFdddddd' } },
      right: { style: 'hair', color: { argb: 'FFdddddd' } },
    },
  };
}

function applySheetTitle(ws: ExcelJS.Worksheet, title: string, colCount: number) {
  ws.mergeCells(1, 1, 1, colCount);
  const titleCell = ws.getCell('A1');
  titleCell.value = title;
  titleCell.font = { bold: true, size: 16, color: { argb: `FF${WHITE}` }, name: 'Calibri' };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${PRIMARY}` } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(1).height = 36;

  ws.mergeCells(2, 1, 2, colCount);
  const subCell = ws.getCell('A2');
  subCell.value = `Generated: ${new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}`;
  subCell.font = { italic: true, color: { argb: `FF${PRIMARY}` }, size: 10, name: 'Calibri' };
  subCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${ACCENT}` } };
  subCell.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(2).height = 22;
}

// ─── GET /api/reports/export ────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    await connectDB();

    const { searchParams } = request.nextUrl;
    const branch     = searchParams.get('branch') || '';
    const department = searchParams.get('department') || '';
    const status     = searchParams.get('status') || '';
    const category   = searchParams.get('category') || '';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const assetQuery: Record<string, any> = {};
    if (branch)     assetQuery.branch = branch;
    if (department) assetQuery.department = department;
    if (status)     assetQuery.asset_status = status;
    if (category)   assetQuery.category = category;

    // Fetch all data in parallel
    const [assets, transfers, maintenances] = await Promise.all([
      Asset.find(assetQuery).sort({ assetCode: 1 }).lean(),
      Transfer.find({}).sort({ transferDate: -1 }).lean(),
      Maintenance.find({}).sort({ startDate: -1 }).lean(),
    ]);

    const assetIds = new Set(assets.map((a) => a._id.toString()));

    const wb = new ExcelJS.Workbook();
    wb.creator = 'Asset Manager';
    wb.created = new Date();
    wb.modified = new Date();

    // ══════════════════════════════════════════════════════════
    // SHEET 1: Asset Details
    // ══════════════════════════════════════════════════════════
    const wsAssets = wb.addWorksheet('Asset Details', {
      pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1 },
      views: [{ state: 'frozen', ySplit: 3 }],
    });

    const assetCols = [
      { header: 'Asset Code',    key: 'assetCode',       width: 16 },
      { header: 'Item Name',     key: 'item_name',       width: 28 },
      { header: 'Category',      key: 'category',        width: 18 },
      { header: 'Brand',         key: 'brand',           width: 16 },
      { header: 'Model',         key: 'model',           width: 18 },
      { header: 'Serial No.',    key: 'serial_number',   width: 20 },
      { header: 'Branch',        key: 'branch',          width: 16 },
      { header: 'Department',    key: 'department',      width: 18 },
      { header: 'Location',      key: 'location',        width: 18 },
      { header: 'Custodian',     key: 'custodian',       width: 20 },
      { header: 'Status',        key: 'asset_status',    width: 14 },
      { header: 'Condition',     key: 'condition_status',width: 14 },
      { header: 'Source',        key: 'source',          width: 14 },
      { header: 'Supplier',      key: 'supplier_name',   width: 22 },
      { header: 'Invoice No.',   key: 'invoice_number',  width: 18 },
      { header: 'Cost Value',    key: 'cost_value',      width: 14 },
      { header: 'Purchase Date', key: 'purchased_date',  width: 16 },
      { header: 'Received Date', key: 'received_date',   width: 16 },
      { header: 'Warranty End',  key: 'warranty_end_date',width: 16 },
      { header: 'QR Code',       key: 'qr',              width: 14 },
      { header: 'Notes',         key: 'notes',           width: 30 },
    ];

    applySheetTitle(wsAssets, '📋  Asset Inventory Report', assetCols.length);

    wsAssets.columns = assetCols;

    // Style header row (row 3)
    const assetHeaderRow = wsAssets.getRow(3);
    assetCols.forEach((_, i) => {
      const cell = assetHeaderRow.getCell(i + 1);
      Object.assign(cell, headerStyle(wb));
    });
    assetHeaderRow.height = 28;

    // Data rows start at row 4
    for (let i = 0; i < assets.length; i++) {
      const a = assets[i];
      const alt = i % 2 === 1;
      const rowIdx = i + 4;
      const row = wsAssets.getRow(rowIdx);
      row.height = 60; // taller to fit QR image

      const fmt = (d?: Date) => d ? new Date(d).toLocaleDateString('en-US') : '';

      const values = [
        a.assetCode,
        a.item_name,
        a.category,
        a.brand ?? '',
        (a as { model?: string }).model ?? '',
        a.serial_number ?? '',
        a.branch,
        a.department,
        a.location,
        a.custodian ?? '',
        a.asset_status,
        a.condition_status,
        a.source ?? '',
        a.supplier_name ?? '',
        a.invoice_number ?? '',
        a.cost_value ?? '',
        fmt(a.purchased_date),
        fmt(a.received_date),
        fmt(a.warranty_end_date),
        '', // placeholder for QR image
        a.notes ?? '',
      ];

      values.forEach((v, ci) => {
        const cell = row.getCell(ci + 1);
        cell.value = v as ExcelJS.CellValue;
        Object.assign(cell, cellStyle(alt));
        // Status colour coding
        if (ci === 10) {
          const statusColors: Record<string, string> = {
            'Active':      '1a7a36',
            'In Storage':  '8a6a1a',
            'In Repair':   'cc7a00',
            'Transferred': '1a4d8a',
            'Missing':     'cc2200',
            'Disposed':    '666666',
          };
          const col = statusColors[String(v)];
          if (col) {
            cell.font = { bold: true, color: { argb: `FF${WHITE}` } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${col}` } };
          }
        }
        // Condition colour coding
        if (ci === 11) {
          const condColors: Record<string, string> = {
            'Excellent': '1a7a36',
            'Good':      '3a7a3a',
            'Fair':      '8a6a1a',
            'Poor':      'cc7a00',
            'Damaged':   'cc2200',
          };
          const col = condColors[String(v)];
          if (col) {
            cell.font = { bold: true, color: { argb: `FF${WHITE}` } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${col}` } };
          }
        }
        // Cost value formatting
        if (ci === 15 && typeof v === 'number') {
          cell.numFmt = '#,##0.00';
        }
      });

      // Embed QR code image
      if (a.qrCodeData && a.qrCodeData.startsWith('data:image/png;base64,')) {
        try {
          const base64 = a.qrCodeData.replace('data:image/png;base64,', '');
          const imgId = wb.addImage({ base64, extension: 'png' });
          wsAssets.addImage(imgId, {
            tl: { col: 19, row: rowIdx - 1 } as ExcelJS.Anchor,   // col 20 = QR column
            br: { col: 20, row: rowIdx } as ExcelJS.Anchor,
            editAs: 'oneCell',
          });
        } catch {
          // If QR embed fails, just skip silently
        }
      }
    }

    // Auto-filter on header row
    wsAssets.autoFilter = {
      from: { row: 3, column: 1 },
      to: { row: 3, column: assetCols.length },
    };

    // ══════════════════════════════════════════════════════════
    // SHEET 2: Transfer History
    // ══════════════════════════════════════════════════════════
    const wsTransfers = wb.addWorksheet('Transfer History', {
      pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1 },
      views: [{ state: 'frozen', ySplit: 3 }],
    });

    const transferCols = [
      { header: 'Asset Code',     key: 'assetCode',    width: 16 },
      { header: 'Asset Name',     key: 'item_name',    width: 28 },
      { header: 'Transfer Type',  key: 'transferType', width: 18 },
      { header: 'From',           key: 'fromValue',    width: 24 },
      { header: 'To',             key: 'toValue',      width: 24 },
      { header: 'Transfer Date',  key: 'transferDate', width: 18 },
      { header: 'Authorized By',  key: 'authorizedBy', width: 20 },
      { header: 'Reason',         key: 'reason',       width: 30 },
      { header: 'Notes',          key: 'notes',        width: 30 },
    ];

    applySheetTitle(wsTransfers, '🔄  Asset Transfer History', transferCols.length);
    wsTransfers.columns = transferCols;

    const transferHeaderRow = wsTransfers.getRow(3);
    transferCols.forEach((_, i) => {
      Object.assign(transferHeaderRow.getCell(i + 1), headerStyle(wb));
    });
    transferHeaderRow.height = 28;

    // Build asset lookup map from fetched assets
    const assetMap = new Map(assets.map((a) => [a._id.toString(), a]));

    let trIdx = 0;
    for (const t of transfers) {
      // Only include transfers for assets matching the filter
      if (branch || department || status || category) {
        if (!assetIds.has(t.asset.toString())) continue;
      }

      const asset = assetMap.get(t.asset.toString());
      const alt = trIdx % 2 === 1;
      const row = wsTransfers.getRow(trIdx + 4);
      row.height = 22;

      const rowVals = [
        asset?.assetCode ?? t.asset.toString(),
        asset?.item_name ?? '—',
        t.transferType.charAt(0).toUpperCase() + t.transferType.slice(1),
        t.fromValue,
        t.toValue,
        new Date(t.transferDate).toLocaleDateString('en-US'),
        t.authorizedBy ?? '',
        t.reason ?? '',
        t.notes ?? '',
      ];

      rowVals.forEach((v, ci) => {
        const cell = row.getCell(ci + 1);
        cell.value = v;
        Object.assign(cell, cellStyle(alt));
        if (ci === 2) {
          const typeColors: Record<string, string> = {
            'Branch':     '1a4d8a',
            'Department': '1a6b4d',
            'Location':   '6b1a6b',
            'Custodian':  '8a4d1a',
          };
          const col = typeColors[v as string];
          if (col) {
            cell.font = { bold: true, color: { argb: `FF${WHITE}` } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${col}` } };
          }
        }
      });
      trIdx++;
    }

    wsTransfers.autoFilter = {
      from: { row: 3, column: 1 },
      to: { row: 3, column: transferCols.length },
    };

    // ══════════════════════════════════════════════════════════
    // SHEET 3: Maintenance Records
    // ══════════════════════════════════════════════════════════
    const wsMaint = wb.addWorksheet('Maintenance Records', {
      pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1 },
      views: [{ state: 'frozen', ySplit: 3 }],
    });

    const maintCols = [
      { header: 'Asset Code',       key: 'assetCode',       width: 16 },
      { header: 'Asset Name',       key: 'item_name',       width: 28 },
      { header: 'Maintenance Type', key: 'maintenanceType', width: 20 },
      { header: 'Description',      key: 'description',     width: 36 },
      { header: 'Status',           key: 'status',          width: 16 },
      { header: 'Start Date',       key: 'startDate',       width: 16 },
      { header: 'End Date',         key: 'endDate',         width: 16 },
      { header: 'Cost',             key: 'cost',            width: 14 },
      { header: 'Technician',       key: 'technician',      width: 20 },
      { header: 'Vendor',           key: 'vendor',          width: 20 },
      { header: 'Notes',            key: 'notes',           width: 30 },
    ];

    applySheetTitle(wsMaint, '🔧  Maintenance Records', maintCols.length);
    wsMaint.columns = maintCols;

    const maintHeaderRow = wsMaint.getRow(3);
    maintCols.forEach((_, i) => {
      Object.assign(maintHeaderRow.getCell(i + 1), headerStyle(wb));
    });
    maintHeaderRow.height = 28;

    let mIdx = 0;
    for (const m of maintenances) {
      if (branch || department || status || category) {
        if (!assetIds.has(m.asset.toString())) continue;
      }

      const asset = assetMap.get(m.asset.toString());
      const alt = mIdx % 2 === 1;
      const row = wsMaint.getRow(mIdx + 4);
      row.height = 22;

      const rowVals = [
        asset?.assetCode ?? m.asset.toString(),
        asset?.item_name ?? '—',
        m.maintenanceType,
        m.description,
        m.status,
        new Date(m.startDate).toLocaleDateString('en-US'),
        m.endDate ? new Date(m.endDate).toLocaleDateString('en-US') : '',
        m.cost ?? '',
        m.technician ?? '',
        m.vendor ?? '',
        m.notes ?? '',
      ];

      rowVals.forEach((v, ci) => {
        const cell = row.getCell(ci + 1);
        cell.value = v as ExcelJS.CellValue;
        Object.assign(cell, cellStyle(alt));

        // Status colour
        if (ci === 4) {
          const statusColors: Record<string, string> = {
            'Scheduled':   '1a4d8a',
            'In Progress': 'cc7a00',
            'Completed':   '1a7a36',
            'Cancelled':   '666666',
          };
          const col = statusColors[String(v)];
          if (col) {
            cell.font = { bold: true, color: { argb: `FF${WHITE}` } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${col}` } };
          }
        }
        // Cost formatting
        if (ci === 7 && typeof v === 'number') {
          cell.numFmt = '#,##0.00';
        }
      });
      mIdx++;
    }

    wsMaint.autoFilter = {
      from: { row: 3, column: 1 },
      to: { row: 3, column: maintCols.length },
    };

    // ══════════════════════════════════════════════════════════
    // SHEET 4: Summary Dashboard
    // ══════════════════════════════════════════════════════════
    const wsSummary = wb.addWorksheet('Summary', {
      pageSetup: { paperSize: 9, orientation: 'portrait' },
    });

    applySheetTitle(wsSummary, '📊  Asset Report Summary', 4);
    wsSummary.columns = [
      { width: 30 }, { width: 18 }, { width: 18 }, { width: 18 },
    ];

    // Helper to add a summary section
    let summaryRow = 4;
    const addSumSection = (title: string, items: { label: string; value: string | number }[]) => {
      // Section header
      wsSummary.mergeCells(summaryRow, 1, summaryRow, 4);
      const sTitle = wsSummary.getCell(summaryRow, 1);
      sTitle.value = title;
      sTitle.font = { bold: true, size: 12, color: { argb: `FF${WHITE}` }, name: 'Calibri' };
      sTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${PRIMARY}` } };
      sTitle.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
      wsSummary.getRow(summaryRow).height = 24;
      summaryRow++;

      items.forEach((item, i) => {
        const a = i % 2 === 1;
        const labelCell = wsSummary.getCell(summaryRow, 1);
        const valueCell = wsSummary.getCell(summaryRow, 2);
        wsSummary.mergeCells(summaryRow, 1, summaryRow, 1);
        wsSummary.mergeCells(summaryRow, 2, summaryRow, 4);
        labelCell.value = item.label;
        valueCell.value = item.value;
        labelCell.font = { bold: true, color: { argb: `FF${PRIMARY}` } };
        valueCell.font = { name: 'Calibri' };
        const rowFill = a ? ALT_ROW : WHITE;
        labelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${rowFill}` } };
        valueCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${rowFill}` } };
        wsSummary.getRow(summaryRow).height = 20;
        summaryRow++;
      });
      summaryRow++; // blank gap
    };

    // Compute summary stats
    const byStatus = assets.reduce<Record<string, number>>((acc, a) => {
      acc[a.asset_status] = (acc[a.asset_status] || 0) + 1; return acc;
    }, {});
    const byCategory = assets.reduce<Record<string, number>>((acc, a) => {
      acc[a.category] = (acc[a.category] || 0) + 1; return acc;
    }, {});
    const byBranch = assets.reduce<Record<string, number>>((acc, a) => {
      acc[a.branch] = (acc[a.branch] || 0) + 1; return acc;
    }, {});
    const totalCost = assets.reduce((sum, a) => sum + (a.cost_value || 0), 0);

    const maintByStatus = maintenances.reduce<Record<string, number>>((acc, m) => {
      acc[m.status] = (acc[m.status] || 0) + 1; return acc;
    }, {});
    const maintTotalCost = maintenances.reduce((sum, m) => sum + (m.cost || 0), 0);

    addSumSection('📦  General Overview', [
      { label: 'Total Assets',          value: assets.length },
      { label: 'Total Transfers',       value: transfers.length },
      { label: 'Total Maintenance Jobs',value: maintenances.length },
      { label: 'Total Asset Value',     value: totalCost },
      { label: 'Total Maintenance Cost',value: maintTotalCost },
      { label: 'Report Generated',      value: new Date().toLocaleString() },
      ...(branch     ? [{ label: 'Filter: Branch',     value: branch     }] : []),
      ...(department ? [{ label: 'Filter: Department', value: department }] : []),
      ...(status     ? [{ label: 'Filter: Status',     value: status     }] : []),
      ...(category   ? [{ label: 'Filter: Category',   value: category   }] : []),
    ]);

    addSumSection('📊  Assets by Status', Object.entries(byStatus).map(([k, v]) => ({ label: k, value: v })));
    addSumSection('🗂️  Assets by Category', Object.entries(byCategory).map(([k, v]) => ({ label: k, value: v })));
    addSumSection('🏢  Assets by Branch', Object.entries(byBranch).map(([k, v]) => ({ label: k, value: v })));
    addSumSection('🔧  Maintenance by Status', Object.entries(maintByStatus).map(([k, v]) => ({ label: k, value: v })));

    // Set first sheet as active
    wb.views = [{ activeTab: 0 } as ExcelJS.WorkbookView];

    // Reorder sheets: Summary first
    // ExcelJS stores as array — move summary to position 0
    const sheets = (wb as unknown as { _worksheets: ExcelJS.Worksheet[] })._worksheets.filter(Boolean);
    // Find summary index
    const summaryIdx = sheets.findIndex((s) => s.name === 'Summary');
    if (summaryIdx > 0) {
      wb.removeWorksheet(wsSummary.id);
      (wb as unknown as { _worksheets: ExcelJS.Worksheet[] })._worksheets.unshift(wsSummary);
    }

    // Serialize workbook
    const buffer = await wb.xlsx.writeBuffer();
    const filename = `asset-report-${new Date().toISOString().slice(0, 10)}.xlsx`;

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('Excel export error:', err);
    return Response.json({ error: 'Export failed' }, { status: 500 });
  }
}
