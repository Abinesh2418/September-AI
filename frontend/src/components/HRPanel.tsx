import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { taskAPI } from '../services/api';
import { Employee, TaskPriority, EmployeeRole } from '../types/taskTypes';

interface TaskForm {
  title: string;
  description: string;
  priority: TaskPriority;
  dueDate: string;
  estimatedHours?: number;
}

const HRPanel: React.FC = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [tasks, setTasks] = useState<TaskForm[]>([]);
  const [loading, setLoading] = useState(false);
  const [showNewEmployeeForm, setShowNewEmployeeForm] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    email: '',
    role: EmployeeRole.FRONTEND_DEVELOPER,
    team: '',
    manager: ''
  });

  const predefinedTasks: Record<EmployeeRole, TaskForm[]> = {
    [EmployeeRole.FRONTEND_DEVELOPER]: [
      {
        title: 'Complete Security & Compliance Training',
        description: 'Complete all mandatory security training modules and acknowledge compliance requirements.',
        priority: TaskPriority.HIGH,
        dueDate: '',
        estimatedHours: 2
      },
      {
        title: 'Read Frontend Development Guidelines',
        description: 'Study the company\'s frontend development standards, coding guidelines, and best practices.',
        priority: TaskPriority.HIGH,
        dueDate: '',
        estimatedHours: 3
      },
      {
        title: 'Set Up Development Environment',
        description: 'Install and configure all necessary tools, IDEs, and dependencies for frontend development.',
        priority: TaskPriority.MEDIUM,
        dueDate: '',
        estimatedHours: 4
      },
      {
        title: 'Join Daily Standup Meetings',
        description: 'Attend daily team standup meetings and get familiar with the team workflow.',
        priority: TaskPriority.MEDIUM,
        dueDate: '',
        estimatedHours: 1
      },
      {
        title: 'Complete First UI Component Task',
        description: 'Implement a simple UI component under senior developer supervision.',
        priority: TaskPriority.LOW,
        dueDate: '',
        estimatedHours: 8
      }
    ],
    [EmployeeRole.BACKEND_DEVELOPER]: [
      {
        title: 'Complete Security & Compliance Training',
        description: 'Complete all mandatory security training modules and acknowledge compliance requirements.',
        priority: TaskPriority.HIGH,
        dueDate: '',
        estimatedHours: 2
      },
      {
        title: 'Read API Documentation & Database Schema',
        description: 'Study the company\'s API documentation and understand the database architecture.',
        priority: TaskPriority.HIGH,
        dueDate: '',
        estimatedHours: 4
      },
      {
        title: 'Set Up Development Environment',
        description: 'Install and configure backend development tools, databases, and testing frameworks.',
        priority: TaskPriority.MEDIUM,
        dueDate: '',
        estimatedHours: 4
      },
      {
        title: 'Shadow Senior Developer',
        description: 'Pair-program with a senior developer on existing backend features.',
        priority: TaskPriority.MEDIUM,
        dueDate: '',
        estimatedHours: 6
      },
      {
        title: 'Implement First API Endpoint',
        description: 'Create a simple CRUD API endpoint with proper testing and documentation.',
        priority: TaskPriority.LOW,
        dueDate: '',
        estimatedHours: 12
      }
    ],
    [EmployeeRole.FULLSTACK_DEVELOPER]: [
      {
        title: 'Complete Security & Compliance Training',
        description: 'Complete all mandatory security training modules and acknowledge compliance requirements.',
        priority: TaskPriority.HIGH,
        dueDate: '',
        estimatedHours: 2
      },
      {
        title: 'Study Full-Stack Architecture',
        description: 'Learn about the company\'s full-stack architecture, deployment processes, and integration patterns.',
        priority: TaskPriority.HIGH,
        dueDate: '',
        estimatedHours: 6
      },
      {
        title: 'Set Up Development Environment',
        description: 'Configure both frontend and backend development environments and CI/CD tools.',
        priority: TaskPriority.MEDIUM,
        dueDate: '',
        estimatedHours: 6
      },
      {
        title: 'Complete End-to-End Feature Tutorial',
        description: 'Build a small feature that includes both frontend and backend components.',
        priority: TaskPriority.LOW,
        dueDate: '',
        estimatedHours: 12
      }
    ],
    [EmployeeRole.QA_ENGINEER]: [
      {
        title: 'Complete Security & Compliance Training',
        description: 'Complete all mandatory security training modules and acknowledge compliance requirements.',
        priority: TaskPriority.HIGH,
        dueDate: '',
        estimatedHours: 2
      },
      {
        title: 'Study QA Processes & Testing Standards',
        description: 'Learn about the company\'s QA methodologies, testing frameworks, and quality standards.',
        priority: TaskPriority.HIGH,
        dueDate: '',
        estimatedHours: 4
      },
      {
        title: 'Set Up Testing Environment',
        description: 'Configure testing tools, automation frameworks, and reporting systems.',
        priority: TaskPriority.MEDIUM,
        dueDate: '',
        estimatedHours: 4
      },
      {
        title: 'Execute Sample Test Cases',
        description: 'Run through existing test suites and create test cases for a simple feature.',
        priority: TaskPriority.LOW,
        dueDate: '',
        estimatedHours: 8
      }
    ],
    [EmployeeRole.DEVOPS_ENGINEER]: [
      {
        title: 'Complete Security & Compliance Training',
        description: 'Complete all mandatory security training modules and acknowledge compliance requirements.',
        priority: TaskPriority.HIGH,
        dueDate: '',
        estimatedHours: 2
      },
      {
        title: 'Study Infrastructure & Deployment Processes',
        description: 'Learn about the company\'s cloud infrastructure, CI/CD pipelines, and deployment strategies.',
        priority: TaskPriority.HIGH,
        dueDate: '',
        estimatedHours: 6
      },
      {
        title: 'Configure Development Tools',
        description: 'Set up monitoring, logging, and deployment tools with proper access credentials.',
        priority: TaskPriority.MEDIUM,
        dueDate: '',
        estimatedHours: 5
      },
      {
        title: 'Complete First Deployment Task',
        description: 'Assist with a deployment pipeline setup or monitoring configuration under supervision.',
        priority: TaskPriority.LOW,
        dueDate: '',
        estimatedHours: 10
      }
    ],
    [EmployeeRole.DESIGNER]: [
      {
        title: 'Complete Security & Compliance Training',
        description: 'Complete all mandatory security training modules and acknowledge compliance requirements.',
        priority: TaskPriority.HIGH,
        dueDate: '',
        estimatedHours: 2
      },
      {
        title: 'Study Design System & Brand Guidelines',
        description: 'Learn about the company\'s design system, brand guidelines, and UI/UX standards.',
        priority: TaskPriority.HIGH,
        dueDate: '',
        estimatedHours: 4
      },
      {
        title: 'Set Up Design Tools & Assets',
        description: 'Configure design software, access design libraries, and set up collaboration tools.',
        priority: TaskPriority.MEDIUM,
        dueDate: '',
        estimatedHours: 3
      },
      {
        title: 'Complete First Design Assignment',
        description: 'Create mockups for a simple feature or improve an existing UI component.',
        priority: TaskPriority.LOW,
        dueDate: '',
        estimatedHours: 8
      }
    ],
    [EmployeeRole.PRODUCT_MANAGER]: [
      {
        title: 'Complete Security & Compliance Training',
        description: 'Complete all mandatory security training modules and acknowledge compliance requirements.',
        priority: TaskPriority.HIGH,
        dueDate: '',
        estimatedHours: 2
      },
      {
        title: 'Study Product Strategy & Roadmaps',
        description: 'Review current product roadmaps, market analysis, and strategic objectives.',
        priority: TaskPriority.HIGH,
        dueDate: '',
        estimatedHours: 6
      },
      {
        title: 'Meet with Stakeholders',
        description: 'Schedule and conduct introductory meetings with key stakeholders and department heads.',
        priority: TaskPriority.MEDIUM,
        dueDate: '',
        estimatedHours: 4
      },
      {
        title: 'Review Product Analytics & Data',
        description: 'Familiarize with analytics tools, KPIs, and product performance metrics.',
        priority: TaskPriority.LOW,
        dueDate: '',
        estimatedHours: 5
      }
    ],
    [EmployeeRole.HR]: [
      {
        title: 'Complete Security & Compliance Training',
        description: 'Complete all mandatory security training modules and acknowledge compliance requirements.',
        priority: TaskPriority.HIGH,
        dueDate: '',
        estimatedHours: 2
      },
      {
        title: 'Study HR Policies & Procedures',
        description: 'Review company HR policies, employee handbook, and compliance requirements.',
        priority: TaskPriority.HIGH,
        dueDate: '',
        estimatedHours: 4
      },
      {
        title: 'Set Up HR Systems Access',
        description: 'Configure access to HRIS, payroll systems, and employee management tools.',
        priority: TaskPriority.MEDIUM,
        dueDate: '',
        estimatedHours: 3
      },
      {
        title: 'Shadow Senior HR Staff',
        description: 'Observe and participate in HR processes like interviews, onboarding, and employee relations.',
        priority: TaskPriority.LOW,
        dueDate: '',
        estimatedHours: 6
      }
    ],
    [EmployeeRole.MANAGER]: [
      {
        title: 'Complete Security & Compliance Training',
        description: 'Complete all mandatory security training modules and acknowledge compliance requirements.',
        priority: TaskPriority.HIGH,
        dueDate: '',
        estimatedHours: 2
      },
      {
        title: 'Review Team Structure & Goals',
        description: 'Meet with team members, understand current projects, and review quarterly goals.',
        priority: TaskPriority.HIGH,
        dueDate: '',
        estimatedHours: 6
      },
      {
        title: 'Study Management Tools & Processes',
        description: 'Learn about project management tools, reporting systems, and team processes.',
        priority: TaskPriority.MEDIUM,
        dueDate: '',
        estimatedHours: 4
      },
      {
        title: 'Complete Management Training',
        description: 'Attend leadership training sessions and management best practices workshops.',
        priority: TaskPriority.LOW,
        dueDate: '',
        estimatedHours: 8
      }
    ],
    [EmployeeRole.DEVELOPER]: [
      {
        title: 'Complete Development Environment Setup',
        description: 'Set up development tools, IDE configurations, and necessary software packages.',
        priority: TaskPriority.HIGH,
        dueDate: '',
        estimatedHours: 3
      },
      {
        title: 'Review Code Standards & Best Practices',
        description: 'Study coding standards, development workflows, and best practices documentation.',
        priority: TaskPriority.HIGH,
        dueDate: '',
        estimatedHours: 4
      },
      {
        title: 'Complete First Code Review',
        description: 'Participate in code review process and understand team development practices.',
        priority: TaskPriority.MEDIUM,
        dueDate: '',
        estimatedHours: 2
      },
      {
        title: 'Attend Development Team Meeting',
        description: 'Join team standup and sprint planning meetings to understand project workflow.',
        priority: TaskPriority.LOW,
        dueDate: '',
        estimatedHours: 2
      }
    ],
    [EmployeeRole.ANALYST]: [
      {
        title: 'Complete Data Analysis Tools Training',
        description: 'Learn to use company data analysis tools, databases, and reporting systems.',
        priority: TaskPriority.HIGH,
        dueDate: '',
        estimatedHours: 4
      },
      {
        title: 'Review Business Requirements Documentation',
        description: 'Study existing business requirements, processes, and analytical frameworks.',
        priority: TaskPriority.HIGH,
        dueDate: '',
        estimatedHours: 5
      },
      {
        title: 'Complete First Data Analysis Project',
        description: 'Work on a small analysis project to understand data sources and reporting procedures.',
        priority: TaskPriority.MEDIUM,
        dueDate: '',
        estimatedHours: 8
      },
      {
        title: 'Attend Stakeholder Meetings',
        description: 'Participate in business meetings to understand stakeholder needs and requirements.',
        priority: TaskPriority.LOW,
        dueDate: '',
        estimatedHours: 3
      }
    ],
    [EmployeeRole.MARKETING_SPECIALIST]: [
      {
        title: 'Complete Brand Guidelines Training',
        description: 'Learn company brand guidelines, marketing standards, and communication protocols.',
        priority: TaskPriority.HIGH,
        dueDate: '',
        estimatedHours: 3
      },
      {
        title: 'Review Marketing Tools & Platforms',
        description: 'Get familiar with marketing automation tools, analytics platforms, and CRM systems.',
        priority: TaskPriority.HIGH,
        dueDate: '',
        estimatedHours: 4
      },
      {
        title: 'Create First Marketing Campaign Draft',
        description: 'Develop a small marketing campaign to understand approval processes and workflows.',
        priority: TaskPriority.MEDIUM,
        dueDate: '',
        estimatedHours: 6
      },
      {
        title: 'Attend Marketing Team Strategy Session',
        description: 'Join marketing team meetings to understand current campaigns and strategies.',
        priority: TaskPriority.LOW,
        dueDate: '',
        estimatedHours: 2
      }
    ]
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      const employeeData = await taskAPI.getEmployees();
      setEmployees(employeeData);
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const employee = await taskAPI.createEmployee({
        ...newEmployee,
        joinDate: new Date().toISOString().split('T')[0]
      });
      
      setEmployees(prev => [...prev, employee]);
      setNewEmployee({
        name: '',
        email: '',
        role: EmployeeRole.FRONTEND_DEVELOPER,
        team: '',
        manager: ''
      });
      setShowNewEmployeeForm(false);
      alert('Employee created successfully!');
    } catch (error) {
      console.error('Error creating employee:', error);
      alert('Failed to create employee');
    } finally {
      setLoading(false);
    }
  };

  const loadPredefinedTasks = (role: EmployeeRole) => {
    const roleTasks = predefinedTasks[role] || [];
    const tasksWithDates = roleTasks.map((task, index) => ({
      ...task,
      dueDate: new Date(Date.now() + (index + 1) * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    }));
    setTasks(tasksWithDates);
  };

  const addCustomTask = () => {
    setTasks(prev => [...prev, {
      title: '',
      description: '',
      priority: TaskPriority.MEDIUM,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    }]);
  };

  const updateTask = (index: number, field: keyof TaskForm, value: string | number) => {
    setTasks(prev => prev.map((task, i) => 
      i === index ? { ...task, [field]: value } : task
    ));
  };

  const removeTask = (index: number) => {
    setTasks(prev => prev.filter((_, i) => i !== index));
  };

  const assignTasks = async () => {
    if (!selectedEmployee || tasks.length === 0) {
      alert('Please select an employee and add at least one task');
      return;
    }

    const invalidTasks = tasks.filter(task => !task.title.trim() || !task.description.trim());
    if (invalidTasks.length > 0) {
      alert('Please fill in all task titles and descriptions');
      return;
    }

    try {
      setLoading(true);
      await taskAPI.assignTasks({
        employeeId: selectedEmployee.id,
        tasks: tasks.map(task => ({
          ...task,
          assignedBy: user?.id || '',
          order: 0,
          status: 'pending' as const,
          subtasks: []
        })),
        autoOrder: true,
        autoPrioritize: true
      });

      alert(`Successfully assigned ${tasks.length} tasks to ${selectedEmployee.name || 'Unknown Employee'}!`);
      setTasks([]);
      setSelectedEmployee(null);
    } catch (error) {
      console.error('Error assigning tasks:', error);
      alert('Failed to assign tasks');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.HIGH: return '#dc3545';
      case TaskPriority.MEDIUM: return '#ffc107';
      case TaskPriority.LOW: return '#28a745';
      default: return '#6c757d';
    }
  };

  return (
    <div className="dashboard">
      <div className="container">
        <div className="hr-panel-header">
          <h1>👥 HR Task Assignment Panel</h1>
          <p>Assign onboarding tasks to new employees and manage their workflow</p>
        </div>

        <div className="hr-panel-content">
          <div className="employee-section">
            <div className="section-header">
              <h2>👤 Select Employee</h2>
              <button 
                className="btn btn-sm btn-outline"
                onClick={() => setShowNewEmployeeForm(true)}
              >
                ➕ Add New Employee
              </button>
            </div>

            {showNewEmployeeForm && (
              <div className="new-employee-form">
                <h3>Add New Employee</h3>
                <form onSubmit={handleCreateEmployee}>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Full Name</label>
                      <input
                        type="text"
                        value={newEmployee.name}
                        onChange={(e) => setNewEmployee(prev => ({ ...prev, name: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Email</label>
                      <input
                        type="email"
                        value={newEmployee.email}
                        onChange={(e) => setNewEmployee(prev => ({ ...prev, email: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>Role</label>
                      <select
                        value={newEmployee.role}
                        onChange={(e) => setNewEmployee(prev => ({ ...prev, role: e.target.value as EmployeeRole }))}
                      >
                        <option value={EmployeeRole.FRONTEND_DEVELOPER}>Frontend Developer</option>
                        <option value={EmployeeRole.BACKEND_DEVELOPER}>Backend Developer</option>
                        <option value={EmployeeRole.FULLSTACK_DEVELOPER}>Fullstack Developer</option>
                        <option value={EmployeeRole.QA_ENGINEER}>QA Engineer</option>
                        <option value={EmployeeRole.DEVOPS_ENGINEER}>DevOps Engineer</option>
                        <option value={EmployeeRole.DESIGNER}>Designer</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Team</label>
                      <input
                        type="text"
                        value={newEmployee.team}
                        onChange={(e) => setNewEmployee(prev => ({ ...prev, team: e.target.value }))}
                        placeholder="e.g., Product Team A"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Manager</label>
                    <input
                      type="text"
                      value={newEmployee.manager}
                      onChange={(e) => setNewEmployee(prev => ({ ...prev, manager: e.target.value }))}
                      placeholder="Manager's name or ID"
                      required
                    />
                  </div>

                  <div className="form-actions">
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                      {loading ? 'Creating...' : 'Create Employee'}
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-secondary"
                      onClick={() => setShowNewEmployeeForm(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="employee-grid">
              {employees.map(employee => (
                <div 
                  key={employee.id}
                  className={`employee-card ${selectedEmployee?.id === employee.id ? 'selected' : ''}`}
                  onClick={() => setSelectedEmployee(employee)}
                >
                  <div className="employee-info">
                    <div className="employee-avatar">
                      {(employee.name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div className="employee-details">
                      <div className="employee-name">{employee.name || 'Unknown Employee'}</div>
                      <div className="employee-role">{(employee.role || 'employee').replace(/[_-]/g, ' ')}</div>
                      <div className="employee-team">{employee.department || 'No Department'}</div>
                    </div>
                  </div>
                  <div className="employee-status">
                    {employee.isActive ? '✅ Active' : '❌ Inactive'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {selectedEmployee && (
            <div className="task-assignment-section">
              <div className="section-header">
                <h2>📋 Assign Tasks to {selectedEmployee.name || 'Unknown Employee'}</h2>
                <div className="task-actions">
                  <button 
                    className="btn btn-sm btn-outline"
                    onClick={() => loadPredefinedTasks(selectedEmployee.role as EmployeeRole)}
                  >
                    📖 Load {selectedEmployee.role.replace(/[_-]/g, ' ')} Tasks
                  </button>
                  <button 
                    className="btn btn-sm btn-outline"
                    onClick={addCustomTask}
                  >
                    ➕ Add Custom Task
                  </button>
                </div>
              </div>

              <div className="tasks-list">
                {tasks.map((task, index) => (
                  <div key={index} className="task-form-card">
                    <div className="task-form-header">
                      <div className="task-number">Task {index + 1}</div>
                      <button 
                        className="remove-task-btn"
                        onClick={() => removeTask(index)}
                        type="button"
                      >
                        ❌
                      </button>
                    </div>

                    <div className="task-form-content">
                      <div className="form-group">
                        <label>Task Title</label>
                        <input
                          type="text"
                          value={task.title}
                          onChange={(e) => updateTask(index, 'title', e.target.value)}
                          placeholder="Enter task title..."
                        />
                      </div>

                      <div className="form-group">
                        <label>Description</label>
                        <textarea
                          value={task.description}
                          onChange={(e) => updateTask(index, 'description', e.target.value)}
                          placeholder="Detailed task description..."
                          rows={3}
                        />
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label>Priority</label>
                          <select
                            value={task.priority}
                            onChange={(e) => updateTask(index, 'priority', e.target.value)}
                          >
                            <option value={TaskPriority.HIGH}>🔴 High</option>
                            <option value={TaskPriority.MEDIUM}>🟠 Medium</option>
                            <option value={TaskPriority.LOW}>🟢 Low</option>
                          </select>
                        </div>
                        
                        <div className="form-group">
                          <label>Due Date</label>
                          <input
                            type="date"
                            value={task.dueDate}
                            onChange={(e) => updateTask(index, 'dueDate', e.target.value)}
                          />
                        </div>
                        
                        <div className="form-group">
                          <label>Estimated Hours</label>
                          <input
                            type="number"
                            min="0.5"
                            step="0.5"
                            value={task.estimatedHours || ''}
                            onChange={(e) => updateTask(index, 'estimatedHours', parseFloat(e.target.value) || 0)}
                            placeholder="Hours"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {tasks.length === 0 && (
                  <div className="empty-tasks-state">
                    <span className="empty-icon">📝</span>
                    <h3>No tasks added yet</h3>
                    <p>Load predefined tasks for {selectedEmployee.role.replace('-', ' ')} or create custom tasks.</p>
                  </div>
                )}
              </div>

              {tasks.length > 0 && (
                <div className="assignment-summary">
                  <div className="summary-header">
                    <h3>📊 Assignment Summary</h3>
                  </div>
                  <div className="summary-content">
                    <div className="summary-stats">
                      <div className="stat">
                        <span className="stat-number">{tasks.length}</span>
                        <span className="stat-label">Total Tasks</span>
                      </div>
                      <div className="stat">
                        <span className="stat-number">{tasks.filter(t => t.priority === TaskPriority.HIGH).length}</span>
                        <span className="stat-label">High Priority</span>
                      </div>
                      <div className="stat">
                        <span className="stat-number">
                          {tasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0)}h
                        </span>
                        <span className="stat-label">Total Hours</span>
                      </div>
                    </div>
                    
                    <button 
                      className="btn btn-lg btn-success assign-btn"
                      onClick={assignTasks}
                      disabled={loading || tasks.length === 0}
                    >
                      {loading ? '🔄 Assigning Tasks...' : `🚀 Assign ${tasks.length} Tasks`}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HRPanel;