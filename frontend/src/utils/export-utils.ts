import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  HeadingLevel, 
  AlignmentType, 
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType,
  LevelFormat
} from "docx";
import { saveAs } from "file-saver";
import ExcelJS from "exceljs";

interface AIInsightsWordParams {
  projectName: string;
  workspaceName?: string;
  description?: string;
  reporterName?: string;
  analysisPeriod: {
    from: string;
    to: string;
  };
  data: {
    insights: {
      bottlenecks: string[];
      velocity_analysis: string;
      team_performance: string[];
      risk_forecast: string;
      recommendations: string[];
      deep_insights?: string;
      criticalIncidents?: string[];
    };
      reportStats?: {
        overallStats: {
          totalTasks: number;
          completedTasks: number;
          completionRate: number;
          inProgressTasks: number;
          inReviewTasks: number;
          highPriorityTasks: number;
          unassignedTasks: number;
          overdueTasks: number;
          totalEstimatedHours: number;
          totalLoggedHours: number;
        };
        memberStats: Array<{
          name: string;
          email: string;
          total: number;
          todo: number;
          inProgress: number;
          inReview: number;
          done: number;
          completionRate: number;
        }>;
      };
      filteredReportStats?: {
        overallStats: {
          totalTasks: number;
          completedTasks: number;
          completionRate: number;
          inProgressTasks: number;
          inReviewTasks: number;
          highPriorityTasks: number;
          unassignedTasks: number;
          overdueTasks: number;
          totalEstimatedHours: number;
          totalLoggedHours: number;
          priorityDistribution?: {
            URGENT: number;
            HIGH: number;
            MEDIUM: number;
            LOW: number;
          };
          statusDistribution?: {
            TODO: number;
            IN_PROGRESS: number;
            INREVIEW: number;
            DONE: number;
          };
        };
        memberStats: Array<{
          name: string;
          email: string;
          total: number;
          todo: number;
          inProgress: number;
          inReview: number;
          done: number;
          estimatedHours?: number;
          loggedHours?: number;
          completionRate: number;
        }>;
      };
    };
}

// Định nghĩa màu sắc thương hiệu TeamFlow
const BRAND_COLOR = "0D9488"; // Teal
const SLATE_COLOR = "0F172A"; // Slate đậm
const BORDER_COLOR = "E2E8F0"; // Gray nhẹ
const TEXT_SECONDARY = "64748B"; // Gray text

// === EXCEL EXPORT LOGIC ===
export interface ProjectExcelParams {
  projectName: string;
  phaseName?: string;
  tasks: any[];
}

const STATUS_LABELS: Record<string, string> = {
  'TODO': 'Cần làm',
  'DONE': 'Hoàn thành',
  'IN_PROGRESS': 'Đang làm',
  'INREVIEW': 'Đang kiểm tra',
  'BACKLOG': 'Tồn đọng',
  'CANCELLED': 'Đã hủy'
};

export const exportProjectTasksToExcel = async ({ projectName, phaseName, tasks }: ProjectExcelParams) => {
  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((t: any) => t.status === 'DONE').length;
  const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  
  const overdueTasks = tasks.filter((t: any) => 
    t.status !== 'DONE' && t.dueDate && new Date(t.dueDate) < now
  );
  
  const upcomingTasks = tasks.filter((t: any) => 
    t.status !== 'DONE' && t.dueDate && new Date(t.dueDate) >= now && new Date(t.dueDate) <= nextWeek
  );

  let performanceLabel = 'Trung bình';
  let performanceColor = 'FF718096'; // Gray
  if (completionRate >= 80) {
    performanceLabel = 'Xuất sắc';
    performanceColor = 'FF38A169'; // Green
  } else if (completionRate >= 50) {
    performanceLabel = 'Tốt';
    performanceColor = 'FF3182CE'; // Blue
  } else if (completionRate < 30 && totalTasks > 5) {
    performanceLabel = 'Cần cải thiện';
    performanceColor = 'FFE53E3E'; // Red
  }

  const summary = [
    ...(phaseName ? [{ label: 'Giai đoạn', value: phaseName }] : []),
    { label: 'Tỷ lệ hoàn thành', value: `${completionRate}%`, color: completionRate > 70 ? 'FF38A169' : 'FFDD6B20' },
    { label: 'Hiệu suất', value: performanceLabel, color: performanceColor },
    { label: 'Tổng số Task', value: totalTasks },
    { label: 'Task đã hoàn thành', value: doneTasks },
    { label: 'Task quá hạn', value: overdueTasks.length, color: overdueTasks.length > 0 ? 'FFE53E3E' : 'FF38A169' },
    { label: 'Task sắp hết hạn', value: upcomingTasks.length, color: upcomingTasks.length > 0 ? 'FFD69E2E' : 'FF38A169' },
  ];

  if (overdueTasks.length > 0) {
    summary.push({ label: '---', value: '---' }); // Spacer
    summary.push({ label: 'CẢNH BÁO QUÁ HẠN', value: `Có ${overdueTasks.length} task trễ hạn!`, color: 'FFE53E3E' });
    
    overdueTasks.forEach((t: any) => {
      const delayDays = Math.floor((now.getTime() - new Date(t.dueDate).getTime()) / (1000 * 60 * 60 * 24));
      summary.push({ label: `! ${t.title}`, value: `Trễ ${delayDays} ngày`, color: 'FFE53E3E' });
    });
  }

  const sortedTasks = [...tasks].sort((a: any, b: any) => {
    const phaseA = a.phaseId?.name || 'Z_NONE'; 
    const phaseB = b.phaseId?.name || 'Z_NONE';
    return phaseA.localeCompare(phaseB);
  });
  
  const columns = [
    { header: 'Giai đoạn', key: 'phase', width: 25 },
    { header: 'Mã Task', key: 'taskCode', width: 15 },
    { header: 'Tên công việc', key: 'title', width: 45 },
    { header: 'Trạng thái', key: 'status', width: 18 },
    { header: 'Mức ưu tiên', key: 'priority', width: 15 },
    { header: 'Ngày bắt đầu', key: 'startDate', width: 15 },
    { header: 'Hạn chót', key: 'dueDate', width: 15 },
    { header: 'Người thực hiện', key: 'assignees', width: 35 },
  ];

  const data = sortedTasks.map((t: any) => ({
    phase: t.phaseId?.name || phaseName || '---',
    taskCode: t.taskCode,
    title: t.title,
    status: STATUS_LABELS[t.status] || t.status,
    priority: t.priority,
    startDate: t.startDate ? new Date(t.startDate).toLocaleDateString('vi-VN') : '',
    dueDate: t.dueDate ? new Date(t.dueDate).toLocaleDateString('vi-VN') : '',
    assignees: t.assignedTo?.map((u: any) => u.name).join(', ') || 'Chưa gán',
  }));

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(phaseName ? 'Công việc giai đoạn' : 'Danh sách công việc');

  // 1. CẤU HÌNH CỘT RỘNG HƠN (Fuller feel)
  worksheet.columns = [
    { key: 'margin', width: 3 }, // Lề trái hẹp hơn để nhường chỗ
    { key: 'col1', width: 25 },
    { key: 'col2', width: 20 },
    { key: 'col3', width: 45 }, // Tên công việc rộng hẳn ra
    { key: 'col4', width: 20 },
    { key: 'col5', width: 15 },
    { key: 'col6', width: 20 },
    { key: 'col7', width: 20 },
    { key: 'col8', width: 30 }, // Người thực hiện
  ];

  let currentRow = 2;
  const titleText = phaseName 
    ? `BÁO CÁO CHI TIẾT GIAI ĐOẠN: ${phaseName.toUpperCase()}`
    : `BÁO CÁO TỔNG THỂ DỰ ÁN: ${projectName.toUpperCase()}`;

  // 2. HEADER BRANDING
  const brandRow = worksheet.getRow(currentRow);
  brandRow.getCell(2).value = "TEAMFLOW | ENTERPRISE INTELLIGENCE REPORT";
  brandRow.getCell(2).font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF' + BRAND_COLOR } };
  currentRow += 2;

  // 3. MAIN TITLE
  const titleRow = worksheet.getRow(currentRow);
  titleRow.getCell(2).value = titleText;
  titleRow.getCell(2).font = { name: 'Arial', size: 26, bold: true, color: { argb: 'FF' + SLATE_COLOR } };
  worksheet.mergeCells(currentRow, 2, currentRow, 9); // Merge toàn bộ chiều rộng bảng
  titleRow.alignment = { vertical: 'middle', horizontal: 'center' };
  titleRow.height = 65;
  currentRow += 3;

  // 4. SUMMARY CARD SECTION (Logical Grouping 2 columns with merged cells)
  if (summary && summary.length > 0) {
    const summaryHeaderRow = worksheet.getRow(currentRow);
    summaryHeaderRow.getCell(2).value = '📊 PHÂN TÍCH CHỈ SỐ TỔNG QUAN';
    summaryHeaderRow.getCell(2).font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FF' + BRAND_COLOR } };
    currentRow += 2;

    let summaryItemsGroup: any[] = [];
    const startRowBorder = currentRow;

    const flushSummaryRow = () => {
      if (summaryItemsGroup.length === 0) return;
      
      const row = worksheet.getRow(currentRow);
      
      const styleItem = (labelStart: number, labelEnd: number, valueStart: number, valueEnd: number, item: any) => {
        if (!item) return;
        if (item.label === '---') return;

        // Gộp ô cho Label để chống che chữ
        if (labelStart !== labelEnd) worksheet.mergeCells(currentRow, labelStart, currentRow, labelEnd);
        const labelCell = row.getCell(labelStart);
        labelCell.value = item.label.toUpperCase();
        labelCell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF' + TEXT_SECONDARY } };
        labelCell.alignment = { wrapText: true, vertical: 'middle' };

        // Gộp ô cho Value
        if (valueStart !== valueEnd) worksheet.mergeCells(currentRow, valueStart, currentRow, valueEnd);
        const valueCell = row.getCell(valueStart);
        valueCell.value = item.value;
        valueCell.font = { name: 'Arial', size: 12, bold: true, color: { argb: item.color ? item.color : 'FF' + SLATE_COLOR } };
        valueCell.alignment = { vertical: 'middle' };
      };

      // Item 1: Label chiếm cột B,C (2,3) | Value chiếm cột D (4)
      styleItem(2, 3, 4, 4, summaryItemsGroup[0]);
      
      // Item 2: Label chiếm cột F,G (6,7) | Value chiếm cột H,I (8,9). Cột E (5) làm dải phân cách.
      if (summaryItemsGroup[1]) {
        styleItem(6, 7, 8, 9, summaryItemsGroup[1]);
      }
      
      row.height = 36; // Tăng một chút để đề phòng chữ xuống dòng
      currentRow++;
      summaryItemsGroup = [];
    };

    for (let i = 0; i < summary.length; i++) {
      const item = summary[i];
      
      // Xử lý dải phân cách (---)
      if (item.label === '---') {
        flushSummaryRow();
        currentRow++;
        continue;
      }

      // Đặc tả cảnh báo đứng 1 mình 1 dòng
      if (item.label.includes('Cảnh báo') || item.label.includes('CẢNH BÁO')) {
        flushSummaryRow();
        const row = worksheet.getRow(currentRow);
        
        worksheet.mergeCells(currentRow, 2, currentRow, 3);
        const labelCell = row.getCell(2);
        labelCell.value = item.label.toUpperCase();
        labelCell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF' + TEXT_SECONDARY } };
        labelCell.alignment = { wrapText: true, vertical: 'middle' };
        
        worksheet.mergeCells(currentRow, 4, currentRow, 6);
        const valueCell = row.getCell(4);
        valueCell.value = item.value;
        valueCell.font = { name: 'Arial', size: 12, bold: true, color: { argb: item.color ? item.color : 'FF' + SLATE_COLOR } };
        valueCell.alignment = { vertical: 'middle' };
        
        row.height = 36;
        currentRow++;
        continue;
      }

      summaryItemsGroup.push(item);
      if (summaryItemsGroup.length === 2) {
        flushSummaryRow();
      }
    }
    flushSummaryRow();
    
    // Thêm viền giả cho vùng summary
    for (let r = startRowBorder; r < currentRow; r++) {
       const rObj = worksheet.getRow(r);
       rObj.getCell(2).border = { left: { style: 'medium', color: { argb: 'FF' + BRAND_COLOR } } };
    }

    currentRow += 3;
  }

  // 5. DATA TABLE HEADER
  const tableHeaderRowIndex = currentRow;
  const headerRow = worksheet.getRow(currentRow);
  const headerValues = [''].concat(columns.map(col => col.header.toUpperCase()));
  headerRow.values = headerValues;
  
  headerRow.eachCell((cell, colNumber) => {
    if (colNumber === 1) return;
    
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF' + BRAND_COLOR },
    };
    cell.font = { name: 'Arial', color: { argb: 'FFFFFFFF' }, bold: true, size: 10 };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      top: { style: 'medium', color: { argb: 'FF' + BRAND_COLOR } },
      left: { style: 'thin', color: { argb: 'FFFFFFFF' } },
      bottom: { style: 'medium', color: { argb: 'FF' + BRAND_COLOR } },
      right: { style: 'thin', color: { argb: 'FFFFFFFF' } },
    };
  });
  headerRow.height = 45;
  currentRow++;

  // 6. DATA ROWS
  data.forEach((item, index) => {
    const row = worksheet.getRow(currentRow);
    const rowData = [''].concat(Object.values(item));
    row.values = rowData;

    row.eachCell((cell, colNumber) => {
      if (colNumber === 1) return;
      
      cell.font = { name: 'Arial', size: 11, color: { argb: 'FF' + SLATE_COLOR } };
      cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true, indent: 2 };
      
      // THÊM ĐẦY ĐỦ VIỀN (GRIDLINES) CHO TẤT CẢ CÁC Ô
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } }, // Slate 300 rõ nét hơn
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };
      
      if (index % 2 === 1) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF1F5F9' }, // Slate 100 đậm hơn chút
        };
      }
    });
    row.height = 42; // Hàng cao hơn hẳn để đầy đặn
    currentRow++;
  });

  const lastDataRowIndex = currentRow - 1;
  // Bật bộ lọc AutoFilter cho bảng dữ liệu
  if (lastDataRowIndex >= tableHeaderRowIndex) {
    worksheet.autoFilter = {
      from: { row: tableHeaderRowIndex, column: 2 },
      to: { row: lastDataRowIndex, column: 9 }
    };
  }

  // Đảm bảo không có chế độ view nào gây kẹt việc cuộn trang
  worksheet.views = [{ showGridLines: false, activeCell: 'A1' }];

  // 7. FOOTER
  currentRow += 2;
  const footerRow = worksheet.getRow(currentRow);
  footerRow.getCell(2).value = "© " + new Date().getFullYear() + " TeamFlow AI Intelligence System | Báo cáo bảo mật được tạo tự động cho " + projectName;
  footerRow.getCell(2).font = { name: 'Arial', size: 9, italic: true, color: { argb: 'FF' + TEXT_SECONDARY } };
  footerRow.getCell(2).alignment = { horizontal: 'center' };
  worksheet.mergeCells(currentRow, 2, currentRow, 9);

  // 8. FINAL COLUMN WIDTH TWEAK
  worksheet.columns.forEach((column, i) => {
    if (i === 0) return;
    column.width = column.width || 25;
  });

  // ==========================================
  // SHEET 2: THỐNG KÊ KPI NHÂN SỰ
  // ==========================================
  const kpiSheet = workbook.addWorksheet('KPI Nhân sự', {
    views: [{ showGridLines: false }]
  });

  kpiSheet.columns = [
    { key: 'margin', width: 3 },
    { key: 'member', width: 35 },
    { key: 'total', width: 15 },
    { key: 'completed', width: 20 },
    { key: 'overdue', width: 15 },
    { key: 'rate', width: 20 }
  ];

  // Header Branding
  const kpiBrandRow = kpiSheet.getRow(2);
  kpiBrandRow.getCell(2).value = "TEAMFLOW | MEMBER PERFORMANCE REPORT";
  kpiBrandRow.getCell(2).font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF' + BRAND_COLOR } };
  
  const kpiTitleRow = kpiSheet.getRow(4);
  kpiTitleRow.getCell(2).value = 'THỐNG KÊ HIỆU SUẤT NHÂN SỰ';
  kpiTitleRow.getCell(2).font = { name: 'Arial', size: 20, bold: true, color: { argb: 'FF' + SLATE_COLOR } };
  
  let kpiRow = 6;
  const kpiHeaderRow = kpiSheet.getRow(kpiRow);
  kpiHeaderRow.values = ['', 'NHÂN SỰ', 'TỔNG TASK', 'ĐÃ HOÀN THÀNH', 'QUÁ HẠN', 'TỶ LỆ HOÀN THÀNH'];
  kpiHeaderRow.height = 35;
  [2, 3, 4, 5, 6].forEach((colIdx) => {
    const cell = kpiHeaderRow.getCell(colIdx);
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + BRAND_COLOR } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      top: { style: 'medium', color: { argb: 'FF' + BRAND_COLOR } },
      bottom: { style: 'medium', color: { argb: 'FF' + BRAND_COLOR } },
    };
  });
  kpiHeaderRow.getCell(2).alignment = { vertical: 'middle', horizontal: 'left', indent: 2 }; 
  kpiRow++;

  // Tính toán KPI
  const memberKpiMap: Record<string, { total: number; completed: number; overdue: number }> = {};
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);

  tasks.forEach(t => {
    const isCompleted = t.status === 'DONE';
    const isOverdue = !isCompleted && t.dueDate && new Date(t.dueDate) < todayDate;

    if (!t.assignedTo || t.assignedTo.length === 0) {
       const name = 'Chưa gán';
       if (!memberKpiMap[name]) memberKpiMap[name] = { total: 0, completed: 0, overdue: 0 };
       memberKpiMap[name].total++;
       if (isCompleted) memberKpiMap[name].completed++;
       else if (isOverdue) memberKpiMap[name].overdue++;
       return;
    }

    t.assignedTo.forEach((u: any) => {
       const name = u.name || u.email || 'Không rõ';
       if (!memberKpiMap[name]) memberKpiMap[name] = { total: 0, completed: 0, overdue: 0 };
       memberKpiMap[name].total++;
       if (isCompleted) memberKpiMap[name].completed++;
       else if (isOverdue) memberKpiMap[name].overdue++;
    });
  });

  const memberNames = Object.keys(memberKpiMap).sort((a, b) => {
     if (a === 'Chưa gán') return 1;
     if (b === 'Chưa gán') return -1;
     return memberKpiMap[b].total - memberKpiMap[a].total; // sort by total tasks desc
  });

  memberNames.forEach((name, idx) => {
     const data = memberKpiMap[name];
     const rate = data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0;
     const row = kpiSheet.getRow(kpiRow);
     row.values = ['', name, data.total, data.completed, data.overdue, `${rate}%`];
     row.height = 36;
     
     row.getCell(2).alignment = { vertical: 'middle', horizontal: 'left', indent: 2 };
     [3, 4, 5, 6].forEach(c => row.getCell(c).alignment = { vertical: 'middle', horizontal: 'center' });
     
     row.getCell(2).font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF' + SLATE_COLOR } };
     [3, 4].forEach(c => row.getCell(c).font = { name: 'Arial', size: 11, color: { argb: 'FF' + TEXT_SECONDARY } });
     
     if (data.overdue > 0) {
       row.getCell(5).font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFE53E3E' } }; // Red
     } else {
       row.getCell(5).font = { name: 'Arial', size: 11, color: { argb: 'FF' + TEXT_SECONDARY } };
     }
     
     const rateCell = row.getCell(6);
     if (rate === 100) rateCell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF38A169' } }; // Green
     else if (rate < 50) rateCell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFDD6B20' } }; // Orange
     else rateCell.font = { name: 'Arial', size: 11, color: { argb: 'FF' + TEXT_SECONDARY } };
     
     [2, 3, 4, 5, 6].forEach(c => {
        row.getCell(c).border = { bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } } };
        if (idx % 2 === 1) {
          row.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } }; // Màu nền so le
        }
     });
     kpiRow++;
  });

  // Áp dụng Freeze Panes & AutoFilter cho Sheet KPI
  kpiSheet.views = [
    { state: 'frozen', xSplit: 0, ySplit: 6, showGridLines: false }
  ];
  if (kpiRow > 7) {
    kpiSheet.autoFilter = {
      from: { row: 6, column: 2 },
      to: { row: kpiRow - 1, column: 6 }
    };
  }

  // Generate and Save
  const filename = phaseName ? `TeamFlow_Phase_${phaseName}_${projectName}` : `TeamFlow_Project_${projectName}`;
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `${filename}.xlsx`);
};

// === WORD EXPORT LOGIC ===

export const exportAIInsightsToWord = async ({ 
  projectName, 
  workspaceName = "N/A", 
  description = "N/A", 
  reporterName = "N/A",
  analysisPeriod,
  data 
}: AIInsightsWordParams) => {
  const { insights, reportStats, filteredReportStats } = data;
  const doc = new Document({
    styles: {
      paragraphStyles: [
        {
          id: "normal",
          name: "Normal",
          run: {
            size: 22,
            font: "Inter, Calibri",
          },
          paragraph: {
            spacing: { line: 360, before: 120, after: 120 },
          },
        },
      ],
    },
    sections: [
      {
        properties: {},
        children: [
          // Styled Header Section
          new Paragraph({
            children: [
              new TextRun({
                text: "TEAMFLOW",
                font: "Arial",
                bold: true,
                size: 28,
                color: BRAND_COLOR,
                characterSpacing: 40,
              }),
              new TextRun({
                text: " | AI INTELLIGENCE REPORT",
                font: "Arial",
                size: 20,
                color: TEXT_SECONDARY,
              }),
            ],
            spacing: { after: 400 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "BÁO CÁO PHÂN TÍCH DỰ ÁN CHUYÊN SÂU",
                font: "Arial",
                bold: true,
                size: 32,
                color: SLATE_COLOR,
              })
            ],
            alignment: AlignmentType.LEFT,
            spacing: { after: 200 },
          }),
          
          // Project Meta Box (Styled Table)
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    shading: { fill: "F8FAFC" },
                    margins: { top: 150, bottom: 150, left: 150, right: 150 },
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
                      bottom: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
                      left: { style: BorderStyle.SINGLE, size: 4, color: BRAND_COLOR },
                      right: { style: BorderStyle.NONE },
                    },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ text: "DỰ ÁN: ", font: "Arial", bold: true, size: 18, color: TEXT_SECONDARY }),
                          new TextRun({ text: projectName.toUpperCase(), font: "Arial", bold: true, size: 22, color: SLATE_COLOR }),
                        ],
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({ text: "WORKSPACE: ", font: "Arial", bold: true, size: 18, color: TEXT_SECONDARY }),
                          new TextRun({ text: workspaceName || "N/A", font: "Arial", size: 20 }),
                        ],
                      }),
                    ],
                  }),
                  new TableCell({
                    shading: { fill: "F8FAFC" },
                    margins: { top: 150, bottom: 150, left: 150, right: 150 },
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
                      bottom: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
                      left: { style: BorderStyle.NONE },
                      right: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
                    },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.RIGHT,
                        children: [
                          new TextRun({ text: "NGƯỜI XUẤT: ", font: "Arial", bold: true, size: 18, color: TEXT_SECONDARY }),
                          new TextRun({ text: reporterName || "N/A", font: "Arial", size: 20, bold: true }),
                        ],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.RIGHT,
                        children: [
                          new TextRun({ text: "KỲ PHÂN TÍCH: ", font: "Arial", bold: true, size: 18, color: TEXT_SECONDARY }),
                          new TextRun({ text: `${analysisPeriod.from} - ${analysisPeriod.to}`, font: "Arial", size: 20 }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),

          // Description
          ...(description ? [
            new Paragraph({
              spacing: { before: 200, after: 400 },
              children: [
                new TextRun({ text: "Mục tiêu dự án: ", font: "Arial", bold: true, size: 22, color: SLATE_COLOR }),
                new TextRun({ text: description, font: "Arial", italics: true, size: 22, color: TEXT_SECONDARY }),
              ],
            })
          ] : [new Paragraph({ spacing: { after: 400 } })]),

          // -1. Báo động đỏ (Critical Incidents)
          ...(insights.criticalIncidents && insights.criticalIncidents.length > 0 ? [
            new Paragraph({
              children: [
                new TextRun({
                  text: "⚠️ CẢNH BÁO NGHIÊM TRỌNG (CRITICAL INCIDENTS)",
                  font: "Arial",
                  bold: true,
                  size: 26,
                  color: "EF4444", // Red 500
                }),
              ],
              spacing: { before: 200, after: 150 },
            }),
            ...insights.criticalIncidents.map(
              (incident) =>
                new Paragraph({
                  indent: { left: 360, hanging: 360 },
                  children: [
                    new TextRun({ text: "• ", font: "Arial", size: 22, color: "EF4444", bold: true }),
                    new TextRun({ text: incident, font: "Arial", size: 22, color: "991B1B", bold: true }),
                  ],
                  spacing: { before: 120, after: 120 },
                })
            ),
            new Paragraph({ spacing: { after: 400 } })
          ] : []),

          // 0. Deep Insights (Góc nhìn chuyên sâu - Hybrid Architecture) - Use Table for padding
          ...(insights.deep_insights ? [
            new Paragraph({
              children: [
                new TextRun({
                  text: "00. GÓC NHÌN CHUYÊN SÂU TỪ AI",
                  font: "Arial",
                  bold: true,
                  size: 26,
                  color: BRAND_COLOR,
                }),
              ],
              spacing: { before: 300, after: 150 },
            }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.SINGLE, size: 12, color: BRAND_COLOR },
                right: { style: BorderStyle.NONE },
              },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      shading: { fill: "F0FDFA" }, // Teal 50 (đồng bộ với BRAND_COLOR)
                      margins: { top: 200, bottom: 200, left: 200, right: 200 },
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: insights.deep_insights,
                              font: "Arial",
                              italics: true,
                              color: SLATE_COLOR,
                              bold: true,
                              size: 22,
                            }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            new Paragraph({ spacing: { after: 400 } })
          ] : []),

          // 1. Velocity Analysis
          new Paragraph({
            children: [
              new TextRun({
                text: "01. ĐÁNH GIÁ NHỊP ĐỘ (VELOCITY)",
                font: "Arial",
                bold: true,
                size: 26,
                color: BRAND_COLOR,
              }),
            ],
            spacing: { before: 200, after: 150 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: insights.velocity_analysis,
                font: "Arial",
                size: 22,
                color: SLATE_COLOR,
              }),
            ],
            spacing: { after: 400 },
          }),

          // 2. Risk Forecast
          new Paragraph({
            children: [
              new TextRun({
                text: "02. DỰ BÁO RỦI RO CHIẾN LƯỢC",
                font: "Arial",
                bold: true,
                size: 26,
                color: BRAND_COLOR,
              }),
            ],
            spacing: { before: 200, after: 150 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: insights.risk_forecast || "Chưa có dữ liệu rủi ro cụ thể.",
                font: "Arial",
                size: 22,
                color: SLATE_COLOR,
              }),
            ],
            spacing: { after: 400 },
          }),

          // 3. Bottlenecks
          new Paragraph({
            children: [
              new TextRun({
                text: "03. PHÁT HIỆN ĐIỂM NGHẼN",
                font: "Arial",
                bold: true,
                size: 26,
                color: BRAND_COLOR,
              }),
            ],
            spacing: { before: 200, after: 150 },
          }),
          ...(Array.isArray(insights.bottlenecks) && insights.bottlenecks.length > 0 ? insights.bottlenecks : ["Không có điểm nghẽn nghiêm trọng nào được phát hiện."]).map(
            (item) =>
              new Paragraph({
                indent: { left: 360, hanging: 360 }, // Proper bullet indent
                children: [
                  new TextRun({ text: "• ", font: "Arial", size: 22, color: BRAND_COLOR, bold: true }),
                  new TextRun({ text: item, font: "Arial", size: 22, color: SLATE_COLOR }),
                ],
                spacing: { before: 120, after: 120 },
              })
          ),
          new Paragraph({ spacing: { after: 300 } }),

          // 4. Team Performance
          new Paragraph({
            children: [
              new TextRun({
                text: "04. PHÂN TÍCH HIỆU SUẤT ĐỘI NGŨ",
                font: "Arial",
                bold: true,
                size: 26,
                color: BRAND_COLOR,
              }),
            ],
            spacing: { before: 200, after: 150 },
          }),
          ...(Array.isArray(insights.team_performance) && insights.team_performance.length > 0 ? insights.team_performance : ["Chưa có dữ liệu thành viên."]).map(
            (item) =>
              new Paragraph({
                indent: { left: 360, hanging: 360 },
                children: [
                  new TextRun({ text: "• ", font: "Arial", size: 22, color: BRAND_COLOR, bold: true }),
                  new TextRun({ text: item, font: "Arial", size: 22, color: SLATE_COLOR }),
                ],
                spacing: { before: 120, after: 120 },
              })
          ),
          new Paragraph({ spacing: { after: 300 } }),

          // 5. Recommendations (Using Table for Card-like UI)
          new Paragraph({
            children: [
              new TextRun({
                text: "05. ĐỀ XUẤT HÀNH ĐỘNG CỤ THỂ",
                font: "Arial",
                bold: true,
                size: 26,
                color: BRAND_COLOR,
              }),
            ],
            spacing: { before: 200, after: 150 },
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
              insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" }, // Light divider
            },
            rows: (Array.isArray(insights.recommendations) ? insights.recommendations : []).map(
              (rec, index) =>
                new TableRow({
                  children: [
                    new TableCell({
                      shading: { fill: "F8FAFC" }, // Light slate background
                      margins: { top: 200, bottom: 200, left: 200, right: 200 },
                      borders: {
                        top: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
                        bottom: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
                        left: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
                        right: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
                      },
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: `${index + 1}. `,
                              font: "Arial",
                              bold: true,
                              size: 22,
                              color: BRAND_COLOR,
                            }),
                            new TextRun({
                              text: rec,
                              font: "Arial",
                              bold: true,
                              size: 22,
                              color: SLATE_COLOR,
                            }),
                          ],
                        }),
                      ],
                    }),
                  ],
                })
            ),
          }),

          // 6. Bảng Thống kê chi tiết (Detailed Stats from reportStats)
          ...(reportStats ? [
            new Paragraph({
              children: [
                new TextRun({
                  text: "06. BẢNG SỐ LIỆU THỐNG KÊ CHI TIẾT",
                  font: "Arial",
                  bold: true,
                  size: 26,
                  color: BRAND_COLOR,
                }),
              ],
              spacing: { before: 400, after: 150 },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "A. THỐNG KÊ TỔNG QUAN DỰ ÁN",
                  font: "Arial",
                  bold: true,
                  size: 22,
                  color: SLATE_COLOR,
                }),
              ],
              spacing: { before: 200, after: 150 },
            }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 4, color: BRAND_COLOR },
                bottom: { style: BorderStyle.SINGLE, size: 4, color: BRAND_COLOR },
                insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
                insideVertical: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
              },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({ shading: { fill: "F8FAFC" }, margins: { top: 100, bottom: 100, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: "Tổng Task", font: "Arial", bold: true, size: 20 })] })] }),
                    new TableCell({ shading: { fill: "F8FAFC" }, margins: { top: 100, bottom: 100, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: "Hoàn thành", font: "Arial", bold: true, size: 20 })] })] }),
                    new TableCell({ shading: { fill: "F8FAFC" }, margins: { top: 100, bottom: 100, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: "Đang thực hiện", font: "Arial", bold: true, size: 20 })] })] }),
                    new TableCell({ shading: { fill: "F8FAFC" }, margins: { top: 100, bottom: 100, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: "Chờ duyệt", font: "Arial", bold: true, size: 20 })] })] }),
                  ]
                }),
                new TableRow({
                  children: [
                    new TableCell({ margins: { top: 100, bottom: 100, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: reportStats.overallStats.totalTasks?.toString() || "0", font: "Arial", size: 20 })] })] }),
                    new TableCell({ margins: { top: 100, bottom: 100, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: reportStats.overallStats.completedTasks?.toString() || "0", font: "Arial", size: 20, color: "10B981", bold: true })] })] }),
                    new TableCell({ margins: { top: 100, bottom: 100, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: reportStats.overallStats.inProgressTasks?.toString() || "0", font: "Arial", size: 20, color: "3B82F6", bold: true })] })] }),
                    new TableCell({ margins: { top: 100, bottom: 100, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: reportStats.overallStats.inReviewTasks?.toString() || "0", font: "Arial", size: 20, color: "F59E0B", bold: true })] })] }),
                  ]
                }),
                new TableRow({
                  children: [
                    new TableCell({ shading: { fill: "F8FAFC" }, margins: { top: 100, bottom: 100, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: "Quan trọng (High)", font: "Arial", bold: true, size: 20 })] })] }),
                    new TableCell({ shading: { fill: "F8FAFC" }, margins: { top: 100, bottom: 100, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: "Trễ hạn (Overdue)", font: "Arial", bold: true, size: 20 })] })] }),
                    new TableCell({ shading: { fill: "F8FAFC" }, margins: { top: 100, bottom: 100, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: "Chưa phân công", font: "Arial", bold: true, size: 20 })] })] }),
                    new TableCell({ shading: { fill: "F8FAFC" }, margins: { top: 100, bottom: 100, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: "Tỷ lệ hoàn thành", font: "Arial", bold: true, size: 20 })] })] }),
                  ]
                }),
                new TableRow({
                  children: [
                    new TableCell({ margins: { top: 100, bottom: 100, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: reportStats.overallStats.highPriorityTasks?.toString() || "0", font: "Arial", size: 20, color: "EF4444", bold: true })] })] }),
                    new TableCell({ margins: { top: 100, bottom: 100, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: reportStats.overallStats.overdueTasks?.toString() || "0", font: "Arial", size: 20, color: "EF4444", bold: true })] })] }),
                    new TableCell({ margins: { top: 100, bottom: 100, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: reportStats.overallStats.unassignedTasks?.toString() || "0", font: "Arial", size: 20 })] })] }),
                    new TableCell({ margins: { top: 100, bottom: 100, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: `${reportStats.overallStats.completionRate || 0}%`, font: "Arial", size: 20, color: "10B981", bold: true })] })] }),
                  ]
                })
              ]
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "B. THỐNG KÊ CHI TIẾT THEO THÀNH VIÊN",
                  font: "Arial",
                  bold: true,
                  size: 22,
                  color: SLATE_COLOR,
                }),
              ],
              spacing: { before: 400, after: 150 },
            }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 4, color: BRAND_COLOR },
                bottom: { style: BorderStyle.SINGLE, size: 4, color: BRAND_COLOR },
                insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
                insideVertical: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
              },
              rows: [
                // Header row
                new TableRow({
                  children: [
                    new TableCell({
                      shading: { fill: "F8FAFC" },
                      margins: { top: 100, bottom: 100, left: 100, right: 100 },
                      children: [new Paragraph({ children: [new TextRun({ text: "Thành viên", font: "Arial", bold: true, size: 18, color: SLATE_COLOR })] })]
                    }),
                    new TableCell({
                      shading: { fill: "F8FAFC" },
                      margins: { top: 100, bottom: 100, left: 100, right: 100 },
                      children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Tổng", font: "Arial", bold: true, size: 18, color: SLATE_COLOR })] })]
                    }),
                    new TableCell({
                      shading: { fill: "F8FAFC" },
                      margins: { top: 100, bottom: 100, left: 100, right: 100 },
                      children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "To-do", font: "Arial", bold: true, size: 18, color: SLATE_COLOR })] })]
                    }),
                    new TableCell({
                      shading: { fill: "F8FAFC" },
                      margins: { top: 100, bottom: 100, left: 100, right: 100 },
                      children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "In Prog", font: "Arial", bold: true, size: 18, color: SLATE_COLOR })] })]
                    }),
                    new TableCell({
                      shading: { fill: "F8FAFC" },
                      margins: { top: 100, bottom: 100, left: 100, right: 100 },
                      children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Review", font: "Arial", bold: true, size: 18, color: SLATE_COLOR })] })]
                    }),
                    new TableCell({
                      shading: { fill: "F8FAFC" },
                      margins: { top: 100, bottom: 100, left: 100, right: 100 },
                      children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Xong", font: "Arial", bold: true, size: 18, color: SLATE_COLOR })] })]
                    }),
                    new TableCell({
                      shading: { fill: "F8FAFC" },
                      margins: { top: 100, bottom: 100, left: 100, right: 100 },
                      children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Tỷ lệ", font: "Arial", bold: true, size: 18, color: SLATE_COLOR })] })]
                    }),
                  ]
                }),
                // Data rows
                ...(reportStats.memberStats || []).map(member => 
                  new TableRow({
                    children: [
                      new TableCell({
                        margins: { top: 100, bottom: 100, left: 100, right: 100 },
                        children: [
                          new Paragraph({ children: [new TextRun({ text: member.name || "N/A", font: "Arial", bold: true, size: 18, color: SLATE_COLOR })] }),
                          new Paragraph({ children: [new TextRun({ text: member.email || "N/A", font: "Arial", size: 16, color: TEXT_SECONDARY })] })
                        ]
                      }),
                      new TableCell({
                        margins: { top: 100, bottom: 100, left: 100, right: 100 },
                        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: member.total?.toString() || "0", font: "Arial", size: 18 })] })]
                      }),
                      new TableCell({
                        margins: { top: 100, bottom: 100, left: 100, right: 100 },
                        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: member.todo?.toString() || "0", font: "Arial", size: 18 })] })]
                      }),
                      new TableCell({
                        margins: { top: 100, bottom: 100, left: 100, right: 100 },
                        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: member.inProgress?.toString() || "0", font: "Arial", size: 18, color: "3B82F6" })] })]
                      }),
                      new TableCell({
                        margins: { top: 100, bottom: 100, left: 100, right: 100 },
                        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: member.inReview?.toString() || "0", font: "Arial", size: 18, color: "F59E0B" })] })]
                      }),
                      new TableCell({
                        margins: { top: 100, bottom: 100, left: 100, right: 100 },
                        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: member.done?.toString() || "0", font: "Arial", size: 18, color: "10B981", bold: true })] })]
                      }),
                      new TableCell({
                        margins: { top: 100, bottom: 100, left: 100, right: 100 },
                        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${member.completionRate || 0}%`, font: "Arial", size: 18, color: "10B981", bold: true })] })]
                      }),
                    ]
                  })
                )
              ]
            })
          ] : []),

          // 7. Bảng Thống kê trong khoảng thời gian lọc (Detailed Stats from filteredReportStats)
          ...(filteredReportStats ? [
            new Paragraph({
              children: [
                new TextRun({
                  text: "07. SỐ LIỆU TRONG KHOẢNG THỜI GIAN LỌC",
                  font: "Arial",
                  bold: true,
                  size: 26,
                  color: BRAND_COLOR,
                }),
              ],
              spacing: { before: 400, after: 150 },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "A. TỔNG QUAN DỰ ÁN TRONG KỲ LỌC",
                  font: "Arial",
                  bold: true,
                  size: 22,
                  color: SLATE_COLOR,
                }),
              ],
              spacing: { before: 200, after: 150 },
            }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 4, color: BRAND_COLOR },
                bottom: { style: BorderStyle.SINGLE, size: 4, color: BRAND_COLOR },
                insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
                insideVertical: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
              },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({ shading: { fill: "F8FAFC" }, margins: { top: 100, bottom: 100, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: "Tổng Task", font: "Arial", bold: true, size: 20 })] })] }),
                    new TableCell({ shading: { fill: "F8FAFC" }, margins: { top: 100, bottom: 100, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: "Hoàn thành", font: "Arial", bold: true, size: 20 })] })] }),
                    new TableCell({ shading: { fill: "F8FAFC" }, margins: { top: 100, bottom: 100, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: "Đang thực hiện", font: "Arial", bold: true, size: 20 })] })] }),
                    new TableCell({ shading: { fill: "F8FAFC" }, margins: { top: 100, bottom: 100, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: "Chờ duyệt", font: "Arial", bold: true, size: 20 })] })] }),
                  ]
                }),
                new TableRow({
                  children: [
                    new TableCell({ margins: { top: 100, bottom: 100, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: filteredReportStats.overallStats.totalTasks?.toString() || "0", font: "Arial", size: 20 })] })] }),
                    new TableCell({ margins: { top: 100, bottom: 100, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: filteredReportStats.overallStats.completedTasks?.toString() || "0", font: "Arial", size: 20, color: "10B981", bold: true })] })] }),
                    new TableCell({ margins: { top: 100, bottom: 100, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: filteredReportStats.overallStats.inProgressTasks?.toString() || "0", font: "Arial", size: 20, color: "3B82F6", bold: true })] })] }),
                    new TableCell({ margins: { top: 100, bottom: 100, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: filteredReportStats.overallStats.inReviewTasks?.toString() || "0", font: "Arial", size: 20, color: "F59E0B", bold: true })] })] }),
                  ]
                }),
                new TableRow({
                  children: [
                    new TableCell({ shading: { fill: "F8FAFC" }, margins: { top: 100, bottom: 100, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: "Quan trọng (High)", font: "Arial", bold: true, size: 20 })] })] }),
                    new TableCell({ shading: { fill: "F8FAFC" }, margins: { top: 100, bottom: 100, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: "Trễ hạn (Overdue)", font: "Arial", bold: true, size: 20 })] })] }),
                    new TableCell({ shading: { fill: "F8FAFC" }, margins: { top: 100, bottom: 100, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: "Chưa phân công", font: "Arial", bold: true, size: 20 })] })] }),
                    new TableCell({ shading: { fill: "F8FAFC" }, margins: { top: 100, bottom: 100, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: "Tỷ lệ hoàn thành", font: "Arial", bold: true, size: 20 })] })] }),
                  ]
                }),
                new TableRow({
                  children: [
                    new TableCell({ margins: { top: 100, bottom: 100, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: filteredReportStats.overallStats.highPriorityTasks?.toString() || "0", font: "Arial", size: 20, color: "EF4444", bold: true })] })] }),
                    new TableCell({ margins: { top: 100, bottom: 100, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: filteredReportStats.overallStats.overdueTasks?.toString() || "0", font: "Arial", size: 20, color: "EF4444", bold: true })] })] }),
                    new TableCell({ margins: { top: 100, bottom: 100, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: filteredReportStats.overallStats.unassignedTasks?.toString() || "0", font: "Arial", size: 20 })] })] }),
                    new TableCell({ margins: { top: 100, bottom: 100, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: `${filteredReportStats.overallStats.completionRate || 0}%`, font: "Arial", size: 20, color: "10B981", bold: true })] })] }),
                  ]
                })
              ]
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "B. CHI TIẾT THÀNH VIÊN TRONG KỲ LỌC",
                  font: "Arial",
                  bold: true,
                  size: 22,
                  color: SLATE_COLOR,
                }),
              ],
              spacing: { before: 400, after: 150 },
            }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 4, color: BRAND_COLOR },
                bottom: { style: BorderStyle.SINGLE, size: 4, color: BRAND_COLOR },
                insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
                insideVertical: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
              },
              rows: [
                // Header row
                new TableRow({
                  children: [
                    new TableCell({
                      shading: { fill: "F8FAFC" },
                      margins: { top: 100, bottom: 100, left: 100, right: 100 },
                      children: [new Paragraph({ children: [new TextRun({ text: "Thành viên", font: "Arial", bold: true, size: 18, color: SLATE_COLOR })] })]
                    }),
                    new TableCell({
                      shading: { fill: "F8FAFC" },
                      margins: { top: 100, bottom: 100, left: 100, right: 100 },
                      children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Tổng", font: "Arial", bold: true, size: 18, color: SLATE_COLOR })] })]
                    }),
                    new TableCell({
                      shading: { fill: "F8FAFC" },
                      margins: { top: 100, bottom: 100, left: 100, right: 100 },
                      children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "To-do", font: "Arial", bold: true, size: 18, color: SLATE_COLOR })] })]
                    }),
                    new TableCell({
                      shading: { fill: "F8FAFC" },
                      margins: { top: 100, bottom: 100, left: 100, right: 100 },
                      children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "In Prog", font: "Arial", bold: true, size: 18, color: SLATE_COLOR })] })]
                    }),
                    new TableCell({
                      shading: { fill: "F8FAFC" },
                      margins: { top: 100, bottom: 100, left: 100, right: 100 },
                      children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Review", font: "Arial", bold: true, size: 18, color: SLATE_COLOR })] })]
                    }),
                    new TableCell({
                      shading: { fill: "F8FAFC" },
                      margins: { top: 100, bottom: 100, left: 100, right: 100 },
                      children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Xong", font: "Arial", bold: true, size: 18, color: SLATE_COLOR })] })]
                    }),
                    new TableCell({
                      shading: { fill: "F8FAFC" },
                      margins: { top: 100, bottom: 100, left: 100, right: 100 },
                      children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Tỷ lệ", font: "Arial", bold: true, size: 18, color: SLATE_COLOR })] })]
                    }),
                  ]
                }),
                // Data rows
                ...(filteredReportStats.memberStats || []).map(member => 
                  new TableRow({
                    children: [
                      new TableCell({
                        margins: { top: 100, bottom: 100, left: 100, right: 100 },
                        children: [
                          new Paragraph({ children: [new TextRun({ text: member.name || "N/A", font: "Arial", bold: true, size: 18, color: SLATE_COLOR })] }),
                          new Paragraph({ children: [new TextRun({ text: member.email || "N/A", font: "Arial", size: 16, color: TEXT_SECONDARY })] })
                        ]
                      }),
                      new TableCell({
                        margins: { top: 100, bottom: 100, left: 100, right: 100 },
                        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: member.total?.toString() || "0", font: "Arial", size: 18 })] })]
                      }),
                      new TableCell({
                        margins: { top: 100, bottom: 100, left: 100, right: 100 },
                        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: member.todo?.toString() || "0", font: "Arial", size: 18 })] })]
                      }),
                      new TableCell({
                        margins: { top: 100, bottom: 100, left: 100, right: 100 },
                        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: member.inProgress?.toString() || "0", font: "Arial", size: 18, color: "3B82F6" })] })]
                      }),
                      new TableCell({
                        margins: { top: 100, bottom: 100, left: 100, right: 100 },
                        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: member.inReview?.toString() || "0", font: "Arial", size: 18, color: "F59E0B" })] })]
                      }),
                      new TableCell({
                        margins: { top: 100, bottom: 100, left: 100, right: 100 },
                        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: member.done?.toString() || "0", font: "Arial", size: 18, color: "10B981", bold: true })] })]
                      }),
                      new TableCell({
                        margins: { top: 100, bottom: 100, left: 100, right: 100 },
                        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${member.completionRate || 0}%`, font: "Arial", size: 18, color: "10B981", bold: true })] })]
                      }),
                    ]
                  })
                )
              ]
            })
          ] : []),

          // 8. Phân tích chuyên sâu (Bảng số liệu)
          ...(filteredReportStats ? [
            new Paragraph({
              children: [
                new TextRun({
                  text: "08. PHÂN TÍCH CHUYÊN SÂU (BẢNG SỐ LIỆU)",
                  font: "Arial",
                  bold: true,
                  size: 26,
                  color: BRAND_COLOR,
                }),
              ],
              spacing: { before: 400, after: 150 },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "A. PHÂN BỔ ĐỘ ƯU TIÊN (PRIORITY)",
                  font: "Arial",
                  bold: true,
                  size: 22,
                  color: SLATE_COLOR,
                }),
              ],
              spacing: { before: 200, after: 150 },
            }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 4, color: BRAND_COLOR },
                bottom: { style: BorderStyle.SINGLE, size: 4, color: BRAND_COLOR },
                insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
                insideVertical: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
              },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({ shading: { fill: "F8FAFC" }, margins: { top: 100, bottom: 100, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: "Cấp bách (Urgent)", font: "Arial", bold: true, size: 20, color: "EF4444" })] })] }),
                    new TableCell({ shading: { fill: "F8FAFC" }, margins: { top: 100, bottom: 100, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: "Cao (High)", font: "Arial", bold: true, size: 20, color: "F59E0B" })] })] }),
                    new TableCell({ shading: { fill: "F8FAFC" }, margins: { top: 100, bottom: 100, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: "Trung bình (Medium)", font: "Arial", bold: true, size: 20, color: "3B82F6" })] })] }),
                    new TableCell({ shading: { fill: "F8FAFC" }, margins: { top: 100, bottom: 100, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: "Thấp (Low)", font: "Arial", bold: true, size: 20, color: "10B981" })] })] }),
                  ]
                }),
                new TableRow({
                  children: [
                    new TableCell({ margins: { top: 100, bottom: 100, left: 100, right: 100 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: filteredReportStats.overallStats.priorityDistribution?.URGENT?.toString() || "0", font: "Arial", size: 20, bold: true })] })] }),
                    new TableCell({ margins: { top: 100, bottom: 100, left: 100, right: 100 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: filteredReportStats.overallStats.priorityDistribution?.HIGH?.toString() || "0", font: "Arial", size: 20, bold: true })] })] }),
                    new TableCell({ margins: { top: 100, bottom: 100, left: 100, right: 100 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: filteredReportStats.overallStats.priorityDistribution?.MEDIUM?.toString() || "0", font: "Arial", size: 20, bold: true })] })] }),
                    new TableCell({ margins: { top: 100, bottom: 100, left: 100, right: 100 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: filteredReportStats.overallStats.priorityDistribution?.LOW?.toString() || "0", font: "Arial", size: 20, bold: true })] })] }),
                  ]
                }),
              ]
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "B. PHÂN BỔ TRẠNG THÁI (STATUS)",
                  font: "Arial",
                  bold: true,
                  size: 22,
                  color: SLATE_COLOR,
                }),
              ],
              spacing: { before: 300, after: 150 },
            }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 4, color: BRAND_COLOR },
                bottom: { style: BorderStyle.SINGLE, size: 4, color: BRAND_COLOR },
                insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
                insideVertical: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
              },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({ shading: { fill: "F8FAFC" }, margins: { top: 100, bottom: 100, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: "Cần làm (To-Do)", font: "Arial", bold: true, size: 20, color: SLATE_COLOR })] })] }),
                    new TableCell({ shading: { fill: "F8FAFC" }, margins: { top: 100, bottom: 100, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: "Đang thực hiện (In Progress)", font: "Arial", bold: true, size: 20, color: "3B82F6" })] })] }),
                    new TableCell({ shading: { fill: "F8FAFC" }, margins: { top: 100, bottom: 100, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: "Chờ duyệt (In Review)", font: "Arial", bold: true, size: 20, color: "F59E0B" })] })] }),
                    new TableCell({ shading: { fill: "F8FAFC" }, margins: { top: 100, bottom: 100, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: "Hoàn thành (Done)", font: "Arial", bold: true, size: 20, color: "10B981" })] })] }),
                  ]
                }),
                new TableRow({
                  children: [
                    new TableCell({ margins: { top: 100, bottom: 100, left: 100, right: 100 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: filteredReportStats.overallStats.statusDistribution?.TODO?.toString() || "0", font: "Arial", size: 20, bold: true })] })] }),
                    new TableCell({ margins: { top: 100, bottom: 100, left: 100, right: 100 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: filteredReportStats.overallStats.statusDistribution?.IN_PROGRESS?.toString() || "0", font: "Arial", size: 20, bold: true })] })] }),
                    new TableCell({ margins: { top: 100, bottom: 100, left: 100, right: 100 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: filteredReportStats.overallStats.statusDistribution?.INREVIEW?.toString() || "0", font: "Arial", size: 20, bold: true })] })] }),
                    new TableCell({ margins: { top: 100, bottom: 100, left: 100, right: 100 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: filteredReportStats.overallStats.statusDistribution?.DONE?.toString() || "0", font: "Arial", size: 20, bold: true })] })] }),
                  ]
                }),
              ]
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "C. QUẢN LÝ THỜI GIAN (TIME TRACKING)",
                  font: "Arial",
                  bold: true,
                  size: 22,
                  color: SLATE_COLOR,
                }),
              ],
              spacing: { before: 300, after: 150 },
            }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 4, color: BRAND_COLOR },
                bottom: { style: BorderStyle.SINGLE, size: 4, color: BRAND_COLOR },
                insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
                insideVertical: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
              },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({ shading: { fill: "F8FAFC" }, margins: { top: 100, bottom: 100, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: "Tổng giờ dự kiến", font: "Arial", bold: true, size: 20 })] })] }),
                    new TableCell({ shading: { fill: "F8FAFC" }, margins: { top: 100, bottom: 100, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: "Tổng giờ đã làm (Logged)", font: "Arial", bold: true, size: 20 })] })] }),
                    new TableCell({ shading: { fill: "F8FAFC" }, margins: { top: 100, bottom: 100, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: "Độ lệch thời gian", font: "Arial", bold: true, size: 20 })] })] }),
                  ]
                }),
                new TableRow({
                  children: [
                    new TableCell({ margins: { top: 100, bottom: 100, left: 100, right: 100 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${filteredReportStats.overallStats.totalEstimatedHours || 0} giờ`, font: "Arial", size: 20 })] })] }),
                    new TableCell({ margins: { top: 100, bottom: 100, left: 100, right: 100 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${filteredReportStats.overallStats.totalLoggedHours || 0} giờ`, font: "Arial", size: 20, color: "3B82F6", bold: true })] })] }),
                    new TableCell({ margins: { top: 100, bottom: 100, left: 100, right: 100 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ 
                      text: `${(filteredReportStats.overallStats.totalLoggedHours || 0) - (filteredReportStats.overallStats.totalEstimatedHours || 0)} giờ`, 
                      font: "Arial", 
                      size: 20, 
                      color: ((filteredReportStats.overallStats.totalLoggedHours || 0) > (filteredReportStats.overallStats.totalEstimatedHours || 0)) ? "EF4444" : "10B981", 
                      bold: true 
                    })] })] }),
                  ]
                }),
              ]
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "D. QUẢN LÝ THỜI GIAN THEO THÀNH VIÊN",
                  font: "Arial",
                  bold: true,
                  size: 22,
                  color: SLATE_COLOR,
                }),
              ],
              spacing: { before: 300, after: 150 },
            }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 4, color: BRAND_COLOR },
                bottom: { style: BorderStyle.SINGLE, size: 4, color: BRAND_COLOR },
                insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
                insideVertical: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
              },
              rows: [
                // Header row
                new TableRow({
                  children: [
                    new TableCell({
                      shading: { fill: "F8FAFC" },
                      margins: { top: 100, bottom: 100, left: 100, right: 100 },
                      children: [new Paragraph({ children: [new TextRun({ text: "Thành viên", font: "Arial", bold: true, size: 18, color: SLATE_COLOR })] })]
                    }),
                    new TableCell({
                      shading: { fill: "F8FAFC" },
                      margins: { top: 100, bottom: 100, left: 100, right: 100 },
                      children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Giờ dự kiến", font: "Arial", bold: true, size: 18, color: SLATE_COLOR })] })]
                    }),
                    new TableCell({
                      shading: { fill: "F8FAFC" },
                      margins: { top: 100, bottom: 100, left: 100, right: 100 },
                      children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Giờ đã làm", font: "Arial", bold: true, size: 18, color: SLATE_COLOR })] })]
                    }),
                    new TableCell({
                      shading: { fill: "F8FAFC" },
                      margins: { top: 100, bottom: 100, left: 100, right: 100 },
                      children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Độ lệch", font: "Arial", bold: true, size: 18, color: SLATE_COLOR })] })]
                    })
                  ]
                }),
                // Data rows
                ...(filteredReportStats.memberStats || []).map(member => 
                  new TableRow({
                    children: [
                      new TableCell({
                        margins: { top: 100, bottom: 100, left: 100, right: 100 },
                        children: [
                          new Paragraph({ children: [new TextRun({ text: member.name || "N/A", font: "Arial", bold: true, size: 18, color: SLATE_COLOR })] }),
                        ]
                      }),
                      new TableCell({
                        margins: { top: 100, bottom: 100, left: 100, right: 100 },
                        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${member.estimatedHours || 0} giờ`, font: "Arial", size: 18 })] })]
                      }),
                      new TableCell({
                        margins: { top: 100, bottom: 100, left: 100, right: 100 },
                        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${member.loggedHours || 0} giờ`, font: "Arial", size: 18, color: "3B82F6", bold: true })] })]
                      }),
                      new TableCell({
                        margins: { top: 100, bottom: 100, left: 100, right: 100 },
                        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ 
                            text: `${(member.loggedHours || 0) - (member.estimatedHours || 0)} giờ`, 
                            font: "Arial", size: 18, 
                            color: ((member.loggedHours || 0) > (member.estimatedHours || 0)) ? "EF4444" : "10B981", 
                            bold: true 
                        })] })]
                      })
                    ]
                  })
                )
              ]
            })
          ] : []),

          // Footer info
          new Paragraph({
            alignment: AlignmentType.CENTER,
            border: {
              top: { color: BORDER_COLOR, space: 1, style: BorderStyle.SINGLE, size: 1 },
            },
            children: [
              new TextRun({
                text: "\nBáo cáo này được bảo mật và tạo ra bởi trí tuệ nhân tạo TeamFlow Intelligence.",
                font: "Arial",
                size: 18,
                color: TEXT_SECONDARY,
                italics: true,
              }),
              new TextRun({
                text: `\nNgày tạo: ${new Date().toLocaleDateString('vi-VN')}`,
                font: "Arial",
                size: 16,
                color: TEXT_SECONDARY,
              }),
            ],
            spacing: { before: 1000 },
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const fileName = `Bao_cao_AI_${projectName.replace(/\s+/g, '_')}_${new Date().getTime()}.docx`;
  saveAs(blob, fileName);
};

export interface WorkspaceOverviewWordParams {
  workspaceName: string;
  reporterName: string;
  activeFilters: {
    year: number;
    periodType: 'month' | 'quarter';
    periodValue: number;
    projectName: string;
    healthStatus: string;
  };
  stats: {
    totalTasks: number;
    inProgressTasks: number;
    completedTasks: number;
    overdueTasks: number;
    completionRate: number;
  };
  velocityData: Array<{ date: string; completed: number }>;
  members: any[];
}

export const exportWorkspaceOverviewToWord = async ({
  workspaceName,
  reporterName = "Thành viên TeamFlow",
  activeFilters,
  stats,
  velocityData = [],
  members = []
}: WorkspaceOverviewWordParams) => {
  const periodLabel = activeFilters.year === 0
    ? "Toàn bộ thời gian (All-time)"
    : activeFilters.periodType === 'month'
      ? (activeFilters.periodValue === 0 ? `Năm ${activeFilters.year} (Cả năm)` : `Tháng ${activeFilters.periodValue}/${activeFilters.year}`)
      : `Quý ${activeFilters.periodValue}/${activeFilters.year}`;

  const processedMembers = (members || []).map((m: any) => {
    const name = m.name || m.userId?.name || "Thành viên";
    const total = m.totalTasks ?? m.total ?? m.taskStats?.totalTasks ?? 0;
    const completed = m.completedTasks ?? m.completed ?? m.taskStats?.completedTasks ?? 0;
    const overdue = m.overdueTasks ?? m.overdue ?? m.taskStats?.overdueTasks ?? 0;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { name, total, completed, overdue, rate };
  });

  // Tìm Top Performer
  let topPerformer = "Chưa ghi nhận";
  const highPerformers = [...processedMembers]
    .filter(m => m.completed > 0)
    .sort((a, b) => b.rate - a.rate || b.completed - a.completed);
  if (highPerformers.length > 0) {
    topPerformer = `${highPerformers[0].name} (${highPerformers[0].rate}% hoàn thành, ${highPerformers[0].completed} task)`;
  }

  // Tìm Workload Champion
  let workloadChampion = "Chưa ghi nhận";
  const busyMembers = [...processedMembers].sort((a, b) => b.total - a.total);
  if (busyMembers.length > 0 && busyMembers[0].total > 0) {
    workloadChampion = `${busyMembers[0].name} (Gánh vác ${busyMembers[0].total} task)`;
  }

  // Tìm Overdue Warning
  let overdueWarning = "Không có thành viên trễ hạn";
  const strugglingMembers = [...processedMembers]
    .filter(m => m.overdue > 0)
    .sort((a, b) => b.overdue - a.overdue);
  if (strugglingMembers.length > 0) {
    overdueWarning = `${strugglingMembers[0].name} (Trễ hạn ${strugglingMembers[0].overdue} task)`;
  }

  // Tiêu đề bảng thành viên
  const tableHeaderRow = new TableRow({
    children: [
      new TableCell({
        shading: { fill: SLATE_COLOR },
        margins: { top: 120, bottom: 120, left: 120, right: 120 },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 1, color: BRAND_COLOR },
          bottom: { style: BorderStyle.SINGLE, size: 1, color: BRAND_COLOR },
          left: { style: BorderStyle.SINGLE, size: 1, color: BRAND_COLOR },
          right: { style: BorderStyle.SINGLE, size: 1, color: BRAND_COLOR },
        },
        children: [new Paragraph({ children: [new TextRun({ text: "Thành viên", bold: true, color: "FFFFFF" })] })]
      }),
      new TableCell({
        shading: { fill: SLATE_COLOR },
        margins: { top: 120, bottom: 120, left: 120, right: 120 },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 1, color: BRAND_COLOR },
          bottom: { style: BorderStyle.SINGLE, size: 1, color: BRAND_COLOR },
          left: { style: BorderStyle.SINGLE, size: 1, color: BRAND_COLOR },
          right: { style: BorderStyle.SINGLE, size: 1, color: BRAND_COLOR },
        },
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Tổng việc giao", bold: true, color: "FFFFFF" })] })]
      }),
      new TableCell({
        shading: { fill: SLATE_COLOR },
        margins: { top: 120, bottom: 120, left: 120, right: 120 },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 1, color: BRAND_COLOR },
          bottom: { style: BorderStyle.SINGLE, size: 1, color: BRAND_COLOR },
          left: { style: BorderStyle.SINGLE, size: 1, color: BRAND_COLOR },
          right: { style: BorderStyle.SINGLE, size: 1, color: BRAND_COLOR },
        },
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Đã hoàn thành", bold: true, color: "FFFFFF" })] })]
      }),
      new TableCell({
        shading: { fill: SLATE_COLOR },
        margins: { top: 120, bottom: 120, left: 120, right: 120 },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 1, color: BRAND_COLOR },
          bottom: { style: BorderStyle.SINGLE, size: 1, color: BRAND_COLOR },
          left: { style: BorderStyle.SINGLE, size: 1, color: BRAND_COLOR },
          right: { style: BorderStyle.SINGLE, size: 1, color: BRAND_COLOR },
        },
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Quá hạn", bold: true, color: "FFFFFF" })] })]
      }),
      new TableCell({
        shading: { fill: SLATE_COLOR },
        margins: { top: 120, bottom: 120, left: 120, right: 120 },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 1, color: BRAND_COLOR },
          bottom: { style: BorderStyle.SINGLE, size: 1, color: BRAND_COLOR },
          left: { style: BorderStyle.SINGLE, size: 1, color: BRAND_COLOR },
          right: { style: BorderStyle.SINGLE, size: 1, color: BRAND_COLOR },
        },
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Hiệu suất", bold: true, color: "FFFFFF" })] })]
      })
    ]
  });

  const memberRows = processedMembers.length === 0
    ? [new TableRow({
        children: [
          new TableCell({
            margins: { top: 100, bottom: 100, left: 120, right: 120 },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
              left: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
              right: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
            },
            columnSpan: 5,
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Chưa ghi nhận dữ liệu nhân sự trong kỳ này", italics: true, color: TEXT_SECONDARY })] })]
          })
        ]
      })]
    : processedMembers.map((m, index) => {
        const rowBg = index % 2 === 1 ? "F8FAFC" : "FFFFFF";
        return new TableRow({
          children: [
            new TableCell({
              shading: { fill: rowBg },
              margins: { top: 100, bottom: 100, left: 120, right: 120 },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
                left: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
                right: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
              },
              children: [new Paragraph({ children: [new TextRun({ text: m.name, bold: true, color: SLATE_COLOR })] })]
            }),
            new TableCell({
              shading: { fill: rowBg },
              margins: { top: 100, bottom: 100, left: 120, right: 120 },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
                left: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
                right: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
              },
              children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(m.total), color: SLATE_COLOR })] })]
            }),
            new TableCell({
              shading: { fill: rowBg },
              margins: { top: 100, bottom: 100, left: 120, right: 120 },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
                left: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
                right: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
              },
              children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(m.completed), color: "10B981", bold: m.completed > 0 })] })]
            }),
            new TableCell({
              shading: { fill: rowBg },
              margins: { top: 100, bottom: 100, left: 120, right: 120 },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
                left: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
                right: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
              },
              children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(m.overdue), color: m.overdue > 0 ? "EF4444" : SLATE_COLOR, bold: m.overdue > 0 })] })]
            }),
            new TableCell({
              shading: { fill: rowBg },
              margins: { top: 100, bottom: 100, left: 120, right: 120 },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
                left: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
                right: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
              },
              children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${m.rate}%`, bold: true, color: BRAND_COLOR })] })]
            })
          ]
        });
      });

  // Tạo bảng chỉ số thống kê
  const statsTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({ shading: { fill: SLATE_COLOR }, margins: { top: 100, bottom: 100, left: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "Chỉ số", bold: true, color: "FFFFFF" })] })] }),
          new TableCell({ shading: { fill: SLATE_COLOR }, margins: { top: 100, bottom: 100, left: 120 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Giá trị thực tế", bold: true, color: "FFFFFF" })] })] }),
        ]
      }),
      new TableRow({
        children: [
          new TableCell({ margins: { top: 100, bottom: 100, left: 120 }, borders: { bottom: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR } }, children: [new Paragraph({ children: [new TextRun({ text: "Tổng số công việc giao", bold: true, color: SLATE_COLOR })] })] }),
          new TableCell({ margins: { top: 100, bottom: 100, left: 120 }, borders: { bottom: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR } }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(stats.totalTasks), bold: true, color: SLATE_COLOR })] })] }),
        ]
      }),
      new TableRow({
        children: [
          new TableCell({ margins: { top: 100, bottom: 100, left: 120 }, borders: { bottom: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR } }, children: [new Paragraph({ children: [new TextRun({ text: "Đã hoàn thành", bold: true, color: SLATE_COLOR })] })] }),
          new TableCell({ margins: { top: 100, bottom: 100, left: 120 }, borders: { bottom: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR } }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(stats.completedTasks), bold: true, color: "10B981" })] })] }),
        ]
      }),
      new TableRow({
        children: [
          new TableCell({ margins: { top: 100, bottom: 100, left: 120 }, borders: { bottom: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR } }, children: [new Paragraph({ children: [new TextRun({ text: "Đang thực hiện", bold: true, color: SLATE_COLOR })] })] }),
          new TableCell({ margins: { top: 100, bottom: 100, left: 120 }, borders: { bottom: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR } }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(stats.inProgressTasks), bold: true, color: "F59E0B" })] })] }),
        ]
      }),
      new TableRow({
        children: [
          new TableCell({ margins: { top: 100, bottom: 100, left: 120 }, borders: { bottom: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR } }, children: [new Paragraph({ children: [new TextRun({ text: "Cảnh báo quá hạn", bold: true, color: SLATE_COLOR })] })] }),
          new TableCell({ margins: { top: 100, bottom: 100, left: 120 }, borders: { bottom: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR } }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(stats.overdueTasks), bold: true, color: stats.overdueTasks > 0 ? "EF4444" : "10B981" })] })] }),
        ]
      }),
      new TableRow({
        children: [
          new TableCell({ margins: { top: 100, bottom: 100, left: 120 }, borders: { bottom: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR } }, children: [new Paragraph({ children: [new TextRun({ text: "Tỷ lệ hoàn thành công việc", bold: true, color: SLATE_COLOR })] })] }),
          new TableCell({ margins: { top: 100, bottom: 100, left: 120 }, borders: { bottom: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR } }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${stats.completionRate}%`, bold: true, color: BRAND_COLOR })] })] }),
        ]
      })
    ]
  });

  // Tạo bảng nhịp độ / vận tốc
  const velocityRows = velocityData.length === 0
    ? [new TableRow({
        children: [
          new TableCell({
            margins: { top: 100, bottom: 100, left: 120 },
            columnSpan: 2,
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Chưa ghi nhận dữ liệu hoàn thành công việc", italics: true, color: TEXT_SECONDARY })] })]
          })
        ]
      })]
    : velocityData.map((item, index) => {
        const rowBg = index % 2 === 1 ? "F8FAFC" : "FFFFFF";
        return new TableRow({
          children: [
            new TableCell({ shading: { fill: rowBg }, margins: { top: 80, bottom: 80, left: 120 }, children: [new Paragraph({ children: [new TextRun({ text: item.date, color: SLATE_COLOR })] })] }),
            new TableCell({ shading: { fill: rowBg }, margins: { top: 80, bottom: 80, left: 120 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${item.completed} task`, bold: true, color: BRAND_COLOR })] })] }),
          ]
        });
      });

  const velocityTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({ shading: { fill: SLATE_COLOR }, margins: { top: 100, bottom: 100, left: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "Mốc thời gian", bold: true, color: "FFFFFF" })] })] }),
          new TableCell({ shading: { fill: SLATE_COLOR }, margins: { top: 100, bottom: 100, left: 120 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Số lượng hoàn thành", bold: true, color: "FFFFFF" })] })] }),
        ]
      }),
      ...velocityRows
    ]
  });

  const doc = new Document({
    styles: {
      paragraphStyles: [
        {
          id: "normal",
          name: "Normal",
          run: {
            size: 22,
            font: "Inter, Calibri",
          },
          paragraph: {
            spacing: { line: 360, before: 120, after: 120 },
          },
        },
      ],
    },
    sections: [
      {
        children: [
          // Branding Header
          new Paragraph({
            children: [
              new TextRun({
                text: "TEAMFLOW",
                bold: true,
                size: 28,
                color: BRAND_COLOR,
                characterSpacing: 40,
              }),
              new TextRun({
                text: " | EXECUTIVE WORKSPACE REPORT",
                size: 20,
                color: TEXT_SECONDARY,
              }),
            ],
            spacing: { after: 400 },
          }),

          // Main Title
          new Paragraph({
            text: "BÁO CÁO CHIẾN LƯỢC TOÀN CẢNH WORKSPACE",
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.LEFT,
            spacing: { after: 200 },
          }),

          // Meta box Table
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    shading: { fill: "F8FAFC" },
                    margins: { top: 150, bottom: 150, left: 150, right: 150 },
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
                      bottom: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
                      left: { style: BorderStyle.SINGLE, size: 4, color: BRAND_COLOR },
                      right: { style: BorderStyle.NONE },
                    },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ text: "WORKSPACE: ", bold: true, size: 18, color: TEXT_SECONDARY }),
                          new TextRun({ text: workspaceName.toUpperCase(), bold: true, size: 22, color: SLATE_COLOR }),
                        ],
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({ text: "KỲ BÁO CÁO: ", bold: true, size: 18, color: TEXT_SECONDARY }),
                          new TextRun({ text: periodLabel, size: 20, bold: true, color: BRAND_COLOR }),
                        ],
                      }),
                    ],
                  }),
                  new TableCell({
                    shading: { fill: "F8FAFC" },
                    margins: { top: 150, bottom: 150, left: 150, right: 150 },
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
                      bottom: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
                      left: { style: BorderStyle.NONE },
                      right: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
                    },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.RIGHT,
                        children: [
                          new TextRun({ text: "NGƯỜI XUẤT BÁO CÁO: ", bold: true, size: 18, color: TEXT_SECONDARY }),
                          new TextRun({ text: reporterName, size: 20, bold: true }),
                        ],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.RIGHT,
                        children: [
                          new TextRun({ text: "TRẠNG THÁI SỨC KHỎE: ", bold: true, size: 18, color: TEXT_SECONDARY }),
                          new TextRun({ text: activeFilters.healthStatus === 'all' ? "Tất cả" : activeFilters.healthStatus.toUpperCase(), size: 20 }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),

          new Paragraph({ spacing: { after: 300 } }),

          // 01. Chỉ số Thống kê Chiến lược
          new Paragraph({
            children: [
              new TextRun({
                text: "01. CHỈ SỐ THỐNG KÊ CHIẾN LƯỢC",
                bold: true,
                size: 26,
                color: BRAND_COLOR,
              }),
            ],
            spacing: { before: 200, after: 150 },
          }),
          statsTable,

          new Paragraph({ spacing: { after: 300 } }),

          // 02. Biểu đồ & Nhịp độ Hoàn thành
          new Paragraph({
            children: [
              new TextRun({
                text: "02. BIỂU ĐỒ & NHỊP ĐỘ HOÀN THÀNH CÔNG VIỆC (VELOCITY)",
                bold: true,
                size: 26,
                color: BRAND_COLOR,
              }),
            ],
            spacing: { before: 200, after: 150 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "Vận tốc hoàn thành công việc là chỉ số quan trọng phản ánh năng lực sản xuất của toàn bộ Workspace qua các mốc thời gian cụ thể trong kỳ báo cáo:",
                italics: true,
                color: TEXT_SECONDARY
              }),
            ],
            spacing: { after: 150 },
          }),
          velocityTable,

          new Paragraph({ spacing: { after: 300 } }),

          // 03. Đánh giá & So sánh Hiệu suất Thành viên
          new Paragraph({
            children: [
              new TextRun({
                text: "03. ĐÁNH GIÁ & SO SÀNH HIỆU SUẤT THÀNH VIÊN",
                bold: true,
                size: 26,
                color: BRAND_COLOR,
              }),
            ],
            spacing: { before: 200, after: 150 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "Dưới đây là bảng xếp hạng hiệu suất làm việc chi tiết của từng nhân sự tham gia Workspace trong kỳ báo cáo vừa qua:",
                italics: true,
                color: TEXT_SECONDARY
              }),
            ],
            spacing: { after: 150 },
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              tableHeaderRow,
              ...memberRows
            ]
          }),

          new Paragraph({ spacing: { before: 250, after: 150 } }),

          // Hộp Tiêu điểm nhân sự (Performance Spotlight Box)
          new Paragraph({
            text: "🏆 TIÊU ĐIỂM HIỆU SUẤT NHÂN SỰ TRONG KỲ",
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 100, after: 100 }
          }),
          new Paragraph({
            shading: { fill: "F1F5F9" },
            indent: { left: 200 },
            children: [
              new TextRun({ text: "• Gương mặt vàng (Top Performer): ", bold: true, color: SLATE_COLOR }),
              new TextRun({ text: topPerformer, color: "10B981", bold: true }),
              new TextRun({ text: "• Gánh vác nhiều nhất (Workload Champion): ", bold: true, color: SLATE_COLOR, break: 1 }),
              new TextRun({ text: workloadChampion, color: BRAND_COLOR }),
              new TextRun({ text: "• Cần hỗ trợ khẩn cấp (Overdue Warning): ", bold: true, color: SLATE_COLOR, break: 1 }),
              new TextRun({ text: overdueWarning, color: strugglingMembers.length > 0 ? "EF4444" : "10B981", bold: strugglingMembers.length > 0 }),
            ],
            spacing: { before: 150, after: 150 }
          }),

          new Paragraph({ spacing: { after: 300 } }),

          // 04. Khuyến nghị & Đề xuất Hành động
          new Paragraph({
            children: [
              new TextRun({
                text: "04. KHUYẾN NGHỊ & ĐỀ XUẤT HÀNH ĐỘNG CHIẾN LƯỢC",
                bold: true,
                size: 26,
                color: BRAND_COLOR,
              }),
            ],
            spacing: { before: 200, after: 150 },
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({
                text: stats.overdueTasks > 0
                  ? `Cần ưu tiên tập trung xử lý dứt điểm ${stats.overdueTasks} công việc đang bị trễ hạn để bảo vệ tiến độ chung của Workspace.`
                  : "Tiến độ Workspace cực kỳ xuất sắc, không ghi nhận công việc trễ hạn nào. Hãy tiếp tục duy trì đà làm việc này."
              })
            ]
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({
                text: stats.completionRate < 50
                  ? `Tỷ lệ hoàn thành công việc hiện tại là ${stats.completionRate}% (ở mức trung bình thấp). Đề xuất tổ chức họp kiểm điểm để tối ưu quy trình.`
                  : `Tỷ lệ hoàn thành công việc rất khả quan (${stats.completionRate}%). Khuyến khích tuyên dương các thành viên có đóng góp tích cực.`
              })
            ]
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({
                text: strugglingMembers.length > 0
                  ? "Phân bổ lại tài nguyên nhân lực một cách hợp lý, giảm bớt tải cho các thành viên đang quá tải hoặc có tỷ lệ trễ hạn cao."
                  : "Duy trì cơ cấu phân chia công việc hiện tại để bảo toàn hiệu năng tối ưu của cả đội ngũ."
              })
            ]
          }),

          // Footer info
          new Paragraph({
            alignment: AlignmentType.CENTER,
            border: {
              top: { color: BORDER_COLOR, space: 1, style: BorderStyle.SINGLE, size: 1 },
            },
            children: [
              new TextRun({
                text: "\nBáo cáo này được bảo mật và tạo ra bởi trí tuệ nhân tạo TeamFlow Intelligence.",
                size: 18,
                color: TEXT_SECONDARY,
                italics: true,
              }),
              new TextRun({
                text: `\nNgày tạo: ${new Date().toLocaleDateString('vi-VN')} | Người xuất: ${reporterName}`,
                size: 16,
                color: TEXT_SECONDARY,
              }),
            ],
            spacing: { before: 1000 },
          }),
        ]
      }
    ]
  });

  const blob = await Packer.toBlob(doc);
  const fileName = `Bao_cao_tong_quan_Workspace_${new Date().getTime()}.docx`;
  saveAs(blob, fileName);
};
