# 📦 Office Supplies Management System

A **comprehensive web-based system** for tracking and managing office supplies borrowing, designed to **streamline inventory management**, **monitor item status**, and **facilitate efficient borrowing processes**.

---

## ✨ Key Features

| **Feature** | **Description** |
|--------------|----------------|
| 🧭 **Dual Interface** | Separate user borrowing portal and admin dashboard for different access levels |
| 🔄 **Real-time Inventory Tracking** | Live updates of available quantities with color-coded stock levels |
| 🧾 **Borrowing Management** | Complete borrowing workflow with request forms and return processing |
| 📊 **Status Monitoring** | Automatic tracking of item statuses: *On Loan*, *Overdue*, *Partial Return*, *Returned* |
| 🧠 **Admin Dashboard** | Comprehensive management interface with statistics and analytics |
| 📱 **Mobile Responsive** | Fully optimized for both desktop and mobile devices |
| 🔥 **Firebase Integration** | Real-time database synchronization with connection status monitoring |
| 🔍 **Search & Filter** | Advanced filtering options for inventory and records management |

---

## 🛠️ Technology Stack

| **Component** | **Technology** |
|----------------|----------------|
| 💻 **Frontend Framework** | Bootstrap 5.3.0 |
| 🎨 **Icons** | Bootstrap Icons 1.10.0 |
| 🗄️ **Database** | Firebase Realtime Database |
| 🔐 **Authentication** | Simple password-based admin access |
| ⚙️ **Core Technologies** | HTML5, CSS3, JavaScript (ES6+) |
| ✨ **UI Components** | Custom CSS with animations and transitions |
| 🔔 **Toast Notifications** | Custom notification system for user feedback |

---

## 📋 User Guide

### 👤 For Regular Users

1. 🏠 **Start at Home Screen**  
   Access the system through the landing page.
2. 📝 **Borrow Office Supplies**  
   Click **"Borrow Office Supplies"** to open the borrowing form.
3. 📦 **Select Items**  
   Choose items using quantity selectors showing current stock levels.
4. 📋 **Fill Request Form**  
   Enter your name, purpose, and expected return date.
5. ✅ **Submit Request**  
   Review the summary and submit your borrowing request.

---

### 🛡️ For Administrators

1. 🔐 **Access Admin Portal**  
   Click **"Admin Portal"** and enter the admin password.
2. 📊 **View Dashboard**  
   Monitor statistics including total items, available stock, and active borrows.
3. 📦 **Manage Inventory**  
   Add, edit, or delete items and adjust quantities.
4. 📋 **Track Status**  
   Monitor item statuses: *On Loan*, *Overdue*, *Partial Return*, *Returned*.
5. 📈 **View Records**  
   Access complete borrowing history with search functionality.

---

## 🚀 Quick Start

This application runs **entirely in your browser** with Firebase backend:

1. 📥 Download all project files (HTML, CSS, JavaScript)  
2. 🖥️ Host the files on a web server or use a local development environment  
3. 🔧 Configure Firebase with your own credentials in the JavaScript file  
4. 🌐 Access the application through your browser  

**Default admin password:** `htbb`

---

## ⚠️ Limitations

> ⚡ Important Notes:

- Requires an **active internet connection** for Firebase synchronization  
- Admin access is protected by a **single password** (no multi-user system)  
- **Date format** is fixed to `dd/mm/yy` and cannot be customized  
- **Overdue status** is calculated by comparing return date with current date  
- **Mobile view** uses card layouts instead of tables for better responsiveness  

---
