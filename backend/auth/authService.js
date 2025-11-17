const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

class AuthService {
  constructor() {
    this.usersFilePath = path.join(__dirname, '..', 'data', 'users.json');
    this.ensureUsersFile();
  }

  ensureUsersFile() {
    if (!fs.existsSync(this.usersFilePath)) {
      const defaultUsers = [];
      fs.writeFileSync(this.usersFilePath, JSON.stringify(defaultUsers, null, 2));
    }
  }

  getUsers() {
    try {
      const data = fs.readFileSync(this.usersFilePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading users file:', error);
      return [];
    }
  }

  getUserByEmail(email) {
    const users = this.getUsers();
    return users.find(user => user.email === email);
  }

  getUserById(id) {
    const users = this.getUsers();
    return users.find(user => user.id === id || user.id === String(id));
  }

  async authenticate(email, password) {
    const user = this.getUserByEmail(email);
    if (!user) return null;
    
    // For demo purposes, using simple password comparison
    // In production, use bcrypt hashing
    if (user.password !== password) return null;
    
    // Return user without password
    const { password: _, ...safeUser } = user;
    return safeUser;
  }

  getUsersByRole(role) {
    const users = this.getUsers();
    return users.filter(user => user.role === role);
  }

  getAllEmployees() {
    const users = this.getUsers();
    return users.filter(user => !['manager', 'hr'].includes(user.role));
  }

  getManagerInfo() {
    const users = this.getUsers();
    return users.find(user => user.role === 'manager');
  }

  getHRInfo() {
    const users = this.getUsers();
    return users.find(user => user.role === 'hr');
  }

  hasPermission(user, permission) {
    return user.permissions && user.permissions.includes(permission);
  }
}

module.exports = AuthService;
