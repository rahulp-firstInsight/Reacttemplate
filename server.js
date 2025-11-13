import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import dotenv from 'dotenv';
import https from 'https';

dotenv.config();

// External API Configuration
const EXTERNAL_API = {
  baseUrl: 'https://aiscribeqa.maximeyes.com:5005',
  templates: '/templates'
};

const app = express();
const PORT = process.env.PORT || 8080; // Use port 8080 for live server (common for cloud deployments)

// Middleware - Configure CORS for live server
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://scribereacttemplate.evaa.ai/', 'https://scribereacttemplate.evaa.ai:8080'] // Add your live frontend URLs
    : ['http://localhost:5173', 'http://localhost:3000'], // Local development
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security headers for live server
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

// Request logging for live server
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Request timeout for live server
app.use((req, res, next) => {
  res.setTimeout(parseInt(process.env.REQUEST_TIMEOUT) || 120000, () => {
    res.status(408).json({ error: 'Request timeout' });
  });
  next();
});

// Live MySQL Connection Configuration
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT) || 3306,
  // SSL configuration for live Azure MySQL
  ssl: {
    rejectUnauthorized: false
  },
  // Production connection pool settings (mysql2 valid options only)
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 0,
  // Additional production settings
  charset: 'utf8mb4',
  timezone: '+00:00'
};

// Create MySQL connection pool
const pool = mysql.createPool(dbConfig);

// Live server database connection validation
const validateLiveConnection = async () => {
  try {
    if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_PASSWORD || !process.env.DB_NAME) {
      throw new Error('Missing required database environment variables');
    }

    console.log(`🌐 Live Server - Connecting to: ${dbConfig.host}:${dbConfig.port}`);
    console.log(`� Database User: ${dbConfig.user}`);
    console.log(`🗄️ Database: ${dbConfig.database}`);
    console.log(`🔒 SSL Mode: Production`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'production'}`);
    
    const connection = await pool.getConnection();
    
    // Test with a simple query
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('✅ Live database connection established successfully');
    console.log('🔍 Connection test query result:', rows[0]);
    
    connection.release();
    
    return true;
  } catch (error) {
    console.error('❌ Live database connection failed:', error.message);
    console.error('� Production Database Issues:');
    console.error('   - Verify database server is running');
    console.error('   - Check firewall and network access');
    console.error('   - Validate SSL certificate configuration');
    console.error('   - Confirm environment variables are set');
    
    // In production, you might want to exit the process or implement retry logic
    if (process.env.NODE_ENV === 'production') {
      console.error('💀 Exiting due to database connection failure in production');
      process.exit(1);
    }
    
    return false;
  }
};

// Helper function to make external API calls
const callExternalAPI = (path, method = 'GET', data = null) => {
  return new Promise((resolve, reject) => {
    const url = new URL(EXTERNAL_API.baseUrl + path);
    
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Scribe-Customization-Studio/1.0'
      },
      // For self-signed certificates
      rejectUnauthorized: false
    };

    console.log(`🌐 EXTERNAL API: ${method} ${EXTERNAL_API.baseUrl}${path}`);

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const result = responseData ? JSON.parse(responseData) : {};
          console.log(`✅ EXTERNAL API Response: ${res.statusCode}`);
          resolve({ statusCode: res.statusCode, data: result });
        } catch (error) {
          console.log(`⚠️ EXTERNAL API Parse Error:`, error.message);
          resolve({ statusCode: res.statusCode, data: responseData });
        }
      });
    });

    req.on('error', (error) => {
      console.log(`❌ EXTERNAL API Error:`, error.message);
      reject(error);
    });

    if (data && method !== 'GET') {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
};

// Helper function to sync template with external API
const syncWithExternalAPI = async (action, templateData, templateId = null) => {
  try {
    switch (action) {
      case 'GET_ALL':
        return await callExternalAPI(EXTERNAL_API.templates, 'GET');
      
      case 'GET_ONE':
        return await callExternalAPI(`${EXTERNAL_API.templates}/${templateId}`, 'GET');
      
      case 'CREATE':
        return await callExternalAPI(EXTERNAL_API.templates, 'POST', templateData);
      
      case 'UPDATE':
        return await callExternalAPI(`${EXTERNAL_API.templates}/${templateId}`, 'PUT', templateData);
      
      case 'DELETE':
        return await callExternalAPI(`${EXTERNAL_API.templates}/${templateId}`, 'DELETE');
      
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.log(`⚠️ External API sync failed for ${action}:`, error.message);
    return null;
  }
};

// Helper function to transform database data to app format
const transformTemplateData = (dbTemplate, sections = [], fields = []) => {
  const templateSections = sections
    .filter(s => s.template_id === dbTemplate.id)
    .map(section => {
      const sectionFields = fields
        .filter(f => f.section_id === section.id)
        .map(field => ({
          name: field.field_name,
          dataType: field.type_name || 'text',
          length: field.max_length ? field.max_length.toString() : '',
          required: field.is_required === 1
        }));

      return {
        id: section.id.toString(),
        name: section.name,
        description: section.description || '',
        type: section.section_type || 'section',
        disabled: section.is_disabled === 1,
        fields: sectionFields,
        children: [], // TODO: Handle nested sections if needed
        parentId: section.parent_section_id ? section.parent_section_id.toString() : undefined
      };
    });

  return {
    id: dbTemplate.id.toString(),
    name: dbTemplate.name,
    description: dbTemplate.description || '',
    domain: dbTemplate.domain_name || 'General',
    created: dbTemplate.created_at,
    sections: templateSections
  };
};

// API Routes

// GET /api/templates - Fetch all templates with external API sync
app.get('/api/templates', async (req, res) => {
  try {
    // First, try to sync with external API
    const externalResponse = await syncWithExternalAPI('GET_ALL');
    
    // Then get from local database
    const sqlCall = 'CALL GetTemplates()';
    console.log(`🔵 EXECUTING: ${sqlCall}`);
    
    const [result] = await pool.execute(sqlCall);
    
    // Extract templates from the result (stored procedures return nested arrays)
    const templates = result[0];
    
    console.log(`✅ RESULT: Found ${templates.length} templates from database`);
    
    // Transform to match frontend format
    const transformedTemplates = templates.map(template => ({
      id: template.template_id.toString(),
      name: template.name,
      description: template.description || '',
      domain: 'General Medicine',
      created: template.created_at,
      sections: [], // Sections would be loaded separately if needed
      source: 'database'
    }));

    // If external API is available, include external templates
    if (externalResponse && externalResponse.statusCode === 200) {
      console.log(`✅ EXTERNAL API: Retrieved templates successfully`);
      
      // Add external templates to the response
      const externalTemplates = Array.isArray(externalResponse.data) ? externalResponse.data : [];
      const formattedExternalTemplates = externalTemplates.map((template, index) => ({
        id: `ext_${template.id || index}`,
        name: template.name || `External Template ${index + 1}`,
        description: template.description || 'From external API',
        domain: template.domain || 'External',
        created: template.created || new Date().toISOString(),
        sections: template.sections || [],
        source: 'external_api'
      }));
      
      // Combine both sources
      const combinedTemplates = [...transformedTemplates, ...formattedExternalTemplates];
      res.json(combinedTemplates);
    } else {
      // Return only database templates if external API fails
      console.log(`⚠️ EXTERNAL API: Not available, returning database templates only`);
      res.json(transformedTemplates);
    }

  } catch (error) {
    console.error('Error fetching templates:', error);
    
    // Try to return at least database templates on error
    try {
      const sqlCall = 'CALL GetTemplates()';
      console.log(`🔵 FALLBACK EXECUTING: ${sqlCall}`);
      
      const [result] = await pool.execute(sqlCall);
      const templates = result[0];
      
      const transformedTemplates = templates.map(template => ({
        id: template.template_id.toString(),
        name: template.name,
        description: template.description || '',
        domain: 'General Medicine',
        created: template.created_at,
        sections: [],
        source: 'database'
      }));

      res.json(transformedTemplates);
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
      res.status(500).json({ error: 'Failed to fetch templates', details: error.message });
    }
  }
});

// GET /api/templates/:id - Fetch single template using stored procedure
app.get('/api/templates/:id', async (req, res) => {
  try {
    const templateId = req.params.id;

    // Call GetTemplateById stored procedure
    const sqlCall = `CALL GetTemplateById(${templateId})`;
    console.log(`🔵 EXECUTING: ${sqlCall}`);
    
    const [result] = await pool.execute('CALL GetTemplateById(?)', [templateId]);
    
    // Extract templates from the result
    const templates = result[0];
    
    console.log(`✅ RESULT: Found ${templates.length > 0 ? 'template with ID ' + templateId : 'no template with ID ' + templateId}`);

    if (templates.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const template = templates[0];
    
    console.log(`🔍 RAW DATABASE TEMPLATE:`, {
      template_id: template.template_id,
      name: template.name,
      metadata_raw: template.metadata,
      metadata_type: typeof template.metadata,
      metadata_length: template.metadata ? template.metadata.length : 'null'
    });
    
    // Parse metadata JSON if available
    let metadata = {};
    try {
      if (template.metadata && template.metadata !== null && template.metadata !== '') {
        console.log(`🧩 PARSING METADATA: ${template.metadata.substring(0, 200)}...`);
        metadata = JSON.parse(template.metadata);
        console.log(`✅ PARSED METADATA SUCCESSFULLY:`, metadata);
      } else {
        console.log(`⚠️ NO METADATA TO PARSE (empty or null)`);
      }
    } catch (error) {
      console.warn(`❌ Failed to parse metadata for template ${templateId}:`, error.message);
      console.warn(`❌ Raw metadata was:`, template.metadata);
      metadata = {};
    }
    
    // Transform to match frontend format
    const transformedTemplate = {
      id: template.template_id.toString(),
      name: template.name,
      description: template.description || '',
      domain: 'General Medicine',
      created: template.created_at,
      sections: [], // You might want to load sections separately
      metadata: metadata,
      source: 'database'
    };

    console.log(`📋 FINAL TEMPLATE RESPONSE:`, {
      id: transformedTemplate.id,
      name: transformedTemplate.name,
      hasMetadata: !!transformedTemplate.metadata,
      metadataKeys: Object.keys(transformedTemplate.metadata)
    });
    res.json(transformedTemplate);
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({ error: 'Failed to fetch template', details: error.message });
  }
});

// POST /api/templates - Create new template with external API sync
app.post('/api/templates', async (req, res) => {
  try {
    const { name, description, metadata, sections = [] } = req.body;
    
    // Prepare template data for external API
    const externalTemplateData = {
      name,
      description: description || '',
      metadata: metadata || { sections, createdAt: new Date().toISOString() },
      sections,
      domain: 'General Medicine'
    };

    // First, try to create in external API
    const externalResponse = await syncWithExternalAPI('CREATE', externalTemplateData);
    
    // Prepare metadata JSON for database
    const metadataJson = JSON.stringify(metadata || {
      sections: sections,
      createdAt: new Date().toISOString(),
      externalSync: externalResponse ? true : false
    });
    
    // Use add_template stored procedure
    const sqlCall = `CALL add_template('${name}', '${description || ''}', '${metadataJson}', 1.0, 1, 'Initial creation')`;
    console.log(`🔵 EXECUTING: ${sqlCall}`);
    
    const [result] = await pool.execute(
      'CALL add_template(?, ?, ?, ?, ?, ?)',
      [
        name,
        description || '',
        metadataJson,
        1.0, // version
        1, // created_by
        'Initial creation' // created_purpose
      ]
    );

    // Get the last inserted ID
    const [idResult] = await pool.execute('SELECT LAST_INSERT_ID() as template_id');
    const templateId = idResult[0].template_id;

    console.log(`✅ RESULT: Created template with ID ${templateId}`);

    // Response includes sync status
    res.status(201).json({ 
      id: templateId, 
      template_id: templateId,
      message: 'Template created successfully',
      externalSync: externalResponse ? 'success' : 'failed',
      externalId: externalResponse?.data?.id || null
    });
    
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ error: 'Failed to create template', details: error.message });
  }
});

// PUT /api/templates/:id - Update existing template with external API sync
app.put('/api/templates/:id', async (req, res) => {
  try {
    const templateId = req.params.id;
    const { name, description, metadata, sections = [] } = req.body;

    // Check if this is an external template
    const isExternal = templateId.startsWith('ext_');
    
    if (isExternal) {
      // Handle external template update
      const externalId = templateId.replace('ext_', '');
      const externalTemplateData = {
        name,
        description: description || '',
        metadata: metadata || { sections, updatedAt: new Date().toISOString() },
        sections
      };

      const externalResponse = await syncWithExternalAPI('UPDATE', externalTemplateData, externalId);
      
      if (externalResponse && externalResponse.statusCode < 300) {
        console.log(`✅ EXTERNAL API: Updated template ${externalId} successfully`);
        res.json({ 
          message: 'External template updated successfully',
          externalSync: 'success'
        });
      } else {
        res.status(500).json({ 
          error: 'Failed to update external template',
          externalSync: 'failed' 
        });
      }
    } else {
      // Handle database template update with external sync
      const externalTemplateData = {
        name,
        description: description || '',
        metadata: metadata || { sections, updatedAt: new Date().toISOString() },
        sections
      };

      // Try to sync with external API
      const externalResponse = await syncWithExternalAPI('UPDATE', externalTemplateData, templateId);
      
      // Prepare metadata JSON
      const metadataJson = JSON.stringify(metadata || {
        sections: sections,
        updatedAt: new Date().toISOString(),
        externalSync: externalResponse ? true : false
      });
      
      // Use UpdateTemplate stored procedure
      const sqlCall = `CALL UpdateTemplate(${templateId}, '${name}', '${description || ''}', '${metadataJson}', 2.0, 1, 'Template updated', b'1')`;
      console.log(`🔵 EXECUTING: ${sqlCall}`);
      
      await pool.execute(
        'CALL UpdateTemplate(?, ?, ?, ?, ?, ?, ?, ?)',
        [
          templateId,
          name,
          description || '',
          metadataJson,
          2.0, // increment version
          1, // updated_by (you might want to get this from session/auth)
          'Template updated', // updated_purpose
          1 // is_active (bit true)
        ]
      );

      console.log(`✅ RESULT: Updated template ID ${templateId} successfully`);

      res.json({ 
        message: 'Template updated successfully',
        externalSync: externalResponse ? 'success' : 'failed'
      });
    }
    
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({ error: 'Failed to update template' });
  }
});

// DELETE /api/templates/:id - Delete template with external API sync
app.delete('/api/templates/:id', async (req, res) => {
  try {
    const templateId = req.params.id;

    // Check if this is an external template
    const isExternal = templateId.startsWith('ext_');
    
    if (isExternal) {
      // Handle external template deletion
      const externalId = templateId.replace('ext_', '');
      const externalResponse = await syncWithExternalAPI('DELETE', null, externalId);
      
      if (externalResponse && externalResponse.statusCode < 300) {
        console.log(`✅ EXTERNAL API: Deleted template ${externalId} successfully`);
        res.json({ 
          message: 'External template deleted successfully',
          externalSync: 'success'
        });
      } else {
        res.status(500).json({ 
          error: 'Failed to delete external template',
          externalSync: 'failed' 
        });
      }
    } else {
      // Handle database template deletion with external sync
      const externalResponse = await syncWithExternalAPI('DELETE', null, templateId);
      
      // Use SoftDeleteTemplate stored procedure
      const sqlCall = `CALL SoftDeleteTemplate(${templateId}, 1, 'Template deactivated')`;
      console.log(`🔵 EXECUTING: ${sqlCall}`);
      
      await pool.execute(
        'CALL SoftDeleteTemplate(?, ?, ?)',
        [
          templateId,
          1, // updated_by (you might want to get this from session/auth)
          'Template deactivated' // updated_purpose
        ]
      );
      
      console.log(`✅ RESULT: Soft deleted template ID ${templateId}`);
      
      res.json({ 
        message: 'Template deleted successfully',
        externalSync: externalResponse ? 'success' : 'failed'
      });
    }
    
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({ error: 'Failed to delete template' });
  }
});

// GET /api/domains - Get all domains
app.get('/api/domains', async (req, res) => {
  try {
    const [domains] = await pool.execute('SELECT id, name, description FROM domains WHERE is_active = TRUE ORDER BY name');
    res.json(domains);
  } catch (error) {
    console.error('Error fetching domains:', error);
    res.status(500).json({ error: 'Failed to fetch domains' });
  }
});

// GET /api/templates/:id/configuration - Get template configuration JSON from metadata
app.get('/api/templates/:id/configuration', async (req, res) => {
  try {
    const templateId = req.params.id;

    // Use GetTemplateById to get template with metadata
    const sqlCall = `CALL GetTemplateById(${templateId})`;
    console.log(`🔵 EXECUTING: ${sqlCall} (for configuration)`);
    
    const [result] = await pool.execute('CALL GetTemplateById(?)', [templateId]);
    const templates = result[0];

    if (templates.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const template = templates[0];
    let configuration = {};

    // Try to get configuration from metadata first
    if (template.metadata) {
      try {
        const metadata = typeof template.metadata === 'string' 
          ? JSON.parse(template.metadata) 
          : template.metadata;
        configuration = metadata.configuration || metadata; // metadata might be the configuration itself
      } catch (parseError) {
        console.warn('Error parsing template metadata:', parseError);
      }
    }

    // If no configuration in metadata, generate from template settings
    if (Object.keys(configuration).length === 0) {
      configuration = {
        templateName: template.name,
        sections: [], // Would need to fetch sections if needed
        generatedAt: new Date().toISOString(),
        version: template.version || '1.0'
      };
    }

    res.json({
      templateId: template.template_id,
      templateName: template.name,
      configuration: configuration
    });

  } catch (error) {
    console.error('Error fetching template configuration:', error);
    res.status(500).json({ error: 'Failed to fetch template configuration', details: error.message });
  }
});

// DEBUG: Simple PUT test route  
app.put('/api/templates/:id/config', (req, res) => {
  res.json({ message: `Simple PUT test for template ${req.params.id}`, body: req.body });
});

// PUT /api/templates/:id/configuration - Save configuration JSON to template metadata
app.put('/api/templates/:id/configuration', async (req, res) => {
  try {
    const templateId = req.params.id;
    const { configuration } = req.body;

    if (!configuration) {
      return res.status(400).json({ error: 'Configuration data is required' });
    }

    // Get existing template to preserve other data
    const getTemplateCall = `CALL GetTemplateById(${templateId})`;
    console.log(`🔵 EXECUTING: ${getTemplateCall} (to get existing data)`);
    
    const [result] = await pool.execute('CALL GetTemplateById(?)', [templateId]);
    const templates = result[0];

    if (templates.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const template = templates[0];

    // Parse existing metadata or create new
    let metadata = {};
    if (template.metadata) {
      try {
        metadata = typeof template.metadata === 'string' 
          ? JSON.parse(template.metadata) 
          : template.metadata;
      } catch (parseError) {
        console.warn('Error parsing existing metadata:', parseError);
        metadata = {};
      }
    }

    // Update configuration in metadata
    metadata.configuration = configuration;
    metadata.configurationUpdatedAt = new Date().toISOString();

    // Use UpdateTemplate stored procedure to save the updated metadata
    const updateCall = `CALL UpdateTemplate(${templateId}, '${template.name}', '${template.description}', '${JSON.stringify(metadata)}', ${parseFloat(template.version) + 0.1}, 1, 'Configuration updated', b'1')`;
    console.log(`🔵 EXECUTING: ${updateCall}`);
    
    await pool.execute(
      'CALL UpdateTemplate(?, ?, ?, ?, ?, ?, ?, ?)',
      [
        templateId,
        template.name, // Keep existing name
        template.description, // Keep existing description
        JSON.stringify(metadata), // Updated metadata
        parseFloat(template.version) + 0.1, // Increment version slightly
        1, // updated_by
        'Configuration updated', // updated_purpose
        1 // is_active
      ]
    );
    
    console.log(`✅ RESULT: Configuration saved for template ID ${templateId}`);

    res.json({ 
      message: 'Configuration saved successfully',
      templateId: templateId,
      updatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error saving template configuration:', error);
    res.status(500).json({ error: 'Failed to save template configuration' });
  }
});

// GET /api/templates/:id/export - Export complete template with configuration
app.get('/api/templates/:id/export', async (req, res) => {
  try {
    const templateId = req.params.id;

    // Get complete template data
    const [templates] = await pool.execute(`
      SELECT 
        t.id,
        t.name,
        t.description,
        t.metadata,
        t.view_mode,
        t.show_hpi_bullets,
        t.show_headers,
        t.created_at,
        d.name AS domain_name
      FROM templates t
      LEFT JOIN domains d ON t.domain_id = d.id
      WHERE t.id = ? AND t.is_active = TRUE
    `, [templateId]);

    if (templates.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const [sections] = await pool.execute(`
      SELECT 
        ts.id,
        ts.name,
        ts.description,
        ts.section_type,
        ts.parent_section_id,
        ts.is_disabled,
        ts.sort_order,
        ts.nesting_level
      FROM template_sections ts
      WHERE ts.template_id = ?
      ORDER BY ts.sort_order
    `, [templateId]);

    const [fields] = await pool.execute(`
      SELECT 
        sf.id,
        sf.section_id,
        sf.field_name,
        sf.field_label,
        sf.max_length,
        sf.is_required,
        sf.sort_order,
        ft.type_name
      FROM section_fields sf
      JOIN field_types ft ON sf.field_type_id = ft.id
      JOIN template_sections ts ON sf.section_id = ts.id
      WHERE ts.template_id = ?
      ORDER BY sf.sort_order
    `, [templateId]);

    const template = templates[0];
    const transformedTemplate = transformTemplateData(template, sections, fields);

    // Parse metadata for configuration
    let configuration = {};
    if (template.metadata) {
      try {
        const metadata = typeof template.metadata === 'string' 
          ? JSON.parse(template.metadata) 
          : template.metadata;
        configuration = metadata.configuration || {};
      } catch (parseError) {
        console.warn('Error parsing template metadata:', parseError);
      }
    }

    // Export object with both template data and configuration
    const exportData = {
      template: transformedTemplate,
      configuration: configuration,
      exportedAt: new Date().toISOString(),
      exportVersion: '1.0'
    };

    res.json(exportData);

  } catch (error) {
    console.error('Error exporting template:', error);
    res.status(500).json({ error: 'Failed to export template' });
  }
});

// GET /api/debug/tables - Show available tables for debugging
app.get('/api/debug/tables', async (req, res) => {
  try {
    const [tables] = await pool.execute('SHOW TABLES');
    res.json({ 
      database: process.env.DB_NAME || 'qa_scribe_test',
      tables: tables.map(row => Object.values(row)[0])
    });
  } catch (error) {
    console.error('Error listing tables:', error);
    res.status(500).json({ error: 'Failed to list tables', details: error.message });
  }
});

// Simple route test
app.get('/api/simple', (req, res) => {
  res.json({ message: 'Simple route works', timestamp: new Date().toISOString() });
});

// Test external API connectivity
app.get('/api/test-external', async (req, res) => {
  try {
    console.log('🔍 Testing external API connectivity...');
    const externalResponse = await syncWithExternalAPI('GET_ALL');
    
    res.json({
      message: 'External API test completed',
      externalAPI: {
        url: EXTERNAL_API.baseUrl + EXTERNAL_API.templates,
        status: externalResponse ? externalResponse.statusCode : 'failed',
        connected: externalResponse ? true : false,
        data: externalResponse ? externalResponse.data : null
      },
      database: {
        configured: true,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'External API test failed',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Health check endpoint with enhanced live server monitoring
app.get('/api/health', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    
    // Test database with a simple query
    const [result] = await connection.execute('SELECT NOW() as server_time, VERSION() as db_version');
    connection.release();
    
    res.json({ 
      status: 'OK', 
      database: 'Connected',
      server_time: new Date().toISOString(),
      db_time: result[0].server_time,
      db_version: result[0].db_version,
      environment: process.env.NODE_ENV || 'production',
      uptime: process.uptime(),
      memory: process.memoryUsage()
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'Error', 
      database: 'Disconnected', 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Global error handling middleware for live server
app.use((error, req, res, next) => {
  console.error(`[${new Date().toISOString()}] ERROR:`, error);
  
  if (process.env.NODE_ENV === 'production') {
    // Don't expose internal errors in production
    res.status(500).json({
      error: 'Internal server error',
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] || 'unknown'
    });
  } else {
    res.status(500).json({
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }
});

// 404 handler for live server  
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Start live server with production configuration
const startLiveServer = async () => {
  try {
    // Validate database connection before starting server
    const dbConnected = await validateLiveConnection();
    
    if (!dbConnected && process.env.NODE_ENV === 'production') {
      console.error('🛑 Cannot start production server without database connection');
      process.exit(1);
    }

    // Start the server
    const server = app.listen(PORT, () => {
      console.log('🌟 ====================================');
      console.log('🚀 LIVE SCRIBE CUSTOMIZATION SERVER');
      console.log('🌟 ====================================');
      console.log(`🌐 Server URL: ${process.env.NODE_ENV === 'production' ? 'https://your-live-domain.com' : `http://localhost:${PORT}`}`);
      console.log(`📊 API Base: ${process.env.NODE_ENV === 'production' ? 'https://your-live-domain.com/api' : `http://localhost:${PORT}/api`}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'production'}`);
      console.log(`🏥 Database: ${dbConfig.database} @ ${dbConfig.host}`);
      console.log(`⚡ Process ID: ${process.pid}`);
      console.log('🌟 ====================================');

      // Log API endpoints for live server monitoring
      const routes = [
        'GET /api/templates',
        'GET /api/templates/:id', 
        'POST /api/templates',
        'PUT /api/templates/:id',
        'DELETE /api/templates/:id',
        'GET /api/templates/:id/configuration',
        'PUT /api/templates/:id/configuration',
        'GET /api/templates/:id/export',
        'GET /api/domains',
        'GET /api/health',
        'GET /api/debug/tables'
      ];
      
      console.log('📋 Available API Endpoints:');
      routes.forEach(route => console.log(`   ${route}`));
      console.log('🌟 ====================================');
    });

    // Handle server shutdown gracefully
    const gracefulShutdown = (signal) => {
      console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
      
      server.close(() => {
        console.log('✅ HTTP server closed');
        
        pool.end(() => {
          console.log('✅ Database connections closed');
          console.log('👋 Live server shutdown complete');
          process.exit(0);
        });
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    console.error('💥 Failed to start live server:', error.message);
    process.exit(1);
  }
};

// Initialize live server
startLiveServer();

export default app;