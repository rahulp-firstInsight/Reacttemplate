# Scribe Customization Studio - Database Setup

## Overview

This directory contains the complete MySQL database schema and sample data for the Scribe Customization Studio application. The database is designed to store medical form templates with hierarchical sections and configurable fields.

## Database Structure

### Core Tables

1. **`users`** - System users (doctors, nurses, administrators)
2. **`domains`** - Medical specialties/categories (Cardiology, Pediatrics, etc.)
3. **`field_types`** - Available form field types (text, number, dropdown, etc.)
4. **`templates`** - Main template definitions
5. **`template_sections`** - Hierarchical sections within templates (supports nesting)
6. **`section_fields`** - Form fields within each section
7. **`field_validations`** - Advanced validation rules for fields

### Key Features

- **Hierarchical Structure**: Supports nested sections with unlimited depth
- **Flexible Field Types**: 18+ different field types with JSON-based configuration
- **Validation System**: Built-in and custom validation rules
- **User Management**: Role-based access control
- **Audit Trail**: Timestamps and user tracking
- **Full-Text Search**: Optimized searching across templates and fields
- **JSON Storage**: Flexible metadata and configuration storage

## Files

### 📄 `schema.sql`
Complete database schema including:
- Table definitions with proper constraints
- Foreign key relationships
- Indexes for performance
- Views for common queries
- Stored procedures for complex operations
- Triggers for automatic updates
- Security considerations

### 📄 `sample_data.sql`
Sample data that matches your application including:
- 4 users with different roles
- 10 medical domains
- 18 field types
- 4 complete templates with sections and fields
- Realistic medical form examples

### 📄 `queries.sql`
Common database operations including:
- Template CRUD operations
- Search and filtering
- Data validation queries
- Reporting and analytics
- API response formatting
- Maintenance and cleanup

## Installation

### 1. Prerequisites
- MySQL 8.0 or higher
- Database client (MySQL Workbench, phpMyAdmin, or command line)

### 2. Create Database
```sql
CREATE DATABASE scribe_customization_studio 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE scribe_customization_studio;
```

### 3. Run Schema
```bash
mysql -u username -p scribe_customization_studio < schema.sql
```

### 4. Load Sample Data
```bash
mysql -u username -p scribe_customization_studio < sample_data.sql
```

### 5. Verify Installation
```sql
-- Check table creation
SHOW TABLES;

-- Check sample data
SELECT COUNT(*) FROM templates;
SELECT COUNT(*) FROM template_sections;
SELECT COUNT(*) FROM section_fields;
```

## Data Model Mapping

### Application Interface ↔ Database Tables

| Application Interface | Database Table | Key Fields |
|----------------------|----------------|------------|
| `Template` | `templates` | id, name, description, domain_id |
| `Section` | `template_sections` | id, name, parent_section_id, nesting_level |
| `Field` | `section_fields` | id, field_name, field_type_id, is_required |

### JSON Data Mapping

Your application's nested structure is flattened in the database:

```javascript
// Application Structure
{
  id: "template-1",
  name: "Basic Medical Form", 
  sections: [
    {
      id: "chief-complaint",
      name: "Chief Complaint",
      fields: [
        {
          name: "chief_complaint",
          dataType: "text",
          required: true
        }
      ]
    }
  ]
}
```

```sql
-- Database Structure
-- templates table
INSERT INTO templates (id, name, ...) VALUES (1, 'Basic Medical Form', ...);

-- template_sections table  
INSERT INTO template_sections (id, template_id, name, ...) VALUES (1, 1, 'Chief Complaint', ...);

-- section_fields table
INSERT INTO section_fields (id, section_id, field_name, field_type_id, is_required, ...)
VALUES (1, 1, 'chief_complaint', 1, TRUE, ...);
```

## API Integration

### Fetching Templates (matching your current API)

```sql
-- Get templates list (for template management screen)
SELECT 
    t.id,
    t.name,
    t.description,
    d.name AS domain,
    t.created_at AS created
FROM templates t
LEFT JOIN domains d ON t.domain_id = d.id
WHERE t.is_active = TRUE
ORDER BY t.created_at DESC;
```

### Loading Complete Template (for form builder)

```sql
-- Use the GetCompleteTemplate stored procedure
CALL GetCompleteTemplate(1);
```

Or use the detailed query in `queries.sql` to get the complete hierarchical structure.

## Configuration

### Environment Variables

```javascript
// Node.js example
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'scribe_user',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'scribe_customization_studio',
  port: process.env.DB_PORT || 3306
};
```

### Connection Pool (recommended)

```javascript
// Using mysql2 with connection pooling
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});
```

## Performance Optimization

### Indexes
- Full-text search on template names and descriptions
- Composite indexes for common query patterns
- Foreign key indexes for joins

### Query Optimization
- Use prepared statements for security and performance
- Leverage views for complex queries
- Implement proper pagination for large datasets

### Caching Strategy
- Cache frequently accessed templates
- Use Redis or similar for session data
- Implement cache invalidation on updates

## Security Considerations

### Database Security
- Use dedicated database user with minimal privileges
- Enable SSL connections
- Regular security updates
- Backup encryption

### Application Security
- Prepared statements to prevent SQL injection
- Input validation and sanitization
- Role-based access control
- Audit logging for sensitive operations

## Backup Strategy

### Regular Backups
```bash
# Daily backup
mysqldump -u username -p --single-transaction --routines --triggers scribe_customization_studio > backup_$(date +%Y%m%d).sql

# Restore from backup  
mysql -u username -p scribe_customization_studio < backup_20241016.sql
```

### Migration Scripts
- Version your schema changes
- Test migrations on development data
- Plan rollback strategies

## Monitoring

### Key Metrics
- Query performance (slow query log)
- Connection pool usage
- Database size growth
- Backup success/failure

### Health Checks
```sql
-- Check database health
SELECT 
    COUNT(*) AS total_templates,
    COUNT(CASE WHEN is_active = TRUE THEN 1 END) AS active_templates,
    COUNT(CASE WHEN created_at >= CURDATE() - INTERVAL 7 DAY THEN 1 END) AS recent_templates
FROM templates;
```

## Troubleshooting

### Common Issues

1. **Connection Issues**
   - Check firewall settings
   - Verify credentials
   - Confirm database server is running

2. **Performance Issues**
   - Review slow query log
   - Check index usage with EXPLAIN
   - Monitor connection pool

3. **Data Integrity Issues**
   - Run validation queries from `queries.sql`
   - Check foreign key constraints
   - Verify JSON field formats

### Debug Queries

```sql
-- Find problematic data
SELECT 'Orphaned Sections' as issue, COUNT(*) as count FROM template_sections ts
LEFT JOIN templates t ON ts.template_id = t.id WHERE t.id IS NULL
UNION ALL
SELECT 'Orphaned Fields' as issue, COUNT(*) as count FROM section_fields sf  
LEFT JOIN template_sections ts ON sf.section_id = ts.id WHERE ts.id IS NULL;
```

## Development Workflow

### Local Development
1. Use Docker for consistent environment
2. Separate database per developer
3. Migration scripts for schema updates
4. Test data fixtures

### Testing
- Unit tests for data access layer
- Integration tests for API endpoints
- Performance tests with realistic data volumes
- Backup/restore testing

## Support

For issues with the database setup or queries:
1. Check the troubleshooting section
2. Review MySQL error logs
3. Verify data integrity with validation queries
4. Test with minimal sample data

---

**Note**: This database schema is designed to be production-ready but should be reviewed by your DBA team before deployment in a production environment.