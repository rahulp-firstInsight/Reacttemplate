import React, { useState } from 'react';
import { GripVertical, Plus, Edit2, Trash2, X } from 'lucide-react';

const MedicalFormBuilder = () => {
  const [viewMode, setViewMode] = useState('paragraph');
  const [showHPIBullets, setShowHPIBullets] = useState(false);
  const [showHeaders, setShowHeaders] = useState(true);
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [showFieldModal, setShowFieldModal] = useState(false);
  const [selectedSectionId, setSelectedSectionId] = useState(null);
  const [draggedItem, setDraggedItem] = useState(null);
  const [showJsonOutput, setShowJsonOutput] = useState(false);
  const [jsonOutput, setJsonOutput] = useState('');
  
  const [sections, setSections] = useState([
    {
      id: 'chief-complaint',
      name: 'Chief Complaint',
      description: '',
      type: 'section',
      fields: [
        {
          id: 'field-location',
          name: 'Location',
          description: '',
          dataType: 'dropdown',
          length: '',
          required: true,
          repeated: true,
          defaultValue: '',
          dropdownOptions: []
        },
        {
          id: 'field-severity',
          name: 'Severity',
          description: '',
          dataType: 'dropdown',
          length: '',
          required: false,
          repeated: false,
          defaultValue: '',
          dropdownOptions: []
        },
        {
          id: 'field-complaints',
          name: 'Complaints',
          description: '',
          dataType: 'textarea',
          length: '',
          required: false,
          repeated: false,
          defaultValue: '',
          dropdownOptions: []
        }
      ]
    },
    {
      id: 'hpi',
      name: 'HPI',
      description: '',
      type: 'section',
      fields: []
    },
    {
      id: 'allergies',
      name: 'Allergies',
      description: '',
      type: 'section',
      disabled: true,
      fields: []
    },
    {
      id: 'medications',
      name: 'Medications',
      description: '',
      type: 'section',
      fields: []
    },
    {
      id: 'medical-history',
      name: 'Medical History',
      description: '',
      type: 'section',
      fields: []
    },
    {
      id: 'surgical-history',
      name: 'Surgical History',
      description: '',
      type: 'section',
      fields: []
    },
    {
      id: 'treatment-experience',
      name: 'Treatment Experience',
      description: '',
      type: 'section',
      fields: []
    },
    {
      id: 'family-history',
      name: 'Family History',
      description: '',
      type: 'section',
      disabled: true,
      fields: []
    },
    {
      id: 'social-history',
      name: 'Social History',
      description: '',
      type: 'category',
      subsections: [
        {
          id: 'sh-substance',
          name: 'SH: Substance Use',
          description: '',
          type: 'section',
          fields: []
        },
        {
          id: 'sh-lifestyle',
          name: 'SH: Lifestyle',
          description: '',
          type: 'section',
          fields: []
        }
      ]
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

  const handleDragStart = (e, item, type, parentId = null) => {
    e.stopPropagation();
    setDraggedItem({ item, type, parentId });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetId, targetType, targetParentId = null) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedItem) return;

    const newSections = JSON.parse(JSON.stringify(sections));
    
    if (draggedItem.type === 'section') {
      if (targetType === 'section') {
        // Moving section to reorder or nest
        let draggedSection = null;
        
        // Remove dragged section from its current location
        const removeSectionFromList = (sectionsList, parentList = null, parentIndex = null) => {
          for (let i = 0; i < sectionsList.length; i++) {
            if (sectionsList[i].id === draggedItem.item.id) {
              draggedSection = sectionsList.splice(i, 1)[0];
              return true;
            }
            if (sectionsList[i].subsections) {
              if (removeSectionFromList(sectionsList[i].subsections, sectionsList, i)) {
                return true;
              }
            }
          }
          return false;
        };
        
        removeSectionFromList(newSections);
        
        if (draggedSection) {
          // Find target section and add as subsection or reorder
          const addSectionToTarget = (sectionsList) => {
            for (let i = 0; i < sectionsList.length; i++) {
              if (sectionsList[i].id === targetId) {
                // Check if we should nest or reorder
                if (e.shiftKey || targetParentId === 'nest') {
                  // Nest: add as subsection
                  if (!sectionsList[i].subsections) {
                    sectionsList[i].subsections = [];
                  }
                  sectionsList[i].type = 'category';
                  sectionsList[i].subsections.push(draggedSection);
                } else {
                  // Reorder: insert at this position
                  sectionsList.splice(i, 0, draggedSection);
                }
                return true;
              }
              if (sectionsList[i].subsections) {
                if (addSectionToTarget(sectionsList[i].subsections)) {
                  return true;
                }
              }
            }
            return false;
          };
          
          addSectionToTarget(newSections);
          setSections(newSections);
        }
      }
    } else if (draggedItem.type === 'field') {
      // Remove field from source
      let removedField = null;
      
      const removeFieldFromSection = (sectionsList) => {
        for (let section of sectionsList) {
          if (section.fields && section.id === draggedItem.parentId) {
            const fieldIndex = section.fields.findIndex(f => f.id === draggedItem.item.id);
            if (fieldIndex !== -1) {
              removedField = section.fields.splice(fieldIndex, 1)[0];
              return true;
            }
          }
          if (section.subsections) {
            if (removeFieldFromSection(section.subsections)) return true;
          }
        }
        return false;
      };
      
      removeFieldFromSection(newSections);
      
      if (removedField) {
        // Add field to target
        if (targetType === 'field') {
          // Drop on another field - insert at that position
          const addFieldToSection = (sectionsList) => {
            for (let section of sectionsList) {
              if (section.id === targetParentId) {
                const targetIndex = section.fields.findIndex(f => f.id === targetId);
                if (targetIndex !== -1) {
                  section.fields.splice(targetIndex, 0, removedField);
                  return true;
                }
              }
              if (section.subsections) {
                if (addFieldToSection(section.subsections)) return true;
              }
            }
            return false;
          };
          addFieldToSection(newSections);
        } else if (targetType === 'section') {
          // Drop on section - add to end
          const addFieldToSection = (sectionsList) => {
            for (let section of sectionsList) {
              if (section.id === targetId) {
                if (!section.fields) {
                  section.fields = [];
                }
                section.fields.push(removedField);
                return true;
              }
              if (section.subsections) {
                if (addFieldToSection(section.subsections)) return true;
              }
            }
            return false;
          };
          addFieldToSection(newSections);
        }
        
        setSections(newSections);
      }
    }
    
    setDraggedItem(null);
  };

  const handleDropOnSection = (e, sectionId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedItem) return;
    
    if (draggedItem.type === 'field') {
      const newSections = JSON.parse(JSON.stringify(sections));
      let removedField = null;
      
      // Remove field from source
      const removeFieldFromSection = (sectionsList) => {
        for (let section of sectionsList) {
          if (section.fields && section.id === draggedItem.parentId) {
            const fieldIndex = section.fields.findIndex(f => f.id === draggedItem.item.id);
            if (fieldIndex !== -1) {
              removedField = section.fields.splice(fieldIndex, 1)[0];
              return true;
            }
          }
          if (section.subsections) {
            if (removeFieldFromSection(section.subsections)) return true;
          }
        }
        return false;
      };
      
      removeFieldFromSection(newSections);
      
      if (removedField) {
        // Add field to target section
        const addFieldToSection = (sectionsList) => {
          for (let section of sectionsList) {
            if (section.id === sectionId) {
              if (!section.fields) {
                section.fields = [];
              }
              section.fields.push(removedField);
              return true;
            }
            if (section.subsections) {
              if (addFieldToSection(section.subsections)) return true;
            }
          }
          return false;
        };
        
        addFieldToSection(newSections);
        setSections(newSections);
      }
    } else if (draggedItem.type === 'section') {
      // Nest section inside target section
      handleDrop(e, sectionId, 'section', 'nest');
    }
    
    setDraggedItem(null);
  };

  const handleAddSection = () => {
    if (sectionForm.name.trim()) {
      const newSection = {
        id: `section-${Date.now()}`,
        name: sectionForm.name,
        description: sectionForm.description,
        type: 'section',
        fields: []
      };
      setSections([...sections, newSection]);
      setSectionForm({ name: '', description: '' });
      setShowSectionModal(false);
    }
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
        repeated: fieldForm.repeated,
        defaultValue: fieldForm.defaultValue,
        dropdownOptions: fieldForm.dataType === 'dropdown' ? fieldForm.dropdownOptions.split('\n').filter(opt => opt.trim()) : []
      };
      
      const newSections = sections.map(section => {
        if (section.id === selectedSectionId) {
          return {
            ...section,
            fields: [...section.fields, newField]
          };
        }
        if (section.subsections) {
          return {
            ...section,
            subsections: section.subsections.map(sub => 
              sub.id === selectedSectionId 
                ? { ...sub, fields: [...sub.fields, newField] }
                : sub
            )
          };
        }
        return section;
      });
      
      setSections(newSections);
      setFieldForm({ 
        name: '', 
        description: '',
        dataType: 'text', 
        length: '', 
        required: false,
        repeated: false,
        defaultValue: '',
        dropdownOptions: ''
      });
      setShowFieldModal(false);
      setSelectedSectionId(null);
    }
  };

  const deleteSection = (sectionId) => {
    setSections(sections.filter(s => s.id !== sectionId));
  };

  const deleteField = (sectionId, fieldId) => {
    const newSections = sections.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          fields: section.fields.filter(f => f.id !== fieldId)
        };
      }
      if (section.subsections) {
        return {
          ...section,
          subsections: section.subsections.map(sub => 
            sub.id === sectionId 
              ? { ...sub, fields: sub.fields.filter(f => f.id !== fieldId) }
              : sub
          )
        };
      }
      return section;
    });
    setSections(newSections);
  };

  const handleSave = () => {
    const generateJSON = () => {
      const cleanSections = sections.map(section => {
        const cleanSection = {
          id: section.id,
          name: section.name,
          description: section.description || '',
          type: section.type,
          fields: [],
          listFields: []
        };
        
        // Separate regular fields and repeated fields
        if (section.fields) {
          section.fields.forEach(field => {
            const cleanField = {
              id: field.id,
              name: field.name,
              description: field.description || '',
              dataType: field.dataType,
              length: field.length || '',
              required: field.required || false,
              defaultValue: field.defaultValue || '',
              dropdownOptions: field.dropdownOptions || []
            };
            
            if (field.repeated) {
              cleanSection.listFields.push(cleanField);
            } else {
              cleanSection.fields.push(cleanField);
            }
          });
        }
        
        // Remove empty arrays for cleaner JSON
        if (cleanSection.fields.length === 0) {
          delete cleanSection.fields;
        }
        if (cleanSection.listFields.length === 0) {
          delete cleanSection.listFields;
        }
        
        if (section.subsections) {
          cleanSection.subsections = section.subsections.map(sub => {
            const cleanSub = {
              id: sub.id,
              name: sub.name,
              description: sub.description || '',
              type: sub.type,
              fields: [],
              listFields: []
            };
            
            if (sub.fields) {
              sub.fields.forEach(field => {
                const cleanField = {
                  id: field.id,
                  name: field.name,
                  description: field.description || '',
                  dataType: field.dataType,
                  length: field.length || '',
                  required: field.required || false,
                  defaultValue: field.defaultValue || '',
                  dropdownOptions: field.dropdownOptions || []
                };
                
                if (field.repeated) {
                  cleanSub.listFields.push(cleanField);
                } else {
                  cleanSub.fields.push(cleanField);
                }
              });
            }
            
            if (cleanSub.fields.length === 0) {
              delete cleanSub.fields;
            }
            if (cleanSub.listFields.length === 0) {
              delete cleanSub.listFields;
            }
            
            return cleanSub;
          });
        }
        
        if (section.disabled !== undefined) {
          cleanSection.disabled = section.disabled;
        }
        
        return cleanSection;
      });
      
      return {
        viewMode: viewMode,
        showHPIBullets: showHPIBullets,
        showHeaders: showHeaders,
        sections: cleanSections
      };
    };
    
    try {
      const result = generateJSON();
      const jsonString = JSON.stringify(result, null, 2);
      setJsonOutput(jsonString);
      setShowJsonOutput(true);
      console.log('JSON Output:', jsonString);
    } catch (error) {
      console.error('Error generating JSON:', error);
      alert('Error generating JSON. Please check console for details.');
    }
  };

  const renderSection = (section, parentId = null) => {
    const isDisabled = section.disabled;
    
    return (
      <div
        key={section.id}
        className={`border rounded-lg p-3 mb-2 ${isDisabled ? 'bg-gray-50 opacity-60' : 'bg-white'} ${
          draggedItem && draggedItem.type === 'section' ? 'transition-all' : ''
        }`}
      >
        <div 
          className="flex items-center gap-2 group"
          draggable={!isDisabled}
          onDragStart={(e) => {
            if (!isDisabled) {
              handleDragStart(e, section, 'section');
            }
          }}
          onDragOver={(e) => {
            if (draggedItem && draggedItem.type === 'section' && draggedItem.item.id !== section.id) {
              handleDragOver(e);
              e.currentTarget.classList.add('bg-blue-50', 'border-blue-400');
            }
          }}
          onDragLeave={(e) => {
            e.currentTarget.classList.remove('bg-blue-50', 'border-blue-400');
          }}
          onDrop={(e) => {
            e.currentTarget.classList.remove('bg-blue-50', 'border-blue-400');
            if (draggedItem && draggedItem.type === 'section' && draggedItem.item.id !== section.id) {
              handleDrop(e, section.id, 'section');
            }
          }}
        >
          {!isDisabled && (
            <GripVertical className="w-4 h-4 text-gray-400 cursor-move flex-shrink-0" />
          )}
          {section.type === 'category' ? (
            <div className="flex items-center gap-1 flex-1">
              <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-sm"></div>
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-sm"></div>
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-sm"></div>
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-sm"></div>
              </div>
              <span className="font-medium">{section.name}</span>
              {section.name === 'Social History' && (
                <span className="w-5 h-5 bg-gray-400 text-white text-xs rounded-full flex items-center justify-center">i</span>
              )}
            </div>
          ) : (
            <>
              <div className="w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center font-bold flex-shrink-0">
                ●
              </div>
              <span className="font-medium text-blue-600 flex-1">{section.name}</span>
            </>
          )}
          {!isDisabled && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedSectionId(section.id);
                  setShowFieldModal(true);
                }}
                className="text-blue-600 hover:text-blue-700 text-sm whitespace-nowrap flex-shrink-0"
              >
                + Add Field
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteSection(section.id);
                }}
                className="text-red-500 hover:text-red-600 flex-shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        {/* Nest section drop zone - appears on hover when dragging a section */}
        {!isDisabled && draggedItem && draggedItem.type === 'section' && draggedItem.item.id !== section.id && (
          <div
            className="mt-2 ml-7 p-2 border-2 border-dashed border-purple-300 bg-purple-50 rounded text-purple-600 text-xs text-center"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDropOnSection(e, section.id)}
          >
            Drop here to nest inside "{section.name}"
          </div>
        )}
        
        {/* Drop zone for fields */}
        <div 
          className={`mt-2 ml-7 min-h-[40px] rounded transition-colors ${
            section.fields && section.fields.length > 0 
              ? 'space-y-1' 
              : 'border-2 border-dashed border-gray-300 p-4 text-center text-gray-400 text-sm'
          }`}
          onDragOver={(e) => {
            if (draggedItem && draggedItem.type === 'field') {
              handleDragOver(e);
              e.currentTarget.classList.add('border-blue-400', 'bg-blue-50');
            }
          }}
          onDragLeave={(e) => {
            e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50');
          }}
          onDrop={(e) => {
            e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50');
            if (draggedItem && draggedItem.type === 'field') {
              handleDropOnSection(e, section.id);
            }
          }}
        >
          {section.fields && section.fields.length > 0 ? (
            section.fields.map((field, index) => (
              <div
                key={field.id}
                draggable={true}
                onDragStart={(e) => {
                  e.stopPropagation();
                  handleDragStart(e, field, 'field', section.id);
                }}
                onDragOver={(e) => {
                  if (draggedItem && draggedItem.type === 'field') {
                    handleDragOver(e);
                    e.currentTarget.classList.add('border-blue-400', 'bg-blue-100');
                  }
                }}
                onDragLeave={(e) => {
                  e.currentTarget.classList.remove('border-blue-400', 'bg-blue-100');
                }}
                onDrop={(e) => {
                  e.currentTarget.classList.remove('border-blue-400', 'bg-blue-100');
                  if (draggedItem && draggedItem.type === 'field') {
                    handleDrop(e, field.id, 'field', section.id);
                  }
                }}
                className="flex items-center gap-2 p-2 bg-gray-50 rounded border border-gray-200 hover:border-gray-300 cursor-move transition-colors"
              >
                <GripVertical className="w-3 h-3 text-gray-400 flex-shrink-0" />
                {field.repeated && (
                  <div className="w-4 h-4 grid grid-cols-2 gap-0.5 flex-shrink-0">
                    <div className="w-1 h-1 bg-blue-600 rounded-sm"></div>
                    <div className="w-1 h-1 bg-blue-600 rounded-sm"></div>
                    <div className="w-1 h-1 bg-blue-600 rounded-sm"></div>
                    <div className="w-1 h-1 bg-blue-600 rounded-sm"></div>
                  </div>
                )}
                <span className="text-sm flex-1">{field.name}</span>
                <span className="text-xs text-gray-500">{field.dataType}</span>
                {field.required && (
                  <span className="text-xs text-red-500 font-bold">*</span>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteField(section.id, field.id);
                  }}
                  className="text-red-500 hover:text-red-600 flex-shrink-0"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))
          ) : (
            !isDisabled && <span>Drop fields here</span>
          )}
        </div>
        
        {section.subsections && (
          <div className="ml-7 mt-2 space-y-2">
            {section.subsections.map(subsection => renderSection(subsection, section.id))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="col-span-1 space-y-4">
            <div>
              <h3 className="text-blue-600 font-medium mb-2">Subjective</h3>
            </div>
            <div>
              <button className="text-blue-600 hover:underline">ROS</button>
            </div>
            <div>
              <button className="text-blue-600 hover:underline">Objective</button>
            </div>
            <div>
              <button className="text-blue-600 hover:underline">Assessment & Plan</button>
            </div>
            <div>
              <button className="text-blue-600 hover:underline">Macros</button>
            </div>
          </div>

          {/* Main Content */}
          <div className="col-span-3 bg-white rounded-lg shadow p-6">
            <div className="mb-6">
              <h2 className="text-blue-600 font-medium mb-4">View each category</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={viewMode === 'paragraph'}
                      onChange={() => setViewMode('paragraph')}
                      className="w-4 h-4"
                    />
                    <span>As a paragraph</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={viewMode === 'bullets'}
                      onChange={() => setViewMode('bullets')}
                      className="w-4 h-4"
                    />
                    <span>As bullet points</span>
                  </label>
                </div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={showHPIBullets}
                    onChange={(e) => setShowHPIBullets(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span>View HPI as bullet points</span>
                </label>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-blue-600 font-medium">Display order</h2>
                  <p className="text-sm text-gray-600">Combine and order selected categories</p>
                </div>
                <label className="flex items-center gap-2">
                  <span className="text-sm font-medium">Show Headers</span>
                  <div
                    onClick={() => setShowHeaders(!showHeaders)}
                    className={`w-12 h-6 rounded-full cursor-pointer transition-colors ${
                      showHeaders ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                        showHeaders ? 'translate-x-6' : 'translate-x-0.5'
                      } mt-0.5`}
                    ></div>
                  </div>
                </label>
              </div>

              <div className="space-y-2">
                {sections.map(section => renderSection(section))}
              </div>

              <button
                onClick={() => setShowSectionModal(true)}
                className="mt-4 w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-between"
              >
                <span className="font-medium">[New category]</span>
                <div className="flex gap-2">
                  <Edit2 className="w-4 h-4" />
                  <Trash2 className="w-4 h-4" />
                </div>
              </button>
              <p className="text-sm text-gray-500 text-center mt-2">
                Drag sections to combine into a new category
              </p>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleSave}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                >
                  Save Configuration
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* JSON Output Modal */}
      {showJsonOutput && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold">Configuration JSON Output</h3>
              <button
                onClick={() => setShowJsonOutput(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <pre className="bg-gray-900 text-green-400 p-4 rounded text-sm font-mono">
                {jsonOutput}
              </pre>
            </div>
            <div className="flex gap-3 justify-end p-6 border-t">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(jsonOutput);
                  alert('JSON copied to clipboard!');
                }}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                Copy to Clipboard
              </button>
              <button
                onClick={() => setShowJsonOutput(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Section Modal */}
      {showSectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Add New Section</h3>
              <button
                onClick={() => {
                  setShowSectionModal(false);
                  setSectionForm({ name: '', description: '' });
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Section Name*</label>
                <input
                  type="text"
                  value={sectionForm.name}
                  onChange={(e) => setSectionForm({ ...sectionForm, name: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter section name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Section Description</label>
                <textarea
                  value={sectionForm.description}
                  onChange={(e) => setSectionForm({ ...sectionForm, description: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Enter section description"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowSectionModal(false);
                    setSectionForm({ name: '', description: '' });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddSection}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Add New Field</h3>
              <button
                onClick={() => {
                  setShowFieldModal(false);
                  setFieldForm({ 
                    name: '', 
                    description: '',
                    dataType: 'text', 
                    length: '', 
                    required: false,
                    repeated: false,
                    defaultValue: '',
                    dropdownOptions: ''
                  });
                  setSelectedSectionId(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Field Name*</label>
                <input
                  type="text"
                  value={fieldForm.name}
                  onChange={(e) => setFieldForm({ ...fieldForm, name: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter field name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Field Description</label>
                <textarea
                  value={fieldForm.description}
                  onChange={(e) => setFieldForm({ ...fieldForm, description: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Enter field description"
                />
              </div>
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={fieldForm.repeated}
                    onChange={(e) => setFieldForm({ ...fieldForm, repeated: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium">Repeated Field</span>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Data Type*</label>
                <select
                  value={fieldForm.dataType}
                  onChange={(e) => setFieldForm({ ...fieldForm, dataType: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                  <option value="date">Date</option>
                  <option value="textarea">Text Area</option>
                  <option value="checkbox">Checkbox</option>
                  <option value="dropdown">Dropdown</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Length</label>
                <input
                  type="number"
                  value={fieldForm.length}
                  onChange={(e) => setFieldForm({ ...fieldForm, length: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Max length"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Default Value</label>
                <input
                  type="text"
                  value={fieldForm.defaultValue}
                  onChange={(e) => setFieldForm({ ...fieldForm, defaultValue: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter default value"
                />
              </div>
              {fieldForm.dataType === 'dropdown' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Dropdown Options (one per line)*</label>
                  <textarea
                    value={fieldForm.dropdownOptions}
                    onChange={(e) => setFieldForm({ ...fieldForm, dropdownOptions: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    rows="6"
                    placeholder="Option 1&#10;Option 2&#10;Option 3"
                  />
                  <p className="text-xs text-gray-500 mt-1">Enter each option on a new line</p>
                </div>
              )}
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={fieldForm.required}
                    onChange={(e) => setFieldForm({ ...fieldForm, required: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium">Required Field</span>
                </label>
              </div>
              <div className="flex gap-3 justify-end pt-4 border-t">
                <button
                  onClick={() => {
                    setShowFieldModal(false);
                    setFieldForm({ 
                      name: '', 
                      description: '',
                      dataType: 'text', 
                      length: '', 
                      required: false,
                      repeated: false,
                      defaultValue: '',
                      dropdownOptions: ''
                    });
                    setSelectedSectionId(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddField}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Add Field
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicalFormBuilder;