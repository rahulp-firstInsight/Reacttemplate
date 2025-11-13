-- ============================================================================
-- Scribe Customization Studio - MySQL Database Schema
-- ============================================================================

-- Drop existing tables if they exist (in reverse order due to foreign keys)
DROP TABLE IF EXISTS field_validations;
DROP TABLE IF EXISTS section_fields;
DROP TABLE IF EXISTS template_sections;
DROP TABLE IF EXISTS templates;
DROP TABLE IF EXISTS domains;
DROP TABLE IF EXISTS field_types;
DROP TABLE IF EXISTS users;

-- ============================================================================
-- 1. USERS TABLE
-- ============================================================================
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'doctor', 'nurse', 'user') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- ============================================================================
-- 2. DOMAINS TABLE (Medical specialties)
-- ============================================================================
CREATE TABLE domains (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    color_code VARCHAR(7) DEFAULT '#007bff', -- Bootstrap color codes
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- ============================================================================
-- 3. FIELD TYPES TABLE
-- ============================================================================
CREATE TABLE field_types (
    id INT PRIMARY KEY AUTO_INCREMENT,
    type_name VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    validation_rules JSON, -- Store validation rules as JSON
    html_input_type VARCHAR(50), -- text, number, date, textarea, select, checkbox, radio
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 4. TEMPLATES TABLE (Main template information)
-- ============================================================================
CREATE TABLE templates (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    domain_id INT,
    created_by INT,
    version VARCHAR(20) DEFAULT '1.0',
    is_published BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    view_mode ENUM('paragraph', 'bullets') DEFAULT 'paragraph',
    show_hpi_bullets BOOLEAN DEFAULT FALSE,
    show_headers BOOLEAN DEFAULT TRUE,
    metadata JSON, -- Store additional configuration as JSON
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    FOREIGN KEY (domain_id) REFERENCES domains(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    
    -- Indexes
    INDEX idx_template_name (name),
    INDEX idx_template_domain (domain_id),
    INDEX idx_template_created_by (created_by),
    INDEX idx_template_active (is_active)
);

-- ============================================================================
-- 5. TEMPLATE SECTIONS TABLE (Sections within templates)
-- ============================================================================
CREATE TABLE template_sections (
    id INT PRIMARY KEY AUTO_INCREMENT,
    template_id INT NOT NULL,
    parent_section_id INT NULL, -- For nested sections
    name VARCHAR(255) NOT NULL,
    description TEXT,
    section_type VARCHAR(50) DEFAULT 'section',
    sort_order INT DEFAULT 0,
    is_disabled BOOLEAN DEFAULT FALSE,
    is_required BOOLEAN DEFAULT FALSE,
    nesting_level INT DEFAULT 0, -- Track nesting depth
    metadata JSON, -- Store additional section properties
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_section_id) REFERENCES template_sections(id) ON DELETE CASCADE,
    
    -- Indexes
    INDEX idx_section_template (template_id),
    INDEX idx_section_parent (parent_section_id),
    INDEX idx_section_order (template_id, sort_order),
    INDEX idx_section_name (name)
);

-- ============================================================================
-- 6. SECTION FIELDS TABLE (Fields within sections)
-- ============================================================================
CREATE TABLE section_fields (
    id INT PRIMARY KEY AUTO_INCREMENT,
    section_id INT NOT NULL,
    field_type_id INT NOT NULL,
    field_name VARCHAR(255) NOT NULL,
    field_label VARCHAR(255),
    placeholder_text VARCHAR(255),
    default_value TEXT,
    max_length INT,
    min_length INT,
    is_required BOOLEAN DEFAULT FALSE,
    is_readonly BOOLEAN DEFAULT FALSE,
    sort_order INT DEFAULT 0,
    validation_rules JSON, -- Custom validation rules for this field
    field_options JSON, -- For dropdowns, checkboxes, radio buttons
    help_text TEXT,
    css_classes VARCHAR(255), -- Bootstrap or custom CSS classes
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    FOREIGN KEY (section_id) REFERENCES template_sections(id) ON DELETE CASCADE,
    FOREIGN KEY (field_type_id) REFERENCES field_types(id) ON DELETE RESTRICT,
    
    -- Indexes
    INDEX idx_field_section (section_id),
    INDEX idx_field_type (field_type_id),
    INDEX idx_field_order (section_id, sort_order),
    INDEX idx_field_name (field_name)
);

-- ============================================================================
-- 7. FIELD VALIDATIONS TABLE (Advanced validation rules)
-- ============================================================================
CREATE TABLE field_validations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    field_id INT NOT NULL,
    validation_type ENUM('required', 'min_length', 'max_length', 'pattern', 'custom') NOT NULL,
    validation_value VARCHAR(255),
    error_message VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    FOREIGN KEY (field_id) REFERENCES section_fields(id) ON DELETE CASCADE,
    
    -- Indexes
    INDEX idx_validation_field (field_id),
    INDEX idx_validation_type (validation_type)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Composite indexes for common queries
CREATE INDEX idx_template_domain_active ON templates(domain_id, is_active);
CREATE INDEX idx_section_template_order ON template_sections(template_id, sort_order, nesting_level);
CREATE INDEX idx_field_section_order ON section_fields(section_id, sort_order);

-- Full-text search indexes
CREATE FULLTEXT INDEX idx_template_search ON templates(name, description);
CREATE FULLTEXT INDEX idx_section_search ON template_sections(name, description);
CREATE FULLTEXT INDEX idx_field_search ON section_fields(field_name, field_label, help_text);

-- ============================================================================
-- VIEWS FOR EASIER QUERYING
-- ============================================================================

-- View: Complete Template with Domain Information
CREATE VIEW v_templates_with_domain AS
SELECT 
    t.id,
    t.name,
    t.description,
    t.version,
    t.is_published,
    t.is_active,
    t.view_mode,
    t.show_hpi_bullets,
    t.show_headers,
    t.created_at,
    t.updated_at,
    d.name AS domain_name,
    d.color_code AS domain_color,
    u.username AS created_by_username,
    u.first_name AS creator_first_name,
    u.last_name AS creator_last_name,
    (SELECT COUNT(*) FROM template_sections WHERE template_id = t.id) AS section_count,
    (SELECT COUNT(*) FROM section_fields sf 
     JOIN template_sections ts ON sf.section_id = ts.id 
     WHERE ts.template_id = t.id) AS total_field_count
FROM templates t
LEFT JOIN domains d ON t.domain_id = d.id
LEFT JOIN users u ON t.created_by = u.id;

-- View: Section Hierarchy
CREATE VIEW v_section_hierarchy AS
SELECT 
    s.id,
    s.template_id,
    s.name,
    s.description,
    s.nesting_level,
    s.sort_order,
    s.is_disabled,
    s.parent_section_id,
    parent.name AS parent_section_name,
    (SELECT COUNT(*) FROM section_fields WHERE section_id = s.id) AS field_count
FROM template_sections s
LEFT JOIN template_sections parent ON s.parent_section_id = parent.id
ORDER BY s.template_id, s.nesting_level, s.sort_order;

-- View: Fields with Type Information
CREATE VIEW v_fields_with_types AS
SELECT 
    f.id,
    f.section_id,
    f.field_name,
    f.field_label,
    f.placeholder_text,
    f.is_required,
    f.is_readonly,
    f.max_length,
    f.min_length,
    f.sort_order,
    ft.type_name,
    ft.display_name AS field_type_display,
    ft.html_input_type,
    s.name AS section_name,
    s.template_id
FROM section_fields f
JOIN field_types ft ON f.field_type_id = ft.id
JOIN template_sections s ON f.section_id = s.id
ORDER BY s.template_id, s.sort_order, f.sort_order;

-- ============================================================================
-- STORED PROCEDURES
-- ============================================================================

-- Procedure: Get Complete Template Structure
DELIMITER //
CREATE PROCEDURE GetCompleteTemplate(IN template_id_param INT)
BEGIN
    -- Get template basic info
    SELECT * FROM v_templates_with_domain WHERE id = template_id_param;
    
    -- Get all sections for this template (hierarchical)
    SELECT * FROM v_section_hierarchy WHERE template_id = template_id_param;
    
    -- Get all fields for this template
    SELECT * FROM v_fields_with_types WHERE template_id = template_id_param;
END //

-- Procedure: Clone Template
CREATE PROCEDURE CloneTemplate(
    IN source_template_id INT,
    IN new_name VARCHAR(255),
    IN created_by_user_id INT,
    OUT new_template_id INT
)
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE section_id INT;
    DECLARE new_section_id INT;
    DECLARE section_cursor CURSOR FOR 
        SELECT id FROM template_sections 
        WHERE template_id = source_template_id 
        ORDER BY nesting_level, sort_order;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    -- Start transaction
    START TRANSACTION;
    
    -- Create new template
    INSERT INTO templates (name, description, domain_id, created_by, view_mode, show_hpi_bullets, show_headers, metadata)
    SELECT CONCAT(new_name, ' (Copy)'), description, domain_id, created_by_user_id, view_mode, show_hpi_bullets, show_headers, metadata
    FROM templates WHERE id = source_template_id;
    
    SET new_template_id = LAST_INSERT_ID();
    
    -- Copy sections and fields
    OPEN section_cursor;
    read_loop: LOOP
        FETCH section_cursor INTO section_id;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        -- Copy section
        INSERT INTO template_sections (template_id, parent_section_id, name, description, section_type, sort_order, is_disabled, is_required, nesting_level, metadata)
        SELECT new_template_id, parent_section_id, name, description, section_type, sort_order, is_disabled, is_required, nesting_level, metadata
        FROM template_sections WHERE id = section_id;
        
        SET new_section_id = LAST_INSERT_ID();
        
        -- Copy fields for this section
        INSERT INTO section_fields (section_id, field_type_id, field_name, field_label, placeholder_text, default_value, max_length, min_length, is_required, is_readonly, sort_order, validation_rules, field_options, help_text, css_classes)
        SELECT new_section_id, field_type_id, field_name, field_label, placeholder_text, default_value, max_length, min_length, is_required, is_readonly, sort_order, validation_rules, field_options, help_text, css_classes
        FROM section_fields WHERE section_id = section_id;
        
    END LOOP;
    CLOSE section_cursor;
    
    COMMIT;
END //
DELIMITER ;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger: Update template updated_at when sections change
DELIMITER //
CREATE TRIGGER tr_update_template_on_section_change
    AFTER UPDATE ON template_sections
    FOR EACH ROW
BEGIN
    UPDATE templates 
    SET updated_at = CURRENT_TIMESTAMP 
    WHERE id = NEW.template_id;
END //

-- Trigger: Update template updated_at when fields change
CREATE TRIGGER tr_update_template_on_field_change
    AFTER UPDATE ON section_fields
    FOR EACH ROW
BEGIN
    UPDATE templates t
    JOIN template_sections ts ON t.id = ts.template_id
    SET t.updated_at = CURRENT_TIMESTAMP 
    WHERE ts.id = NEW.section_id;
END //
DELIMITER ;

-- ============================================================================
-- COMMENTS AND DOCUMENTATION
-- ============================================================================

-- Add table comments
ALTER TABLE templates COMMENT = 'Main template definitions for medical forms';
ALTER TABLE template_sections COMMENT = 'Hierarchical sections within templates (supports nesting)';
ALTER TABLE section_fields COMMENT = 'Form fields within each section';
ALTER TABLE domains COMMENT = 'Medical specialties/categories for templates';
ALTER TABLE field_types COMMENT = 'Available field types (text, number, dropdown, etc.)';
ALTER TABLE users COMMENT = 'System users who can create and manage templates';
ALTER TABLE field_validations COMMENT = 'Advanced validation rules for form fields';

-- ============================================================================
-- SECURITY NOTES
-- ============================================================================

-- 1. Consider adding row-level security based on user roles
-- 2. Implement proper authentication and authorization
-- 3. Use prepared statements to prevent SQL injection
-- 4. Regular backups of template data
-- 5. Consider data encryption for sensitive medical information
-- 6. Audit trail for template changes (consider adding audit tables)

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================