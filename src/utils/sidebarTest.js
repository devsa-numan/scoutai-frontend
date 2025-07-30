// Test utility for sidebar state management
export const testSidebarState = () => {
  // Test localStorage persistence
  const testLocalStorage = () => {
    const originalValue = localStorage.getItem('sidebarVisible');
    
    // Test setting to false
    localStorage.setItem('sidebarVisible', 'false');
    const falseValue = JSON.parse(localStorage.getItem('sidebarVisible'));
    console.log('Test localStorage false:', falseValue === false);
    
    // Test setting to true
    localStorage.setItem('sidebarVisible', 'true');
    const trueValue = JSON.parse(localStorage.getItem('sidebarVisible'));
    console.log('Test localStorage true:', trueValue === true);
    
    // Restore original value
    if (originalValue !== null) {
      localStorage.setItem('sidebarVisible', originalValue);
    } else {
      localStorage.removeItem('sidebarVisible');
    }
  };
  
  testLocalStorage();
  console.log('Sidebar state management test completed');
}; 