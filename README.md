# 📦 Office Supplies Management System

A comprehensive **web-based system** for tracking and managing office supplies borrowing, designed to streamline inventory management, monitor item status, and facilitate efficient borrowing processes.

---

## ✨ Key Features

| Feature | Description |
| :-- | :-- |
| 🧭 **Dual Interface** | Separate user borrowing portal and admin dashboard for different access levels |
| 🔄 **Real-time Inventory Tracking** | Live updates of available quantities with color-coded stock levels (Low: ≤3, Medium: 4–6, High: >6) |
| 🧾 **Borrowing Management** | Complete borrowing workflow with request forms, quantity selectors, and return processing |
| 📊 **Status Monitoring** | Automatic tracking of item statuses: On Loan, Overdue, Partial Return, Returned |
| 🧠 **Admin Dashboard** | Comprehensive management interface with statistics, analytics, and inventory controls |
| 📱 **Mobile Responsive** | Fully optimized for both desktop and mobile devices with adaptive layouts |
| 🔥 **Firebase Integration** | Real-time database synchronization with connection status monitoring |
| 🔍 **Search & Filter** | Advanced filtering options for inventory (by stock level) and records (by borrower/purpose) |
| 📈 **Visual Analytics** | Dashboard with statistics cards showing total items, available stock, active borrows, and low stock alerts |
| 🎨 **Modern UI/UX** | Clean, professional interface with animations, transitions, and intuitive navigation |

---

## 🛠️ Technology Stack

| Component | Technology |
| :-- | :-- |
| 💻 **Frontend Framework** | Bootstrap 5.3.0 |
| 🎨 **Icons** | Bootstrap Icons 1.10.0 |
| 🗄️ **Database** | Firebase Realtime Database |
| 🔐 **Authentication** | Simple password-based admin access (`htbb`) |
| ⚙️ **Core Technologies** | HTML5, CSS3, JavaScript (ES6+) |
| ✨ **UI Components** | Custom CSS with animations, transitions, and responsive design |
| 🔔 **Toast Notifications** | Custom notification system for user feedback |
| 📱 **Mobile Design** | Adaptive layouts with card-based views for smaller screens |
| 🎯 **Date Handling** | `dd/mm/yyyy` format with automatic overdue calculation |

---

## 📋 User Guide

### 👤 For Regular Users

#### 🏠 Start at Home Screen
Access the system through the landing page with two main options.

#### 📝 Borrow Office Supplies
Click **"Borrow Office Supplies"** to open the borrowing form interface.

#### 📦 Select Items
- Browse available office supplies with real-time stock levels  
- Use quantity selectors to specify the number of items needed  
- View color-coded availability indicators:  
  - 🔴 **Low** (≤3)  
  - 🟡 **Medium** (4–6)  
  - 🟢 **High** (>6)

#### 📋 Fill Request Form
- Enter your **name** and **purpose** (e.g., CHTBB, Alpha, ARG, Youth)  
- Select **borrow date** (automatically set to today) and **expected return date**  
- Review the **summary card** showing all selected items and quantities

#### ✅ Submit Request
- Submit your borrowing request for processing  
- View recent borrowing records in the table below the form  

---

### 🛡️ For Administrators

#### 🔐 Access Admin Portal
- Click **"Admin Portal"** and enter the admin password (`htbb`).

#### 📊 View Dashboard
- Monitor statistics: total items, available stock, active borrows, low stock alerts  
- View recent activity with borrower information and item status  
- Access all admin functions through sidebar navigation  

#### 📦 Manage Inventory
- Add new items with name and initial quantity  
- Edit existing item names  
- Delete items (removes both item and inventory data)  
- Adjust quantities with + and – buttons  
- Filter items by stock level: **All**, **High**, **Medium**, **Low**

#### 📋 Track Status
Monitor item statuses through dedicated tabs:
- **On Loan:** Currently borrowed items  
- **Overdue:** Items past return date with days overdue indicator  
- **Partial Return:** Items with some quantities returned  
- **Returned:** Recently returned items  
Process returns with detailed quantity tracking.

#### 📈 View Records
- Access complete borrowing history with search functionality  
- Filter records by borrower name or purpose  
- View detailed information including items, dates, and status  
- Process returns directly from the records table  

---

## 🚀 Quick Start

This application runs entirely in your browser with a Firebase backend:

1. 📥 **Download** all project files (HTML, CSS, JavaScript)  
2. 🖥️ **Host** the files on a web server or use a local development environment  
3. 🔧 **Configure Firebase** with your own credentials in the JavaScript file  
4. 🌐 **Access** the application through your browser  

> Default admin password: `htbb`

---

## ⚙️ Configuration

### 🔧 Firebase Setup

1. Create a Firebase project at [firebase.google.com](https://firebase.google.com)  
2. Enable **Realtime Database**  
3. Copy your Firebase configuration  
4. Replace placeholder values in your JavaScript file:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    databaseURL: "YOUR_DATABASE_URL",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

---

## 📱 Mobile Experience

The system features a fully responsive design that adapts to different screen sizes:

- **Desktop:** Full-featured interface with tables and sidebars  
- **Tablet:** Optimized layout with adjusted spacing and sizing  
- **Mobile:** Card-based views with simplified navigation and touch-friendly controls  

---

## ⚠️ Limitations

⚡ **Important Notes:**
- Requires an active internet connection for Firebase synchronization  
- Admin access is protected by a single password (no multi-user system)  
- Date format is fixed to `dd/mm/yyyy`  
- Overdue status calculated by comparing return date with current date  
- Mobile view uses card layouts instead of tables for responsiveness  
- Item identification is based on case-insensitive name matching for return processing  
- Firebase configuration requires valid credentials for proper functionality  

---
