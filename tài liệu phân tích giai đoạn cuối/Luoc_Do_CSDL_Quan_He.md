## 4.4. LƯỢC ĐỒ CƠ SỞ DỮ LIỆU QUAN HỆ

Dưới đây là mô hình Lược đồ Cơ sở dữ liệu của hệ thống TeamFlow được thiết lập dựa trên 18 thực thể dữ liệu thực tế từ codebase.
*Ký hiệu:* Khóa chính được **<u>gạch chân</u>**, khóa ngoại được *in nghiêng*.

- **User** (<u>_id</u>, name, email, password, profilePicture, isActive, lastLogin, *currentWorkspace*, preferences.receiveDailyDigest, inboxToken, slackUserId, createdAt, updatedAt)

- **Account** (<u>_id</u>, provider, providerId, *userId*, refreshToken, tokenExpiry, createdAt, updatedAt)

- **Role** (<u>_id</u>, name, permission, createdAt, updatedAt)

- **Workspace** (<u>_id</u>, name, description, *owner*, inviteCode, slackWebhookUrl, dailyDigestEnabled, createdAt, updatedAt)

- **Member** (<u>_id</u>, *userId*, *workspaceId*, *role*, joinedAt, createdAt, updatedAt)

- **Announcement** (<u>_id</u>, *workspaceId*, *projectId*, type, title, content, isPinned, attachments [fileUrl, fileName, fileType], reactions [emoji, *userIds*], comments [<u>_id</u>, *authorId*, content, reactions [emoji, *userIds*], *mentions*, *replyTo*, createdAt], *createdBy*, deletedAt, createdAt, updatedAt)

- **ActivityLog** (<u>_id</u>, *workspaceId*, *projectId*, *userId*, action, entityType, entityId, details.oldValue, details.newValue, details.summary, createdAt)

- **Project** (<u>_id</u>, name, description, emoji, *workspaceId*, *createdBy*, status, startDate, endDate, deletedAt, viewCount, lastAccessedAt, coverUrl, coverPositionX, coverPositionY, *favoritedBy*, slackWebhookUrl, createdAt, updatedAt)

- **Phase** (<u>_id</u>, *workspaceId*, *projectId*, name, description, startDate, endDate, isLocked, *createdBy*, deletedAt, createdAt, updatedAt)

- **Task** (<u>_id</u>, taskCode, title, description, *projectId*, *workspaceId*, *parentId*, status, priority, *assignedTo*, *createdBy*, startDate, dueDate, completedAt, estimatedHours, loggedHours, *phaseId*, *tags*, requiresApproval, overdueNotificationSent, deletedAt, createdAt, updatedAt)

- **Tag** (<u>_id</u>, *workspaceId*, name, color, *createdBy*, createdAt, updatedAt)

- **TaskComment** (<u>_id</u>, *taskId*, *authorId*, *workspaceId*, content, type, reactions [emoji, *userIds*], *replyTo*, *mentions*, isEdited, createdAt, updatedAt)

- **PersonalInbox** (<u>_id</u>, *ownerId*, title, description, sourceType, sourceMetadata, status, metadata, createdAt, updatedAt)

- **AssetFolder** (<u>_id</u>, *workspaceId*, *projectId*, *phaseId*, *parentFolderId*, name, visibility, *createdBy*, deletedAt, createdAt, updatedAt)

- **ProjectAsset** (<u>_id</u>, *workspaceId*, *projectId*, *folderId*, *phaseId*, *taskId*, name, storageProvider, storageKey, fileUrl, fileSize, fileType, category, status, *createdBy*, deletedAt, createdAt, updatedAt)

- **Notification** (<u>_id</u>, *recipientId*, *senderId*, *workspaceId*, type, title, message, isRead, refId, refType, metadata, createdAt)

- **WorkspaceAnalyticsSnapshot** (<u>_id</u>, *workspaceId*, date, totalTasks, completedTasks, inProgressTasks, overdueTasks, totalProjects, createdAt)

- **ProjectAnalyticsSnapshot** (<u>_id</u>, *projectId*, *workspaceId*, date, totalTasks, completedTasks, inProgressTasks, overdueTasks, unassignedTasks, dailyCompletedTasks, performanceIndex, createdAt)
