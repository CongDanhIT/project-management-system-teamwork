const fs = require('fs');
const path = require('path');

const dir = 'd:/project workspace/my-team-flow-project/tài liệu phân tích giai đoạn cuối';
const files = fs.readdirSync(dir);

files.forEach(file => {
    if (file.startsWith('Sequence_') && file.endsWith('.puml')) {
        const filePath = path.join(dir, file);
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Thêm cấu hình tự động ngắt dòng message nếu vượt quá 150px
        if (!content.includes('maxMessageSize')) {
            content = content.replace(
                'skinparam responseMessageBelowArrow true',
                'skinparam responseMessageBelowArrow true\nskinparam maxMessageSize 150'
            );
        }
        
        // Tối ưu các mô tả thủ công nếu có các mô tả rất dài trong alt, loop hoặc note
        // (Ví dụ thay thế thủ công các dòng text dài trong ngoặc)
        
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated: ${file}`);
    }
});
