# Live Server Testing Guide

## 🚀 Your Live Server URL
```
http://localhost:8080
```

## 📊 API Base URL
```
http://localhost:8080/api
```

## 🧪 Testing Methods

### Method 1: PowerShell Commands
```powershell
# Test basic endpoint
Invoke-RestMethod -Uri 'http://localhost:8080/api/simple' -Method GET

# Test health check
Invoke-RestMethod -Uri 'http://localhost:8080/api/health' -Method GET

# Test templates list
Invoke-RestMethod -Uri 'http://localhost:8080/api/templates' -Method GET

# Test debug tables
Invoke-RestMethod -Uri 'http://localhost:8080/api/debug/tables' -Method GET
```

### Method 2: CURL Commands
```bash
# Basic test
curl http://localhost:8080/api/simple

# Health check
curl http://localhost:8080/api/health

# Templates
curl http://localhost:8080/api/templates

# Create new template
curl -X POST http://localhost:8080/api/templates \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Template","description":"Testing API"}'
```

### Method 3: Node.js Test Script
```bash
node test-live-server.mjs
```

### Method 4: Browser Testing
Open in your browser:
- http://localhost:8080/api/simple
- http://localhost:8080/api/health
- http://localhost:8080/api/templates

## 📋 Available Endpoints

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| GET | `/api/simple` | Basic test | ✅ Working |
| GET | `/api/health` | Server health | ⚠️ DB Timeout |
| GET | `/api/templates` | List templates | ⚠️ DB Timeout |
| POST | `/api/templates` | Create template | ⚠️ DB Timeout |
| PUT | `/api/templates/:id` | Update template | ⚠️ DB Timeout |
| DELETE | `/api/templates/:id` | Delete template | ⚠️ DB Timeout |
| GET | `/api/templates/:id/configuration` | Get config | ⚠️ DB Timeout |
| PUT | `/api/templates/:id/configuration` | Save config | ⚠️ DB Timeout |
| GET | `/api/templates/:id/export` | Export template | ⚠️ DB Timeout |
| GET | `/api/domains` | List domains | ⚠️ DB Timeout |
| GET | `/api/debug/tables` | Show tables | ⚠️ DB Timeout |

## 🔧 Database Connection Status
- **Issue**: Connection timeout to Azure MySQL
- **Cause**: Firewall restrictions (IP not whitelisted)
- **Solution**: Add your current IP to Azure MySQL firewall rules

## 💡 Quick Tests
1. **Server Running**: `netstat -ano | findstr ":8080"`
2. **Basic API**: `curl http://localhost:8080/api/simple`
3. **Full Test**: `node test-live-server.mjs`