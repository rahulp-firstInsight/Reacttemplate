-- ============================================================================
-- Scribe Customization Studio - Simple Sample Data
-- ============================================================================

-- Clear existing data
DELETE FROM field_validations;
DELETE FROM section_fields;
DELETE FROM template_sections;
DELETE FROM templates;
DELETE FROM domains;
DELETE FROM field_types;
DELETE FROM users;

-- Reset auto-increment counters
ALTER TABLE users AUTO_INCREMENT = 1;
ALTER TABLE domains AUTO_INCREMENT = 1;
ALTER TABLE field_types AUTO_INCREMENT = 1;
ALTER TABLE templates AUTO_INCREMENT = 1;
ALTER TABLE template_sections AUTO_INCREMENT = 1;
ALTER TABLE section_fields AUTO_INCREMENT = 1;

-- ============================================================================
-- 1. USERS DATA
-- ============================================================================
INSERT INTO users (username, email, first_name, last_name, password_hash, role) VALUES
('admin', 'admin@scribe.com', 'System', 'Administrator', 'hash1', 'admin'),
('dr_smith', 'dr.smith@hospital.com', 'John', 'Smith', 'hash2', 'doctor'),
('nurse_jane', 'jane.doe@hospital.com', 'Jane', 'Doe', 'hash3', 'nurse');

-- ============================================================================
-- 2. DOMAINS DATA
-- ============================================================================
INSERT INTO domains (name, description, color_code) VALUES
('General Medicine', 'General medical practice and primary care', '#007bff'),
('Cardiology', 'Heart and cardiovascular system', '#dc3545'),
('Pediatrics', 'Medical care for children', '#28a745'),
('Comprehensive Care', 'Multi-specialty comprehensive assessment', '#6c757d');

-- ============================================================================
-- 3. FIELD TYPES DATA
-- ============================================================================
INSERT INTO field_types (type_name, display_name, html_input_type) VALUES
('text', 'Single Line Text', 'text'),
('textarea', 'Multi-line Text', 'textarea'),
('number', 'Number', 'number'),
('date', 'Date', 'date'),
('checkbox', 'Checkbox', 'checkbox'),
('dropdown', 'Dropdown Select', 'select');

-- ============================================================================
-- 4. TEMPLATES DATA
-- ============================================================================
INSERT INTO templates (name, description, domain_id, created_by, view_mode, show_hpi_bullets, show_headers, is_published) VALUES
('Basic Medical Form', 'Standard medical intake form', 1, 1, 'paragraph', FALSE, TRUE, TRUE),
('Comprehensive Assessment', 'Complete patient assessment', 4, 2, 'bullets', TRUE, TRUE, TRUE),
('Cardiology Assessment', 'Cardiac evaluation form', 2, 2, 'paragraph', FALSE, TRUE, TRUE),
('Pediatric Intake', 'Child-specific medical form', 3, 3, 'bullets', TRUE, TRUE, TRUE);

-- ============================================================================
-- 5. TEMPLATE SECTIONS DATA
-- ============================================================================

-- Basic Medical Form sections
INSERT INTO template_sections (template_id, name, description, sort_order, nesting_level, is_required) VALUES
(1, 'Chief Complaint', 'Primary reason for visit', 1, 0, TRUE),
(1, 'HPI', 'History of Present Illness', 2, 0, TRUE),
(1, 'Allergies', 'Known allergies', 3, 0, FALSE),
(1, 'Medications', 'Current medications', 4, 0, TRUE);

-- Comprehensive Assessment sections
INSERT INTO template_sections (template_id, name, description, sort_order, nesting_level, is_required) VALUES
(2, 'Patient Demographics', 'Basic patient information', 1, 0, TRUE),
(2, 'Chief Complaint', 'Primary concern', 2, 0, TRUE),
(2, 'History of Present Illness', 'Current illness history', 3, 0, TRUE),
(2, 'Past Medical History', 'Previous conditions', 4, 0, TRUE),
(2, 'Medications', 'Current medications', 5, 0, TRUE),
(2, 'Allergies', 'Known allergies', 6, 0, TRUE);

-- Cardiology Assessment sections
INSERT INTO template_sections (template_id, name, description, sort_order, nesting_level, is_required) VALUES
(3, 'Cardiac History', 'Previous heart conditions', 1, 0, TRUE),
(3, 'Current Symptoms', 'Present cardiac symptoms', 2, 0, TRUE),
(3, 'Risk Factors', 'Cardiovascular risks', 3, 0, TRUE),
(3, 'Physical Examination', 'Cardiac examination', 4, 0, TRUE);

-- Pediatric Intake sections  
INSERT INTO template_sections (template_id, name, description, sort_order, nesting_level, is_required) VALUES
(4, 'Child Information', 'Basic child demographics', 1, 0, TRUE),
(4, 'Parent Information', 'Caregiver details', 2, 0, TRUE),
(4, 'Chief Complaint', 'Reason for visit', 3, 0, TRUE),
(4, 'Development History', 'Growth and milestones', 4, 0, TRUE);

-- ============================================================================
-- 6. SECTION FIELDS DATA
-- ============================================================================

-- Chief Complaint fields (multiple sections have this)
INSERT INTO section_fields (section_id, field_type_id, field_name, field_label, is_required, sort_order, max_length) VALUES
(1, 2, 'chief_complaint', 'Chief Complaint', TRUE, 1, 500),
(1, 3, 'duration_days', 'Duration (days)', FALSE, 2, NULL),
(6, 2, 'chief_complaint', 'Chief Complaint', TRUE, 1, 500),
(11, 2, 'chief_complaint', 'Chief Complaint', TRUE, 1, 500);

-- HPI fields
INSERT INTO section_fields (section_id, field_type_id, field_name, field_label, is_required, sort_order, max_length) VALUES
(2, 2, 'hpi_details', 'History of Present Illness', TRUE, 1, 1000),
(2, 2, 'associated_symptoms', 'Associated Symptoms', FALSE, 2, 500);

-- Allergies fields
INSERT INTO section_fields (section_id, field_type_id, field_name, field_label, is_required, sort_order, max_length) VALUES
(3, 1, 'drug_allergies', 'Drug Allergies', FALSE, 1, 255),
(3, 1, 'food_allergies', 'Food Allergies', FALSE, 2, 255),
(3, 5, 'no_known_allergies', 'No Known Allergies', FALSE, 3, NULL);

-- Medications fields
INSERT INTO section_fields (section_id, field_type_id, field_name, field_label, is_required, sort_order, max_length) VALUES
(4, 2, 'current_medications', 'Current Medications', TRUE, 1, 1000),
(9, 2, 'current_medications', 'Current Medications', TRUE, 1, 1000);

-- Patient Demographics fields
INSERT INTO section_fields (section_id, field_type_id, field_name, field_label, is_required, sort_order, max_length) VALUES
(5, 1, 'patient_name', 'Full Name', TRUE, 1, 100),
(5, 4, 'date_of_birth', 'Date of Birth', TRUE, 2, NULL),
(5, 1, 'phone', 'Phone Number', TRUE, 3, 20);

-- Child Information fields
INSERT INTO section_fields (section_id, field_type_id, field_name, field_label, is_required, sort_order, max_length) VALUES
(13, 1, 'child_name', 'Child Full Name', TRUE, 1, 100),
(13, 4, 'child_dob', 'Date of Birth', TRUE, 2, NULL),
(13, 1, 'school', 'School/Daycare', FALSE, 3, 100);

-- Parent Information fields
INSERT INTO section_fields (section_id, field_type_id, field_name, field_label, is_required, sort_order, max_length) VALUES
(14, 1, 'parent_name', 'Parent/Guardian Name', TRUE, 1, 100),
(14, 1, 'parent_phone', 'Contact Number', TRUE, 2, 20),
(14, 1, 'relationship', 'Relationship to Child', TRUE, 3, 50);

-- ============================================================================
-- 7. VERIFICATION QUERY
-- ============================================================================
SELECT 
    t.name AS template_name,
    d.name AS domain_name,
    COUNT(DISTINCT ts.id) AS section_count,
    COUNT(sf.id) AS field_count
FROM templates t
LEFT JOIN domains d ON t.domain_id = d.id
LEFT JOIN template_sections ts ON t.id = ts.template_id
LEFT JOIN section_fields sf ON ts.id = sf.section_id
GROUP BY t.id, t.name, d.name
ORDER BY t.name;