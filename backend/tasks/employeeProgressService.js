const fs = require('fs');
const path = require('path');

class EmployeeProgressService {
  constructor() {
    this.tasksFile = path.join(__dirname, '..', 'data', 'tasks.json');
    this.usersFile = path.join(__dirname, '..', 'data', 'users.json');
    this.activityFile = path.join(__dirname, '..', 'data', 'activity-log.json');
  }

  readJsonFile(filePath) {
    try {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`Error reading ${filePath}:`, error);
      return [];
    }
  }

  findEmployeeByName(searchName) {
    const users = this.readJsonFile(this.usersFile);
    
    // Normalize the search name for better matching
    const normalizedSearch = searchName.toLowerCase().trim();
    
    return users.find(user => {
      const fullName = user.name.toLowerCase();
      const firstName = user.name.split(' ')[0].toLowerCase();
      const lastName = user.name.split(' ').slice(1).join(' ').toLowerCase();
      
      return fullName.includes(normalizedSearch) ||
             normalizedSearch.includes(firstName) ||
             normalizedSearch.includes(lastName) ||
             fullName === normalizedSearch;
    });
  }

  getEmployeeProgress(employeeName) {
    const employee = this.findEmployeeByName(employeeName);
    
    if (!employee) {
      return {
        success: false,
        message: `❌ **Employee Not Found**: I couldn't find an employee named "${employeeName}". Please check the spelling or try using their full name.`
      };
    }

    const tasks = this.readJsonFile(this.tasksFile);
    const activities = this.readJsonFile(this.activityFile);
    
    // Find tasks assigned to this employee
    const employeeTasks = tasks.filter(task => 
      task.assignedTo === employee.id || task.assignedTo === String(employee.id)
    );

    if (employeeTasks.length === 0) {
      return {
        success: true,
        message: `📋 **${employee.name}** has no assigned tasks yet.`
      };
    }

    // Calculate progress statistics
    const completedTasks = employeeTasks.filter(task => task.status === 'completed');
    const inProgressTasks = employeeTasks.filter(task => task.status === 'in-progress' || task.status === 'started');
    const pendingTasks = employeeTasks.filter(task => task.status === 'pending' || task.status === 'not-started');
    
    const progressPercentage = employeeTasks.length > 0 
      ? Math.round((completedTasks.length / employeeTasks.length) * 100) 
      : 0;

    // Get recent activity
    const recentActivity = activities
      .filter(activity => 
        activity.employeeId === employee.id || activity.employeeId === String(employee.id)
      )
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 3);

    // Format the response with proper newlines
    let response = `👤 **${employee.name}** (${employee.role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())})\n`;
    response += `🏢 Department: ${employee.department || 'Not Specified'}\n\n`;
    
    response += `📊 **Progress Overview:**\n`;
    response += `• Overall Progress: ${progressPercentage}%\n`;
    response += `• Total Tasks: ${employeeTasks.length}\n`;
    response += `• ✅ Completed: ${completedTasks.length}\n`;
    response += `• 🔄 In Progress: ${inProgressTasks.length}\n`;
    response += `• ⏳ Pending: ${pendingTasks.length}\n\n`;

    // Add task details
    if (completedTasks.length > 0) {
      response += `✅ **Recently Completed:**\n`;
      completedTasks.slice(-2).forEach(task => {
        const completedDate = task.completedAt ? new Date(task.completedAt).toLocaleDateString() : 'Recently';
        response += `   • ${task.title} (${completedDate})\n`;
      });
      response += `\n`;
    }

    if (inProgressTasks.length > 0) {
      response += `🔄 **Currently Working On:**\n`;
      inProgressTasks.forEach(task => {
        const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date';
        response += `   • ${task.title} (Due: ${dueDate})\n`;
      });
      response += `\n`;
    }

    if (recentActivity.length > 0) {
      response += `📈 **Recent Activity:**\n`;
      recentActivity.forEach(activity => {
        const activityDate = new Date(activity.timestamp).toLocaleDateString();
        const action = activity.action.charAt(0).toUpperCase() + activity.action.slice(1);
        response += `   • ${action} task (${activityDate})\n`;
      });
    }

    // Add performance indicator
    let performanceIndicator = '';
    if (progressPercentage >= 90) {
      performanceIndicator = '🌟 **Excellent Performance!**';
    } else if (progressPercentage >= 75) {
      performanceIndicator = '🟢 **Good Progress**';
    } else if (progressPercentage >= 50) {
      performanceIndicator = '🟡 **Moderate Progress**';
    } else {
      performanceIndicator = '🔴 **Needs Attention**';
    }

    response += `\n${performanceIndicator}`;

    return {
      success: true,
      message: response,
      data: {
        employeeName: employee.name,
        progressPercentage,
        totalTasks: employeeTasks.length,
        completedTasks: completedTasks.length,
        inProgressTasks: inProgressTasks.length,
        pendingTasks: pendingTasks.length
      }
    };
  }

  // Helper method to get all employees for suggestions
  getAllEmployeeNames() {
    const users = this.readJsonFile(this.usersFile);
    return users
      .filter(user => user.role !== 'manager' && user.role !== 'hr')
      .map(user => user.name);
  }
}

module.exports = new EmployeeProgressService();