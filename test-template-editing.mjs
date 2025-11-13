import fetch from 'node-fetch';

async function testTemplateEditing() {
  console.log('🔧 Testing template editing workflow...');
  
  const templateId = 1; // First template from your list
  
  // Step 1: Test editing a template with categories, subcategories, and text fields
  const templateUpdate = {
    name: "Test Update via API1 - Edited",
    description: "Updated template with categories and fields",
    sections: [
      {
        id: "patient-info",
        name: "Patient Information",
        description: "Basic patient details",
        type: "category",
        fields: [
          {
            name: "patient_name",
            dataType: "text",
            required: true,
            label: "Patient Full Name"
          },
          {
            name: "patient_age", 
            dataType: "number",
            required: true,
            label: "Age"
          }
        ],
        children: [
          {
            id: "demographics",
            name: "Demographics", 
            description: "Demographic information",
            type: "subcategory",
            fields: [
              {
                name: "gender",
                dataType: "text",
                required: false,
                label: "Gender"
              },
              {
                name: "date_of_birth",
                dataType: "date",
                required: true,
                label: "Date of Birth"
              }
            ]
          }
        ]
      },
      {
        id: "medical-history",
        name: "Medical History",
        description: "Patient medical background",
        type: "category", 
        fields: [
          {
            name: "chief_complaint",
            dataType: "text",
            required: true,
            label: "Chief Complaint"
          },
          {
            name: "history_present_illness",
            dataType: "textarea",
            required: true,
            label: "History of Present Illness"
          }
        ]
      }
    ]
  };
  
  try {
    console.log('\n📝 Step 1: Updating template structure...');
    const updateResponse = await fetch(`http://localhost:8080/api/templates/${templateId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(templateUpdate)
    });
    
    if (updateResponse.ok) {
      const updateResult = await updateResponse.json();
      console.log('✅ Template updated successfully:', updateResult);
    } else {
      console.error('❌ Template update failed:', await updateResponse.text());
      return;
    }
    
    // Step 2: Save configuration with categories and fields
    console.log('\n💾 Step 2: Saving template configuration...');
    
    const configuration = {
      categories: [
        {
          id: "patient-info",
          name: "Patient Information",
          fields: [
            {
              name: "patient_name",
              dataType: "text", 
              required: true,
              label: "Patient Full Name"
            },
            {
              name: "patient_age",
              dataType: "number",
              required: true, 
              label: "Age"
            }
          ],
          subcategories: [
            {
              id: "demographics",
              name: "Demographics",
              fields: [
                {
                  name: "gender",
                  dataType: "text",
                  required: false,
                  label: "Gender"
                },
                {
                  name: "date_of_birth", 
                  dataType: "date",
                  required: true,
                  label: "Date of Birth"
                }
              ]
            }
          ]
        },
        {
          id: "medical-history", 
          name: "Medical History",
          fields: [
            {
              name: "chief_complaint",
              dataType: "text",
              required: true,
              label: "Chief Complaint"
            },
            {
              name: "history_present_illness",
              dataType: "textarea", 
              required: true,
              label: "History of Present Illness"
            }
          ]
        }
      ],
      settings: {
        viewMode: "paragraph",
        showHeaders: true,
        showHPIBullets: false
      }
    };
    
    const configResponse = await fetch(`http://localhost:8080/api/templates/${templateId}/configuration`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ configuration })
    });
    
    if (configResponse.ok) {
      const configResult = await configResponse.json();
      console.log('✅ Configuration saved successfully:', configResult);
    } else {
      console.error('❌ Configuration save failed:', await configResponse.text());
      return;
    }
    
    // Step 3: Verify the saved configuration
    console.log('\n🔍 Step 3: Verifying saved configuration...');
    
    const getConfigResponse = await fetch(`http://localhost:8080/api/templates/${templateId}/configuration`);
    
    if (getConfigResponse.ok) {
      const savedConfig = await getConfigResponse.json();
      console.log('✅ Retrieved configuration:');
      console.log('Template ID:', savedConfig.templateId);
      console.log('Template Name:', savedConfig.templateName);
      console.log('Categories:', savedConfig.configuration?.categories?.length || 0);
      
      if (savedConfig.configuration?.categories) {
        savedConfig.configuration.categories.forEach((category, index) => {
          console.log(`  Category ${index + 1}: ${category.name}`);
          console.log(`    Fields: ${category.fields?.length || 0}`);
          if (category.subcategories) {
            console.log(`    Subcategories: ${category.subcategories.length}`);
            category.subcategories.forEach((sub, subIndex) => {
              console.log(`      Subcategory ${subIndex + 1}: ${sub.name} (${sub.fields?.length || 0} fields)`);
            });
          }
        });
      }
    } else {
      console.error('❌ Failed to retrieve configuration');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testTemplateEditing();