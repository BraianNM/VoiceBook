// Funciones de Perfil y Edición

// Cargar perfil del usuario
async function loadUserProfile(userId) {
    try {
        let userProfile = null;
        const profileContent = document.getElementById('userProfileContent');
        if (profileContent) profileContent.innerHTML = '<div class="loading">Cargando perfil...</div>';

        // 1. Intentar cargar como talento
        const talentDoc = await db.collection('talents').doc(userId).get();
        if (talentDoc.exists) {
            userProfile = {
                type: 'talent',
                ...talentDoc.data(),
                id: talentDoc.id
            };
        } else {
            // 2. Intentar cargar como cliente
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
            // Actualizar el estado global con la data más reciente
            window.currentUser = { ...window.currentUser, ...userProfile };
            
            displayUserProfile(userProfile);
            window.updateDashboardTabs(userProfile.type);
            
            // Si el usuario es talento, carga los demos en la pestaña de demos
            if (userProfile.type === 'talent') {
                window.displayUserDemos(userProfile.demos || []);
            }

        } else {
             if (profileContent) profileContent.innerHTML = '<p class="error">❌ No se encontró tu perfil. Por favor, intenta cerrar sesión y volver a iniciarla.</p>';
        }
        
    } catch (error) {
        console.error('Error cargando perfil:', error);
    }
}
window.loadUserProfile = loadUserProfile; // Hacer global

// Actualizar las pestañas del dashboard
window.updateDashboardTabs = function(userType) {
    const demosTab = document.getElementById('demosTab');
    const jobsTab = document.getElementById('jobsTab');
    const applicationsTab = document.getElementById('applicationsTab');
    
    // El talento ve Demos y Postulaciones
    if (userType === 'talent') {
        if (demosTab) demosTab.style.display = 'block';
        if (jobsTab) jobsTab.style.display = 'none';
        if (applicationsTab) applicationsTab.style.display = 'block';
    } 
    // El cliente ve Ofertas
    else if (userType === 'client') {
        if (demosTab) demosTab.style.display = 'none';
        if (jobsTab) jobsTab.style.display = 'block';
        if (applicationsTab) applicationsTab.style.display = 'none';
    }
};


// Mostrar perfil en el dashboard
function displayUserProfile(profile) {
    const profileContent = document.getElementById('userProfileContent');
    const userNameEl = document.getElementById('userName'); // Actualiza el nombre en el header
    if (userNameEl) userNameEl.textContent = `Hola, ${profile.name}`;

    // Información de ubicación (Usando las funciones de locations.js)
    const locationInfo = profile.country && profile.state && profile.city ? 
        `<div class="info-item">
            <label>Ubicación:</label>
            <span>${window.getCityName(profile.country, profile.state, profile.city)}, ${window.getStateName(profile.country, profile.state)}, ${window.getCountryName(profile.country)}</span>
        </div>` : '<div class="info-item"><label>Ubicación:</label><span>N/A</span></div>';
    
    if (profile.type === 'talent') {
        profileContent.innerHTML = `
            <div class="profile-header-container">
                <img src="${profile.photoURL || 'https://via.placeholder.com/120/3498db/ffffff?text=V'}" alt="Foto de Perfil" class="profile-picture-lg">
                <div class="profile-header-text">
                    <h2>${profile.name}</h2>
                    <p class="text-muted">Talento de Voz | ${profile.email}</p>
                    <button class="btn btn-primary btn-sm" onclick="openEditProfileModal()">Editar Perfil</button>
                </div>
            </div>
            
            <div class="info-grid">
                <div class="info-item">
                    <label>Especialidad:</label>
                    <span>${profile.specialty || 'No especificada'}</span>
                </div>
                <div class="info-item">
                    <label>Home Studio:</label>
                    <span>${profile.homeStudio ? 'Sí ✅' : 'No ❌'}</span>
                </div>
                ${locationInfo}
                <div class="info-item">
                    <label>Idiomas:</label>
                    <span>${profile.languages?.join(', ') || 'N/A'}</span>
                </div>
                <div class="info-item">
                    <label>Edad/Rango:</label>
                    <span>${profile.realAge ? `${profile.realAge} años` : 'N/A'} / ${profile.ageRange || 'N/A'}</span>
                </div>
            </div>

            <div class="description-section">
                <h3>Acerca de mí</h3>
                <p>${profile.bio || 'Aún no has escrito tu biografía.'}</p>
            </div>
        `;
    } else if (profile.type === 'client') {
        profileContent.innerHTML = `
            <div class="profile-header-container">
                <img src="${profile.photoURL || 'https://via.placeholder.com/120/546e7a/ffffff?text=C'}" alt="Foto de Cliente" class="profile-picture-lg">
                <div class="profile-header-text">
                    <h2>${profile.name}</h2>
                    <p class="text-muted">${profile.clientType === 'empresa' ? 'Cliente Empresarial' : 'Cliente Particular'} | ${profile.email}</p>
                    <button class="btn btn-primary btn-sm" onclick="openEditProfileModal()">Editar Perfil</button>
                </div>
            </div>
            
            <div class="info-grid">
                ${profile.clientType === 'empresa' ? `<div class="info-item"><label>Empresa:</label><span>${profile.companyName || 'N/A'}</span></div>` : ''}
                ${locationInfo}
                <div class="info-item">
                    <label>Teléfono:</label>
                    <span>${profile.phone || 'N/A'}</span>
                </div>
            </div>
        `;
    }
}
window.displayUserProfile = displayUserProfile;


// Función para abrir el modal de edición y precargar datos
window.openEditProfileModal = function() {
    const profile = window.currentUser;
    if (!profile) return;

    // Campos comunes
    document.getElementById('editProfileType').textContent = profile.type === 'talent' ? '(Talento)' : '(Cliente)';
    document.getElementById('editName').value = profile.name || '';
    document.getElementById('editPhone').value = profile.phone || '';
    document.getElementById('editProfilePicture').src = profile.photoURL || 'https://via.placeholder.com/120/3498db/ffffff?text=V';
    
    // Carga de ubicación
    window.loadEditLocationFields(profile.country, profile.state, profile.city);

    const talentFields = document.getElementById('talentEditFields');
    const companyNameGroup = document.getElementById('editCompanyNameGroup');
    const editAudioFiles = document.getElementById('editAudioFiles');
    
    // Campos de Talento
    if (profile.type === 'talent') {
        talentFields.style.display = 'grid';
        if (companyNameGroup) companyNameGroup.style.display = 'none';

        document.getElementById('editSpecialty').value = profile.specialty || '';
        document.getElementById('editBio').value = profile.bio || '';
        document.getElementById('editHomeStudio').checked = profile.homeStudio || false;
        document.getElementById('editRealAge').value = profile.realAge || '';
        document.getElementById('editAgeRange').value = profile.ageRange || '';
        document.getElementById('editLanguagesDisplay').value = profile.languages?.join(', ') || 'N/A';
        
        if (editAudioFiles) editAudioFiles.value = ''; // Limpiar input file
        window.displayUserDemosEdit(profile.demos || []);
    } 
    // Campos de Cliente
    else if (profile.type === 'client') {
        if (talentFields) talentFields.style.display = 'none';
        if (companyNameGroup) companyNameGroup.style.display = profile.clientType === 'empresa' ? 'block' : 'none';
        if (companyNameGroup) document.getElementById('editCompanyName').value = profile.companyName || '';
    }

    document.getElementById('editProfileModal').style.display = 'flex';
};

// =========================================================================
// GESTIÓN DE DEMOS
// =========================================================================

// Mostrar demos en la pestaña de edición
window.displayUserDemosEdit = function(demos) {
    const container = document.getElementById('currentDemosEdit');
    if (!container) return;

    if (demos.length === 0) {
        container.innerHTML = '<h4>Demos Actuales:</h4><p>Aún no tienes demos de audio subidos.</p>';
        return;
    }

    container.innerHTML = '<h4>Demos Actuales:</h4>';
    const demosGrid = document.createElement('div');
    demosGrid.classList.add('demos-grid');

    demos.forEach(demo => {
        const demoItem = document.createElement('div');
        demoItem.classList.add('demo-item');
        demoItem.innerHTML = `
            <audio controls src="${demo.url}"></audio>
            <button class="btn btn-secondary btn-sm" onclick="window.deleteDemo('${demo.publicId}', '${window.currentUser.uid}')">Eliminar</button>
        `;
        demosGrid.appendChild(demoItem);
    });

    container.appendChild(demosGrid);
};

// Mostrar demos en la pestaña "Mis Demos"
window.displayUserDemos = function(demos) {
    const container = document.getElementById('demosTabContent');
    if (!container) return;

    if (demos.length === 0) {
        container.innerHTML = '<p class="loading">Aún no tienes demos de audio subidos.</p>';
        return;
    }

    container.innerHTML = '<div class="demos-grid"></div>';
    const demosGrid = container.querySelector('.demos-grid');
    
    demos.forEach(demo => {
        const demoItem = document.createElement('div');
        demoItem.classList.add('demo-item');
        demoItem.innerHTML = `
            <p><strong>Formato:</strong> ${demo.format || 'N/A'}</p>
            <audio controls src="${demo.url}"></audio>
            <button class="btn btn-secondary btn-sm" onclick="window.deleteDemo('${demo.publicId}', '${window.currentUser.uid}')">Eliminar</button>
        `;
        demosGrid.appendChild(demoItem);
    });
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
        
        // Refrescar el estado global y el perfil
        window.currentUser.demos = updatedDemos;
        window.loadUserProfile(userId);
        
    } catch (error) {
        console.error('Error eliminando demo:', error);
        alert('Error eliminando el demo');
    }
};

// Subida de demos y actualización de perfil
window.handleDemoUpload = async function(userId, messageDiv) {
    const audioFilesInput = document.getElementById('editAudioFiles');
    const files = audioFilesInput.files;

    if (files.length === 0) {
        return []; // No hay archivos para subir
    }
    if (files.length > 2) {
        showMessage(messageDiv, '❌ Solo puedes subir un máximo de 2 demos a la vez.', 'error');
        throw new Error('Máximo 2 demos.');
    }

    const newDemos = [];
    for (let i = 0; i < files.length; i++) {
        try {
            showMessage(messageDiv, `🔄 Subiendo demo ${i + 1}/${files.length}...`, 'success');
            const demoData = await window.uploadToCloudinary(files[i]);
            newDemos.push(demoData);
        } catch (error) {
            showMessage(messageDiv, `❌ Falló la subida del demo ${i + 1}: ${error.message}`, 'error');
            throw error; 
        }
    }
    
    // Obtener demos actuales y combinarlos
    const currentDoc = await db.collection('talents').doc(userId).get();
    let currentDemos = currentDoc.data().demos || [];
    
    // Limitar el número total de demos (ej. máximo 5)
    const MAX_DEMOS = 5;
    const combinedDemos = [...currentDemos, ...newDemos].slice(-MAX_DEMOS); // Mantiene los últimos MAX_DEMOS

    await db.collection('talents').doc(userId).update({
        demos: combinedDemos
    });
    
    window.currentUser.demos = combinedDemos;
    return combinedDemos;
}

// =========================================================================
// EDICIÓN DE PERFIL
// =========================================================================

// Manejo de la subida de foto de perfil
window.handleProfilePhotoUpload = async function() {
    const photoInput = document.getElementById('editPhotoInput');
    const file = photoInput.files[0];
    const messageDiv = document.getElementById('editProfileMessage');

    if (!file) return;
    
    showMessage(messageDiv, '🔄 Subiendo foto de perfil...', 'success');
    
    try {
        const photoData = await window.uploadToCloudinary(file);
        const photoURL = photoData.url;
        
        await db.collection(window.currentUser.isTalent ? 'talents' : 'clients').doc(window.currentUser.uid).update({
            photoURL: photoURL
        });

        // Actualizar la vista previa
        document.getElementById('editProfilePicture').src = photoURL;
        showMessage(messageDiv, '✅ Foto actualizada. Guarda los cambios para finalizar.', 'success');
        
    } catch (error) {
        console.error('Error subiendo foto:', error);
        showMessage(messageDiv, '❌ Error al subir la foto de perfil.', 'error');
    }
}

// Actualizar perfil de Talento
window.updateTalentProfile = async function(userId) {
    const messageDiv = document.getElementById('editProfileMessage');
    
    try {
        const updateData = {
            name: document.getElementById('editName').value,
            phone: document.getElementById('editPhone').value,
            country: document.getElementById('editCountry').value,
            state: document.getElementById('editState').value,
            city: document.getElementById('editCity').value,
            specialty: document.getElementById('editSpecialty').value,
            bio: document.getElementById('editBio').value,
            homeStudio: document.getElementById('editHomeStudio').checked,
            realAge: parseInt(document.getElementById('editRealAge').value) || null,
            ageRange: document.getElementById('editAgeRange').value,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        if (!updateData.name || !updateData.country) {
            showMessage(messageDiv, '❌ Nombre y ubicación son obligatorios', 'error');
            return;
        }
        
        showMessage(messageDiv, '🔄 Guardando datos...', 'success');
        
        // 1. Subir demos (si los hay)
        await window.handleDemoUpload(userId, messageDiv);
        
        // 2. Actualizar datos de perfil en Firestore
        await db.collection('talents').doc(userId).update(updateData);
        
        // 3. Actualizar estado global y recargar
        window.currentUser = { ...window.currentUser, ...updateData };
        
        showMessage(messageDiv, '✅ Perfil actualizado correctamente', 'success');
        
        setTimeout(() => {
            window.closeEditProfileModal();
            window.loadUserProfile(userId);
        }, 2000);
        
    } catch (error) {
        console.error('❌ Error actualizando perfil:', error);
        showMessage(messageDiv, '❌ Error: ' + error.message, 'error');
    }
};

// Actualizar perfil de Cliente
window.updateClientProfile = async function(userId) {
    const messageDiv = document.getElementById('editProfileMessage');
    const profile = window.currentUser;

    try {
        const updateData = {
            name: document.getElementById('editName').value,
            phone: document.getElementById('editPhone').value,
            country: document.getElementById('editCountry').value,
            state: document.getElementById('editState').value,
            city: document.getElementById('editCity').value,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        if (profile.clientType === 'empresa') {
            updateData.companyName = document.getElementById('editCompanyName').value;
        }
        
        if (!updateData.name || !updateData.country) {
            showMessage(messageDiv, '❌ Nombre y ubicación son obligatorios', 'error');
            return;
        }
        
        showMessage(messageDiv, '🔄 Guardando cambios...', 'success');
        
        await db.collection('clients').doc(userId).update(updateData);
        
        window.currentUser = { ...window.currentUser, ...updateData };

        showMessage(messageDiv, '✅ Perfil actualizado correctamente', 'success');
        
        setTimeout(() => {
            window.closeEditProfileModal();
            window.loadUserProfile(userId);
        }, 2000);
        
    } catch (error) {
        console.error('❌ Error actualizando perfil:', error);
        showMessage(messageDiv, '❌ Error: ' + error.message, 'error');
    }
};

// Cerrar modal de edición
window.closeEditProfileModal = function() {
    const editModal = document.getElementById('editProfileModal');
    if (editModal) editModal.style.display = 'none';
};
