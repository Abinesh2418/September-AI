const fs = require('fs').promises;
const path = require('path');

class TaskDataService {
  constructor() {
    this.dataDir = path.join(__dirname, '../data');
    this.employeesFile = path.join(this.dataDir, 'employees.json');
    this.tasksFile = path.join(this.dataDir, 'tasks.json');
    this.activityLogFile = path.join(this.dataDir, 'activity-log.json');
    this.dailyActivitiesFile = path.join(this.dataDir, 'daily-activities.json');
    
    this.ensureDataFilesExist();
  }

  async ensureDataFilesExist() {
    try {
      await fs.access(this.dataDir);
    } catch (error) {
      await fs.mkdir(this.dataDir, { recursive: true });
    }

    const defaultFiles = [
      { path: this.employeesFile, data: [] },
      { path: this.tasksFile, data: [] },
      { path: this.activityLogFile, data: [] },
      { path: this.dailyActivitiesFile, data: [] }
    ];

    for (const file of defaultFiles) {
      try {
        await fs.access(file.path);
      } catch (error) {
        await fs.writeFile(file.path, JSON.stringify(file.data, null, 2));
      }
    }
  }

  async readFile(filePath) {
    try {
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error);
      return [];
    }
  }

  async writeFile(filePath, data) {
    try {
      await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error(`Error writing file ${filePath}:`, error);
      throw error;
    }
  }

  // Employee operations
  async getEmployees() {
    return await this.readFile(this.employeesFile);
  }

  async getEmployeeById(id) {
    const employees = await this.getEmployees();
    return employees.find(emp => emp.id === id);
  }

  async createEmployee(employee) {
    const employees = await this.getEmployees();
    const newEmployee = {
      ...employee,
      id: this.generateId(),
      isActive: true
    };
    employees.push(newEmployee);
    await this.writeFile(this.employeesFile, employees);
    return newEmployee;
  }

  async updateEmployee(id, updates) {
    const employees = await this.getEmployees();
    const index = employees.findIndex(emp => emp.id === id);
    if (index === -1) return null;
    
    employees[index] = { ...employees[index], ...updates };
    await this.writeFile(this.employeesFile, employees);
    return employees[index];
  }

  // Task operations
  async getTasks() {
    return await this.readFile(this.tasksFile);
  }

  async getTasksByEmployee(employeeId) {
    const tasks = await this.getTasks();
    return tasks.filter(task => task.assignedTo === employeeId);
  }

  async getTaskById(id) {
    const tasks = await this.getTasks();
    return tasks.find(task => task.id === id);
  }

  async createTask(task) {
    const tasks = await this.getTasks();
    const now = new Date().toISOString();
    const newTask = {
      ...task,
      id: this.generateId(),
      createdAt: now,
      updatedAt: now,
      status: task.status || 'pending'
    };
    tasks.push(newTask);
    await this.writeFile(this.tasksFile, tasks);
    
    // Log activity
    await this.logActivity({
      employeeId: task.assignedTo,
      taskId: newTask.id,
      action: 'created',
      details: `Task "${task.title}" assigned`,
      performedBy: task.assignedBy
    });
    
    return newTask;
  }

  async updateTask(id, updates) {
    const tasks = await this.getTasks();
    const index = tasks.findIndex(task => task.id === id);
    if (index === -1) return null;
    
    const oldTask = tasks[index];
    const now = new Date().toISOString();
    
    tasks[index] = { 
      ...oldTask, 
      ...updates, 
      updatedAt: now 
    };
    
    // If status changed to completed, set completedAt
    if (updates.status === 'completed' && oldTask.status !== 'completed') {
      tasks[index].completedAt = now;
    }
    
    await this.writeFile(this.tasksFile, tasks);
    
    // Log activity
    const action = updates.status === 'completed' ? 'completed' : 
                  updates.status === 'in-progress' ? 'started' : 'updated';
    
    await this.logActivity({
      employeeId: oldTask.assignedTo,
      taskId: id,
      action,
      details: `Task "${oldTask.title}" ${action}`,
      performedBy: updates.updatedBy || oldTask.assignedTo,
      metadata: {
        oldStatus: oldTask.status,
        newStatus: updates.status,
        timeSpent: updates.timeSpent,
        comments: updates.notes
      }
    });
    
    return tasks[index];
  }

  async deleteTask(id) {
    const tasks = await this.getTasks();
    const taskIndex = tasks.findIndex(task => task.id === id);
    if (taskIndex === -1) return false;
    
    tasks.splice(taskIndex, 1);
    await this.writeFile(this.tasksFile, tasks);
    return true;
  }

  // Activity log operations
  async getActivityLog() {
    return await this.readFile(this.activityLogFile);
  }

  async getActivityLogByEmployee(employeeId, limit = 50) {
    const activities = await this.getActivityLog();
    return activities
      .filter(activity => activity.employeeId === employeeId)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
  }

  async logActivity(activity) {
    const activities = await this.getActivityLog();
    const newActivity = {
      ...activity,
      id: this.generateId(),
      timestamp: new Date().toISOString()
    };
    activities.push(newActivity);
    await this.writeFile(this.activityLogFile, activities);
    return newActivity;
  }

  // Daily activities operations
  async getDailyActivities() {
    return await this.readFile(this.dailyActivitiesFile);
  }

  async getDailyActivityByEmployeeAndDate(employeeId, date) {
    const dailyActivities = await this.getDailyActivities();
    return dailyActivities.find(activity => 
      activity.employeeId === employeeId && activity.date === date
    );
  }

  async updateDailyActivity(employeeId, date, data) {
    const dailyActivities = await this.getDailyActivities();
    const index = dailyActivities.findIndex(activity => 
      activity.employeeId === employeeId && activity.date === date
    );
    
    const dailyActivity = {
      employeeId,
      date,
      ...data
    };
    
    if (index === -1) {
      dailyActivities.push(dailyActivity);
    } else {
      dailyActivities[index] = { ...dailyActivities[index], ...dailyActivity };
    }
    
    await this.writeFile(this.dailyActivitiesFile, dailyActivities);
    return dailyActivity;
  }

  // Helper methods
  generateId() {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  async getTaskProgress(employeeId) {
    const tasks = await this.getTasksByEmployee(employeeId);
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'completed').length;
    const inProgressTasks = tasks.filter(task => task.status === 'in-progress').length;
    const pendingTasks = tasks.filter(task => task.status === 'pending').length;
    
    const today = new Date().toISOString().split('T')[0];
    const tasksCompletedToday = tasks.filter(task => 
      task.completedAt && task.completedAt.startsWith(today)
    ).length;
    
    const recentActivity = await this.getActivityLogByEmployee(employeeId, 1);
    const lastActivity = recentActivity.length > 0 ? recentActivity[0].timestamp : null;
    
    return {
      employeeId,
      totalTasks,
      completedTasks,
      inProgressTasks,
      pendingTasks,
      completionPercentage: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      lastActivity,
      tasksCompletedToday
    };
  }

  async getManagerDashboardData(managerEmployeeIds = []) {
    const employees = await this.getEmployees();
    const allTasks = await this.getTasks();
    const allActivities = await this.getActivityLog();
    
    // Filter employees managed by this manager if specified
    const managedEmployees = managerEmployeeIds.length > 0 ? 
      employees.filter(emp => managerEmployeeIds.includes(emp.id)) : employees;
    
    const taskProgress = [];
    for (const employee of managedEmployees) {
      const progress = await this.getTaskProgress(employee.id);
      taskProgress.push(progress);
    }
    
    const recentActivity = allActivities
      .filter(activity => managedEmployees.some(emp => emp.id === activity.employeeId))
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 20);
    
    const today = new Date().toISOString().split('T')[0];
    const dailyActivities = await this.getDailyActivities();
    const todayActivities = dailyActivities.filter(activity => activity.date === today);
    
    const teamStats = {
      totalEmployees: managedEmployees.length,
      activeEmployees: managedEmployees.filter(emp => emp.isActive).length,
      totalTasks: allTasks.filter(task => managedEmployees.some(emp => emp.id === task.assignedTo)).length,
      completedTasks: allTasks.filter(task => 
        task.status === 'completed' && managedEmployees.some(emp => emp.id === task.assignedTo)
      ).length,
      pendingTasks: allTasks.filter(task => 
        task.status === 'pending' && managedEmployees.some(emp => emp.id === task.assignedTo)
      ).length,
      avgCompletionRate: taskProgress.length > 0 ? 
        Math.round(taskProgress.reduce((sum, p) => sum + p.completionPercentage, 0) / taskProgress.length) : 0
    };
    
    return {
      employees: managedEmployees,
      taskProgress,
      recentActivity,
      dailyActivities: todayActivities,
      teamStats
    };
  }
}

module.exports = TaskDataService;