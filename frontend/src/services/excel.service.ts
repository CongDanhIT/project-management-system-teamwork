import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

export interface ExcelColumn {
  header: string;
  key: string;
  width?: number;
}

export interface SummaryItem {
  label: string;
  value: string | number;
  color?: string; // ARGB
}

export class ExcelService {
  static async exportToExcel({
    filename,
    sheetName = 'Sheet1',
    columns,
    data,
    title,
    summary,
  }: {
    filename: string;
    sheetName?: string;
    columns: ExcelColumn[];
    data: any[];
    title?: string;
    summary?: SummaryItem[];
  }) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    // 1. Setup Column Metadata (Keys and Widths)
    // Avoid setting 'header' here to prevent ExcelJS from auto-writing headers to row 1
    worksheet.columns = columns.map(col => ({
      key: col.key,
      width: col.width || 20,
    }));

    let currentRow = 1;

    // 2. Add Title if provided
    if (title) {
      const titleRow = worksheet.addRow([title]);
      titleRow.font = { name: 'Arial', size: 20, bold: true, color: { argb: 'FF035D5B' } };
      worksheet.mergeCells(currentRow, 1, currentRow, columns.length);
      titleRow.alignment = { vertical: 'middle', horizontal: 'center' };
      titleRow.height = 40;
      
      currentRow++; // Move to next row
      worksheet.addRow([]); // Add an empty spacer row
      currentRow++;
    }

    // 2.5 Add Summary Section if provided
    if (summary && summary.length > 0) {
      const summaryTitleRow = worksheet.addRow(['TỔNG QUAN DỰ ÁN']);
      summaryTitleRow.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FF035D5B' } };
      worksheet.mergeCells(currentRow, 1, currentRow, columns.length);
      currentRow++;

      // Render summary in a 2-column grid format for readability
      for (let i = 0; i < summary.length; i += 2) {
        const item1 = summary[i];
        const item2 = summary[i + 1];
        
        // We use columns 1-2 for item1 and columns 4-5 for item2
        const row = worksheet.addRow([]);
        row.getCell(1).value = item1.label + ':';
        row.getCell(2).value = item1.value;
        row.getCell(1).font = { bold: true };
        if (item1.color) row.getCell(2).font = { color: { argb: item1.color }, bold: true };

        if (item2) {
          row.getCell(4).value = item2.label + ':';
          row.getCell(5).value = item2.value;
          row.getCell(4).font = { bold: true };
          if (item2.color) row.getCell(5).font = { color: { argb: item2.color }, bold: true };
        }
        
        currentRow++;
      }
      
      worksheet.addRow([]); // Spacer
      currentRow++;
    }

    // 3. Style and Add Header Row
    const headerRow = worksheet.getRow(currentRow);
    headerRow.values = columns.map(col => col.header);
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF035D5B' }, // Brand Primary Deep Teal
      };
      cell.font = {
        name: 'Arial',
        color: { argb: 'FFFFFFFF' },
        bold: true,
        size: 12,
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });
    headerRow.height = 30;

    // 4. Add Data Rows
    data.forEach((item, index) => {
      const row = worksheet.addRow(item);
      
      // Style Data Cells
      row.eachCell((cell) => {
        cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFEDF2F7' } },
          left: { style: 'thin', color: { argb: 'FFEDF2F7' } },
          bottom: { style: 'thin', color: { argb: 'FFEDF2F7' } },
          right: { style: 'thin', color: { argb: 'FFEDF2F7' } },
        };
        
        // Alternating row colors
        if (index % 2 === 1) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF9FAFB' },
          };
        }
      });
      row.height = 20;
    });

    // 5. Auto-fit columns (basic implementation)
    worksheet.columns.forEach(column => {
      let maxLength = 0;
      column.eachCell!({ includeEmpty: true }, cell => {
        const columnLength = cell.value ? cell.value.toString().length : 10;
        if (columnLength > maxLength) {
          maxLength = columnLength;
        }
      });
      column.width = Math.min(Math.max(maxLength + 2, 10), 50);
    });

    // 6. Generate and Save File
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `${filename}.xlsx`);
  }
}
