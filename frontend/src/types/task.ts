export enum TaskStatus {
  TODO = 'TODO',
  BACKLOG = 'BACKLOG',
  INREVIEW = 'INREVIEW',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  DONE = 'DONE',
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export interface Tag {
  _id: string;
  name: string;
  color: string;
}

export interface Task {
  _id: string;
  taskCode: string;
  title: string;
  description: string | null;
  projectId: {
    _id: string;
    name: string;
    emoji?: string;
  };
  workspaceId: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedTo: {  // [MULTI-ASSIGNEE] Mảng người thực hiện, rỗng = chưa gán
    _id: string;
    name: string;
    email: string;
    profilePicture?: string;
  }[];
  createdBy: string;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  parentId?: string;
  estimatedHours?: number;
  loggedHours?: number;
  startDate?: string | null;
  deletedAt?: string | null;
  tags: Tag[]; // Danh sách nhãn thực tế
  phaseId?: {
    _id: string;
    name: string;
  };
  userCommentCount?: number; // Số bình luận do user chủ động gửi (không tính SYSTEM)
}
