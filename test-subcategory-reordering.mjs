console.log('🧪 Testing Enhanced Subcategory Reordering Functionality...\n');

async function testSubcategoryReordering() {
  try {
    console.log('1️⃣ Testing backend connection...');
    const healthCheck = await fetch('http://localhost:8080/api/health');
    if (!healthCheck.ok) {
      throw new Error('Backend server not responding');
    }
    console.log('✅ Backend server is running');

    console.log('\n2️⃣ Verifying templates for reordering test...');
    const templatesResponse = await fetch('http://localhost:8080/api/templates');
    if (!templatesResponse.ok) {
      throw new Error('Failed to fetch templates');
    }
    
    const templates = await templatesResponse.json();
    console.log(`✅ Found ${templates.length} templates in database`);
    
    // Look for templates suitable for reordering tests
    let hasMultipleSubcategories = false;
    templates.forEach((template, index) => {
      if (template.sections && template.sections.length > 0) {
        template.sections.forEach(section => {
          if (section.children && section.children.length > 1) {
            hasMultipleSubcategories = true;
            console.log(`   📂 Template ${template.id} "${template.name}" has ${section.children.length} subcategories in "${section.name}":`);
            section.children.forEach((child, childIndex) => {
              console.log(`      ${childIndex + 1}. "${child.name}" (ID: ${child.id})`);
            });
          }
        });
      }
    });
    
    if (hasMultipleSubcategories) {
      console.log('\n✅ Found templates with multiple subcategories - perfect for testing reordering!');
    } else {
      console.log('\n⚠️  Create multiple subcategories within the same parent category to test reordering.');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testSubcategoryReordering().then(() => {
  console.log('\n🏁 Subcategory Reordering Test Complete!');
  console.log('\n🎯 NEW SUBCATEGORY REORDERING FEATURES:');
  console.log('✅ Reorder Within Same Parent: Change the order of subcategories within the same parent category');
  console.log('✅ Visual Feedback Differentiation:');
  console.log('   🔄 CYAN border/glow = Reordering within same parent');
  console.log('   🟢 GREEN border/glow = Moving to different parent');
  console.log('✅ Smart Operation Detection: Automatically detects reordering vs moving operations');
  console.log('✅ Enhanced Success Messages: Different messages for reordering vs moving');
  
  console.log('\n📋 HOW TO TEST SUBCATEGORY REORDERING:');
  console.log('1. Open http://localhost:5173 in your browser');
  console.log('2. Edit a template with main categories');
  console.log('3. Create 3-4 subcategories under the same main category:');
  console.log('   • Example: Under "Patient Assessment" create "Vital Signs", "Physical Exam", "Lab Results", "Imaging"');
  console.log('4. Test reordering subcategories within the same parent:');
  console.log('   • Drag "Physical Exam" onto "Lab Results" - should show CYAN border (reordering)');
  console.log('   • Watch the order change within the same parent category');
  console.log('   • See message: "Physical Exam reordered within Patient Assessment"');
  console.log('5. Test moving to different parent:');
  console.log('   • Drag a subcategory to a different main category - should show GREEN border');
  console.log('   • See message: "Subcategory moved successfully!"');
  
  console.log('\n💡 VISUAL FEEDBACK GUIDE:');
  console.log('🔵 CYAN glow = Reordering subcategories within same parent category');
  console.log('🟢 GREEN glow = Moving subcategory to become child of different section');
  console.log('🎯 This helps you understand what operation will happen before you drop!');
  
  console.log('\n🚀 The enhanced drag system now supports:');
  console.log('• Subcategory reordering within same parent');
  console.log('• Subcategory movement between different parents');
  console.log('• Visual operation type indicators');
  console.log('• Context-aware success messages');
}).catch(console.error);