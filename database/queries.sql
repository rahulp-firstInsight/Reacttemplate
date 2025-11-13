-- ============================================================================
-- Scribe Customization Studio - Common Database Queries
-- ============================================================================

-- ============================================================================
-- 1. TEMPLATE MANAGEMENT QUERIES
-- ============================================================================

-- Get all active templates with domain information
SELECT 
    t.id,
    t.name,
    t.description,
    d.name AS domain,
    t.created_at,
    t.is_published,
    (SELECT COUNT(*) FROM template_sections WHERE template_id = t.id) AS section_count
FROM templates t
LEFT JOIN domains d ON t.domain_id = d.id
WHERE t.is_active = TRUE
ORDER BY t.created_at DESC;

-- Get complete template structure for form builder
SELECT 
    t.id AS template_id,
    t.name AS template_name,
    t.view_mode,
    t.show_hpi_bullets,
    t.show_headers,
    ts.id AS section_id,
    ts.name AS section_name,
    ts.description AS section_description,
    ts.parent_section_id,
    ts.nesting_level,
    ts.sort_order AS section_order,
    ts.is_disabled AS section_disabled,
    sf.id AS field_id,
    sf.field_name,
    sf.field_label,
    sf.placeholder_text,
    sf.is_required AS field_required,
    sf.max_length,
    sf.sort_order AS field_order,
    ft.type_name AS field_type,
    ft.html_input_type,
    sf.field_options,
    sf.validation_rules
FROM templates t
LEFT JOIN template_sections ts ON t.id = ts.template_id
LEFT JOIN section_fields sf ON ts.id = sf.section_id
LEFT JOIN field_types ft ON sf.field_type_id = ft.id
WHERE t.id = ? -- Replace ? with template ID
ORDER BY ts.sort_order, sf.sort_order;

-- Search templates by name or description
SELECT 
    t.id,
    t.name,
    t.description,
    d.name AS domain,
    t.created_at,
    MATCH(t.name, t.description) AGAINST(? IN NATURAL LANGUAGE MODE) AS relevance_score
FROM templates t
LEFT JOIN domains d ON t.domain_id = d.id
WHERE MATCH(t.name, t.description) AGAINST(? IN NATURAL LANGUAGE MODE)
   OR t.name LIKE CONCAT('%', ?, '%')
   OR t.description LIKE CONCAT('%', ?, '%')
ORDER BY relevance_score DESC, t.created_at DESC;

-- ============================================================================
-- 2. TEMPLATE CREATION AND UPDATE QUERIES
-- ============================================================================

-- Create new template
INSERT INTO templates (name, description, domain_id, created_by, view_mode, show_hpi_bullets, show_headers, metadata)
VALUES (?, ?, ?, ?, ?, ?, ?, ?);

-- Create new section
INSERT INTO template_sections (template_id, parent_section_id, name, description, sort_order, nesting_level)
VALUES (?, ?, ?, ?, ?, ?);

-- Create new field
INSERT INTO section_fields (section_id, field_type_id, field_name, field_label, placeholder_text, is_required, max_length, sort_order, field_options)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);

-- Update template settings
UPDATE templates 
SET name = ?, 
    description = ?, 
    domain_id = ?, 
    view_mode = ?, 
    show_hpi_bullets = ?, 
    show_headers = ?, 
    updated_at = CURRENT_TIMESTAMP
WHERE id = ?;

-- Update section order after drag and drop
UPDATE template_sections 
SET sort_order = ?, 
    parent_section_id = ?, 
    nesting_level = ?,
    updated_at = CURRENT_TIMESTAMP
WHERE id = ?;

-- Move field to different section
UPDATE section_fields 
SET section_id = ?, 
    sort_order = ?,
    updated_at = CURRENT_TIMESTAMP
WHERE id = ?;

-- ============================================================================
-- 3. TEMPLATE COPY/CLONE QUERIES
-- ============================================================================

-- Copy template with new name
CALL CloneTemplate(?, ?, ?, @new_template_id);
SELECT @new_template_id AS new_template_id;

-- Manual template copy (if stored procedure not available)
-- Step 1: Copy template
INSERT INTO templates (name, description, domain_id, created_by, view_mode, show_hpi_bullets, show_headers, metadata)
SELECT CONCAT(?, ' (Copy)'), description, domain_id, ?, view_mode, show_hpi_bullets, show_headers, metadata
FROM templates WHERE id = ?;

-- Step 2: Get new template ID
SET @new_template_id = LAST_INSERT_ID();

-- Step 3: Copy sections (run this for each section, updating sort order)
INSERT INTO template_sections (template_id, parent_section_id, name, description, section_type, sort_order, is_disabled, nesting_level)
SELECT @new_template_id, parent_section_id, name, description, section_type, sort_order, is_disabled, nesting_level
FROM template_sections WHERE template_id = ? ORDER BY sort_order;

-- Step 4: Copy fields (run after sections are copied)
INSERT INTO section_fields (section_id, field_type_id, field_name, field_label, placeholder_text, default_value, max_length, is_required, sort_order, field_options, validation_rules)
SELECT 
    new_ts.id,
    sf.field_type_id,
    sf.field_name,
    sf.field_label,
    sf.placeholder_text,
    sf.default_value,
    sf.max_length,
    sf.is_required,
    sf.sort_order,
    sf.field_options,
    sf.validation_rules
FROM section_fields sf
JOIN template_sections old_ts ON sf.section_id = old_ts.id
JOIN template_sections new_ts ON (new_ts.template_id = @new_template_id AND new_ts.sort_order = old_ts.sort_order AND new_ts.name = old_ts.name)
WHERE old_ts.template_id = ?
ORDER BY sf.sort_order;

-- ============================================================================
-- 4. DELETION QUERIES
-- ============================================================================

-- Delete template (cascades to sections and fields)
DELETE FROM templates WHERE id = ?;

-- Delete section (cascades to fields)
DELETE FROM template_sections WHERE id = ?;

-- Delete field
DELETE FROM section_fields WHERE id = ?;

-- Soft delete template (mark as inactive)
UPDATE templates SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = ?;

-- ============================================================================
-- 5. FIELD TYPE AND DOMAIN QUERIES
-- ============================================================================

-- Get all available field types
SELECT 
    id,
    type_name,
    display_name,
    html_input_type,
    validation_rules
FROM field_types 
ORDER BY display_name;

-- Get all domains
SELECT 
    id,
    name,
    description,
    color_code
FROM domains 
WHERE is_active = TRUE
ORDER BY name;

-- ============================================================================
-- 6. REPORTING AND ANALYTICS QUERIES
-- ============================================================================

-- Template usage statistics
SELECT 
    d.name AS domain,
    COUNT(t.id) AS template_count,
    AVG(section_stats.section_count) AS avg_sections,
    AVG(field_stats.field_count) AS avg_fields
FROM domains d
LEFT JOIN templates t ON d.id = t.domain_id AND t.is_active = TRUE
LEFT JOIN (
    SELECT template_id, COUNT(*) as section_count 
    FROM template_sections 
    GROUP BY template_id
) section_stats ON t.id = section_stats.template_id
LEFT JOIN (
    SELECT ts.template_id, COUNT(sf.id) as field_count
    FROM template_sections ts
    LEFT JOIN section_fields sf ON ts.id = sf.section_id
    GROUP BY ts.template_id
) field_stats ON t.id = field_stats.template_id
GROUP BY d.id, d.name
ORDER BY template_count DESC;

-- Most popular field types
SELECT 
    ft.display_name,
    ft.type_name,
    COUNT(sf.id) AS usage_count
FROM field_types ft
LEFT JOIN section_fields sf ON ft.id = sf.field_type_id
GROUP BY ft.id, ft.display_name, ft.type_name
ORDER BY usage_count DESC;

-- Templates created per month
SELECT 
    DATE_FORMAT(created_at, '%Y-%m') AS month,
    COUNT(*) AS templates_created
FROM templates
WHERE created_at >= DATE_SUB(CURRENT_DATE, INTERVAL 12 MONTH)
GROUP BY DATE_FORMAT(created_at, '%Y-%m')
ORDER BY month;

-- ============================================================================
-- 7. DATA VALIDATION QUERIES
-- ============================================================================

-- Find templates without sections
SELECT t.id, t.name
FROM templates t
LEFT JOIN template_sections ts ON t.id = ts.template_id
WHERE ts.id IS NULL AND t.is_active = TRUE;

-- Find sections without fields
SELECT 
    t.name AS template_name,
    ts.id AS section_id,
    ts.name AS section_name
FROM template_sections ts
JOIN templates t ON ts.template_id = t.id
LEFT JOIN section_fields sf ON ts.id = sf.section_id
WHERE sf.id IS NULL AND t.is_active = TRUE
ORDER BY t.name, ts.name;

-- Find orphaned sections (parent_section_id references non-existent section)
SELECT 
    ts1.id,
    ts1.name,
    ts1.parent_section_id
FROM template_sections ts1
LEFT JOIN template_sections ts2 ON ts1.parent_section_id = ts2.id
WHERE ts1.parent_section_id IS NOT NULL AND ts2.id IS NULL;

-- ============================================================================
-- 8. API RESPONSE FORMATTING QUERIES
-- ============================================================================

-- Format template list for API (matching your current app structure)
SELECT 
    t.id,
    t.name,
    t.description,
    d.name AS domain,
    t.created_at AS created,
    JSON_ARRAY() AS sections  -- Empty array, populate separately if needed
FROM templates t
LEFT JOIN domains d ON t.domain_id = d.id
WHERE t.is_active = TRUE
ORDER BY t.created_at DESC;

-- Format complete template with sections and fields (JSON structure)
SELECT 
    JSON_OBJECT(
        'id', t.id,
        'name', t.name,
        'description', t.description,
        'domain', d.name,
        'created', t.created_at,
        'viewMode', t.view_mode,
        'showHPIBullets', t.show_hpi_bullets,
        'showHeaders', t.show_headers,
        'sections', (
            SELECT JSON_ARRAYAGG(
                JSON_OBJECT(
                    'id', ts.id,
                    'name', ts.name,
                    'description', ts.description,
                    'type', ts.section_type,
                    'disabled', ts.is_disabled,
                    'parentId', ts.parent_section_id,
                    'fields', (
                        SELECT COALESCE(JSON_ARRAYAGG(
                            JSON_OBJECT(
                                'name', sf.field_name,
                                'dataType', ft.type_name,
                                'length', sf.max_length,
                                'required', sf.is_required
                            )
                        ), JSON_ARRAY())
                        FROM section_fields sf
                        JOIN field_types ft ON sf.field_type_id = ft.id
                        WHERE sf.section_id = ts.id
                        ORDER BY sf.sort_order
                    ),
                    'children', JSON_ARRAY()  -- Nested sections would require recursive query
                )
            )
            FROM template_sections ts
            WHERE ts.template_id = t.id
            ORDER BY ts.sort_order
        )
    ) AS template_data
FROM templates t
LEFT JOIN domains d ON t.domain_id = d.id
WHERE t.id = ?;  -- Replace ? with template ID

-- ============================================================================
-- 9. MAINTENANCE AND CLEANUP QUERIES
-- ============================================================================

-- Update sort orders after section deletion
SET @counter = 0;
UPDATE template_sections 
SET sort_order = (@counter := @counter + 1)
WHERE template_id = ? 
ORDER BY sort_order;

-- Update field sort orders after field deletion
SET @counter = 0;
UPDATE section_fields 
SET sort_order = (@counter := @counter + 1)
WHERE section_id = ? 
ORDER BY sort_order;

-- Clean up orphaned validation rules
DELETE fv FROM field_validations fv
LEFT JOIN section_fields sf ON fv.field_id = sf.id
WHERE sf.id IS NULL;

-- ============================================================================
-- 10. BACKUP AND EXPORT QUERIES
-- ============================================================================

-- Export template structure as JSON (for backup/migration)
SELECT 
    t.name AS template_name,
    JSON_OBJECT(
        'template', JSON_OBJECT(
            'name', t.name,
            'description', t.description,
            'domain', d.name,
            'settings', JSON_OBJECT(
                'viewMode', t.view_mode,
                'showHPIBullets', t.show_hpi_bullets,
                'showHeaders', t.show_headers
            )
        ),
        'sections', (
            SELECT JSON_ARRAYAGG(
                JSON_OBJECT(
                    'name', ts.name,
                    'description', ts.description,
                    'order', ts.sort_order,
                    'nesting_level', ts.nesting_level,
                    'fields', (
                        SELECT COALESCE(JSON_ARRAYAGG(
                            JSON_OBJECT(
                                'name', sf.field_name,
                                'label', sf.field_label,
                                'type', ft.type_name,
                                'required', sf.is_required,
                                'maxLength', sf.max_length,
                                'placeholder', sf.placeholder_text,
                                'options', sf.field_options,
                                'validations', sf.validation_rules
                            )
                        ), JSON_ARRAY())
                        FROM section_fields sf
                        JOIN field_types ft ON sf.field_type_id = ft.id
                        WHERE sf.section_id = ts.id
                        ORDER BY sf.sort_order
                    )
                )
            )
            FROM template_sections ts
            WHERE ts.template_id = t.id
            ORDER BY ts.sort_order
        )
    ) AS export_data
FROM templates t
LEFT JOIN domains d ON t.domain_id = d.id
WHERE t.id = ?;

-- ============================================================================
-- END OF QUERIES
-- ============================================================================