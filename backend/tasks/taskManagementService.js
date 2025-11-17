const TaskDataService = require('./taskDataService');
const AuthService = require('../auth/authService');

class TaskManagementService {
  constructor() {
    this.dataService = new TaskDataService();
    this.authService = new AuthService();
  }

  // Employee management
  async getEmployees() {
    try {
      // Get employees from the auth service
      return await this.authService.getAllEmployees();
    } catch (error) {
      console.error('Error getting employees:', error);
      throw new Error('Failed to retrieve employees');
    }
  }

  async getEmployeeById(id) {
    try {
      return await this.authService.getUserById(id);
    } catch (error) {
      console.error('Error getting employee:', error);
      throw new Error('Failed to retrieve employee');
    }
  }

  async createEmployee(employeeData) {
    try {
      // For this demo, we'll read from the predefined users.json file
      // In production, you'd add new users to the file
      console.log('Employee creation requested:', employeeData);
      return { success: true, message: 'Employee data is predefined in users.json' };
    } catch (error) {
      console.error('Error creating employee:', error);
      throw new Error('Failed to create employee');
    }
  }

  // Task assignment and management
  async assignTasks(assignmentRequest) {
    try {
      const { employeeId, tasks, autoOrder = true, autoPrioritize = true } = assignmentRequest;
      
      // Verify employee exists
      const employee = await this.authService.getUserById(employeeId);
      if (!employee) {
        throw new Error('Employee not found');
      }

      let processedTasks = [...tasks];

      // Auto-order tasks if requested
      if (autoOrder) {
        processedTasks = this.autoOrderTasks(processedTasks);
      }

      // Auto-prioritize tasks if requested
      if (autoPrioritize) {
        processedTasks = this.autoPrioritizeTasks(processedTasks);
      }

      // Create tasks with subtasks
      const createdTasks = [];
      for (const task of processedTasks) {
        const taskWithSubtasks = {
          ...task,
          assignedTo: employeeId,
          subtasks: this.generateSubtasks(task)
        };
        
        const createdTask = await this.dataService.createTask(taskWithSubtasks);
        createdTasks.push(createdTask);
      }

      return createdTasks;
    } catch (error) {
      console.error('Error assigning tasks:', error);
      throw new Error('Failed to assign tasks: ' + error.message);
    }
  }

  async getEmployeeTasks(employeeId) {
    try {
      const employee = await this.authService.getUserById(employeeId);
      if (!employee) {
        throw new Error('Employee not found');
      }

      const tasks = await this.dataService.getTasksByEmployee(employeeId);
      const progress = await this.dataService.getTaskProgress(employeeId);
      const recentActivity = await this.dataService.getActivityLogByEmployee(employeeId, 10);

      // Sort tasks by order and priority
      tasks.sort((a, b) => {
        if (a.order !== b.order) return a.order - b.order;
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });

      return {
        employee,
        tasks,
        progress,
        recentActivity
      };
    } catch (error) {
      console.error('Error getting employee tasks:', error);
      throw new Error('Failed to retrieve employee tasks: ' + error.message);
    }
  }

  async updateTaskStatus(taskUpdateRequest) {
    try {
      const { taskId, status, notes, timeSpent, subtaskUpdates } = taskUpdateRequest;
      
      const task = await this.dataService.getTaskById(taskId);
      if (!task) {
        throw new Error('Task not found');
      }

      // Update subtasks if provided
      if (subtaskUpdates && subtaskUpdates.length > 0) {
        const updatedSubtasks = task.subtasks.map(subtask => {
          const update = subtaskUpdates.find(u => u.id === subtask.id);
          if (update) {
            return {
              ...subtask,
              completed: update.completed,
              completedAt: update.completed ? new Date().toISOString() : undefined
            };
          }
          return subtask;
        });

        // If all subtasks are completed, auto-complete the main task
        if (updatedSubtasks.every(st => st.completed) && status !== 'completed') {
          await this.dataService.updateTask(taskId, {
            status: 'completed',
            subtasks: updatedSubtasks,
            notes,
            timeSpent
          });
        } else {
          await this.dataService.updateTask(taskId, {
            subtasks: updatedSubtasks,
            notes,
            timeSpent
          });
        }
      } else {
        // Update main task status
        await this.dataService.updateTask(taskId, {
          status,
          notes,
          timeSpent
        });
      }

      // Update daily activity
      const today = new Date().toISOString().split('T')[0];
      if (status === 'completed') {
        await this.updateDailyActivity(task.assignedTo, today, task);
      }

      return await this.dataService.getTaskById(taskId);
    } catch (error) {
      console.error('Error updating task:', error);
      throw new Error('Failed to update task: ' + error.message);
    }
  }

  async getManagerDashboard(managerId) {
    try {
      // Get all employees managed by this manager
      const allEmployees = await this.dataService.getEmployees();
      const managedEmployees = allEmployees.filter(emp => emp.manager === managerId);
      const managedEmployeeIds = managedEmployees.map(emp => emp.id);

      return await this.dataService.getManagerDashboardData(managedEmployeeIds);
    } catch (error) {
      console.error('Error getting manager dashboard:', error);
      throw new Error('Failed to retrieve manager dashboard: ' + error.message);
    }
  }

  async getTaskProgressQuery(query) {
    try {
      const { type, employeeId, date, timeframe } = query;
      
      switch (type) {
        case 'employee-progress':
          if (!employeeId) throw new Error('Employee ID required for progress query');
          const employee = await this.dataService.getEmployeeById(employeeId);
          const progress = await this.dataService.getTaskProgress(employeeId);
          const tasks = await this.dataService.getTasksByEmployee(employeeId);
          
          return {
            response: this.formatProgressResponse(employee, progress, tasks),
            data: { employee, progress, tasks }
          };

        case 'daily-summary':
          const targetDate = date || new Date().toISOString().split('T')[0];
          if (!employeeId) throw new Error('Employee ID required for daily summary');
          
          const dailyActivity = await this.dataService.getDailyActivityByEmployeeAndDate(employeeId, targetDate);
          const emp = await this.dataService.getEmployeeById(employeeId);
          
          return {
            response: this.formatDailySummaryResponse(emp, dailyActivity, targetDate),
            data: { employee: emp, dailyActivity }
          };

        case 'task-status':
          if (!employeeId) throw new Error('Employee ID required for task status');
          const taskData = await this.getEmployeeTasks(employeeId);
          
          return {
            response: this.formatTaskStatusResponse(taskData),
            data: taskData
          };

        default:
          throw new Error('Unknown query type');
      }
    } catch (error) {
      console.error('Error processing task query:', error);
      throw new Error('Failed to process query: ' + error.message);
    }
  }

  // Helper methods
  autoOrderTasks(tasks) {
    // Simple ordering: security training first, then documentation, then hands-on tasks
    const orderPriority = {
      'security': 1,
      'training': 2,
      'documentation': 3,
      'reading': 4,
      'meeting': 5,
      'coding': 6,
      'project': 7
    };

    return tasks.map((task, index) => {
      let order = index + 1;
      
      // Assign order based on task content
      for (const [keyword, priority] of Object.entries(orderPriority)) {
        if (task.title.toLowerCase().includes(keyword) || task.description.toLowerCase().includes(keyword)) {
          order = priority * 10 + index; // Multiply by 10 to allow sub-ordering
          break;
        }
      }
      
      return { ...task, order };
    }).sort((a, b) => a.order - b.order);
  }

  autoPrioritizeTasks(tasks) {
    return tasks.map(task => {
      let priority = 'medium';
      
      const title = task.title.toLowerCase();
      const description = task.description.toLowerCase();
      
      // High priority keywords
      if (title.includes('security') || title.includes('compliance') || 
          description.includes('urgent') || description.includes('critical')) {
        priority = 'high';
      }
      // Low priority keywords  
      else if (title.includes('optional') || title.includes('nice to have') ||
               description.includes('when time permits')) {
        priority = 'low';
      }
      
      return { ...task, priority };
    });
  }

  generateSubtasks(task) {
    // Generate common subtasks based on task type
    const commonSubtasks = {
      'documentation': [
        'Open documentation portal',
        'Read overview section',
        'Study key concepts',
        'Take notes on important points',
        'Complete comprehension check'
      ],
      'security': [
        'Access security training portal',
        'Complete identity verification',
        'Review security policies',
        'Take security quiz',
        'Acknowledge compliance requirements'
      ],
      'meeting': [
        'Add meeting to calendar',
        'Prepare questions to ask',
        'Join meeting on time',
        'Take notes during meeting',
        'Follow up on action items'
      ],
      'coding': [
        'Set up development environment',
        'Review existing code',
        'Understand requirements',
        'Implement solution',
        'Test implementation',
        'Submit for review'
      ]
    };

    let subtasks = [];
    const taskText = (task.title + ' ' + task.description).toLowerCase();
    
    for (const [type, steps] of Object.entries(commonSubtasks)) {
      if (taskText.includes(type)) {
        subtasks = steps.map((step, index) => ({
          id: `${Date.now()}_${index}`,
          title: step,
          description: '',
          completed: false,
          order: index + 1
        }));
        break;
      }
    }

    // If no specific type found, create generic subtasks
    if (subtasks.length === 0) {
      subtasks = [
        {
          id: `${Date.now()}_1`,
          title: 'Start the task',
          description: '',
          completed: false,
          order: 1
        },
        {
          id: `${Date.now()}_2`,
          title: 'Complete main work',
          description: '',
          completed: false,
          order: 2
        },
        {
          id: `${Date.now()}_3`,
          title: 'Review and finalize',
          description: '',
          completed: false,
          order: 3
        }
      ];
    }

    return subtasks;
  }

  async updateDailyActivity(employeeId, date, completedTask) {
    try {
      const existingActivity = await this.dataService.getDailyActivityByEmployeeAndDate(employeeId, date);
      
      const tasksCompleted = existingActivity ? [...existingActivity.tasksCompleted, completedTask] : [completedTask];
      const totalTimeSpent = tasksCompleted.reduce((sum, task) => sum + (task.actualHours || 0), 0);

      await this.dataService.updateDailyActivity(employeeId, date, {
        tasksCompleted,
        totalTimeSpent
      });
    } catch (error) {
      console.error('Error updating daily activity:', error);
    }
  }

  formatProgressResponse(employee, progress, tasks) {
    const completedToday = tasks.filter(task => 
      task.completedAt && task.completedAt.startsWith(new Date().toISOString().split('T')[0])
    );
    
    const inProgress = tasks.filter(task => task.status === 'in-progress');
    const pending = tasks.filter(task => task.status === 'pending');

    let response = `Progress Update for ${employee.name} (${employee.role}):\n\n`;
    response += `📊 Overall Progress: ${progress.completedTasks}/${progress.totalTasks} tasks completed (${progress.completionPercentage}%)\n\n`;
    
    if (completedToday.length > 0) {
      response += `✅ Completed Today:\n`;
      completedToday.forEach(task => {
        response += `  • ${task.title}\n`;
      });
      response += '\n';
    }

    if (inProgress.length > 0) {
      response += `🔄 In Progress:\n`;
      inProgress.forEach(task => {
        response += `  • ${task.title}\n`;
      });
      response += '\n';
    }

    if (pending.length > 0) {
      response += `⏳ Pending:\n`;
      pending.slice(0, 3).forEach(task => {
        response += `  • ${task.title}\n`;
      });
      if (pending.length > 3) {
        response += `  ... and ${pending.length - 3} more\n`;
      }
    }

    return response;
  }

  formatDailySummaryResponse(employee, dailyActivity, date) {
    let response = `Daily Summary for ${employee.name} - ${date}:\n\n`;
    
    if (dailyActivity && dailyActivity.tasksCompleted.length > 0) {
      response += `✅ Tasks Completed (${dailyActivity.tasksCompleted.length}):\n`;
      dailyActivity.tasksCompleted.forEach(task => {
        response += `  • ${task.title}\n`;
      });
      response += `\n⏱️ Total Time: ${dailyActivity.totalTimeSpent} hours\n`;
    } else {
      response += `No tasks completed on ${date}`;
    }

    return response;
  }

  formatTaskStatusResponse(taskData) {
    const { employee, tasks, progress } = taskData;
    
    let response = `Task Status for ${employee.name}:\n\n`;
    response += `📈 Progress: ${progress.completionPercentage}% (${progress.completedTasks}/${progress.totalTasks})\n\n`;
    
    const priorityTasks = tasks.filter(t => t.priority === 'high' && t.status !== 'completed');
    if (priorityTasks.length > 0) {
      response += `🔴 High Priority Tasks:\n`;
      priorityTasks.forEach(task => {
        response += `  • ${task.title} (${task.status})\n`;
      });
      response += '\n';
    }

    const recentCompleted = tasks.filter(t => t.completedAt && 
      new Date(t.completedAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );
    
    if (recentCompleted.length > 0) {
      response += `✅ Recently Completed:\n`;
      recentCompleted.slice(0, 5).forEach(task => {
        response += `  • ${task.title}\n`;
      });
    }

    return response;
  }
}

module.exports = TaskManagementService;