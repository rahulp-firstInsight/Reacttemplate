# API Integration Guide

## Template API Integration

This application supports fetching templates from an external API. The templates are displayed in a table showing the template name and domain.

### API Configuration

1. **Update the API URL**: In `SimpleApp.tsx`, replace the `API_BASE_URL` with your actual API endpoint:
   ```typescript
   const API_BASE_URL = 'https://your-api-domain.com';
   ```

2. **Set Authentication**: Update the Authorization header with your actual token:
   ```typescript
   'Authorization': 'Bearer your-actual-auth-token'
   ```

### Expected API Response Format

The API should return an array of template objects. The application supports multiple response formats:

#### Option 1: Direct array
```json
[
  {
    "id": "template-1",
    "name": "Basic Medical Form",
    "domain": "General Medicine",
    "description": "Standard medical intake form",
    "created": "2024-01-15T10:30:00Z",
    "sections": []
  }
]
```

#### Option 2: Wrapped response
```json
{
  "data": [
    {
      "id": "template-1", 
      "templateName": "Basic Medical Form",
      "category": "General Medicine",
      "description": "Standard medical intake form",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "status": "success",
  "total": 1
}
```

### Field Mapping

The application automatically maps different field names to ensure compatibility:

- **Template Name**: `name` OR `templateName`
- **Domain**: `domain` OR `category`  
- **Created Date**: `created` OR `createdAt`
- **ID**: `id` (will generate one if missing)
- **Description**: `description`
- **Sections**: `sections` (optional)

### API Endpoints

- **GET /templates** - Fetch all templates
- **POST /templates** - Create new template (future enhancement)
- **PUT /templates/:id** - Update template (future enhancement)
- **DELETE /templates/:id** - Delete template (future enhancement)

### Error Handling

If the API is unavailable or returns an error, the application will:

1. Show an error message to the user
2. Fall back to displaying mock data for development
3. Allow the user to retry with the refresh button

### Testing with Mock Data

The application includes mock data for development and testing. If your API is not ready yet, the mock data will automatically be used when API calls fail.

### Features

- ✅ **Auto-refresh**: Templates are loaded automatically when the component mounts
- ✅ **Manual refresh**: Users can click the refresh button to reload templates
- ✅ **Loading states**: Shows loading spinner while fetching data
- ✅ **Error handling**: Displays error messages and falls back to mock data
- ✅ **Last updated time**: Shows when templates were last fetched
- ✅ **Responsive design**: Table works on different screen sizes

### Integration Checklist

- [ ] Update `API_BASE_URL` with your actual API endpoint
- [ ] Set proper authentication token
- [ ] Test API response format matches expected structure
- [ ] Verify CORS settings allow requests from your domain
- [ ] Test error handling scenarios
- [ ] Configure production vs development API URLs