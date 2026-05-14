// Helper để tạo filter thời gian dựa trên year, month, quarter cho Dashboard
export const getDashboardTimeFilterMatch = (filters?: { year?: number, month?: number, quarter?: number }) => {
    if (!filters || !filters.year) return {};

    const { year, month, quarter } = filters;
    let startDate: Date;
    let endDate: Date;

    if (month) {
        // Lọc theo tháng cụ thể
        startDate = new Date(year, month - 1, 1);
        endDate = new Date(year, month, 0, 23, 59, 59, 999);
    } else if (quarter) {
        // Lọc theo quý (Q1: 1-3, Q2: 4-6, Q3: 7-9, Q4: 10-12)
        const startMonth = (quarter - 1) * 3;
        startDate = new Date(year, startMonth, 1);
        endDate = new Date(year, startMonth + 3, 0, 23, 59, 59, 999);
    } else {
        // Lọc theo năm
        startDate = new Date(year, 0, 1);
        endDate = new Date(year, 11, 31, 23, 59, 59, 999);
    }

    return {
        createdAt: {
            $gte: startDate,
            $lte: endDate
        }
    };
};
