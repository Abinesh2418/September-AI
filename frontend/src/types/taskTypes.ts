// Task Management System Types

export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in-progress',
  COMPLETED = 'completed'
}

export enum TaskPriority {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

export enum EmployeeRole {
  FRONTEND_DEVELOPER = 'frontend-developer',
  BACKEND_DEVELOPER = 'backend-developer',
  FULLSTACK_DEVELOPER = 'fullstack-developer',
  QA_ENGINEER = 'qa-engineer',
  DEVOPS_ENGINEER = 'devops-engineer',
  PRODUCT_MANAGER = 'product-manager',
  DESIGNER = 'designer',
  DEVELOPER = 'developer',
  ANALYST = 'analyst',
  MARKETING_SPECIALIST = 'marketing_specialist',
  HR = 'hr',
  MANAGER = 'manager'
}

export interface Subtask {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  order: number;
  completedAt?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  order: number;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  assignedTo: string; // employee ID
  assignedBy: string; // HR/Manager ID
  subtasks: Subtask[];
  estimatedHours?: number;
  actualHours?: number;
  notes?: string;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: EmployeeRole | string; // Allow string to handle custom roles from JSON
  team?: string; // Keep team as optional for backwards compatibility
  department?: string; // Add department property
  manager?: string; // Manager ID - make optional
  joinDate?: string; // Make optional since it might not exist in JSON
  profilePicture?: string;
  isActive?: boolean; // Make optional since it might not exist in JSON
  permissions?: string[]; // Add permissions array from JSON data
}

export interface ActivityLog {
  id: string;
  employeeId: string;
  taskId: string;
  action: 'created' | 'started' | 'completed' | 'updated' | 'commented';
  timestamp: string;
  details: string;
  performedBy: string; // who did the action
  metadata?: {
    oldStatus?: TaskStatus;
    newStatus?: TaskStatus;
    timeSpent?: number;
    comments?: string;
  };
}

export interface TaskProgress {
  employeeId: string;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  pendingTasks: number;
  completionPercentage: number;
  lastActivity: string;
  tasksCompletedToday: number;
  averageCompletionTime?: number; // in hours
}

export interface DailyActivity {
  date: string;
  employeeId: string;
  tasksCompleted: Task[];
  tasksStarted: Task[];
  totalTimeSpent: number; // in hours
  notes?: string;
}

export interface TaskAssignmentRequest {
  employeeId: string;
  tasks: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'assignedTo'>[];
  autoOrder?: boolean;
  autoPrioritize?: boolean;
}

export interface TaskUpdateRequest {
  taskId: string;
  status?: TaskStatus;
  notes?: string;
  timeSpent?: number;
  subtaskUpdates?: {
    id: string;
    completed: boolean;
  }[];
}

export interface EmployeeTasksResponse {
  employee: Employee;
  tasks: Task[];
  progress: TaskProgress;
  recentActivity: ActivityLog[];
}

export interface ManagerDashboardData {
  employees: Employee[];
  taskProgress: TaskProgress[];
  recentActivity: ActivityLog[];
  dailyActivities: DailyActivity[];
  teamStats: {
    totalEmployees: number;
    activeEmployees: number;
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    avgCompletionRate: number;
  };
}

// Chatbot query types
export interface TaskQuery {
  type: 'employee-progress' | 'daily-summary' | 'task-status' | 'team-overview';
  employeeId?: string;
  date?: string;
  timeframe?: 'today' | 'week' | 'month';
}

export interface TaskQueryResponse {
  query: TaskQuery;
  response: string;
  data: any;
  timestamp: string;
}