-- ============================================================================
-- Scribe Customization Studio - Sample Data
-- ============================================================================

-- Clear existing data (in reverse order due to foreign keys)
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
ALTER TABLE field_validations AUTO_INCREMENT = 1;

-- ============================================================================
-- 1. USERS DATA
-- ============================================================================
INSERT INTO users (username, email, first_name, last_name, password_hash, role) VALUES
('admin', 'admin@scribe.com', 'System', 'Administrator', '$2b$10$example_hash_1', 'admin'),
('dr_smith', 'dr.smith@hospital.com', 'John', 'Smith', '$2b$10$example_hash_2', 'doctor'),
('nurse_jane', 'jane.doe@hospital.com', 'Jane', 'Doe', '$2b$10$example_hash_3', 'nurse'),
('user_test', 'test@example.com', 'Test', 'User', '$2b$10$example_hash_4', 'user');

-- ============================================================================
-- 2. DOMAINS DATA (Medical Specialties)
-- ============================================================================
INSERT INTO domains (name, description, color_code) VALUES
('General Medicine', 'General medical practice and primary care', '#007bff'),
('Cardiology', 'Heart and cardiovascular system', '#dc3545'),
('Pediatrics', 'Medical care for infants, children, and adolescents', '#28a745'),
('Orthopedics', 'Musculoskeletal system disorders', '#ffc107'),
('Neurology', 'Nervous system disorders', '#6f42c1'),
('Dermatology', 'Skin, hair, and nail conditions', '#fd7e14'),
('Psychiatry', 'Mental health and behavioral disorders', '#20c997'),
('Emergency Medicine', 'Acute care and emergency situations', '#e83e8c'),
('Comprehensive Care', 'Multi-specialty comprehensive assessment', '#6c757d'),
('Internal Medicine', 'Adult internal medicine', '#17a2b8');

-- ============================================================================
-- 3. FIELD TYPES DATA
-- ============================================================================
INSERT INTO field_types (type_name, display_name, html_input_type, validation_rules) VALUES
('text', 'Single Line Text', 'text', '{"maxLength": 255, "minLength": 0}'),
('textarea', 'Multi-line Text', 'textarea', '{"maxLength": 2000, "minLength": 0}'),
('number', 'Number', 'number', '{"min": 0, "max": 999999}'),
('date', 'Date', 'date', '{"format": "YYYY-MM-DD"}'),
('time', 'Time', 'time', '{"format": "HH:MM"}'),
('datetime', 'Date and Time', 'datetime-local', '{"format": "YYYY-MM-DDTHH:MM"}'),
('email', 'Email Address', 'email', '{"pattern": "^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$"}'),
('phone', 'Phone Number', 'tel', '{"pattern": "^[\\+]?[1-9][\\d]{0,15}$"}'),
('url', 'Website URL', 'url', '{"pattern": "^https?://"}'),
('checkbox', 'Checkbox', 'checkbox', '{}'),
('radio', 'Radio Button', 'radio', '{}'),
('dropdown', 'Dropdown Select', 'select', '{}'),
('multiselect', 'Multi-Select', 'select', '{"multiple": true}'),
('file', 'File Upload', 'file', '{"allowedTypes": ["pdf", "doc", "docx", "jpg", "png"]}'),
('password', 'Password', 'password', '{"minLength": 8}'),
('range', 'Range Slider', 'range', '{"min": 0, "max": 100, "step": 1}'),
('color', 'Color Picker', 'color', '{}'),
('hidden', 'Hidden Field', 'hidden', '{}');

-- ============================================================================
-- 4. TEMPLATES DATA (Based on your application data)
-- ============================================================================
INSERT INTO templates (name, description, domain_id, created_by, view_mode, show_hpi_bullets, show_headers, is_published, metadata) VALUES
-- Template 1: Basic Medical Form
(
    'Basic Medical Form',
    'Standard medical intake form for general practice',
    1, -- General Medicine
    1, -- admin
    'paragraph',
    FALSE,
    TRUE,
    TRUE,
    '{"exportFormat": "pdf", "allowPatientAccess": true}'
),

-- Template 2: Comprehensive Assessment
(
    'Comprehensive Assessment',
    'Complete patient assessment form for detailed evaluation',
    9, -- Comprehensive Care
    2, -- dr_smith
    'bullets',
    TRUE,
    TRUE,
    TRUE,
    '{"exportFormat": "pdf", "requiresSignature": true}'
),

-- Template 3: Cardiology Assessment
(
    'Cardiology Assessment',
    'Specialized cardiac evaluation form for heart conditions',
    2, -- Cardiology
    2, -- dr_smith
    'paragraph',
    FALSE,
    TRUE,
    TRUE,
    '{"exportFormat": "pdf", "ecgRequired": true}'
),

-- Template 4: Pediatric Intake
(
    'Pediatric Intake',
    'Child-specific medical form with parental information',
    3, -- Pediatrics
    3, -- nurse_jane
    'bullets',
    TRUE,
    TRUE,
    TRUE,
    '{"exportFormat": "pdf", "parentalConsentRequired": true}'
);

-- ============================================================================
-- 5. TEMPLATE SECTIONS DATA
-- ============================================================================

-- Sections for Template 1: Basic Medical Form
INSERT INTO template_sections (template_id, name, description, sort_order, nesting_level, is_required) VALUES
(1, 'Chief Complaint', 'Primary reason for the visit', 1, 0, TRUE),
(1, 'History of Present Illness (HPI)', 'Detailed history of current condition', 2, 0, TRUE),
(1, 'Allergies', 'Known allergies and reactions', 3, 0, FALSE),
(1, 'Current Medications', 'List of current medications and dosages', 4, 0, TRUE);

-- Sections for Template 2: Comprehensive Assessment
INSERT INTO template_sections (template_id, name, description, sort_order, nesting_level, is_required) VALUES
(2, 'Patient Demographics', 'Basic patient information', 1, 0, TRUE),
(2, 'Chief Complaint', 'Primary concern or symptom', 2, 0, TRUE),
(2, 'History of Present Illness', 'Detailed current illness history', 3, 0, TRUE),
(2, 'Past Medical History', 'Previous medical conditions and treatments', 4, 0, TRUE),
(2, 'Family History', 'Relevant family medical history', 5, 0, FALSE),
(2, 'Social History', 'Lifestyle factors and social determinants', 6, 0, FALSE),
(2, 'Medications', 'Current and recent medications', 7, 0, TRUE),
(2, 'Allergies and Adverse Reactions', 'Known allergies and intolerances', 8, 0, TRUE),
(2, 'Review of Systems', 'Systematic review of body systems', 9, 0, FALSE),
(2, 'Physical Examination', 'Clinical examination findings', 10, 0, TRUE),
(2, 'Assessment and Plan', 'Clinical assessment and treatment plan', 11, 0, TRUE);

-- Nested sections under Review of Systems for Template 2
INSERT INTO template_sections (template_id, parent_section_id, name, description, sort_order, nesting_level, is_required) VALUES
(2, 9, 'Cardiovascular', 'Heart and circulation symptoms', 1, 1, FALSE),
(2, 9, 'Respiratory', 'Breathing and lung symptoms', 2, 1, FALSE),
(2, 9, 'Gastrointestinal', 'Digestive system symptoms', 3, 1, FALSE),
(2, 9, 'Genitourinary', 'Kidney and reproductive symptoms', 4, 1, FALSE),
(2, 9, 'Neurological', 'Nervous system symptoms', 5, 1, FALSE),
(2, 9, 'Musculoskeletal', 'Muscle and joint symptoms', 6, 1, FALSE);

-- Sections for Template 3: Cardiology Assessment  
INSERT INTO template_sections (template_id, name, description, sort_order, nesting_level, is_required) VALUES
(3, 'Cardiac History', 'Previous heart conditions and interventions', 1, 0, TRUE),
(3, 'Current Symptoms', 'Present cardiac symptoms', 2, 0, TRUE),
(3, 'Risk Factors', 'Cardiovascular risk assessment', 3, 0, TRUE),
(3, 'Medications', 'Cardiac and other medications', 4, 0, TRUE),
(3, 'Physical Examination', 'Cardiovascular examination', 5, 0, TRUE),
(3, 'Diagnostic Tests', 'ECG, echo, and other cardiac tests', 6, 0, FALSE),
(3, 'Assessment and Plan', 'Cardiac assessment and management plan', 7, 0, TRUE);

-- Sections for Template 4: Pediatric Intake
INSERT INTO template_sections (template_id, name, description, sort_order, nesting_level, is_required) VALUES
(4, 'Child Information', 'Basic child demographics and information', 1, 0, TRUE),
(4, 'Parent/Guardian Information', 'Caregiver contact and relationship', 2, 0, TRUE),
(4, 'Chief Complaint', 'Reason for visit', 3, 0, TRUE),
(4, 'Birth and Development History', 'Pregnancy, birth, and developmental milestones', 4, 0, TRUE),
(4, 'Immunization History', 'Vaccination record', 5, 0, TRUE),
(4, 'Allergies', 'Known allergies and reactions', 6, 0, TRUE),
(4, 'Current Medications', 'Any medications the child is taking', 7, 0, FALSE),
(4, 'Family History', 'Relevant family medical history', 8, 0, FALSE),
(4, 'Social History', 'School, home environment, activities', 9, 0, FALSE);

-- ============================================================================
-- 6. SECTION FIELDS DATA
-- ============================================================================

-- Fields for Basic Medical Form - Chief Complaint (Section ID: 1)
INSERT INTO section_fields (section_id, field_type_id, field_name, field_label, placeholder_text, is_required, sort_order, max_length, help_text) VALUES
(1, 2, 'chief_complaint', 'Chief Complaint', 'Describe the main reason for today\'s visit', TRUE, 1, 500, 'Please be as specific as possible about the primary concern'),
(1, 3, 'duration_days', 'Duration (days)', 'Number of days', FALSE, 2, NULL, 'How many days has this been a concern?'),
(1, 11, 'severity', 'Pain/Severity Level', NULL, FALSE, 3, NULL, 'Rate severity from 1-10'),
(1, 10, 'affects_daily_life', 'Affects Daily Activities', NULL, FALSE, 4, NULL, 'Check if this condition affects your daily activities');

-- Fields for Basic Medical Form - HPI (Section ID: 2)
INSERT INTO section_fields (section_id, field_type_id, field_name, field_label, placeholder_text, is_required, sort_order, max_length, help_text) VALUES
(2, 2, 'hpi_details', 'History of Present Illness', 'Describe the history and progression of your current condition', TRUE, 1, 1000, 'Include timeline, triggers, what makes it better/worse'),
(2, 12, 'associated_symptoms', 'Associated Symptoms', NULL, FALSE, 2, NULL, 'Select any additional symptoms you are experiencing'),
(2, 2, 'previous_treatments', 'Previous Treatments', 'List any treatments you have tried', FALSE, 3, 500, 'Include medications, therapies, or other interventions');

-- Fields for Basic Medical Form - Allergies (Section ID: 3)
INSERT INTO section_fields (section_id, field_type_id, field_name, field_label, placeholder_text, is_required, sort_order, max_length, help_text) VALUES
(3, 1, 'drug_allergies', 'Drug Allergies', 'List any drug allergies', FALSE, 1, 255, 'Include the name of the medication and reaction'),
(3, 1, 'food_allergies', 'Food Allergies', 'List any food allergies', FALSE, 2, 255, 'Include specific foods and type of reaction'),
(3, 1, 'environmental_allergies', 'Environmental Allergies', 'List environmental allergies (pollen, dust, etc.)', FALSE, 3, 255, 'Include seasonal or year-round environmental allergies'),
(3, 10, 'no_known_allergies', 'No Known Allergies', NULL, FALSE, 4, NULL, 'Check if you have no known allergies');

-- Fields for Basic Medical Form - Medications (Section ID: 4)
INSERT INTO section_fields (section_id, field_type_id, field_name, field_label, placeholder_text, is_required, sort_order, max_length, help_text) VALUES
(4, 2, 'current_medications', 'Current Medications', 'List all current medications with dosages', TRUE, 1, 1000, 'Include prescription, over-the-counter, and supplements'),
(4, 2, 'medication_changes', 'Recent Medication Changes', 'Any recent changes to medications', FALSE, 2, 500, 'Include new medications, dosage changes, or discontinued medications');

-- Fields for Comprehensive Assessment - Patient Demographics (Section ID: 5)
INSERT INTO section_fields (section_id, field_type_id, field_name, field_label, placeholder_text, is_required, sort_order, max_length, help_text) VALUES
(5, 1, 'patient_name', 'Full Name', 'Patient\'s full legal name', TRUE, 1, 100, NULL),
(5, 4, 'date_of_birth', 'Date of Birth', NULL, TRUE, 2, NULL, NULL),
(5, 11, 'gender', 'Gender', NULL, TRUE, 3, NULL, 'Select gender identity'),
(5, 8, 'phone', 'Phone Number', 'Primary contact number', TRUE, 4, 20, NULL),
(5, 7, 'email', 'Email Address', 'Primary email address', FALSE, 5, 100, NULL),
(5, 2, 'address', 'Address', 'Full residential address', FALSE, 6, 300, NULL),
(5, 1, 'emergency_contact', 'Emergency Contact', 'Name and phone of emergency contact', TRUE, 7, 150, NULL);

-- Fields for Cardiology Assessment - Cardiac History (Section ID: 17)
INSERT INTO section_fields (section_id, field_type_id, field_name, field_label, placeholder_text, is_required, sort_order, max_length, help_text) VALUES
(17, 10, 'previous_heart_attack', 'Previous Heart Attack', NULL, FALSE, 1, NULL, 'Check if you have had a previous heart attack'),
(17, 10, 'heart_surgery', 'Previous Heart Surgery', NULL, FALSE, 2, NULL, 'Check if you have had any heart surgery'),
(17, 10, 'heart_catheterization', 'Previous Heart Catheterization', NULL, FALSE, 3, NULL, 'Check if you have had a heart catheterization'),
(17, 2, 'cardiac_history_details', 'Cardiac History Details', 'Provide details of any heart conditions', FALSE, 4, 500, 'Include dates and details of any cardiac events or procedures');

-- Fields for Pediatric Intake - Child Information (Section ID: 24)
INSERT INTO section_fields (section_id, field_type_id, field_name, field_label, placeholder_text, is_required, sort_order, max_length, help_text) VALUES
(24, 1, 'child_name', 'Child\'s Full Name', 'Child\'s full legal name', TRUE, 1, 100, NULL),
(24, 4, 'child_dob', 'Date of Birth', NULL, TRUE, 2, NULL, NULL),
(24, 11, 'child_gender', 'Gender', NULL, TRUE, 3, NULL, NULL),
(24, 1, 'school', 'School/Daycare', 'Name of school or daycare', FALSE, 4, 100, NULL),
(24, 1, 'grade', 'Grade Level', 'Current grade or age group', FALSE, 5, 20, NULL);

-- ============================================================================
-- 7. FIELD VALIDATIONS DATA
-- ============================================================================

-- Validations for required fields
INSERT INTO field_validations (field_id, validation_type, validation_value, error_message) VALUES
-- Chief complaint validations
(1, 'required', NULL, 'Chief complaint is required'),
(1, 'min_length', '10', 'Please provide more detail about your chief complaint'),

-- Patient name validations  
(16, 'required', NULL, 'Patient name is required'),
(16, 'min_length', '2', 'Name must be at least 2 characters'),

-- Date of birth validations
(17, 'required', NULL, 'Date of birth is required'),

-- Phone number validations
(19, 'required', NULL, 'Phone number is required'),
(19, 'pattern', '^[\+]?[1-9][\d]{0,15}$', 'Please enter a valid phone number'),

-- Email validations (where required)
(20, 'pattern', '^[\w\-\.]+@([\w-]+\.)+[\w-]{2,4}$', 'Please enter a valid email address');

-- ============================================================================
-- 8. UPDATE FIELD OPTIONS FOR DROPDOWN/SELECT FIELDS
-- ============================================================================

-- Update severity dropdown options
UPDATE section_fields 
SET field_options = JSON_OBJECT(
    'options', JSON_ARRAY(
        JSON_OBJECT('value', '1', 'label', '1 - Minimal'),
        JSON_OBJECT('value', '2', 'label', '2 - Mild'), 
        JSON_OBJECT('value', '3', 'label', '3 - Uncomfortable'),
        JSON_OBJECT('value', '4', 'label', '4 - Moderate'),
        JSON_OBJECT('value', '5', 'label', '5 - Distracting'),
        JSON_OBJECT('value', '6', 'label', '6 - Distressing'),
        JSON_OBJECT('value', '7', 'label', '7 - Unmanageable'),
        JSON_OBJECT('value', '8', 'label', '8 - Intense'),
        JSON_OBJECT('value', '9', 'label', '9 - Severe'),
        JSON_OBJECT('value', '10', 'label', '10 - Unable to move')
    )
)
WHERE field_name = 'severity';

-- Update gender dropdown options
UPDATE section_fields 
SET field_options = JSON_OBJECT(
    'options', JSON_ARRAY(
        JSON_OBJECT('value', 'male', 'label', 'Male'),
        JSON_OBJECT('value', 'female', 'label', 'Female'),
        JSON_OBJECT('value', 'non-binary', 'label', 'Non-binary'),
        JSON_OBJECT('value', 'prefer-not-to-say', 'label', 'Prefer not to say'),
        JSON_OBJECT('value', 'other', 'label', 'Other')
    )
)
WHERE field_name IN ('gender', 'child_gender');

-- Update associated symptoms multi-select options
UPDATE section_fields 
SET field_options = JSON_OBJECT(
    'options', JSON_ARRAY(
        JSON_OBJECT('value', 'fever', 'label', 'Fever'),
        JSON_OBJECT('value', 'nausea', 'label', 'Nausea'),
        JSON_OBJECT('value', 'vomiting', 'label', 'Vomiting'),
        JSON_OBJECT('value', 'headache', 'label', 'Headache'),
        JSON_OBJECT('value', 'dizziness', 'label', 'Dizziness'),
        JSON_OBJECT('value', 'fatigue', 'label', 'Fatigue'),
        JSON_OBJECT('value', 'shortness_of_breath', 'label', 'Shortness of breath'),
        JSON_OBJECT('value', 'chest_pain', 'label', 'Chest pain'),
        JSON_OBJECT('value', 'abdominal_pain', 'label', 'Abdominal pain'),
        JSON_OBJECT('value', 'back_pain', 'label', 'Back pain')
    )
)
WHERE field_name = 'associated_symptoms';

-- ============================================================================
-- 9. VERIFICATION QUERIES
-- ============================================================================

-- Show all templates with their section and field counts
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

-- Show template structure
SELECT 
    t.name AS template_name,
    ts.name AS section_name,
    ts.nesting_level,
    sf.field_name,
    ft.display_name AS field_type,
    sf.is_required
FROM templates t
LEFT JOIN template_sections ts ON t.id = ts.template_id
LEFT JOIN section_fields sf ON ts.id = sf.section_id
LEFT JOIN field_types ft ON sf.field_type_id = ft.id
ORDER BY t.name, ts.sort_order, sf.sort_order;

-- ============================================================================
-- END OF SAMPLE DATA
-- ============================================================================