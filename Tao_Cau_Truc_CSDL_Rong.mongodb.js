// Script tạo cấu trúc cơ sở dữ liệu rỗng (Schema) cho MongoDB
// File này chỉ tạo ra các bảng (collections) rỗng, chưa có dữ liệu.

const databaseName = "teamsync_db";
use(databaseName);

const collections = [
  "accounts",
  "activitylogs",
  "announcements",
  "assetfolders",
  "inboxes",
  "members",
  "notifications",
  "personalnotes",
  "phases",
  "projectanalyticssnapshots",
  "projectassets",
  "projects",
  "roles",
  "tags",
  "taskcomments",
  "tasks",
  "users",
  "whiteboards",
  "workflows",
  "workspaceanalyticssnapshots",
  "workspaces"
];

print("=========================================");
print("BẮT ĐẦU TẠO CẤU TRÚC CSDL: " + databaseName);
print("=========================================");

collections.forEach(function(colName) {
    // Kiểm tra xem bảng đã tồn tại chưa
    const collExists = db.getCollectionNames().indexOf(colName) > -1;
    if (!collExists) {
        db.createCollection(colName);
        print("✅ Đã tạo thành công bảng rỗng: " + colName);
    } else {
        print("⚠️ Bảng đã tồn tại (bỏ qua): " + colName);
    }
});

print("=========================================");
print("HOÀN TẤT TẠO CẤU TRÚC CSDL!");
print("=========================================");
