#!/usr/bin/env python3
"""
Feature-2: Ticket Dashboard Web Server
Shows tickets created from real Gmail inbox monitoring
"""

import os
import json
from datetime import datetime
from typing import Dict, List
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
import uvicorn

# Import our enhanced ticket system
from enhanced_gmail_system import initialize_system

# FastAPI app
app = FastAPI(
    title="Feature-2: Gmail Ticket Dashboard",
    description="Real Gmail inbox monitoring with automatic ticket creation",
    version="3.0.0"
)

# Global ticket system
ticket_system = None

class EmailRequest(BaseModel):
    sender: str
    subject: str
    body: str

@app.on_event("startup")
async def startup():
    """Initialize enhanced ticket system"""
    global ticket_system
    try:
        ticket_system = initialize_system()
        print("✅ Enhanced Gmail Ticket System initialized for dashboard")
    except Exception as e:
        print(f"❌ Failed to initialize: {e}")

@app.get("/", response_class=HTMLResponse)
async def dashboard():
    """Serve ticket dashboard"""
    return HTMLResponse(content="""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Feature-2: Gmail Ticket Dashboard</title>
        <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
        <style>
            .priority-high { border-left: 6px solid #dc2626; background: #fef2f2; }
            .priority-medium { border-left: 6px solid #d97706; background: #fffbeb; }
            .priority-low { border-left: 6px solid #059669; background: #f0fdf4; }
            .category-security { background: linear-gradient(135deg, #dc2626, #991b1b); }
            .category-access { background: linear-gradient(135deg, #7c3aed, #5b21b6); }
            .category-hardware { background: linear-gradient(135deg, #0ea5e9, #0284c7); }
            .category-software { background: linear-gradient(135deg, #059669, #047857); }
            .category-network { background: linear-gradient(135deg, #d97706, #b45309); }
            .category-general { background: linear-gradient(135deg, #6b7280, #4b5563); }
            .pulse { animation: pulse 2s infinite; }
            .ticket-card:hover { transform: translateY(-2px); transition: all 0.3s; }
        </style>
    </head>
    <body class="bg-gray-50 min-h-screen">
        <!-- Header -->
        <header class="bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-xl">
            <div class="container mx-auto px-6 py-6">
                <div class="flex justify-between items-center">
                    <div class="flex items-center space-x-4">
                        <i class="fas fa-ticket-alt text-4xl"></i>
                        <div>
                            <h1 class="text-3xl font-bold">Feature-2: Gmail Ticket System</h1>
                            <p class="text-indigo-100">Real inbox monitoring with AI-powered ticket creation</p>
                        </div>
                    </div>
                    <div class="flex items-center space-x-6">
                        <div class="text-center">
                            <div class="text-3xl font-bold" id="totalTickets">0</div>
                            <div class="text-sm text-indigo-100">Total Tickets</div>
                        </div>
                        <div class="text-center">
                            <div class="text-2xl font-bold text-green-300" id="systemStatus">MONITORING</div>
                            <div class="text-sm text-indigo-100">Status</div>
                        </div>
                    </div>
                </div>
            </div>
        </header>

        <!-- Gmail Info -->
        <div class="container mx-auto px-6 py-6">
            <div class="bg-white rounded-xl shadow-lg p-6 mb-6 border border-blue-100">
                <h2 class="text-xl font-bold mb-4 flex items-center text-gray-800">
                    <i class="fas fa-envelope text-blue-600 mr-3"></i>
                    Gmail Inbox Monitoring
                </h2>
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div class="bg-blue-50 p-4 rounded-lg text-center">
                        <div class="text-2xl font-bold text-blue-600" id="monitoredEmail">sharang.23ad@kct.ac.in</div>
                        <div class="text-sm text-gray-600">Monitored Account</div>
                    </div>
                    <div class="bg-green-50 p-4 rounded-lg text-center">
                        <div class="text-2xl font-bold text-green-600" id="emailsProcessed">0</div>
                        <div class="text-sm text-gray-600">Emails Processed</div>
                    </div>
                    <div class="bg-yellow-50 p-4 rounded-lg text-center">
                        <div class="text-2xl font-bold text-yellow-600" id="lastCheck">Never</div>
                        <div class="text-sm text-gray-600">Last Check</div>
                    </div>
                    <div class="bg-purple-50 p-4 rounded-lg text-center">
                        <div class="text-2xl font-bold text-purple-600" id="uptime">--</div>
                        <div class="text-sm text-gray-600">System Uptime</div>
                    </div>
                </div>
            </div>

            <!-- Priority Stats -->
            <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
                <h2 class="text-xl font-bold mb-4 flex items-center text-gray-800">
                    <i class="fas fa-exclamation-triangle text-red-500 mr-3"></i>
                    Ticket Priorities
                </h2>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div class="priority-high p-6 rounded-lg text-center">
                        <i class="fas fa-fire text-red-600 text-3xl mb-2"></i>
                        <div class="text-3xl font-bold text-red-700" id="highPriorityTickets">0</div>
                        <div class="text-sm text-red-600 font-semibold">HIGH PRIORITY</div>
                        <div class="text-xs text-gray-500 mt-1">Security, Outages, Urgent Access</div>
                    </div>
                    <div class="priority-medium p-6 rounded-lg text-center">
                        <i class="fas fa-clock text-yellow-600 text-3xl mb-2"></i>
                        <div class="text-3xl font-bold text-yellow-700" id="mediumPriorityTickets">0</div>
                        <div class="text-sm text-yellow-600 font-semibold">MEDIUM PRIORITY</div>
                        <div class="text-xs text-gray-500 mt-1">Standard Requests, Account Issues</div>
                    </div>
                    <div class="priority-low p-6 rounded-lg text-center">
                        <i class="fas fa-info-circle text-green-600 text-3xl mb-2"></i>
                        <div class="text-3xl font-bold text-green-700" id="lowPriorityTickets">0</div>
                        <div class="text-sm text-green-600 font-semibold">LOW PRIORITY</div>
                        <div class="text-xs text-gray-500 mt-1">General Questions, Documentation</div>
                    </div>
                </div>
            </div>

            <!-- Staff Routing -->
            <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
                <h2 class="text-xl font-bold mb-4 flex items-center text-gray-800">
                    <i class="fas fa-users text-indigo-600 mr-3"></i>
                    Staff Assignment & Routing
                </h2>
                <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div class="category-security text-white p-4 rounded-lg text-center">
                        <i class="fas fa-shield-alt text-2xl mb-2"></i>
                        <div class="font-bold">Security Officer</div>
                        <div class="text-xs opacity-90">Password resets, Access control</div>
                        <div class="text-xs mt-1" id="securityTickets">0 tickets</div>
                    </div>
                    <div class="category-hardware text-white p-4 rounded-lg text-center">
                        <i class="fas fa-laptop text-2xl mb-2"></i>
                        <div class="font-bold">IT Manager</div>
                        <div class="text-xs opacity-90">Hardware, General support</div>
                        <div class="text-xs mt-1" id="itManagerTickets">0 tickets</div>
                    </div>
                    <div class="category-network text-white p-4 rounded-lg text-center">
                        <i class="fas fa-network-wired text-2xl mb-2"></i>
                        <div class="font-bold">Network Admin</div>
                        <div class="text-xs opacity-90">VPN, Connectivity issues</div>
                        <div class="text-xs mt-1" id="networkTickets">0 tickets</div>
                    </div>
                    <div class="category-access text-white p-4 rounded-lg text-center">
                        <i class="fas fa-user-plus text-2xl mb-2"></i>
                        <div class="font-bold">HR Coordinator</div>
                        <div class="text-xs opacity-90">New employees, Onboarding</div>
                        <div class="text-xs mt-1" id="hrTickets">0 tickets</div>
                    </div>
                    <div class="category-software text-white p-4 rounded-lg text-center">
                        <i class="fas fa-shopping-cart text-2xl mb-2"></i>
                        <div class="font-bold">Procurement</div>
                        <div class="text-xs opacity-90">Software licenses, Purchases</div>
                        <div class="text-xs mt-1" id="procurementTickets">0 tickets</div>
                    </div>
                    <div class="category-general text-white p-4 rounded-lg text-center">
                        <i class="fas fa-question-circle text-2xl mb-2"></i>
                        <div class="font-bold">General Support</div>
                        <div class="text-xs opacity-90">Miscellaneous requests</div>
                        <div class="text-xs mt-1" id="generalTickets">0 tickets</div>
                    </div>
                </div>
            </div>

            <!-- Control Panel -->
            <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
                <div class="flex flex-wrap gap-4 items-center justify-between">
                    <div class="flex gap-4 flex-wrap">
                        <button id="refreshBtn" class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center">
                            <i class="fas fa-sync-alt mr-2"></i>Check Inbox Now
                        </button>
                        <button id="simulateBtn" class="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center">
                            <i class="fas fa-envelope mr-2"></i>Simulate Employee Email
                        </button>
                        <button id="realTimeToggle" class="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center" onclick="toggleRealTimeMonitoring()">
                            <i class="fas fa-play mr-2"></i>Start Real-Time Monitoring
                        </button>
                        <button id="clearTicketsBtn" class="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center">
                            <i class="fas fa-trash mr-2"></i>Clear All Tickets
                        </button>
                    </div>
                    <div class="flex gap-4">
                        <select id="priorityFilter" class="px-4 py-2 border rounded-lg">
                            <option value="all">All Priorities</option>
                            <option value="high">High Priority</option>
                            <option value="medium">Medium Priority</option>
                            <option value="low">Low Priority</option>
                        </select>
                        <select id="categoryFilter" class="px-4 py-2 border rounded-lg">
                            <option value="all">All Categories</option>
                            <option value="security">Security</option>
                            <option value="access">Access</option>
                            <option value="hardware">Hardware</option>
                            <option value="software">Software</option>
                            <option value="network">Network</option>
                            <option value="general">General</option>
                        </select>
                    </div>
                </div>
            </div>

            <!-- Tickets List -->
            <div class="bg-white rounded-xl shadow-lg">
                <div class="p-6 border-b">
                    <h2 class="text-xl font-bold flex items-center text-gray-800">
                        <i class="fas fa-list text-purple-600 mr-3"></i>
                        Active Tickets
                        <span id="processingIndicator" class="ml-4 text-sm text-blue-600 pulse hidden">
                            <i class="fas fa-spinner fa-spin"></i> Processing Gmail...
                        </span>
                    </h2>
                </div>
                <div id="ticketsList" class="divide-y divide-gray-100">
                    <!-- Tickets will be populated here -->
                </div>
            </div>
        </div>

        <script>
            let tickets = [];
            let systemData = {};

            // Initialize dashboard
            document.addEventListener('DOMContentLoaded', function() {
                loadDashboardData();
                setInterval(loadDashboardData, 30000); // Refresh every 30 seconds
                
                // Event listeners
                document.getElementById('refreshBtn').addEventListener('click', () => checkInboxNow(true));
                document.getElementById('simulateBtn').addEventListener('click', simulateEmail);
                document.getElementById('clearTicketsBtn').addEventListener('click', clearAllTickets);
                document.getElementById('priorityFilter').addEventListener('change', filterTickets);
                document.getElementById('categoryFilter').addEventListener('change', filterTickets);
            });

            async function loadDashboardData() {
                try {
                    showProcessing(true);
                    const response = await fetch('/api/dashboard');
                    if (response.ok) {
                        const data = await response.json();
                        systemData = data;
                        tickets = data.tickets || [];
                        updateUI();
                    }
                } catch (error) {
                    console.error('Error loading dashboard:', error);
                } finally {
                    showProcessing(false);
                }
            }

            function updateUI() {
                // Update stats
                document.getElementById('totalTickets').textContent = tickets.length;
                document.getElementById('emailsProcessed').textContent = systemData.system_info?.total_processed || 0;
                document.getElementById('uptime').textContent = systemData.system_info?.uptime || '--';
                document.getElementById('lastCheck').textContent = new Date().toLocaleTimeString();

                // Update priority counts
                const priorityCounts = { high: 0, medium: 0, low: 0 };
                tickets.forEach(ticket => priorityCounts[ticket.priority]++);
                
                document.getElementById('highPriorityTickets').textContent = priorityCounts.high;
                document.getElementById('mediumPriorityTickets').textContent = priorityCounts.medium;
                document.getElementById('lowPriorityTickets').textContent = priorityCounts.low;

                // Update staff assignment counts
                const staffCounts = {};
                tickets.forEach(ticket => {
                    const role = ticket.assigned_role;
                    staffCounts[role] = (staffCounts[role] || 0) + 1;
                });

                document.getElementById('securityTickets').textContent = (staffCounts.SOFTWARE_SECURITY_OFFICER || 0) + ' tickets';
                document.getElementById('itManagerTickets').textContent = (staffCounts.IT_HELPDESK_MANAGER || 0) + ' tickets';
                document.getElementById('networkTickets').textContent = (staffCounts.NETWORK_ADMIN || 0) + ' tickets';
                document.getElementById('hrTickets').textContent = (staffCounts.HR_COORDINATOR || 0) + ' tickets';
                document.getElementById('procurementTickets').textContent = (staffCounts.PROCUREMENT_OFFICER || 0) + ' tickets';

                // Render tickets
                renderTickets();
            }

            function renderTickets() {
                const ticketsList = document.getElementById('ticketsList');
                const priorityFilter = document.getElementById('priorityFilter').value;
                const categoryFilter = document.getElementById('categoryFilter').value;

                let filteredTickets = tickets;
                if (priorityFilter !== 'all') {
                    filteredTickets = filteredTickets.filter(t => t.priority === priorityFilter);
                }
                if (categoryFilter !== 'all') {
                    filteredTickets = filteredTickets.filter(t => t.category === categoryFilter);
                }

                if (filteredTickets.length === 0) {
                    ticketsList.innerHTML = `
                        <div class="p-12 text-center text-gray-500">
                            <i class="fas fa-inbox text-6xl mb-4 text-gray-300"></i>
                            <p class="text-xl">No tickets found</p>
                            <p class="text-sm">Tickets will appear here when employees send IT requests to your Gmail inbox</p>
                        </div>`;
                    return;
                }

                ticketsList.innerHTML = filteredTickets.map(ticket => `
                    <div class="ticket-card p-6 priority-${ticket.priority} hover:shadow-lg">
                        <div class="flex justify-between items-start mb-4">
                            <div class="flex-1">
                                <div class="flex items-center space-x-3 mb-2">
                                    <span class="px-3 py-1 rounded-full text-xs font-bold ${getPriorityClass(ticket.priority)}">${ticket.priority.toUpperCase()}</span>
                                    <span class="px-3 py-1 rounded-full text-xs font-semibold ${getCategoryClass(ticket.category)}">${ticket.category.toUpperCase()}</span>
                                    <span class="text-xs text-gray-500">#{ticket.ticket_id}</span>
                                </div>
                                <h3 class="text-lg font-semibold text-gray-800 mb-2">${ticket.subject}</h3>
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p class="text-gray-600"><i class="fas fa-user mr-1"></i><strong>From:</strong> ${ticket.sender_name}</p>
                                        <p class="text-gray-600"><i class="fas fa-envelope mr-1"></i>${ticket.sender_email}</p>
                                    </div>
                                    <div>
                                        <p class="text-gray-600"><i class="fas fa-user-tag mr-1"></i><strong>Assigned to:</strong> ${formatRole(ticket.assigned_role)}</p>
                                        <p class="text-gray-600"><i class="fas fa-clock mr-1"></i>${formatDateTime(ticket.created_at)}</p>
                                        <p class="text-gray-600"><i class="fas fa-${ticket.notification_sent ? 'check-circle text-green-500' : 'exclamation-circle text-red-500'} mr-1"></i><strong>Notification:</strong> ${ticket.notification_sent ? 'Sent to staff' : 'Failed to send'}</p>
                                    </div>
                                </div>
                            </div>
                            <div class="flex flex-col space-y-2 ml-4">
                                <button onclick="viewTicket('${ticket.ticket_id}')" class="px-4 py-2 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200">
                                    <i class="fas fa-eye mr-1"></i>View Details
                                </button>
                                <button onclick="resolveTicket('${ticket.ticket_id}')" class="px-4 py-2 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200">
                                    <i class="fas fa-check mr-1"></i>Mark Resolved
                                </button>
                                <button onclick="escalateTicket('${ticket.ticket_id}')" class="px-4 py-2 bg-yellow-100 text-yellow-700 rounded text-sm hover:bg-yellow-200">
                                    <i class="fas fa-exclamation-triangle mr-1"></i>Escalate
                                </button>
                                <button onclick="forwardTicket('${ticket.ticket_id}')" class="px-4 py-2 bg-purple-100 text-purple-700 rounded text-sm hover:bg-purple-200">
                                    <i class="fas fa-share mr-1"></i>Forward
                                </button>
                            </div>
                        </div>
                        <div class="bg-gray-50 p-4 rounded-lg">
                            <p class="text-sm text-gray-700"><strong>Issue:</strong> ${ticket.issue_type}</p>
                            <p class="text-sm text-gray-700"><strong>Description:</strong> ${ticket.description.substring(0, 200)}${ticket.description.length > 200 ? '...' : ''}</p>
                            <p class="text-sm text-gray-600 mt-2"><strong>Priority Reason:</strong> ${ticket.urgency_reason}</p>
                        </div>
                    </div>
                `).join('');
            }

            function getPriorityClass(priority) {
                const classes = {
                    high: 'bg-red-100 text-red-800',
                    medium: 'bg-yellow-100 text-yellow-800',
                    low: 'bg-green-100 text-green-800'
                };
                return classes[priority] || 'bg-gray-100 text-gray-800';
            }

            function getCategoryClass(category) {
                const classes = {
                    security: 'bg-red-100 text-red-800',
                    access: 'bg-purple-100 text-purple-800',
                    hardware: 'bg-blue-100 text-blue-800',
                    software: 'bg-green-100 text-green-800',
                    network: 'bg-yellow-100 text-yellow-800',
                    general: 'bg-gray-100 text-gray-800'
                };
                return classes[category] || 'bg-gray-100 text-gray-800';
            }

            function formatRole(role) {
                return role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            }

            function formatDateTime(isoString) {
                return new Date(isoString).toLocaleString();
            }

            function showProcessing(show) {
                document.getElementById('processingIndicator').classList.toggle('hidden', !show);
            }

            function filterTickets() {
                renderTickets();
            }

            async function checkInboxNow(showAlert = true) {
                try {
                    showProcessing(true);
                    const response = await fetch('/api/check-inbox', { method: 'POST' });
                    if (response.ok) {
                        const result = await response.json();
                        if (showAlert) {
                            alert(`📧 Inbox checked! ${result.new_tickets} new tickets created.`);
                        } else if (result.new_tickets > 0) {
                            // Show subtle notification for real-time monitoring
                            console.log(`🔄 Real-time: ${result.new_tickets} new tickets created`);
                        }
                        loadDashboardData();
                    }
                } catch (error) {
                    if (showAlert) {
                        alert('Error checking inbox: ' + error.message);
                    }
                } finally {
                    showProcessing(false);
                }
            }

            async function simulateEmail() {
                const testEmails = [
                    // Security Officer - HIGH Priority
                    {
                        sender: 'employee1@company.com',
                        subject: 'URGENT: Suspected security breach - unauthorized access detected',
                        body: 'Hi IT Security, I received suspicious emails asking for my login credentials. I think my account may have been compromised. I noticed unusual activity in my email this morning. Please investigate immediately as this could affect company data security.'
                    },
                    {
                        sender: 'manager@company.com', 
                        subject: 'Password reset required immediately',
                        body: 'My password expired and I cannot access critical client data for today\'s presentation. I need urgent password reset for my domain account. This is blocking my work completely.'
                    },
                    // IT Helpdesk Manager - MEDIUM Priority
                    {
                        sender: 'sarah.wilson@company.com',
                        subject: 'Laptop hardware issue - screen flickering',
                        body: 'Hello IT support, my laptop screen started flickering this morning and now I can barely see anything. It\'s affecting my productivity. Can someone from hardware support help me? I have important deadlines this week.'
                    },
                    {
                        sender: 'mike.johnson@company.com',
                        subject: 'Software installation problem - Adobe Creative Suite',
                        body: 'Hi team, I\'m unable to install Adobe Creative Suite on my workstation. Getting error code 1603 during installation. I need this software for the marketing campaign project. Can IT help with troubleshooting?'
                    },
                    // HR Coordinator - MEDIUM Priority
                    {
                        sender: 'hr.department@company.com',
                        subject: 'New employee onboarding - Alex Chen starts Monday',
                        body: 'Hello IT team, we have a new software engineer Alex Chen starting this Monday. Please set up his laptop, email account, domain access, and development environment. He will be working on the mobile app project. Also need VPN access configured.'
                    },
                    {
                        sender: 'recruiter@company.com',
                        subject: 'Employee departure - access revocation needed',
                        body: 'Hi IT, John Smith from Marketing department is leaving the company on Friday. Please revoke his access to all systems, disable accounts, and schedule laptop return. His last working day is November 22nd.'
                    },
                    // Network Admin - HIGH Priority  
                    {
                        sender: 'operations@company.com',
                        subject: 'CRITICAL: VPN connection issues affecting entire team',
                        body: 'Urgent: Our entire remote team cannot connect to VPN since this morning. This is affecting client calls and project deadlines. Multiple employees reporting connection timeouts. Need immediate network troubleshooting.'
                    },
                    {
                        sender: 'techsupport@company.com',
                        subject: 'Network connectivity problems in Building A',
                        body: 'Hi Network team, employees in Building A floors 3-5 are experiencing intermittent internet connectivity. WiFi keeps disconnecting every few minutes. Affecting productivity significantly. Please investigate network infrastructure.'
                    },
                    // Procurement Officer - LOW Priority
                    {
                        sender: 'finance@company.com',
                        subject: 'Software license renewal - Microsoft Office 365',
                        body: 'Hello procurement team, our Microsoft Office 365 licenses are expiring next month. We need to renew for 150 users. Please handle the purchase process and ensure no service interruption. Budget has been approved.'
                    },
                    {
                        sender: 'developer@company.com',
                        subject: 'Request for new software - JetBrains IntelliJ license',
                        body: 'Hi, I need a JetBrains IntelliJ IDEA license for Java development work. My current trial expires soon. This is for the new project starting next month. Please process the software purchase request.'
                    }
                ];

                const email = testEmails[Math.floor(Math.random() * testEmails.length)];
                
                try {
                    showProcessing(true);
                    const response = await fetch('/api/simulate-email', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(email)
                    });
                    
                    if (response.ok) {
                        const result = await response.json();
                        alert(`Simulated employee email processed! Ticket created: ${result.ticket_id}`);
                        loadDashboardData();
                    }
                } catch (error) {
                    alert('Error simulating email: ' + error.message);
                } finally {
                    showProcessing(false);
                }
            }

            function viewTicket(ticketId) {
                const ticket = tickets.find(t => t.ticket_id === ticketId);
                if (ticket) {
                    alert(`Ticket Details:\\n\\nID: ${ticket.ticket_id}\\nFrom: ${ticket.sender_name}\\nPriority: ${ticket.priority}\\nAssigned to: ${formatRole(ticket.assigned_role)}\\n\\nDescription:\\n${ticket.description}`);
                }
            }

            async function resolveTicket(ticketId) {
                try {
                    const response = await fetch(`/api/ticket/${ticketId}/resolve`, { method: 'POST' });
                    if (response.ok) {
                        const result = await response.json();
                        alert(`✅ Ticket ${ticketId} marked as resolved!`);
                        loadDashboardData();
                    }
                } catch (error) {
                    alert('Error resolving ticket: ' + error.message);
                }
            }

            async function escalateTicket(ticketId) {
                try {
                    const response = await fetch(`/api/ticket/${ticketId}/escalate`, { method: 'POST' });
                    if (response.ok) {
                        const result = await response.json();
                        alert(`⚠️ Ticket ${ticketId} escalated to manager!`);
                        loadDashboardData();
                    }
                } catch (error) {
                    alert('Error escalating ticket: ' + error.message);
                }
            }

            function forwardTicket(ticketId) {
                const ticket = tickets.find(t => t.ticket_id === ticketId);
                if (ticket) {
                    const newAssignee = prompt(`Forward ticket ${ticketId} to (email):`, ticket.assigned_to);
                    if (newAssignee) {
                        alert(`📧 Ticket ${ticketId} forwarded to: ${newAssignee}`);
                    }
                }
            }

            async function clearAllTickets() {
                if (confirm('Are you sure you want to clear all tickets? This cannot be undone.')) {
                    try {
                        const response = await fetch('/api/tickets/clear', { method: 'POST' });
                        if (response.ok) {
                            alert('🗑️ All tickets cleared!');
                            loadDashboardData();
                        }
                    } catch (error) {
                        alert('Error clearing tickets: ' + error.message);
                    }
                }
            }

            let realTimeMonitoring = false;
            let monitoringInterval;

            function toggleRealTimeMonitoring() {
                const btn = document.getElementById('realTimeToggle');
                if (!realTimeMonitoring) {
                    realTimeMonitoring = true;
                    btn.innerHTML = '<i class="fas fa-stop mr-2"></i>Stop Real-Time Monitoring';
                    btn.classList.remove('bg-red-600', 'hover:bg-red-700');
                    btn.classList.add('bg-orange-600', 'hover:bg-orange-700');
                    
                    // Start real-time monitoring every 10 seconds
                    monitoringInterval = setInterval(() => {
                        checkInboxNow(false); // Silent check
                    }, 10000);
                    
                    alert('🚀 Real-time monitoring started! Checking inbox every 10 seconds.');
                } else {
                    realTimeMonitoring = false;
                    btn.innerHTML = '<i class="fas fa-play mr-2"></i>Start Real-Time Monitoring';
                    btn.classList.remove('bg-orange-600', 'hover:bg-orange-700');
                    btn.classList.add('bg-red-600', 'hover:bg-red-700');
                    
                    if (monitoringInterval) {
                        clearInterval(monitoringInterval);
                    }
                    
                    alert('⏸️ Real-time monitoring stopped.');
                }
            }

            // Load initial data
            loadDashboardData();
        </script>
    </body>
    </html>
    """)

@app.get("/api/dashboard")
async def get_dashboard_data():
    """Get dashboard data"""
    global ticket_system
    if not ticket_system:
        return {"tickets": [], "stats": {}, "system_info": {}}
    
    return ticket_system.get_dashboard_data()

@app.post("/api/check-inbox")
async def check_inbox():
    """Manually check Gmail inbox"""
    global ticket_system
    if not ticket_system:
        raise HTTPException(status_code=503, detail="Ticket system not available")
    
    new_tickets = ticket_system.process_new_emails()
    return {
        "message": "Inbox checked successfully",
        "new_tickets": len(new_tickets),
        "tickets": new_tickets
    }

@app.post("/api/simulate-email")
async def simulate_employee_email(email_request: EmailRequest):
    """Simulate an employee email for testing"""
    global ticket_system
    if not ticket_system:
        raise HTTPException(status_code=503, detail="Ticket system not available")
    
    # Create simulated email data
    email_data = {
        'id': f"sim_{datetime.now().strftime('%H%M%S')}",
        'sender': email_request.sender,
        'subject': email_request.subject,
        'body': email_request.body,
        'timestamp': datetime.now().isoformat()
    }
    
    # Use enhanced simulation method
    ticket = ticket_system.simulate_employee_email(
        email_request.sender,
        email_request.subject, 
        email_request.body
    )
    
    return {
        "message": "Employee email simulated and processed",
        "ticket_id": ticket['ticket_id'],
        "priority": ticket['priority'],
        "assigned_to": ticket['assigned_role'],
        "ticket": ticket
    }

@app.post("/api/ticket/{ticket_id}/resolve")
async def resolve_ticket(ticket_id: str):
    """Mark a ticket as resolved"""
    global ticket_system
    if not ticket_system:
        raise HTTPException(status_code=503, detail="Ticket system not available")
    
    success = ticket_system.resolve_ticket(ticket_id)
    if success:
        # Find the updated ticket
        for ticket in ticket_system.tickets:
            if ticket['ticket_id'] == ticket_id:
                return {"message": f"Ticket {ticket_id} marked as resolved", "ticket": ticket}
    
    raise HTTPException(status_code=404, detail="Ticket not found")

@app.post("/api/ticket/{ticket_id}/escalate")
async def escalate_ticket(ticket_id: str):
    """Escalate a ticket to higher priority"""
    global ticket_system
    if not ticket_system:
        raise HTTPException(status_code=503, detail="Ticket system not available")
    
    success = ticket_system.escalate_ticket(ticket_id)
    if success:
        # Find the updated ticket
        for ticket in ticket_system.tickets:
            if ticket['ticket_id'] == ticket_id:
                return {"message": f"Ticket {ticket_id} escalated to {ticket['priority']} priority", "ticket": ticket}
    
    raise HTTPException(status_code=404, detail="Ticket not found")

@app.post("/api/tickets/clear")
async def clear_all_tickets():
    """Clear all tickets"""
    global ticket_system
    if not ticket_system:
        raise HTTPException(status_code=503, detail="Ticket system not available")
    
    cleared_count = ticket_system.clear_all_tickets()
    return {"message": f"Cleared {cleared_count} tickets", "cleared_count": cleared_count}

@app.post("/api/start-monitoring")
async def start_real_time_monitoring(background_tasks: BackgroundTasks):
    """Start real-time Gmail monitoring"""
    global ticket_system
    if not ticket_system:
        raise HTTPException(status_code=503, detail="Ticket system not available")
    
    # Start background monitoring
    background_tasks.add_task(monitor_gmail_continuously)
    return {"message": "Real-time monitoring started", "status": "monitoring"}

@app.post("/api/stop-monitoring")
async def stop_real_time_monitoring():
    """Stop real-time Gmail monitoring"""
    return {"message": "Real-time monitoring stopped", "status": "stopped"}

async def monitor_gmail_continuously():
    """Continuously monitor Gmail in background"""
    global ticket_system
    import asyncio
    
    while True:
        try:
            if ticket_system:
                new_tickets = ticket_system.process_new_emails()
                if new_tickets:
                    print(f"🔄 Real-time monitoring: {len(new_tickets)} new tickets created")
        except Exception as e:
            print(f"❌ Monitoring error: {e}")
        
        await asyncio.sleep(10)  # Check every 10 seconds

@app.get("/api/health")
async def health_check():
    """System health check"""
    global ticket_system
    return {
        "status": "healthy",
        "message": "Feature-2 Gmail Ticket System",
        "monitored_email": ticket_system.email_address if ticket_system else "Not configured",
        "services": {
            "ticket_system": "operational" if ticket_system else "offline",
            "gmail_connection": "ready",
            "ai_processing": "ready",
            "email_notifications": "enabled"
        },
        "timestamp": datetime.now().isoformat()
    }

def main():
    """Start the dashboard server"""
    print("🎫 Feature-2: Gmail Ticket Dashboard")
    print("=" * 50)
    print("📧 Monitoring Gmail: sharang.23ad@kct.ac.in")
    print("🎯 Creating tickets automatically from employee emails")
    print("👥 Routing tickets to appropriate staff members")
    print("📊 Dashboard: http://localhost:8000")
    print("🔧 API Docs: http://localhost:8000/docs")
    print("=" * 50)
    
    uvicorn.run(
        "ticket_dashboard:app",
        host="0.0.0.0",
        port=8000,
        reload=False,
        log_level="info"
    )

if __name__ == "__main__":
    main()