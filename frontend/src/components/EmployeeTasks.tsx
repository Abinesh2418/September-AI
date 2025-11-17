import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { taskAPI } from '../services/api';
import { Task, TaskStatus, TaskPriority, EmployeeTasksResponse } from '../types/taskTypes';

const EmployeeTasks: React.FC = () => {
  const { user } = useAuth();
  const [taskData, setTaskData] = useState<EmployeeTasksResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

  useEffect(() => {
    loadTasks();
  }, [user]);

  const loadTasks = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const data = await taskAPI.getEmployeeTasks(user.id.toString());
      setTaskData(data);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskStatusUpdate = async (taskId: string, status: TaskStatus, notes?: string) => {
    try {
      setUpdatingTaskId(taskId);
      await taskAPI.updateTaskStatus(taskId, { status, notes });
      
      // Reload tasks to get updated data
      await loadTasks();
      
      // Show success message
      alert('Task status updated successfully!');
    } catch (error) {
      console.error('Error updating task:', error);
      alert('Failed to update task status');
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const handleSubtaskToggle = async (taskId: string, subtaskId: string, completed: boolean) => {
    try {
      const task = taskData?.tasks.find(t => t.id === taskId);
      if (!task) return;

      const subtaskUpdates = [{
        id: subtaskId,
        completed
      }];

      await taskAPI.updateTaskStatus(taskId, { subtaskUpdates });
      await loadTasks();
    } catch (error) {
      console.error('Error updating subtask:', error);
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

  const getPriorityIcon = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.HIGH: return '🔴';
      case TaskPriority.MEDIUM: return '🟠';
      case TaskPriority.LOW: return '🟢';
      default: return '⚪';
    }
  };

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.PENDING: return '⏳';
      case TaskStatus.IN_PROGRESS: return '🔄';
      case TaskStatus.COMPLETED: return '✅';
      default: return '📋';
    }
  };

  if (loading) {
    return <div className="dashboard"><div className="container">Loading your tasks...</div></div>;
  }

  if (!taskData) {
    return <div className="dashboard"><div className="container">Failed to load tasks</div></div>;
  }

  return (
    <div className="dashboard">
      <div className="container">
        <div className="task-board-header">
          <div className="header-content">
            <h1>🎯 My Task Board</h1>
            <div className="progress-summary">
              <div className="progress-card">
                <div className="progress-circle">
                  <span className="progress-percentage">{taskData.progress.completionPercentage}%</span>
                </div>
                <div className="progress-details">
                  <div className="progress-label">Overall Progress</div>
                  <div className="progress-stats">
                    {taskData.progress.completedTasks}/{taskData.progress.totalTasks} tasks completed
                  </div>
                </div>
              </div>
              
              <div className="today-summary">
                <div className="stat-item">
                  <span className="stat-icon">🎉</span>
                  <div className="stat-content">
                    <div className="stat-number">{taskData.progress.tasksCompletedToday}</div>
                    <div className="stat-label">Completed Today</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="tasks-grid">
          {taskData.tasks.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">📝</span>
              <h3>No tasks assigned yet</h3>
              <p>Your tasks will appear here once they're assigned by HR or your manager.</p>
            </div>
          ) : (
            taskData.tasks.map((task) => (
              <div 
                key={task.id} 
                className={`task-card ${task.status} ${selectedTask?.id === task.id ? 'selected' : ''}`}
                onClick={() => setSelectedTask(task)}
              >
                <div className="task-header">
                  <div className="task-priority">
                    <span className="priority-icon">{getPriorityIcon(task.priority)}</span>
                    <span className="priority-label">{task.priority}</span>
                  </div>
                  <div className="task-status">
                    <span className="status-icon">{getStatusIcon(task.status)}</span>
                    <span className="status-label">{task.status.replace('-', ' ')}</span>
                  </div>
                </div>

                <div className="task-content">
                  <h3 className="task-title">{task.title}</h3>
                  <p className="task-description">{task.description}</p>
                  
                  {task.dueDate && (
                    <div className="task-due-date">
                      <span className="due-icon">📅</span>
                      Due: {new Date(task.dueDate).toLocaleDateString()}
                    </div>
                  )}

                  {task.subtasks && task.subtasks.length > 0 && (
                    <div className="task-subtasks">
                      <div className="subtasks-header">
                        <span className="subtasks-icon">📋</span>
                        <span className="subtasks-title">
                          Steps ({task.subtasks.filter(st => st.completed).length}/{task.subtasks.length})
                        </span>
                      </div>
                      <div className="subtasks-list">
                        {task.subtasks.map((subtask) => (
                          <div 
                            key={subtask.id}
                            className={`subtask-item ${subtask.completed ? 'completed' : ''}`}
                          >
                            <label className="subtask-checkbox">
                              <input
                                type="checkbox"
                                checked={subtask.completed}
                                onChange={(e) => handleSubtaskToggle(task.id, subtask.id, e.target.checked)}
                                disabled={task.status === TaskStatus.COMPLETED}
                              />
                              <span className="subtask-text">{subtask.title}</span>
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="task-actions">
                  {task.status === TaskStatus.PENDING && (
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTaskStatusUpdate(task.id, TaskStatus.IN_PROGRESS);
                      }}
                      disabled={updatingTaskId === task.id}
                    >
                      {updatingTaskId === task.id ? 'Starting...' : 'Start Task'}
                    </button>
                  )}
                  
                  {task.status === TaskStatus.IN_PROGRESS && (
                    <button
                      className="btn btn-sm btn-success"
                      onClick={(e) => {
                        e.stopPropagation();
                        const notes = prompt('Add completion notes (optional):');
                        handleTaskStatusUpdate(task.id, TaskStatus.COMPLETED, notes || undefined);
                      }}
                      disabled={updatingTaskId === task.id}
                    >
                      {updatingTaskId === task.id ? 'Completing...' : 'Mark Complete'}
                    </button>
                  )}
                  
                  {task.status === TaskStatus.COMPLETED && (
                    <div className="completion-badge">
                      <span className="completion-icon">✅</span>
                      <span className="completion-text">Completed</span>
                      {task.completedAt && (
                        <div className="completion-time">
                          {new Date(task.completedAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {selectedTask && (
          <div className="task-detail-modal" onClick={() => setSelectedTask(null)}>
            <div className="task-detail-content" onClick={(e) => e.stopPropagation()}>
              <div className="task-detail-header">
                <h2>{selectedTask.title}</h2>
                <button 
                  className="close-btn"
                  onClick={() => setSelectedTask(null)}
                >
                  ×
                </button>
              </div>
              
              <div className="task-detail-body">
                <div className="task-meta">
                  <div className="meta-item">
                    <span className="meta-label">Priority:</span>
                    <span className="meta-value">
                      {getPriorityIcon(selectedTask.priority)} {selectedTask.priority}
                    </span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Status:</span>
                    <span className="meta-value">
                      {getStatusIcon(selectedTask.status)} {selectedTask.status.replace('-', ' ')}
                    </span>
                  </div>
                  {selectedTask.dueDate && (
                    <div className="meta-item">
                      <span className="meta-label">Due Date:</span>
                      <span className="meta-value">
                        📅 {new Date(selectedTask.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                <div className="task-description-full">
                  <h4>Description</h4>
                  <p>{selectedTask.description}</p>
                </div>

                {selectedTask.notes && (
                  <div className="task-notes">
                    <h4>Notes</h4>
                    <p>{selectedTask.notes}</p>
                  </div>
                )}

                {selectedTask.subtasks && selectedTask.subtasks.length > 0 && (
                  <div className="task-subtasks-detail">
                    <h4>Task Steps</h4>
                    <div className="subtasks-progress">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill"
                          style={{
                            width: `${(selectedTask.subtasks.filter(st => st.completed).length / selectedTask.subtasks.length) * 100}%`
                          }}
                        ></div>
                      </div>
                      <span className="progress-text">
                        {selectedTask.subtasks.filter(st => st.completed).length} of {selectedTask.subtasks.length} steps completed
                      </span>
                    </div>
                    
                    <div className="subtasks-list-detail">
                      {selectedTask.subtasks.map((subtask, index) => (
                        <div key={subtask.id} className={`subtask-detail ${subtask.completed ? 'completed' : ''}`}>
                          <div className="subtask-number">{index + 1}</div>
                          <div className="subtask-content">
                            <div className="subtask-title">{subtask.title}</div>
                            {subtask.description && (
                              <div className="subtask-description">{subtask.description}</div>
                            )}
                          </div>
                          <div className="subtask-status">
                            {subtask.completed ? '✅' : '⏳'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeTasks;