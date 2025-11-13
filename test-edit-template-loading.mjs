// Test configuration loading functionality
console.log('🧪 Testing Configuration Loading When Editing Templates');
console.log('='.repeat(60));

// Test the configuration loading endpoint
const testConfigurationLoading = async () => {
  try {
    console.log('1. Testing configuration endpoint...');
    
    const response = await fetch('http://localhost:8080/api/templates/1/configuration');
    if (response.ok) {
      const config = await response.json();
      console.log('✅ Configuration endpoint working');
      console.log('📋 Available configuration data:');
      console.log('   - Template ID:', config.templateId);
      console.log('   - Template Name:', config.templateName);
      console.log('   - View Mode:', config.configuration?.viewMode);
      console.log('   - Show HPI Bullets:', config.configuration?.showHPIBullets);
      console.log('   - Show Headers:', config.configuration?.showHeaders);
      console.log('   - Sections Count:', config.configuration?.sections?.length);
      console.log('   - Generated At:', config.configuration?.generatedAt);
      
      if (config.configuration?.sections) {
        console.log('\n📋 Available Sections:');
        config.configuration.sections.forEach((section, index) => {
          console.log(`   ${index + 1}. ${section.name || section.id} (${section.fields?.length || 0} fields)`);
        });
      }
      
      return config;
    } else {
      console.log('❌ No configuration found for template 1');
      return null;
    }
  } catch (error) {
    console.log('❌ Error testing configuration endpoint:', error.message);
    return null;
  }
};

// Test template endpoint to see what sections are in the template itself
const testTemplateEndpoint = async () => {
  try {
    console.log('\n2. Testing template endpoint...');
    
    const response = await fetch('http://localhost:8080/api/templates/1');
    if (response.ok) {
      const template = await response.json();
      console.log('✅ Template endpoint working');
      console.log('📋 Template sections count:', template.sections?.length || 0);
      console.log('📊 Template metadata available:', !!template.metadata);
      
      if (template.sections && template.sections.length > 0) {
        console.log('\n📋 Template Default Sections:');
        template.sections.forEach((section, index) => {
          console.log(`   ${index + 1}. ${section.name} (${section.fields?.length || 0} fields)`);
        });
      }
      
      return template;
    } else {
      console.log('❌ Template not found');
      return null;
    }
  } catch (error) {
    console.log('❌ Error testing template endpoint:', error.message);
    return null;
  }
};

// Run tests
const runTests = async () => {
  console.log('🚀 Starting configuration loading tests...\n');
  
  const config = await testConfigurationLoading();
  const template = await testTemplateEndpoint();
  
  console.log('\n🎯 RESULTS SUMMARY:');
  console.log('='.repeat(40));
  
  if (config && template) {
    const configSections = config.configuration?.sections?.length || 0;
    const templateSections = template.sections?.length || 0;
    
    console.log('✅ Both endpoints working');
    console.log(`📊 Configuration sections: ${configSections}`);
    console.log(`📊 Template sections: ${templateSections}`);
    
    if (configSections > templateSections) {
      console.log('🎉 GOOD: Configuration has more sections than template default');
      console.log('   → This means saved configuration is being preserved!');
    } else if (configSections === templateSections) {
      console.log('ℹ️  Configuration and template have same section count');
    } else {
      console.log('⚠️  Template has more sections than saved configuration');
    }
    
    // Check specific configuration settings
    if (config.configuration) {
      console.log('\n📋 Saved Configuration Settings:');
      console.log(`   → View Mode: ${config.configuration.viewMode}`);
      console.log(`   → Show HPI Bullets: ${config.configuration.showHPIBullets}`);
      console.log(`   → Show Headers: ${config.configuration.showHeaders}`);
      console.log(`   → Last Modified: ${config.configuration.generatedAt ? new Date(config.configuration.generatedAt).toLocaleString() : 'Unknown'}`);
      
      console.log('\n🎯 WHEN YOU EDIT THIS TEMPLATE:');
      console.log('   ✅ Form should load with these saved settings');
      console.log('   ✅ View mode should be restored');
      console.log('   ✅ Checkbox states should be preserved');
      console.log('   ✅ All sections and fields should appear');
    }
    
  } else if (config && !template) {
    console.log('❌ Configuration exists but template not found');
  } else if (!config && template) {
    console.log('⚠️  Template exists but no saved configuration');
    console.log('   → This is normal for new templates');
  } else {
    console.log('❌ Neither configuration nor template found');
  }
  
  console.log('\n💡 TESTING INSTRUCTIONS:');
  console.log('1. Start your servers: node server.js & npm run dev');
  console.log('2. Open the app and edit a template that has saved configuration');
  console.log('3. Check if previous settings are loaded automatically');
  console.log('4. Use "Apply Config to Form" button if manual loading needed');
};

// Run the tests
runTests().catch(console.error);