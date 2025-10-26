// js/debug.js - temporal para diagnosticar
console.log('=== DEBUG VOICEBOOK ===');
console.log('Current User:', currentUser);
console.log('loadUserProfile function:', typeof loadUserProfile);
console.log('showDashboard function:', typeof window.showDashboard);

// Verificar que todo esté cargado
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded');
    
    // Verificar que los elementos existan
    console.log('Dashboard modal exists:', !!document.getElementById('dashboardModal'));
    console.log('Profile content exists:', !!document.getElementById('userProfileContent'));
});
