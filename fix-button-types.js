#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// List of files that have buttons without type attributes that need fixing
const filesToFix = [
  'frontend/src/pages/TaskDetail.jsx',
  'frontend/src/components/project/ProjectMembers.jsx', 
  'frontend/src/components/common/NotificationPanel.jsx',
  'frontend/src/components/layout/DashboardLayout.jsx',
  'frontend/src/pages/Documents.jsx',
  'frontend/src/pages/Dashboard.jsx',
  'frontend/src/pages/CreateTask.jsx',
  'frontend/src/pages/CreateProject.jsx'
];

function fixButtonTypes(content) {
  // Fix buttons that don't have type attribute
  return content.replace(
    /<button(?![^>]*type=)([^>]*?)>/g,
    '<button type="button"$1>'
  );
}

function processFile(filePath) {
  try {
    const fullPath = path.join(__dirname, filePath);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const fixed = fixButtonTypes(content);
      
      if (content !== fixed) {
        fs.writeFileSync(fullPath, fixed, 'utf8');
        console.log(`Fixed button types in: ${filePath}`);
      }
    } else {
      console.log(`File not found: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
}

console.log('Starting button type fix...');
filesToFix.forEach(processFile);
console.log('Button type fix completed!');
