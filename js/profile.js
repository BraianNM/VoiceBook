// Funciones de Perfil y Edición

// Cargar perfil del usuario
async function loadUserProfile(userId) {
    try {
        let userProfile = null;
        
        // Intentar cargar como talento
        const talentDoc = await db.collection('talents').doc(userId).get();
        if (talentDoc.exists) {
            userProfile = {
                type: 'talent',
                ...talentDoc.data(),
                id: talentDoc.id
            };
        } else {
            // Intentar cargar como cliente
            const clientDoc = await db.collection('clients').doc(userId).get();
            if (clientDoc.exists) {
                userProfile = {
                    type: 'client',
                    ...clientDoc.data(),
                    id: clientDoc.id
                };
            }
        }
        
        if (userProfile) {
            displayUserProfile(userProfile);
        } else {
             // Si el usuario existe pero no tiene perfil (ej. acaba de registrarse), redirigir o mostrar mensaje
             const profileContent = document.getElementById('userProfileContent');
             if (profileContent) profileContent.innerHTML = '<p>Tu perfil no está completo. Por favor, completa tu registro.</p>';
        }
        
    } catch (error) {
        console.error('Error cargando perfil:', error);
    }
}
window.loadUserProfile = loadUserProfile; // Hacer global

// Mostrar perfil en el dashboard
function displayUserProfile(profile) {
    const profileContent = document.getElementById('userProfileContent');
    if (!profileContent) return; // Salir si no estamos en la página de perfil
    
    // Información de ubicación (si está disponible)
    // Asumiendo que getCityName, getStateName y getCountryName están en locations.js
    const locationInfo = profile.country && profile.state && profile.city && typeof getCountryName !== 'undefined' ? 
        `<div class="info-item">
            <label>Ubicación:</label>
            <span>${getCityName(profile.country, profile.state, profile.city)}, ${getStateName(profile.country, profile.state)}, ${getCountryName(profile.country)}</span>
        </div>` : '';
    
    if (profile.type === 'talent') {
        // Lógica de visualización para Talentos
        let demosHtml = '';
        if (profile.demos && profile.demos.length > 0) {
            demosHtml = profile.demos.map(demo => `
                <div class="demo-item">
                    <span>${demo.name} (${demo.duration ? Math.round(demo.duration) + 's' : ''})</span>
                    <audio controls src="${demo.url}"></audio>
                    <button class="btn btn-danger btn-sm" onclick="deleteDemo('${demo.publicId}', '${profile.id}')">Eliminar</button>
                </div>
            `).join('');
        } else {
            demosHtml = '<p>No has subido demos aún.</p>';
        }

        profileContent.innerHTML = `
            <div class="profile-header">
                <h2>Perfil de Talento</h2>
                <button class="btn btn-secondary" onclick="openEditProfileModal('${profile.id}', 'talent')">
                    <i class="fas fa-edit"></i> Editar Perfil
                </button>
            </div>
            <div class="info-grid">
                <div class="info-item"><label>Nombre:</label><span>${profile.name}</span></div>
                <div class="info-item"><label>Email:</label><span>${profile.email}</span></div>
                <div class="info-item"><label>Teléfono:</label><span>${profile.phone || 'N/A'}</span></div>
                <div class="info-item"><label>Género:</label><span>${profile.gender || 'N/A'}</span></div>
                <div class="info-item"><label>Edad (Real):</label><span>${profile.realAge || 'N/A'}</span></div>
                <div class="info-item"><label>Rango de edad (Roles):</label><span>${profile.ageRange || 'N/A'}</span></div>
                <div class="info-item"><label>Nacionalidad:</label><span>${profile.nationality || 'N/A'}</span></div>
                <div class="info-item"><label>Home Studio:</label><span>${profile.homeStudio === 'si' ? 'Sí' : 'No'}</span></div>
                ${locationInfo}
            </div>
            <div class="description-section">
                <h3>Acerca de mí:</h3>
                <p>${profile.description || 'Sin descripción'}</p>
            </div>
            <div class="demos-section">
                <h3>Demos de Audio:</h3>
                ${demosHtml}
            </div>
        `;
        
        // Mostrar pestañas específicas de talento
        if (document.getElementById('jobsTab')) document.getElementById('jobsTab').style.display = 'block';
        if (document.getElementById('applicationsTab')) document.getElementById('applicationsTab').style.display = 'block';
        
    } else if (profile.type === 'client') {
        // Lógica de visualización para Clientes
        profileContent.innerHTML = `
            <div class="profile-header">
                <h2>Perfil de Cliente</h2>
                <button class="btn btn-secondary" onclick="openEditProfileModal('${profile.id}', 'client')">
                    <i class="fas fa-edit"></i> Editar Perfil
                </button>
            </div>
            <div class="info-grid">
                <div class="info-item"><label>Nombre:</label><span>${profile.name}</span></div>
                <div class="info-item"><label>Email:</label><span>${profile.email}</span></div>
                <div class="info-item"><label>Teléfono:</label><span>${profile.phone || 'N/A'}</span></div>
                <div class="info-item"><label>Tipo de Cliente:</label><span>${profile.type === 'empresa' ? 'Empresa' : 'Particular'}</span></div>
                ${profile.companyName ? `<div class="info-item"><label>Empresa:</label><span>${profile.companyName}</span></div>` : ''}
            </div>
        `;
        
        // Mostrar pestañas específicas de cliente/empresa
        if (document.getElementById('jobsTab')) document.getElementById('jobsTab').style.display = 'block';
        if (document.getElementById('applicationsTab')) document.getElementById('applicationsTab').style.display = 'none';
        
    } else {
        profileContent.innerHTML = '<p>No se pudo cargar el perfil del usuario.</p>';
    }
    
    // Abrir el modal del dashboard si aún no está visible
    if (document.getElementById('dashboardModal')) document.getElementById('dashboardModal').style.display = 'flex';
}

// Abrir modal de edición (CORRECCIÓN: VERIFICACIÓN DE ELEMENTOS)
window.openEditProfileModal = async function(userId, type) {
    const dashboardModal = document.getElementById('dashboardModal');
    const editModal = document.getElementById('editProfileModal');
    const messageDiv = document.getElementById('editProfileMessage');

    // 1. Ocultar Dashboard y Mostrar Modal de Edición
    if (dashboardModal) dashboardModal.style.display = 'none';
    if (editModal) editModal.style.display = 'flex';
    if (messageDiv) messageDiv.innerHTML = '';
    
    // Si no encontramos el modal, reportar en la consola y salir
    if (!editModal) {
        console.error("❌ ERROR: No se encontró el modal de edición ('editProfileModal'). Asegúrate de que existe en el HTML.");
        return;
    }

    try {
        let docRef;
        const talentFields = document.getElementById('editTalentFields');
        const clientFields = document.getElementById('editClientFields');

        // 2. Mostrar/Ocultar campos según el tipo de usuario
        if (type === 'talent') {
            if (talentFields) talentFields.style.display = 'block';
            if (clientFields) clientFields.style.display = 'none';
            docRef = db.collection('talents').doc(userId);
        } else {
            if (talentFields) talentFields.style.display = 'none';
            if (clientFields) clientFields.style.display = 'block';
            docRef = db.collection('clients').doc(userId);
        }

        // 3. Cargar datos del perfil
        const doc = await docRef.get();
        if (doc.exists) {
            const data = doc.data();
            
            // 4. Rellenar campos comunes (con verificación de existencia)
            if (document.getElementById('editName')) document.getElementById('editName').value = data.name || '';
            if (document.getElementById('editPhone')) document.getElementById('editPhone').value = data.phone || '';
            
            // 5. Rellenar campos específicos (con verificación de existencia)
            if (type === 'talent') {
                if (document.getElementById('editDescription')) document.getElementById('editDescription').value = data.description || '';
                if (document.getElementById('editHomeStudio')) document.getElementById('editHomeStudio').value = data.homeStudio || '';
                // Ejemplo de otros campos de talento:
                if (document.getElementById('editGender')) document.getElementById('editGender').value = data.gender || '';
            } else {
                const companyGroup = document.getElementById('editCompanyNameGroup');
                const companyInput = document.getElementById('editCompanyName');

                if (data.companyName && companyGroup && companyInput) {
                    companyGroup.style.display = 'block';
                    companyInput.value = data.companyName || '';
                } else if (companyGroup) {
                    companyGroup.style.display = 'none';
                }
            }
        } else {
            showMessage(messageDiv, '❌ Error: No se encontró el perfil del usuario.', 'error');
        }
    } catch (error) {
        console.error('❌ Error al cargar datos para edición:', error);
        showMessage(messageDiv, `❌ Error al cargar datos: ${error.message}`, 'error');
    }
};

// Actualizar perfil de talento (HECHA GLOBAL)
window.updateTalentProfile = async function() {
    const messageDiv = document.getElementById('editProfileMessage');
    
    try {
        const userId = currentUser.uid;
        const updateData = {
            name: document.getElementById('editName').value,
            phone: document.getElementById('editPhone').value,
            description: document.getElementById('editDescription').value,
            homeStudio: document.getElementById('editHomeStudio').value,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        if (!updateData.name || !updateData.description) {
            showMessage(messageDiv, '❌ Nombre y descripción son obligatorios', 'error');
            return;
        }
        
        showMessage(messageDiv, '🔄 Guardando cambios...', 'success');
        
        await db.collection('talents').doc(userId).update(updateData);
        
        showMessage(messageDiv, '✅ Perfil actualizado correctamente', 'success');
        
        setTimeout(() => {
            closeEditProfileModal();
            loadUserProfile(userId);
        }, 2000);
        
    } catch (error) {
        console.error('Error actualizando perfil:', error);
        showMessage(messageDiv, '❌ Error: ' + error.message, 'error');
    }
};

// Actualizar perfil de cliente (HECHA GLOBAL)
window.updateClientProfile = async function() {
    const messageDiv = document.getElementById('editProfileMessage');
    
    try {
        const userId = currentUser.uid;
        const updateData = {
            name: document.getElementById('editName').value,
            phone: document.getElementById('editPhone').value,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        const companyNameInput = document.getElementById('editCompanyName');
        if (companyNameInput) {
            updateData.companyName = companyNameInput.value;
        }
        
        if (!updateData.name) {
            showMessage(messageDiv, '❌ Nombre es obligatorio', 'error');
            return;
        }
        
        showMessage(messageDiv, '🔄 Guardando cambios...', 'success');
        
        await db.collection('clients').doc(userId).update(updateData);
        
        showMessage(messageDiv, '✅ Perfil actualizado correctamente', 'success');
        
        setTimeout(() => {
            closeEditProfileModal();
            loadUserProfile(userId);
        }, 2000);
        
    } catch (error) {
        console.error('❌ Error actualizando perfil:', error);
        showMessage(messageDiv, '❌ Error: ' + error.message, 'error');
    }
};

// Eliminar demo de audio
window.deleteDemo = async function(publicId, userId) {
    if (!confirm('¿Estás seguro de que quieres eliminar este demo?')) {
        return;
    }
    
    try {
        const currentDoc = await db.collection('talents').doc(userId).get();
        const currentDemos = currentDoc.data().demos || [];
        const updatedDemos = currentDemos.filter(demo => demo.publicId !== publicId);
        
        await db.collection('talents').doc(userId).update({
            demos: updatedDemos
        });
        
        loadUserProfile(userId);
        
    } catch (error) {
        console.error('Error eliminando demo:', error);
        alert('Error eliminando el demo');
    }
};

// Cerrar modal de edición
window.closeEditProfileModal = function() {
    const editModal = document.getElementById('editProfileModal');
    const dashboardModal = document.getElementById('dashboardModal');
    
    if (editModal) editModal.style.display = 'none';
    if (dashboardModal) dashboardModal.style.display = 'flex';
};

// Función auxiliar para mostrar mensajes
function showMessage(element, message, type) {
    if (element) {
        element.innerHTML = `<div class="${type}">${message}</div>`;
    }
}
