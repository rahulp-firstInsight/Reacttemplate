import React, { useState, useEffect } from 'react';
import { GripVertical, Plus, Edit2, Trash2, X, Copy, RefreshCw } from 'lucide-react';
import { templateApi } from './api/templateApi';

const API_CONFIG = {
  // Default to localhost:8080 for live database connection
  BASE_URL: 'https://reacttemplateexpress.onrender.com',
  HEADERS: {
    'Content-Type': 'application/json'
  },
  ENDPOINTS: {
    GET_TEMPLATE: (id: string) => `/templates/${id}`,
    UPDATE_TEMPLATE: (id: string) => `/templates/${id}`
  }
} as const;

interface Field {
  id?: string;
  name: string;
  description?: string;
  dataType: string;
  length: string;
  required: boolean;
  repeated?: boolean;
  defaultValue?: string;
  dropdownOptions?: string;
}

interface Section {
  id: string;
  name: string;
  description: string;
  type: string;
  disabled?: boolean;
  fields: Field[];
  children?: Section[];
  parentId?: string;
}

interface Template {
  id: string;
  name: string;
  description: string;
  domain: string;
  created: string;
  sections: Section[];
}

function generateStandardJson(sections: Section[]): string {
  function mapSection(section: Section): any {
    return {
      SectionName: section.name,
      Section: (section.children || []).map(mapSection),
      ListFields: (section.fields || []).map(field => ({
        FieldName: field.name,
        FieldType: "string", // Always output "string" for FieldType
        required: field.required,
        description: field.description,
        defaultValue: field.defaultValue !== undefined ? field.defaultValue : "",
        Literals: field.dropdownOptions ? field.dropdownOptions.split(',').map(v => v.trim()) : []
      }))
    };
  }
  const standard = sections.filter(s => !s.parentId).map(mapSection);
  return JSON.stringify(standard, null, 2);
}

const MedicalFormBuilder = () => {
  const [viewMode, setViewMode] = useState('paragraph');
  const [showHPIBullets, setShowHPIBullets] = useState(false);
  const [showHeaders, setShowHeaders] = useState(true);
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [showFieldModal, setShowFieldModal] = useState(false);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [showJsonOutput, setShowJsonOutput] = useState(false);
  const [jsonOutput, setJsonOutput] = useState('');
  
  // Template management state
  const [currentScreen, setCurrentScreen] = useState<'templates' | 'builder'>('templates');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [currentTemplateId, setCurrentTemplateId] = useState<string | null>(null);
  
  // API state management
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  
  const [sections, setSections] = useState<Section[]>([
    {
      id: 'chief-complaint',
      name: 'Chief Complaint',
      description: '',
      type: 'section',
      fields: [],
      children: []
    },
    {
      id: 'hpi',
      name: 'HPI',
      description: '',
      type: 'section',
      fields: [],
      children: []
    },
    {
      id: 'allergies',
      name: 'Allergies',
      description: '',
      type: 'section',
      disabled: true,
      fields: [],
      children: []
    },
    {
      id: 'medications',
      name: 'Medications',
      description: '',
      type: 'section',
      fields: [],
      children: []
    }
  ]);

  const [sectionForm, setSectionForm] = useState({
    name: '',
    description: ''
  });

  const [fieldForm, setFieldForm] = useState({
    name: '',
    description: '',
    dataType: 'text',
    length: '',
    required: false,
    repeated: false,
    defaultValue: '',
    dropdownOptions: ''
  });

  // Drag and drop state
  const [draggedSection, setDraggedSection] = useState<string | null>(null);
  const [dragOverSection, setDragOverSection] = useState<string | null>(null);
  const [, setDragOperation] = useState<'move' | 'reorder' | null>(null);
  
  // Field drag and drop state
  const [draggedField, setDraggedField] = useState<{fieldIndex: number, sectionId: string} | null>(null);
  const [dragOverField, setDragOverField] = useState<string | null>(null);

  // API Functions
  const fetchTemplates = async () => {
    setIsLoading(true);
    setApiError(null);
    
    try {
      // Use live database API (port 8080)
      const templates = await templateApi.getTemplates();
      
      const mappedTemplates: Template[] = templates.map(t => ({
        id: t.id ?? `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: t.name ?? 'Unnamed Template',
        description: t.description ?? '',
        domain: t.domain ?? 'General Medicine',
        created: t.created ?? new Date().toISOString(),
        sections: (t.sections as Section[]) ?? []
      }));
      setTemplates(mappedTemplates);
      setLastFetched(new Date());
      
    } catch (error) {
      console.error('Error fetching templates:', error);
      
      // If API fails, fall back to mock data for development
      const mockTemplates: Template[] = [
        {
          id: 'template-1',
          name: 'Basic Medical Form',
          description: 'Standard medical intake form',
          domain: 'General Medicine',
          created: new Date().toISOString(),
          sections: [
            {
              id: 'chief-complaint',
              name: 'Chief Complaint',
              description: '',
              type: 'section',
              fields: [],
              children: []
            },
            {
              id: 'hpi',
              name: 'HPI',
              description: '',
              type: 'section',
              fields: [],
              children: []
            }
          ]
        },
        {
          id: 'template-2',
          name: 'Comprehensive Assessment',
          description: 'Complete patient assessment form',
          domain: 'Comprehensive Care',
          created: new Date().toISOString(),
          sections: [
            {
              id: 'allergies',
              name: 'Allergies',
              description: '',
              type: 'section',
              fields: [],
              children: []
            },
            {
              id: 'medications',
              name: 'Medications',
              description: '',
              type: 'section',
              fields: [],
              children: []
            }
          ]
        },
        {
          id: 'template-3',
          name: 'Cardiology Assessment',
          description: 'Specialized cardiac evaluation form',
          domain: 'Cardiology',
          created: new Date().toISOString(),
          sections: []
        },
        {
          id: 'template-4',
          name: 'Pediatric Intake',
          description: 'Child-specific medical form',
          domain: 'Pediatrics',
          created: new Date().toISOString(),
          sections: []
        }
      ];
      
      setTemplates(mockTemplates);
      setApiError(error instanceof Error ? error.message : 'Failed to fetch templates from API, showing mock data');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshTemplates = () => {
    fetchTemplates();
  };

  // Load templates on component mount
  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleAddSection = () => {
    if (sectionForm.name.trim()) {
      const newSection = {
        id: `section-${Date.now()}`,
        name: sectionForm.name,
        description: sectionForm.description,
        type: 'section',
        fields: [],
        children: []
      };
      setSections([...sections, newSection]);
      setSectionForm({ name: '', description: '' });
      setShowSectionModal(false);
    }
  };

  const handleAddCategory = (parentSectionId: string) => {
    const categoryName = prompt('Enter category name:');
    if (categoryName && categoryName.trim()) {
      const newCategory = {
        id: `category-${Date.now()}`,
        name: categoryName.trim(),
        description: '',
        type: 'section',
        fields: [],
        children: []
      };

      // Add category to the specified parent section
      const updatedSections = addCategoryToSection(sections, parentSectionId, newCategory);
      setSections(updatedSections);
    }
  };

  // Helper function to add category to any section (including nested ones)
  const addCategoryToSection = (sectionsList: Section[], parentSectionId: string, newCategory: Section): Section[] => {
    return sectionsList.map(section => {
      if (section.id === parentSectionId) {
        return {
          ...section,
          children: [...(section.children || []), newCategory]
        };
      }
      
      // Recursively check nested sections
      if (section.children && section.children.length > 0) {
        return {
          ...section,
          children: addCategoryToSection(section.children, parentSectionId, newCategory)
        };
      }
      
      return section;
    });
  };

  const handleRenameCategory = (categoryId: string) => {
    const category = findSectionById(sections, categoryId);
    if (!category) return;

    const newName = prompt('Enter new category name:', category.name);
    if (newName && newName.trim() && newName.trim() !== category.name) {
      const updatedSections = updateSectionName(sections, categoryId, newName.trim());
      setSections(updatedSections);
    }
  };

  // Helper function to find section by ID recursively
  const findSectionById = (sectionsList: Section[], targetId: string): Section | null => {
    for (const section of sectionsList) {
      if (section.id === targetId) return section;
      
      if (section.children && section.children.length > 0) {
        const found = findSectionById(section.children, targetId);
        if (found) return found;
      }
    }
    return null;
  };

  // Helper function to update section name recursively
  const updateSectionName = (sectionsList: Section[], targetId: string, newName: string): Section[] => {
    return sectionsList.map(section => {
      if (section.id === targetId) {
        return { ...section, name: newName };
      }
      
      if (section.children && section.children.length > 0) {
        return {
          ...section,
          children: updateSectionName(section.children, targetId, newName)
        };
      }
      
      return section;
    });
  };

  const handleAddField = () => {
    if (fieldForm.name.trim() && selectedSectionId) {
      const newField = {
        id: `field-${Date.now()}`,
        name: fieldForm.name,
        description: fieldForm.description,
        dataType: fieldForm.dataType,
        length: fieldForm.length,
        required: fieldForm.required,
        repeated: fieldForm.repeated || false,
        defaultValue: fieldForm.defaultValue || '',
        dropdownOptions: (fieldForm as any).dropdownOptions || ''
      };

      // Helper function to add field to any section recursively
      const addFieldToSection = (sectionsList: Section[]): Section[] => {
        return sectionsList.map(section => {
          if (section.id === selectedSectionId) {
            return {
              ...section,
              fields: [...(section.fields || []), newField]
            };
          }
          // Recursively check nested sections/categories
          if (section.children && section.children.length > 0) {
            return {
              ...section,
              children: addFieldToSection(section.children)
            };
          }
          return section;
        });
      };
      const newSections = addFieldToSection(sections);
      setSections(newSections);
      setFieldForm({ name: '', description: '', dataType: 'text', length: '', required: false, repeated: false, defaultValue: '', dropdownOptions: '' });
      setShowFieldModal(false);
      setSelectedSectionId(null);
      setEditingFieldId(null);
    }
  };

  // Save edited field
  const handleSaveEditField = () => {
    if (editingFieldId && selectedSectionId) {
      const updateFieldInSections = (sectionsList: Section[]): Section[] => {
        return sectionsList.map(section => {
          if (section.id === selectedSectionId) {
            return {
              ...section,
              fields: section.fields.map(field =>
                field.id === editingFieldId ? { ...field, ...fieldForm } : field
              )
            };
          }
          // Recursively check nested sections/categories
          if (section.children && section.children.length > 0) {
            return {
              ...section,
              children: updateFieldInSections(section.children)
            };
          }
          return section;
        });
      };
      const updatedSections = updateFieldInSections(sections);
      setSections(updatedSections);
      setShowFieldModal(false);
      setEditingFieldId(null);
      setSelectedSectionId(null);
      setFieldForm({ name: '', description: '', dataType: 'text', length: '', required: false, repeated: false, defaultValue: '', dropdownOptions: '' });
    }
  };


  const handleSave = async () => {
    console.log('🔄 Starting configuration save process...');
    
    // Create comprehensive configuration object
    const result = {
      viewMode: viewMode,
      showHPIBullets: showHPIBullets,
      showHeaders: showHeaders,
      sections: sections,
      generatedAt: new Date().toISOString(),
      version: '1.0',
      templateId: currentTemplateId,
      templateName: currentTemplateId ? templates.find(t => t.id === currentTemplateId)?.name : 'New Template',
      metadata: {
        totalSections: sections.length,
        totalFields: sections.reduce((total, section) => {
          return total + (section.fields?.length || 0) + 
                 (section.children?.reduce((childTotal, child) => childTotal + (child.fields?.length || 0), 0) || 0);
        }, 0),
        lastModified: new Date().toISOString(),
        configurationSource: 'Scribe Customization Studio'
      }
    };
    
    try {
      const jsonString = JSON.stringify(result, null, 2);
      setJsonOutput(jsonString);
      // setShowJsonOutput(true); // Modal will not open automatically
      console.log('✅ Configuration JSON generated:', jsonString);

      // Always try to save configuration to database if we have a current template
      if (currentTemplateId) {
        console.log('💾 Saving configuration to live database...');
        await saveConfigurationToDatabase(result);
        console.log('✅ Configuration saved to database successfully!');
      } else {
        console.warn('⚠️ No template ID available - configuration generated but not saved to database');
        
        // Show warning message for unsaved templates
        const warningDiv = document.createElement('div');
        warningDiv.className = 'alert alert-warning position-fixed';
        warningDiv.style.cssText = 'top: 20px; right: 20px; z-index: 1000; animation: fadeIn 0.3s ease-in';
        warningDiv.innerHTML = '⚠️ Configuration generated but not saved to database. Please save the template first.';
        document.body.appendChild(warningDiv);
        
        setTimeout(() => {
          warningDiv.remove();
        }, 5000);
      }
    } catch (error) {
      console.error('❌ Error in configuration save process:', error);
      
      // Show detailed error message
      const errorDiv = document.createElement('div');
      errorDiv.className = 'alert alert-danger position-fixed';
      errorDiv.style.cssText = 'top: 20px; right: 20px; z-index: 1000; animation: fadeIn 0.3s ease-in';
      errorDiv.innerHTML = `❌ Error saving configuration: ${error instanceof Error ? error.message : 'Unknown error'}`;
      document.body.appendChild(errorDiv);
      
      setTimeout(() => {
        errorDiv.remove();
      }, 7000);
    }
  };

  // Load configuration JSON from database metadata
  const loadConfigurationFromDatabase = async (templateId: string) => {
    console.log('📥 Loading configuration from live database for template:', templateId);
    
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/templates/${templateId}/configuration`);
      
      if (!response.ok) {
        console.warn('⚠️ No saved configuration found for template:', templateId);
        return null;
      }
      
      const result = await response.json();
      console.log('✅ Configuration loaded from database:', result);
      
      // Extract configuration data
      const config = result.configuration || result;
      
      if (config) {
        // Apply configuration to form state
        if (config.viewMode) setViewMode(config.viewMode);
        if (config.showHPIBullets !== undefined) setShowHPIBullets(config.showHPIBullets);
        if (config.showHeaders !== undefined) setShowHeaders(config.showHeaders);
        if (config.sections && config.sections.length > 0) {
          setSections(config.sections);
          console.log('📋 Restored sections from configuration:', config.sections.length);
        }
        
        // Show success message
        const successDiv = document.createElement('div');
        successDiv.className = 'alert alert-info position-fixed';
        successDiv.style.cssText = 'top: 20px; right: 20px; z-index: 1000; animation: fadeIn 0.3s ease-in';
        successDiv.innerHTML = `📥 Previous configuration loaded! (Generated: ${config.generatedAt ? new Date(config.generatedAt).toLocaleString() : 'Unknown'})`;
        document.body.appendChild(successDiv);
        
        setTimeout(() => {
          successDiv.remove();
        }, 4000);
        
        return config;
      }
      
    } catch (error) {
      console.warn('⚠️ Error loading configuration from database:', error);
      return null;
    }
  };

  // Save configuration JSON to database metadata
  const saveConfigurationToDatabase = async (configurationData: any) => {
    console.log('💾 Attempting to save configuration to live database...');
    console.log('Current Template ID:', currentTemplateId);
    console.log('Configuration Data:', configurationData);
    
    if (!currentTemplateId) {
      console.warn('❌ No template ID available - cannot save to database');
      
      // Show warning message
      const warningDiv = document.createElement('div');
      warningDiv.className = 'alert alert-warning position-fixed';
      warningDiv.style.cssText = 'top: 20px; right: 20px; z-index: 1000; animation: fadeIn 0.3s ease-in';
      warningDiv.innerHTML = '⚠️ Please save template first to store configuration in database';
      document.body.appendChild(warningDiv);
      
      setTimeout(() => {
        warningDiv.remove();
      }, 5000);
      return;
    }
    
    try {
      // Save configuration to live database using the configuration endpoint
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/templates/${currentTemplateId}/configuration`, {
        method: 'PUT',
        headers: API_CONFIG.HEADERS,
        body: JSON.stringify({
          configuration: configurationData
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Configuration saved to live database successfully:', result);
      
      // Show success message
      const successDiv = document.createElement('div');
      successDiv.className = 'alert alert-success position-fixed';
      successDiv.style.cssText = 'top: 20px; right: 20px; z-index: 1000; animation: fadeIn 0.3s ease-in';
      successDiv.innerHTML = `✅ Configuration saved to database! (Template ID: ${currentTemplateId})`;
      document.body.appendChild(successDiv);
      
      setTimeout(() => {
        successDiv.remove();
      }, 3000);

    } catch (error) {
      console.error('❌ Error saving configuration to database:', error);
      
      // Check if it's a network error vs actual save failure
      let errorMessage = '❌ Failed to save configuration to database.';
      if (error instanceof Error) {
        if (error.message.includes('fetch') || error.message.includes('network')) {
          errorMessage = '🌐 Network error - check if server is running on port 8080';
        } else if (error.message.includes('HTTP error! status: 500')) {
          errorMessage = '🗄️ Database error - check server logs for details';
        } else {
          errorMessage = `❌ Save error: ${error.message}`;
        }
      }
      
      // Show detailed error message
      const errorDiv = document.createElement('div');
      errorDiv.className = 'alert alert-warning position-fixed';
      errorDiv.style.cssText = 'top: 20px; right: 20px; z-index: 1000; animation: fadeIn 0.3s ease-in; max-width: 400px;';
      errorDiv.innerHTML = `
        ${errorMessage}
        <br><small>💡 Try: 1) Check server is running 2) Refresh page 3) Try saving again</small>
      `;
      document.body.appendChild(errorDiv);
      
      setTimeout(() => {
        errorDiv.remove();
      }, 7000);
    }
  };

  const deleteSection = (sectionId: string) => {
    // Remove from top-level sections
    let updatedSections = sections.filter(s => s.id !== sectionId);
    
    // Remove from nested sections
    updatedSections = updatedSections.map(section => ({
      ...section,
      children: section.children ? section.children.filter(child => child.id !== sectionId) : []
    }));
    
    setSections(updatedSections);
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, sectionId: string) => {
    console.log('🔄 Section drag started:', sectionId);
    e.stopPropagation();
    setDraggedSection(sectionId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', sectionId);
    // Add visual feedback
    e.dataTransfer.setDragImage(e.currentTarget as Element, 0, 0);
  };

  const handleDragEnd = () => {
    setDraggedSection(null);
    setDragOverSection(null);
    setDragOperation(null);
  };

  const handleDragOver = (e: React.DragEvent, sectionId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedSection && draggedSection !== sectionId) {
      console.log('🎯 Section drag over:', sectionId);
      e.dataTransfer.dropEffect = 'move';
      setDragOverSection(sectionId);
      
      // Determine operation type for visual feedback
      const findSectionWithParent = (sectionsList: Section[], targetId: string, parentId: string | null = null): { section: Section | null, parent: Section | null } => {
        for (const section of sectionsList) {
          if (section.id === targetId) {
            return { section, parent: parentId ? sectionsList.find(s => s.id === parentId) || null : null };
          }
          if (section.children && section.children.length > 0) {
            const found = findSectionWithParent(section.children, targetId, section.id);
            if (found.section) {
              return { section: found.section, parent: section };
            }
          }
        }
        return { section: null, parent: null };
      };
      
      const draggedInfo = findSectionWithParent(sections, draggedSection);
      const targetInfo = findSectionWithParent(sections, sectionId);
      const sameParent = draggedInfo.parent?.id === targetInfo.parent?.id;
      
      setDragOperation(sameParent ? 'reorder' : 'move');
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.stopPropagation();
    // Only clear drag over if we're actually leaving the section area
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const isLeavingElement = (
      e.clientX < rect.left || 
      e.clientX > rect.right || 
      e.clientY < rect.top || 
      e.clientY > rect.bottom
    );
    
    if (isLeavingElement) {
      setDragOverSection(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetSectionId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('🔄 Section drop triggered:', { draggedSection, targetSectionId });
    
    if (!draggedSection || draggedSection === targetSectionId) {
      setDraggedSection(null);
      setDragOverSection(null);
      return;
    }

    // Helper function to find a section and its parent recursively
    const findSectionWithParent = (sectionsList: Section[], targetId: string, parentId: string | null = null): { section: Section | null, parent: Section | null } => {
      for (const section of sectionsList) {
        if (section.id === targetId) {
          return { section, parent: parentId ? sectionsList.find(s => s.id === parentId) || null : null };
        }
        if (section.children && section.children.length > 0) {
          const found = findSectionWithParent(section.children, targetId, section.id);
          if (found.section) {
            return { section: found.section, parent: section };
          }
        }
      }
      return { section: null, parent: null };
    };

    // Find dragged section and target section with their parents
    const draggedInfo = findSectionWithParent(sections, draggedSection);
    const targetInfo = findSectionWithParent(sections, targetSectionId);

    if (!draggedInfo.section) {
      console.warn('⚠️ Could not find dragged section:', draggedSection);
      setDraggedSection(null);
      setDragOverSection(null);
      return;
    }

    // Check if we're reordering within the same parent
    const sameParent = draggedInfo.parent?.id === targetInfo.parent?.id;
    
    if (sameParent && draggedInfo.parent) {
      console.log(`🔄 Reordering "${draggedInfo.section.name}" within parent "${draggedInfo.parent.name}"`);
      
      // Reorder within the same parent
      const updatedSections = sections.map(section => {
        if (section.id === draggedInfo.parent!.id) {
          const children = [...(section.children || [])];
          const draggedIndex = children.findIndex(child => child.id === draggedSection);
          const targetIndex = children.findIndex(child => child.id === targetSectionId);
          
          if (draggedIndex !== -1 && targetIndex !== -1) {
            // Remove dragged item
            const [draggedItem] = children.splice(draggedIndex, 1);
            // Insert at target position
            children.splice(targetIndex, 0, draggedItem);
          }
          
          return { ...section, children };
        } else if (section.children) {
          // Also check nested sections
          return {
            ...section,
            children: section.children.map(child => {
              if (child.id === draggedInfo.parent!.id) {
                const subChildren = [...(child.children || [])];
                const draggedIndex = subChildren.findIndex(subChild => subChild.id === draggedSection);
                const targetIndex = subChildren.findIndex(subChild => subChild.id === targetSectionId);
                
                if (draggedIndex !== -1 && targetIndex !== -1) {
                  const [draggedItem] = subChildren.splice(draggedIndex, 1);
                  subChildren.splice(targetIndex, 0, draggedItem);
                }
                
                return { ...child, children: subChildren };
              }
              return child;
            })
          };
        }
        return section;
      });
      
      setSections(updatedSections);
      
      // Show success message for reordering
      const successDiv = document.createElement('div');
      successDiv.className = 'alert alert-info position-fixed';
      successDiv.style.cssText = 'top: 20px; right: 20px; z-index: 1000; animation: fadeIn 0.3s ease-in';
      successDiv.innerHTML = `🔄 "${draggedInfo.section.name}" reordered within "${draggedInfo.parent.name}"!`;
      document.body.appendChild(successDiv);
      
      setTimeout(() => {
        successDiv.remove();
      }, 2500);
      
    } else {
      // Moving to a different parent (existing functionality)
      console.log(`🔄 Moving "${draggedInfo.section.name}" to be child of "${targetSectionId}"`);
      
      // Helper function to find and remove a section recursively
      const findAndRemoveSection = (sectionsList: Section[], targetId: string): { updatedSections: Section[], removedSection: Section | null } => {
        let removedSection: Section | null = null;
        
        const updateSections = (sections: Section[]): Section[] => {
          return sections.reduce((acc: Section[], section) => {
            if (section.id === targetId) {
              removedSection = section;
              return acc; // Don't include this section
            } else if (section.children && section.children.length > 0) {
              const filteredChildren = updateSections(section.children);
              return [...acc, { ...section, children: filteredChildren }];
            } else {
              return [...acc, section];
            }
          }, []);
        };
        
        return { updatedSections: updateSections(sectionsList), removedSection };
      };

      // Helper function to add a section as a child to any section recursively
      const addSectionAsChild = (sectionsList: Section[], parentId: string, newSection: Section): Section[] => {
        return sectionsList.map(section => {
          if (section.id === parentId) {
            return {
              ...section,
              children: [...(section.children || []), { ...newSection, parentId: parentId }]
            };
          } else if (section.children && section.children.length > 0) {
            return {
              ...section,
              children: addSectionAsChild(section.children, parentId, newSection)
            };
          }
          return section;
        });
      };

      // Find and remove the dragged section
      const { updatedSections: sectionsAfterRemoval, removedSection } = findAndRemoveSection(sections, draggedSection);
      
      if (!removedSection) {
        console.warn('⚠️ Could not find dragged section:', draggedSection);
        setDraggedSection(null);
        setDragOverSection(null);
        return;
      }

      // Add the section as a child to the target section
      const finalSections = addSectionAsChild(sectionsAfterRemoval, targetSectionId, removedSection);
      
      setSections(finalSections);

      // Show success message for moving
      const successDiv = document.createElement('div');
      successDiv.className = 'alert alert-success position-fixed';
      successDiv.style.cssText = 'top: 20px; right: 20px; z-index: 1000; animation: fadeIn 0.3s ease-in';
      successDiv.innerHTML = `✅ "${removedSection.name}" moved successfully!`;
      document.body.appendChild(successDiv);
      
      setTimeout(() => {
        successDiv.remove();
      }, 2500);
    }
    
    setDraggedSection(null);
    setDragOverSection(null);
    setDragOperation(null);
  };

  const handleDropOutside = (e: React.DragEvent) => {
    e.preventDefault();
    
    if (!draggedSection) return;

    console.log('🔄 Section dropped outside - promoting to top level:', draggedSection);

    // Helper function to find and remove a section recursively
    const findAndRemoveSection = (sectionsList: Section[], targetId: string): { updatedSections: Section[], removedSection: Section | null } => {
      let removedSection: Section | null = null;
      
      const updateSections = (sections: Section[]): Section[] => {
        return sections.reduce((acc: Section[], section) => {
          if (section.id === targetId) {
            removedSection = section;
            return acc; // Don't include this section
          } else if (section.children && section.children.length > 0) {
            const filteredChildren = updateSections(section.children);
            return [...acc, { ...section, children: filteredChildren }];
          } else {
            return [...acc, section];
          }
        }, []);
      };
      
      return { updatedSections: updateSections(sectionsList), removedSection };
    };

    // Find and remove the dragged section
    const { updatedSections, removedSection } = findAndRemoveSection(sections, draggedSection);
    
    if (removedSection) {
      // Add as top-level section (remove parentId)
      const { parentId, ...sectionWithoutParent } = removedSection;
      const finalSections = [...updatedSections, sectionWithoutParent];
      setSections(finalSections);
      
      // Show success message
      const successDiv = document.createElement('div');
      successDiv.className = 'alert alert-info position-fixed';
      successDiv.style.cssText = 'top: 20px; right: 20px; z-index: 1000; animation: fadeIn 0.3s ease-in';
      successDiv.innerHTML = `📈 "${removedSection.name}" promoted to main category!`;
      document.body.appendChild(successDiv);
      
      setTimeout(() => {
        successDiv.remove();
      }, 2500);
    }

    setDraggedSection(null);
    setDragOverSection(null);
    setDragOperation(null);
  };

  // Template management functions
  const handleEditTemplate = async (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setCurrentTemplateId(templateId);
      
      // First set the template sections as fallback
      setSections(template.sections);
      setCurrentScreen('builder');
      
      // Then try to load saved configuration from database
      console.log('🔄 Loading saved configuration for template:', templateId);
      try {
        const savedConfig = await loadConfigurationFromDatabase(templateId);
        if (!savedConfig) {
          console.log('ℹ️ No saved configuration found, using template default sections');
        }
      } catch (error) {
        console.warn('⚠️ Failed to load saved configuration, using template sections:', error);
      }
    }
  };

  const handleCopyTemplate = async (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      try {
        const newTemplate = {
          ...template,
          id: undefined, // Let the API assign a new ID
          name: `${template.name} (Copy)`,
          created: new Date().toISOString()
        };
        
        // Create the template in live database
        const createdTemplate = await templateApi.createTemplate(newTemplate);
        
        // Ensure the created template conforms to our Template type (id must be a string)
        const templateToAdd: Template = {
          id: (createdTemplate.id ?? `template-${Date.now()}`).toString(),
          name: createdTemplate.name ?? newTemplate.name,
          description: createdTemplate.description ?? '',
          domain: createdTemplate.domain ?? 'General Medicine',
          created: createdTemplate.created ?? new Date().toISOString(),
          sections: (createdTemplate.sections as Section[]) ?? []
        };
        
        // Update local state
        setTemplates([...templates, templateToAdd]);
        
        // Show success message
        const successDiv = document.createElement('div');
        successDiv.className = 'alert alert-success position-fixed';
        successDiv.style.cssText = 'top: 20px; right: 20px; z-index: 1000; animation: fadeIn 0.3s ease-in';
        successDiv.innerHTML = `✅ Template copied successfully!`;
        document.body.appendChild(successDiv);
        
        setTimeout(() => {
          successDiv.remove();
        }, 3000);
      } catch (error) {
        console.error('Error copying template:', error);
        
        // Show error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'alert alert-danger position-fixed';
        errorDiv.style.cssText = 'top: 20px; right: 20px; z-index: 1000; animation: fadeIn 0.3s ease-in';
        errorDiv.innerHTML = '❌ Failed to copy template. Check console for details.';
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
          errorDiv.remove();
        }, 5000);
      }
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      // Delete the template from live database
      await templateApi.deleteTemplate(templateId);
      
      // Update local state
      setTemplates(templates.filter(t => t.id !== templateId));
      
      // Show success message
      const successDiv = document.createElement('div');
      successDiv.className = 'alert alert-success position-fixed';
      successDiv.style.cssText = 'top: 20px; right: 20px; z-index: 1000; animation: fadeIn 0.3s ease-in';
      successDiv.innerHTML = `✅ Template deleted successfully!`;
      document.body.appendChild(successDiv);
      
      setTimeout(() => {
        successDiv.remove();
      }, 3000);
    } catch (error) {
      console.error('Error deleting template:', error);
      
      // Show error message
      const errorDiv = document.createElement('div');
      errorDiv.className = 'alert alert-danger position-fixed';
      errorDiv.style.cssText = 'top: 20px; right: 20px; z-index: 1000; animation: fadeIn 0.3s ease-in';
      errorDiv.innerHTML = '❌ Failed to delete template. Check console for details.';
      document.body.appendChild(errorDiv);
      
      setTimeout(() => {
        errorDiv.remove();
      }, 5000);
    }
  };



  const handleCreateNewTemplate = () => {
    setCurrentTemplateId(null);
    setSections([
      {
        id: 'chief-complaint',
        name: 'Chief Complaint',
        description: '',
        type: 'section',
        fields: [],
        children: []
      },
      {
        id: 'hpi',
        name: 'HPI',
        description: '',
        type: 'section',
        fields: [],
        children: []
      }
    ]);
    setCurrentScreen('builder');
  };

  const handleSaveTemplate = async (templateName: string) => {
    try {
      // Generate configuration JSON for metadata
      const configurationData = {
        viewMode: viewMode,
        showHPIBullets: showHPIBullets,
        showHeaders: showHeaders,
        sections: sections,
        generatedAt: new Date().toISOString(),
        version: '1.0',
        templateName: templateName
      };

      const templateData = {
        name: templateName,
        description: '',
        domain: 'General Medicine',
        sections: sections,
        viewMode: viewMode,
        showHPIBullets: showHPIBullets,
        showHeaders: showHeaders,
        metadata: {
          configuration: configurationData,
          exportFormat: 'pdf',
          allowPatientAccess: true
        }
      };

      if (currentTemplateId) {
        // Update existing template using templateApi instead of direct fetch
        //const updatedTemplate = await templateApi.updateTemplate(currentTemplateId, templateData);

        // Update local state
        setTemplates(templates.map(t => 
          t.id === currentTemplateId 
            ? { ...t, name: templateName, sections: sections }
            : t
        ));
      } else {
        // Create new template using templateApi instead of direct fetch
        const createdTemplate = await templateApi.createTemplate(templateData);
        
        console.log('✅ New template created with ID:', createdTemplate.id);
        
        // Set the current template ID to the newly created template
        setCurrentTemplateId((createdTemplate.id ?? `template-${Date.now()}`).toString());
        
        // Add new template to local state
        const newTemplate = {
          id: createdTemplate.id?.toString() ?? `template-${Date.now()}`,
          name: templateName,
          description: '',
          domain: 'General Medicine',
          created: new Date().toISOString(),
          sections: sections
        };
        setTemplates([...templates, newTemplate]);
      }
      
      // Refresh templates from server to get latest data
      await fetchTemplates();
      
      // Auto-save configuration to database now that we have a template ID
      if (currentTemplateId) {
        console.log('🔄 Auto-saving configuration after template save...');
        const configurationData = {
          viewMode: viewMode,
          showHPIBullets: showHPIBullets,
          showHeaders: showHeaders,
          sections: sections,
          generatedAt: new Date().toISOString(),
          version: '1.0',
          templateName: templateName
        };
        await saveConfigurationToDatabase(configurationData);
      }
      
      setCurrentScreen('templates');
      
      // Show success message
      alert(`✅ Template "${templateName}" saved successfully!\n📊 Configuration JSON has been stored in database metadata.`);
      
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Failed to save template. Please try again.');
    }
  };

  const handleBackToTemplates = () => {
    setCurrentScreen('templates');
    setCurrentTemplateId(null);
  };

  // Field drag and drop handlers
  const handleFieldDragStart = (e: React.DragEvent, fieldIndex: number, sectionId: string) => {
    // Helper function to find section recursively
    const findSectionRecursive = (sectionsList: Section[], targetId: string): Section | null => {
      for (const section of sectionsList) {
        if (section.id === targetId) return section;
        if (section.children) {
          const found = findSectionRecursive(section.children, targetId);
          if (found) return found;
        }
      }
      return null;
    };
    
    const section = findSectionRecursive(sections, sectionId);
    const fieldName = section?.fields[fieldIndex]?.name || 'Unknown';
    
    console.log('🔄 Field drag started:', { 
      fieldIndex, 
      sectionId, 
      sectionName: section?.name,
      fieldName,
      isCategory: section?.children && section.children.length > 0
    });
    
    setDraggedField({ fieldIndex, sectionId });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/x-field', `${sectionId}-${fieldIndex}`);
    e.stopPropagation(); // Prevent section drag
  };

  const handleFieldDragOver = (e: React.DragEvent, targetSectionId: string) => {
    console.log('Field drag over section:', targetSectionId);
    e.preventDefault();
    e.stopPropagation();
    if (draggedField) {
      e.dataTransfer.dropEffect = 'move';
      // Only set dragOverField if dragging over empty field area (not individual fields)
      if (!dragOverField || !dragOverField.includes('-')) {
        setDragOverField(targetSectionId);
      }
    }
  };

  const handleFieldDragLeave = (e: React.DragEvent) => {
    e.stopPropagation();
    setDragOverField(null);
  };

  const handleFieldDrop = (e: React.DragEvent, targetSectionId: string, targetFieldIndex?: number) => {
    console.log('Field drop triggered:', { draggedField, targetSectionId, targetFieldIndex });
    e.preventDefault();
    e.stopPropagation();
    
    if (!draggedField) return;

    const { fieldIndex, sectionId: sourceSectionId } = draggedField;

    // Helper function to find a section by ID recursively
    const findSection = (sectionsList: Section[], sectionId: string): Section | null => {
      for (const section of sectionsList) {
        if (section.id === sectionId) return section;
        if (section.children) {
          const found = findSection(section.children, sectionId);
          if (found) return found;
        }
      }
      return null;
    };

    // Helper function to remove field from any section recursively
    const removeFieldFromSection = (sectionsList: Section[], sourceSectionId: string, fieldIndex: number): { updatedSections: Section[], removedField: any } => {
      let removedField = null;
      
      const updateSections = (sections: Section[]): Section[] => {
        return sections.map(section => {
          if (section.id === sourceSectionId) {
            removedField = section.fields[fieldIndex];
            return { 
              ...section, 
              fields: section.fields.filter((_, index) => index !== fieldIndex) 
            };
          } else if (section.children) {
            return { 
              ...section, 
              children: updateSections(section.children) 
            };
          }
          return section;
        });
      };
      
      return { updatedSections: updateSections(sectionsList), removedField };
    };

    // Helper function to add field to any section recursively
    const addFieldToSection = (sectionsList: Section[], targetSectionId: string, field: any, targetFieldIndex?: number): Section[] => {
      return sectionsList.map(section => {
        if (section.id === targetSectionId) {
          const newFields = [...section.fields];
          const insertIndex = targetFieldIndex !== undefined ? targetFieldIndex : newFields.length;
          newFields.splice(insertIndex, 0, field);
          return { ...section, fields: newFields };
        } else if (section.children) {
          return { 
            ...section, 
            children: addFieldToSection(section.children, targetSectionId, field, targetFieldIndex) 
          };
        }
        return section;
      });
    };

    // Find the source section and get the field to move
    const sourceSection = findSection(sections, sourceSectionId);
    if (!sourceSection || !sourceSection.fields[fieldIndex]) {
      setDraggedField(null);
      setDragOverField(null);
      return;
    }

    const fieldToMove = sourceSection.fields[fieldIndex];

    // If dropping within the same section, handle reordering
    if (sourceSectionId === targetSectionId && targetFieldIndex !== undefined) {
      const updateSectionsForReorder = (sectionsList: Section[]): Section[] => {
        return sectionsList.map(section => {
          if (section.id === sourceSectionId) {
            const newFields = [...section.fields];
            // Remove the field from its current position
            newFields.splice(fieldIndex, 1);
            // Insert it at the new position
            const insertIndex = targetFieldIndex > fieldIndex ? targetFieldIndex - 1 : targetFieldIndex;
            newFields.splice(insertIndex, 0, fieldToMove);
            return { ...section, fields: newFields };
          } else if (section.children) {
            return { ...section, children: updateSectionsForReorder(section.children) };
          }
          return section;
        });
      };

      const updatedSections = updateSectionsForReorder(sections);
      setSections(updatedSections);
    } else {
      // Moving between different sections (including categories and subcategories)
      console.log(`Moving field "${fieldToMove.name}" from section "${sourceSectionId}" to section "${targetSectionId}"`);
      
      // First remove the field from source section
      const { updatedSections: sectionsAfterRemoval, removedField } = removeFieldFromSection(sections, sourceSectionId, fieldIndex);
      
      if (removedField) {
        // Then add it to the target section
        const finalSections = addFieldToSection(sectionsAfterRemoval, targetSectionId, removedField, targetFieldIndex);
        setSections(finalSections);
        
        // Show success message
        const successDiv = document.createElement('div');
        successDiv.className = 'alert alert-success position-fixed';
        successDiv.style.cssText = 'top: 20px; right: 20px; z-index: 1000; animation: fadeIn 0.3s ease-in';
        successDiv.innerHTML = `✅ Field "${removedField.name}" moved successfully!`;
        document.body.appendChild(successDiv);
        
        setTimeout(() => {
          successDiv.remove();
        }, 2000);
      }
    }
    
    setDraggedField(null);
    setDragOverField(null);
  };

  // Recursive section rendering component
  const renderSection = (section: Section, level: number = 0) => {
    const isDragging = draggedSection === section.id;
    const isDropTarget = dragOverSection === section.id;
    
    return (
      <div key={section.id}>
        <div
          onDragOver={(e) => handleDragOver(e, section.id)}
          onDragLeave={(e) => handleDragLeave(e)}
          onDrop={(e) => handleDrop(e, section.id)}
          className={`
            border rounded-2 p-3 mb-2 drag-target
            ${isDropTarget ? 'drag-over' : 'border-light-subtle'}
            ${section.disabled ? 'bg-light opacity-50' : 'bg-white'}
            ${isDragging ? 'drag-ghost' : ''}
          `}
          style={{
            marginLeft: `${level * 20}px`
          }}
        >
          <div className="d-flex align-items-center gap-2 mb-3">
            {!section.disabled && (
              <div
                draggable={true}
                onDragStart={(e) => handleDragStart(e, section.id)}
                onDragEnd={handleDragEnd}
                className="p-1 d-flex align-items-center justify-content-center drag-handle"
                title="Drag to reorder"
              >
                <GripVertical size={16} className="text-muted" />
              </div>
            )}
            <div className="d-flex align-items-center justify-content-center bg-primary text-white rounded-circle fw-bold" 
                 style={{ width: '20px', height: '20px', fontSize: '12px' }}>
              ●
            </div>
            <span 
              className="text-primary fw-medium flex-fill"
              onClick={() => level > 0 ? handleRenameCategory(section.id) : null}
              style={{ 
                cursor: level > 0 ? 'pointer' : 'default',
                textDecoration: level > 0 ? 'underline' : 'none'
              }}
              title={level > 0 ? 'Click to rename category' : ''}
            >
              {level > 0 && "📁 "}{section.name}
            </span>
            {level > 0 && (
              <span className="badge bg-success rounded-pill fs-6">
                Category
              </span>
            )}
            {!section.disabled && (
              <>
                <button
                  onClick={() => handleAddCategory(section.id)}
                  className="btn btn-link text-success p-0 text-nowrap me-2"
                  title={`Add a new category within this ${level === 0 ? 'section' : 'category'}`}
                >
                  + Add {level === 0 ? 'Category' : 'Subcategory'}
                </button>
                <button
                  onClick={() => {
                    setSelectedSectionId(section.id);
                    setShowFieldModal(true);
                  }}
                  className="btn btn-link text-primary p-0 text-nowrap"
                >
                  + Add Field
                </button>
                <button
                  onClick={() => deleteSection(section.id)}
                  className="btn btn-link text-danger p-0"
                >
                  <Trash2 size={16} />
                </button>
              </>
            )}
          </div>

          {/* Display Fields */}
          {!section.disabled && (
            <div 
              onDragOver={(e) => handleFieldDragOver(e, section.id)}
              onDragLeave={handleFieldDragLeave}
              onDrop={(e) => handleFieldDrop(e, section.id, section.fields.length)}
              className={`
                d-flex flex-column gap-2 p-2 rounded-1 transition
                ${dragOverField === section.id ? 'bg-primary-subtle border border-primary border-2 border-dashed' : 'border border-2 border-transparent border-dashed'}
              `}
              style={{ minHeight: '40px' }}>
              {section.fields.map((field, fieldIndex) => (
                <React.Fragment key={fieldIndex}>
                  {/* Drop zone above each field */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (draggedField && draggedField.sectionId === section.id && draggedField.fieldIndex !== fieldIndex) {
                        setDragOverField(`${section.id}-${fieldIndex}`);
                      }
                    }}
                    onDragLeave={(e) => {
                      e.stopPropagation();
                      setDragOverField(null);
                    }}
                    onDrop={(e) => handleFieldDrop(e, section.id, fieldIndex)}
                    className={`
                      transition-all duration-200 
                      ${dragOverField === `${section.id}-${fieldIndex}` ? 'h-2 bg-primary-subtle border-primary border-2 border-dashed rounded mb-1' : 'h-0'}
                    `}
                    style={{ 
                      minHeight: dragOverField === `${section.id}-${fieldIndex}` ? '8px' : '0px',
                      opacity: dragOverField === `${section.id}-${fieldIndex}` ? 1 : 0 
                    }}
                  />
                  
                  <div 
                    className={`
                      drag-target p-2 px-3 border border-light-subtle rounded bg-light d-flex align-items-center justify-content-between transition
                      ${draggedField?.fieldIndex === fieldIndex && draggedField?.sectionId === section.id ? 'drag-ghost' : ''}
                    `}
                  >
                    <div className="d-flex align-items-center gap-1 flex-fill">
                      <div
                        draggable={true}
                        onDragStart={(e) => handleFieldDragStart(e, fieldIndex, section.id)}
                        className="drag-handle p-1"
                      >
                        <GripVertical size={12} className="text-muted" />
                      </div>
                      <div className="flex-fill">
                        <div className="d-flex align-items-center gap-1 mb-1">
                          <span className="fw-medium small">{field.name}</span>
                          {field.required && (
                            <span className="badge bg-danger rounded-pill" style={{ fontSize: '10px' }}>
                              Required
                            </span>
                          )}
                        </div>
                        {field.description && (
                          <div className="small text-muted mb-1" style={{ fontStyle: 'italic' }}>
                            {field.description}
                          </div>
                        )}
                        <div className="small text-muted">
                          Type: {field.dataType} {field.length && `• Max Length: ${field.length}`}
                        </div>
                      </div>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm"
                        onClick={() => {
                          setFieldForm({
                            name: field.name,
                            description: field.description || '',
                            dataType: field.dataType,
                            length: field.length,
                            required: field.required,
                            repeated: (field as any).repeated || false,
                            defaultValue: field.defaultValue || '',
                            dropdownOptions: (field as any).dropdownOptions || ''
                          });
                          setSelectedSectionId(section.id);
                          setEditingFieldId(field.id || null);
                          setShowFieldModal(true);
                        }}
                        title="Edit Field"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => {
                          // Helper function to remove field from any section recursively
                          const removeFieldFromSection = (sectionsList: Section[]): Section[] => {
                            return sectionsList.map(s => {
                              if (s.id === section.id) {
                                return { ...s, fields: s.fields.filter((_, i) => i !== fieldIndex) };
                              }
                              // Recursively check nested sections/categories
                              if (s.children && s.children.length > 0) {
                                return { ...s, children: removeFieldFromSection(s.children) };
                              }
                              return s;
                            });
                          };
                          const updatedSections = removeFieldFromSection(sections);
                          setSections(updatedSections);
                        }}
                        title="Delete Field"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  
                  {/* Drop zone at the end of the list for the last field */}
                  {fieldIndex === section.fields.length - 1 && (
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (draggedField && draggedField.sectionId === section.id) {
                          setDragOverField(`${section.id}-end`);
                        }
                      }}
                      onDragLeave={(e) => {
                        e.stopPropagation();
                        setDragOverField(null);
                      }}
                      onDrop={(e) => handleFieldDrop(e, section.id, section.fields.length)}
                      className={`
                        transition-all duration-200 
                        ${dragOverField === `${section.id}-end` ? 'h-2 bg-primary-subtle border-primary border-2 border-dashed rounded mt-1' : 'h-0'}
                      `}
                      style={{ 
                        minHeight: dragOverField === `${section.id}-end` ? '8px' : '0px',
                        opacity: dragOverField === `${section.id}-end` ? 1 : 0 
                      }}
                    />
                  )}
                </React.Fragment>
              ))}
              
              {section.fields.length === 0 && (
                <p className={`
                  fst-italic text-center p-3 small mb-0
                  ${dragOverField === section.id ? 'text-primary fw-medium' : 'text-muted'}
                `}>
                  {dragOverField === section.id 
                    ? 'Drop field here to add to this section' 
                    : 'No fields added yet. Click "+ Add Field" or drag fields from other sections.'
                  }
                </p>
              )}
            </div>
          )}
        </div>
        
        {/* Render nested sections */}
        {section.children && section.children.map(childSection => 
          renderSection(childSection, level + 1)
        )}
      </div>
    );
  };

  // Template list screen component
  const renderTemplateList = () => (
    <div className="min-vh-100 bg-light p-4">
      <div className="container-xxl">
        <div className="card shadow-sm p-4">
          
          {/* Header with Add New button */}
          <div className="d-flex align-items-center justify-content-between mb-5">
            <div>
              <h1 className="h2 fw-bold mb-2">Form Templates</h1>
              <div className="d-flex align-items-center gap-3">
                <p className="text-muted m-0">Manage your medical form templates</p>
                {lastFetched && (
                  <span className="badge bg-light text-muted fs-7">
                    Last updated: {lastFetched.toLocaleTimeString()}
                  </span>
                )}
              </div>
              {apiError && (
                <div className="alert alert-danger mt-2 py-2">
                  ⚠️ {apiError}
                </div>
              )}
            </div>
            <div className="d-flex gap-3 align-items-center">
              <button
                onClick={refreshTemplates}
                disabled={isLoading}
                className={`btn btn-outline-secondary ${isLoading ? '' : ''}`}
              >
                <RefreshCw 
                  className={`me-2 ${isLoading ? 'spin' : ''}`}
                  size={16}
                />
                {isLoading ? 'Refreshing...' : 'Refresh'}
              </button>
              <button
                onClick={handleCreateNewTemplate}
                className="btn btn-primary"
              >
                <Plus className="me-2" size={20} />
                Add New Template
              </button>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="d-flex align-items-center justify-content-center py-5 bg-light border border-2 border-secondary rounded mb-4">
              <div className="text-center">
                <RefreshCw 
                  className="spin text-primary mb-3"
                  size={32}
                />
                <p className="text-dark m-0 fs-5 fw-medium">
                  Loading templates from API...
                </p>
              </div>
            </div>
          )}

          {/* Templates Table */}
          {!isLoading && (
            <div className="table-responsive">
              <table className="table table-striped table-bordered table-hover">
                {/* Table Header */}
                <thead className="table-dark">
                  <tr>
                    <th scope="col" className="fw-bold w-35">
                      Template name
                    </th>
                    <th scope="col" className="fw-bold w-30">
                      Domain
                    </th>
                    <th scope="col" className="text-center fw-bold w-35">
                      Actions
                    </th>
                  </tr>
                </thead>
                
                {/* Table Body */}
                <tbody>
                  {templates.map((template) => (
                  <tr key={template.id}>
                    <td className="align-middle fw-semibold fs-6">
                      {template.name}
                    </td>
                    
                    <td className="align-middle text-muted">
                      <span className="badge bg-secondary">{template.domain}</span>
                    </td>
                    
                    <td className="text-center align-middle">
                      <div className="btn-group" role="group" aria-label="Template actions">
                        <button
                          onClick={() => handleEditTemplate(template.id)}
                          className="btn btn-outline-primary btn-sm"
                          title="Edit Template"
                        >
                          <Edit2 size={16} />
                        </button>
                        
                        <button
                          onClick={() => handleCopyTemplate(template.id)}
                          className="btn btn-outline-success btn-sm"
                          title="Copy Template"
                        >
                          <Copy size={16} />
                        </button>
                        
                        <button
                          onClick={() => handleDeleteTemplate(template.id)}
                          className="btn btn-outline-danger btn-sm"
                          title="Delete Template"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Empty state */}
          {!isLoading && templates.length === 0 && (
            <div className="card text-center border-2 border-dark">
              <div className="card-body py-5">
                <div className="mb-4">
                  <div className="display-1 text-muted">📋</div>
                </div>
                <h3 className="card-title h4 mb-3">No templates yet</h3>
                <p className="card-text text-muted mb-4">Create your first form template to get started</p>
                <button
                  onClick={handleCreateNewTemplate}
                  className="btn btn-primary btn-lg"
                >
                  <Plus className="me-2" size={20} />
                  Create Template
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [showFieldsDataJsonModal, setShowFieldsDataJsonModal] = useState(false);
  const [transcriptionOutput, setTranscriptionOutput] = useState("");
  const [activeModalTab, setActiveModalTab] = useState<'fields' | 'standard'>('fields');
  const [, setStandardJsonOutput] = useState('');
  return (
    <>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
        
        /* Drag and Drop Styles */
        [draggable="true"] {
          -webkit-user-drag: element;
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
        }
        
        .drag-handle {
          cursor: move !important;
          touch-action: none;
        }
        
        .drag-handle:hover {
          opacity: 0.8;
        }
        
        .drag-target {
          transition: all 0.2s ease;
        }
        
        .drag-target.drag-over {
          border-color: #007bff !important;
          border-width: 2px !important;
          background-color: rgba(0, 123, 255, 0.1) !important;
        }
        
        .drag-target.drag-reorder {
          border-color: #17a2b8 !important;
          border-width: 2px !important;
          background-color: rgba(23, 162, 184, 0.1) !important;
          box-shadow: 0 0 10px rgba(23, 162, 184, 0.3);
        }
        
        .drag-target.drag-move {
          border-color: #28a745 !important;
          border-width: 2px !important;
          background-color: rgba(40, 167, 69, 0.1) !important;
          box-shadow: 0 0 10px rgba(40, 167, 69, 0.3);
        }
        
        .drag-ghost {
          opacity: 0.5;
          transform: rotate(2deg);
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(100px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
      <div>
        {currentScreen === 'templates' ? renderTemplateList() : (
        <div 
          className="min-vh-100 bg-light p-4"
          onDrop={handleDropOutside}
          onDragOver={(e) => e.preventDefault()}
        >
      <div className="container-xxl">
        <div className="card shadow-sm p-4">
          
          {/* Header with Back and Save buttons */}
          <div className="d-flex align-items-center justify-content-between mb-4">
            <div className="d-flex align-items-center gap-3">
              <button
                onClick={handleBackToTemplates}
                className="btn btn-outline-secondary"
              >
                ← Back to Templates
              </button>
              <div>
                <h1 className="h3 fw-bold text-dark mb-1">
                  {currentTemplateId ? 'Edit Template' : 'New Template'}
                </h1>
              </div>
            </div>
            <div className="d-flex gap-2">
              <button
                onClick={() => {
                  const templateName = prompt('Enter template name:', currentTemplateId ? templates.find(t => t.id === currentTemplateId)?.name : 'New Template');
                  if (templateName) {
                    handleSaveTemplate(templateName);
                  }
                }}
                className="btn btn-success"
              >
                Save Template
              </button>
              

            </div>
          </div>
          
          <div className="mb-4">
            <h2 className="text-primary fw-medium mb-3">View each category</h2>
            <div className="d-flex flex-column gap-3">
              <div className="d-flex align-items-center gap-4">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="radio"
                    id="viewParagraph"
                    checked={viewMode === 'paragraph'}
                    onChange={() => setViewMode('paragraph')}
                  />
                  <label className="form-check-label" htmlFor="viewParagraph">
                    As a paragraph
                  </label>
                </div>
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="radio"
                    id="viewBullets"
                    checked={viewMode === 'bullets'}
                    onChange={() => setViewMode('bullets')}
                  />
                  <label className="form-check-label" htmlFor="viewBullets">
                    As bullet points
                  </label>
                </div>
              </div>
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="hpiBullets"
                  checked={showHPIBullets}
                  onChange={(e) => setShowHPIBullets(e.target.checked)}
                />
                <label className="form-check-label" htmlFor="hpiBullets">
                  View HPI as bullet points
                </label>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              {/* Show Headers Toggle */}
              <div>
                <span style={{ marginRight: '0.5rem' }}>Show Headers</span>
                <input type="checkbox" checked={showHeaders} onChange={e => setShowHeaders(e.target.checked)} />
              </div>
              
              <button
  type="button"
  className="btn btn-secondary ms-2"
  onClick={() => {
    setShowJsonOutput(true); // Only open the config modal
    setJsonOutput(JSON.stringify(sections, null, 2));
    // Ensure fieldsDataJsonModal stays closed
    // If you have a state for fieldsDataJsonModal, set it to false here
    // setShowFieldsDataJsonModal(false);
  }}
>
  Show Configuration
</button>
<button
  type="button"
  className="btn btn-secondary ms-2"
  onClick={() => {
    setShowFieldsDataJsonModal(true); // This opens the Fields Data (JSON) modal
    setJsonOutput(JSON.stringify(sections, null, 2)); // Optionally set the JSON output
  }}
>
  Test
</button>
            </div>

            <div className="d-flex flex-column gap-2">
              {sections.filter(section => !section.parentId).map(section => 
                renderSection(section)
              )}
            </div>

            <button
              onClick={() => setShowSectionModal(true)}
              className="btn btn-outline-secondary border-2 border-dashed w-100 mt-3 py-3 d-flex align-items-center justify-content-between"
            >
              <span className="fw-medium">[New category]</span>
              <div className="d-flex gap-2">
                <Edit2 size={16} />
                <Trash2 size={16} />
              </div>
            </button>

            <div className="mt-4 d-flex justify-content-end">
              <button
                onClick={handleSave}
                className="btn btn-success"
              >
                Save Configuration
              </button>
            </div>

            {/* Test Modal */}
            {showFieldsDataJsonModal && (
              <>
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', zIndex: 1040 }} />
                <div className="modal" role="dialog" id="fieldsDataJsonModal" style={{ display: 'block', zIndex: 1050 }}>
                  <div className="modal-dialog modal-lg" role="document">
                    <div className="modal-content">
                      <div className="modal-header">
                        <h5 className="modal-title">Configuration Modal</h5>
                        <button type="button" className="btn-close" onClick={() => setShowFieldsDataJsonModal(false)}></button>
                      </div>
                      <div className="modal-body">
                        <ul className="nav nav-tabs">
                          <li className="nav-item">
                            <button className={`nav-link${activeModalTab === 'fields' ? ' active' : ''}`} onClick={() => setActiveModalTab('fields')}>Fields Data (JSON)</button>
                          </li>
                          <li className="nav-item">
                            <button className={`nav-link${activeModalTab === 'standard' ? ' active' : ''}`} onClick={() => setActiveModalTab('standard')}>Standard json</button>
                          </li>
                        </ul>
                        <div style={{ marginTop: '1rem' }}>
                          {activeModalTab === 'fields' && (
                            <div className='configuration'><pre style={{ maxHeight: '200px', overflowY: 'auto' }}>{jsonOutput}</pre></div>
                          )}
                          {activeModalTab === 'standard' && (
  <pre style={{ background: '#f8f9fa', padding: '16px', borderRadius: '6px', fontSize: '14px', overflowX: 'auto', maxHeight: '200px' }}>
    {generateStandardJson(sections)}
  </pre>
)}
                        </div>
                        <div className='d-flex justify-content-between'>
                          <h5>Transcription</h5>
                          <input
                            type="file"
                            accept=".txt"
                            style={{ display: "none" }}
                            id="attachTxtFileInput"
                            onChange={e => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (ev) => {
                                  setTranscriptionOutput(ev.target?.result as string);
                                };
                                reader.readAsText(file);
                              }
                            }}
                          />
                          <button className='btn btn-success' onClick={() => document.getElementById("attachTxtFileInput")?.click()}>
                            Attach File(.txt)
                          </button>
                        </div>
                        <div className='transcription'><pre style={{ maxHeight: '200px', overflowY: 'auto', whiteSpace:'normal' }}>{transcriptionOutput}</pre></div>
                        <div className='d-flex justify-content-end'>
                        <button className='btn btn-success' onClick={() => setStandardJsonOutput(generateStandardJson(sections))}>
                            Generate
                          </button>
                        </div>
                        <div className='d-flex justify-content-start'>
                          <h5>AI Generated Notes</h5>
                          <div></div>
                        </div>
                      </div>
                      <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={() => setShowFieldsDataJsonModal(false)}>
                          Close
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
            

          </div>
        </div>
      </div>

      {/* Add Section Modal */}
      {showSectionModal && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" 
             style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 50 }}>
          <div className="bg-white rounded-2 p-4 w-100" style={{ maxWidth: '448px' }}>
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h3 className="h5 fw-semibold mb-0">Add New Section</h3>
              <button
                onClick={() => {
                  setShowSectionModal(false);
                  setSectionForm({ name: '', description: '' });
                }}
                className="btn btn-link text-muted p-0"
              >
                <X size={20} />
              </button>
            </div>
            <div className="d-flex flex-column gap-3">
              <div>
                <label className="form-label fw-medium small">
                  Section Name*
                </label>
                <input
                  type="text"
                  value={sectionForm.name}
                  onChange={(e) => setSectionForm({ ...sectionForm, name: e.target.value })}
                  className="form-control"
                  placeholder="Enter section name"
                />
              </div>
              <div className="d-flex gap-3 justify-content-end">
                <button
                  onClick={() => {
                    setShowSectionModal(false);
                    setSectionForm({ name: '', description: '' });
                  }}
                  className="btn btn-outline-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddSection}
                  className="btn btn-primary"
                >
                  Add Section
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Field Modal */}
      {showFieldModal && (
        <div className="modal fade show d-block" role="dialog" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{editingFieldId ? 'Edit Field' : 'Add Field'}</h5>
                <button type="button" className="btn-close" aria-label="Close" onClick={() => { setShowFieldModal(false); setEditingFieldId(null); }}></button>
              </div>
              <div className="modal-body">
                <div className="form-group mb-2">
                  <label>Name</label>
                  <input type="text" className="form-control" value={fieldForm.name} onChange={e => setFieldForm({ ...fieldForm, name: e.target.value })} />
                </div>
                <div className="form-group mb-2">
                  <label>Description</label>
                  <input type="text" className="form-control" value={fieldForm.description} onChange={e => setFieldForm({ ...fieldForm, description: e.target.value })} />
                </div>
                <div className="form-group mb-2">
                  <label>Data Type</label>
                  <select className="form-control" value={fieldForm.dataType} onChange={e => setFieldForm({ ...fieldForm, dataType: e.target.value })}>
                    <option value="text">Text</option>
                    <option value="number">Number</option>
                    <option value="date">Date</option>
                    <option value="textarea">Text Area</option>
                    <option value="checkbox">Checkbox</option>
                    <option value="radio">Radio</option>
                    <option value="dropdown">Dropdown</option>
                  </select>
                </div>
                <div className="form-group mb-2">
                  <label>Length</label>
                  <input type="text" className="form-control" value={fieldForm.length} onChange={e => setFieldForm({ ...fieldForm, length: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Default Value</label>
                  {/* Render input based on dataType */}
                  {fieldForm.dataType === "text" && (
                    <input
                      type="text"
                      className="form-control"
                      value={fieldForm.defaultValue}
                      onChange={e => setFieldForm({ ...fieldForm, defaultValue: e.target.value })}
                      placeholder="Enter text value"
                    />
                  )}
                  {fieldForm.dataType === "dropdown" && (
                    <select
                      className="form-select"
                      value={fieldForm.defaultValue}
                      onChange={e => setFieldForm({ ...fieldForm, defaultValue: e.target.value })}
                    >
                      <option value="">Select an option</option>
                      {(fieldForm.dropdownOptions || "").split(",").map(opt => (
                        <option key={opt.trim()} value={opt.trim()}>{opt.trim()}</option>
                      ))}
                    </select>
                  )}
                  {/* You can add more types here if needed */}
                </div>
                <div className="form-check mb-2">
                  <input type="checkbox" className="form-check-input" checked={fieldForm.required} onChange={e => setFieldForm({ ...fieldForm, required: e.target.checked })} id="requiredCheck" />
                  <label className="form-check-label" htmlFor="requiredCheck">Required</label>
                </div>
                <div className="form-check mb-2">
                  <input type="checkbox" className="form-check-input" checked={fieldForm.repeated || false} onChange={e => setFieldForm({ ...fieldForm, repeated: e.target.checked })} id="repeatedCheck" />
                  <label className="form-check-label" htmlFor="repeatedCheck">Repeated</label>
                </div>
                {fieldForm.dataType === 'dropdown' && (
                  <div className="form-group">
                    <label>Dropdown Options (comma separated)</label>
                    <input type="text" className="form-control" value={(fieldForm as any).dropdownOptions || ''} onChange={e => setFieldForm({ ...fieldForm, dropdownOptions: e.target.value } as any)} />
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => { setShowFieldModal(false); setEditingFieldId(null); }}>Cancel</button>
                <button type="button" className="btn btn-primary" onClick={editingFieldId ? handleSaveEditField : handleAddField}>
                  {editingFieldId ? "Save" : "Add Field"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Configuration JSON Output Modal (Bootstrap-styled) */}
      <div className={`modal fade ${showJsonOutput ? 'show d-block' : ''}`} role="dialog" id="configJsonModal" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
        <div className="modal-dialog modal-lg" role="document">
          <div className="modal-content">
            <div className="modal-header bg-primary text-white">
              <h5 className="modal-title">Configuration JSON Output</h5>
              <button type="button" className="btn-close btn-close-white" aria-label="Close" onClick={() => setShowJsonOutput(false)}></button>
            </div>
            <div className="modal-body">
              <div className="alert alert-success mb-3">
                <input type="checkbox" checked readOnly className="me-2" />
                Configuration stored in database metadata (Template ID: {currentTemplateId || 'N/A'})
              </div>
              <pre className="bg-dark text-light p-3 rounded" style={{ maxHeight: '400px', overflowY: 'auto', fontSize: '1rem' }}>{jsonOutput}</pre>
            </div>
            <div className="modal-footer d-flex justify-content-between">
              <div>
                <button className="btn btn-outline-secondary me-2" onClick={() => navigator.clipboard.writeText(jsonOutput)}>
                  Copy to Clipboard
                </button>
                <button className="btn btn-outline-primary me-2" onClick={async () => {
                  try {
                    const savedConfig = await loadConfigurationFromDatabase(currentTemplateId!);
                    if (savedConfig) {
                      alert('✅ Configuration applied to form! All previous settings have been restored.');
                    } else {
                      alert('ℹ️ No saved configuration found for this template.');
                    }
                  } catch (error) {
                    console.error('Error applying config:', error);
                    alert('❌ Failed to apply configuration to form.');
                  }
                }}>
                  Apply Config to Form
                </button>
              </div>
              <div>
                <button className="btn btn-success me-2" onClick={async () => {
                  try {
                    const configData = JSON.parse(jsonOutput);
                    // Save to database
                    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.UPDATE_TEMPLATE(currentTemplateId!)}/configuration`, {
                      method: 'PUT',
                      headers: API_CONFIG.HEADERS,
                      body: JSON.stringify({ configuration: configData })
                    });
                    if (response.ok) {
                      // Export as JSON file download
                      const blob = new Blob([jsonOutput], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = `template-${currentTemplateId}-configuration.json`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      URL.revokeObjectURL(url);
                      alert('✅ Configuration saved to database and exported successfully!');
                    } else {
                      throw new Error('Failed to save');
                    }
                  } catch (error) {
                    console.error('Error saving config:', error);
                    alert('❌ Failed to save configuration to database.');
                  }
                }}>
                  Save to DB &amp; Export
                </button>
                <button className="btn btn-secondary" onClick={() => setShowJsonOutput(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

        </div>
        )}
      </div>
    </>
  );
};

function App() {
  return <MedicalFormBuilder />;
}

export default App;