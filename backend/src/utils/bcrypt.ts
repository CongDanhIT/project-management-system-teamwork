import bcrypt from "bcrypt";

/**
 * Mã hóa một chuỗi văn bản thuần túy thành chuỗi hash.
 * 
 * @param value - Chuỗi văn bản cần mã hóa (ví dụ: mật khẩu).
 * @param salt - Độ phức tạp của thuật toán mã hóa (mặc định là 10).
 * @returns {Promise<string>} Chuỗi đã được mã hóa.
 */
export const hashValue = async (value: string, salt: number = 10): Promise<string> => {
    return await bcrypt.hash(value, salt);
};

/**
 * So sánh một chuỗi văn bản thuần túy với một chuỗi hash đã có.
 * 
 * @param value - Chuỗi văn bản thuần túy cần kiểm tra.
 * @param hash - Chuỗi hash để đối soát.
 * @returns {Promise<boolean>} Kết quả so sánh (true nếu khớp, false nếu không).
 */
export const compareValue = async (value: string, hash: string): Promise<boolean> => {
    return await bcrypt.compare(value, hash);
};  