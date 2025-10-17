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
        }
        
    } catch (error) {
        console.error('Error cargando perfil:', error);
    }
}
window.loadUserProfile = loadUserProfile; // Hacer global

// Mostrar perfil en el dashboard
function displayUserProfile(profile) {
    const profileContent = document.getElementById('userProfileContent');
    
    // Información de ubicación (si está disponible)
    const locationInfo = profile.country && profile.state && profile.city ? 
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
                <div class="info-item"><label>Género:</label><span>${profile.gender}</span></div>
                <div class="info-item"><label>Edad (Real):</label><span>${profile.realAge || 'N/A'}</span></div>
                <div class="info-item"><label>Rango de edad (Roles):</label><span>${profile.ageRange}</span></div>
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
        document.getElementById('jobsTab').style.display = 'block';
        document.getElementById('applicationsTab').style.display = 'none'; // Clientes no tienen postulaciones
    } else {
        profileContent.innerHTML = '<p>No se pudo cargar el perfil del usuario.</p>';
    }
    
    // Abrir el modal del dashboard si aún no está visible
    document.getElementById('dashboardModal').style.display = 'flex';
}

// Abrir modal de edición
window.openEditProfileModal = async function(userId, type) {
    document.getElementById('dashboardModal').style.display = 'none';
    const editModal = document.getElementById('editProfileModal');
    editModal.style.display = 'flex';
    document.getElementById('editProfileMessage').innerHTML = '';

    try {
        let docRef;
        if (type === 'talent') {
            docRef = db.collection('talents').doc(userId);
            document.getElementById('editTalentFields').style.display = 'block';
            document.getElementById('editClientFields').style.display = 'none';
        } else {
            docRef = db.collection('clients').doc(userId);
            document.getElementById('editTalentFields').style.display = 'none';
            document.getElementById('editClientFields').style.display = 'block';
        }

        const doc = await docRef.get();
        if (doc.exists) {
            const data = doc.data();
            document.getElementById('editName').value = data.name || '';
            document.getElementById('editPhone').value = data.phone || '';
            
            if (type === 'talent') {
                document.getElementById('editDescription').value = data.description || '';
                document.getElementById('editHomeStudio').value = data.homeStudio || '';
                // Cargar otros campos del talento si existen en el formulario
            } else {
                if (data.companyName) {
                    document.getElementById('editCompanyNameGroup').style.display = 'block';
                    document.getElementById('editCompanyName').value = data.companyName || '';
                } else {
                    document.getElementById('editCompanyNameGroup').style.display = 'none';
                }
            }
        }
    } catch (error) {
        console.error('Error cargando datos para edición:', error);
        showMessage(document.getElementById('editProfileMessage'), '❌ Error al cargar datos.', 'error');
    }
};

// Actualizar perfil de talento (CORREGIDA: HECHA GLOBAL)
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

// Actualizar perfil de cliente (CORREGIDA: HECHA GLOBAL)
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
        if (companyNameInput && document.getElementById('editClientFields').style.display !== 'none') {
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
    document.getElementById('editProfileModal').style.display = 'none';
    document.getElementById('dashboardModal').style.display = 'flex';
};

// Función auxiliar para mostrar mensajes (redundante, pero necesaria en profile.js si no se carga app.js después)
function showMessage(element, message, type) {
    if (element) {
        element.innerHTML = `<div class="${type}">${message}</div>`;
    }
}
