# 🌟 LIVE PROJECT DEMO - TEMPLATES FROM AZURE MYSQL DATABASE

## 🚀 **CURRENT RUNNING STATUS**

### **Backend Server (Live & Connected)**
- **URL**: `http://localhost:8080`
- **Status**: ✅ **RUNNING** 
- **Database**: ✅ **CONNECTED** to `qamysqlserver.mysql.database.azure.com/qa_scribe_test`
- **Process ID**: 24764

### **Frontend Application (Live & Updated)**  
- **URL**: `http://localhost:5173`
- **Status**: ✅ **RUNNING**
- **API Connection**: Updated to use port 8080

### **External API Integration**
- **URL**: `https://aiscribeqa.maximeyes.com:5005/templates` 
- **Status**: ✅ **CONFIGURED** and syncing

---

## 📊 **LIVE TEMPLATES FROM DATABASE**

**Retrieved Templates (2 found):**

| **ID** | **Name** | **Description** | **Domain** | **Created** | **Source** |
|--------|----------|-----------------|------------|-------------|------------|
| 1 | Updated Integrated Template | Updated via integrated API | General Medicine | 2025-10-20T06:19:09.000Z | database |
| 2 | Integrated Test Template | Created via integrated API | General Medicine | 2025-10-20T10:51:17.000Z | database |

---

## 🔍 **SQL STORED PROCEDURE CALLS (Visible in Server Console)**

When you interact with templates, you'll see these SQL calls:

### **📋 Viewing Templates**
```sql
🌐 EXTERNAL API: GET https://aiscribeqa.maximeyes.com:5005/templates
🔵 EXECUTING: CALL GetTemplates()
✅ RESULT: Found 2 templates from database
```

### **📝 Creating Template**  
```sql
🌐 EXTERNAL API: POST https://aiscribeqa.maximeyes.com:5005/templates
🔵 EXECUTING: CALL add_template('Template Name', 'Description', '{"metadata"}', 1.0, 1, 'Initial creation')
✅ RESULT: Created template with ID X
```

### **✏️ Updating Template**
```sql
🌐 EXTERNAL API: PUT https://aiscribeqa.maximeyes.com:5005/templates/1
🔵 EXECUTING: CALL UpdateTemplate(1, 'Updated Name', 'Updated desc', '{"metadata"}', 2.0, 1, 'Template updated', b'1')
✅ RESULT: Updated template ID 1 successfully
```

### **🗑️ Deleting Template**
```sql
🌐 EXTERNAL API: DELETE https://aiscribeqa.maximeyes.com:5005/templates/1
🔵 EXECUTING: CALL SoftDeleteTemplate(1, 1, 'Template deactivated')
✅ RESULT: Soft deleted template ID 1
```

---

## 🎯 **HOW TO VIEW THE LIVE DEMO**

### **1. Frontend Web Interface**
- **Open**: `http://localhost:5173` in your browser
- **Features**: Live templates display, refresh button, real-time data from Azure MySQL

### **2. API Testing**  
```powershell
# Get all templates
Invoke-RestMethod -Uri 'http://localhost:8080/api/templates' -Method GET

# Get single template
Invoke-RestMethod -Uri 'http://localhost:8080/api/templates/1' -Method GET

# Test external API connectivity
Invoke-RestMethod -Uri 'http://localhost:8080/api/test-external' -Method GET
```

### **3. Server Console Monitoring**
- Watch the server terminal for real-time SQL calls
- Every API request shows the corresponding stored procedure execution
- External API sync status is displayed

---

## 📋 **INTEGRATION FEATURES**

### **✅ What's Working:**
- ✅ Live connection to Azure MySQL database
- ✅ SQL stored procedure execution with logging
- ✅ External API integration and syncing  
- ✅ Frontend displaying real-time data
- ✅ CRUD operations with dual storage (database + external API)
- ✅ Real-time SQL call visibility in console

### **🔧 Database Configuration:**
- **Host**: `qamysqlserver.mysql.database.azure.com:3306`
- **User**: `mysql_admin`
- **Database**: `qa_scribe_test`
- **Connection**: SSL enabled, production ready
- **Tables**: Using stored procedures (GetTemplates, add_template, UpdateTemplate, SoftDeleteTemplate)

### **🌐 API Endpoints Available:**
- `GET /api/templates` - List all templates (database + external API)
- `POST /api/templates` - Create template (sync to both systems)
- `PUT /api/templates/:id` - Update template (sync to both systems)  
- `DELETE /api/templates/:id` - Delete template (sync to both systems)
- `GET /api/health` - Health check
- `GET /api/test-external` - External API connectivity test

---

## 🎉 **DEMO COMPLETE!**

Your project is now running with:
- **Live Azure MySQL database connection** ✅
- **Real-time template display** ✅  
- **SQL stored procedure calls visible** ✅
- **External API integration** ✅
- **Full CRUD operations** ✅
- **Dual sync (database + external)** ✅

**Access URLs:**
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8080/api
- **Database**: qamysqlserver.mysql.database.azure.com/qa_scribe_test