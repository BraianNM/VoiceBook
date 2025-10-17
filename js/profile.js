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
            // Cargar datos para el modal de edición al cargar el perfil
            window.populateEditProfileModal(userProfile); 
        } else {
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
    if (!profileContent) return; 
    
    // Información de ubicación (si está disponible)
    const locationInfo = profile.country && profile.state && profile.city && typeof getCountryName !== 'undefined' ? 
        `<div class="info-item">
            <label>Ubicación:</label>
            <span>${getCityName(profile.country, profile.state, profile.city)}, ${getStateName(profile.country, profile.state)}, ${getCountryName(profile.country)}</span>
        </div>` : '';
    
    if (profile.type === 'talent') {
        let demosHtml = '';
        if (profile.demos && profile.demos.length > 0) {
            demosHtml = profile.demos.map(demo => `
                <div class="demo-item">
                    <span>${demo.name} (${demo.duration ? Math.round(demo.duration) + 's' : ''})</span>
                    <audio controls src="${demo.url}"></audio>
                    <button class="btn btn-danger btn-sm" onclick="window.deleteDemo('${demo.publicId}', '${profile.id}')">Eliminar</button>
                </div>
            `).join('');
        } else {
            demosHtml = '<p>No has subido demos aún.</p>';
        }

        profileContent.innerHTML = `
            <div class="profile-header">
                <h2>Perfil de Talento</h2>
                <button class="btn btn-secondary" onclick="window.openEditProfileModal('${profile.id}', 'talent')">
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
            </div>
            ${locationInfo}
            <p style="margin-top: 15px;"><strong>Biografía:</strong> ${profile.bio || 'Sin biografía.'}</p>
            <p><strong>Idiomas de Trabajo:</strong> ${profile.languages ? profile.languages.join(', ') : 'N/A'}</p>

            <h3 style="margin-top: 20px;">Demos de Voz</h3>
            <div class="demos-section">
                ${demosHtml}
            </div>
        `;
    } else if (profile.type === 'client') {
        profileContent.innerHTML = `
            <div class="profile-header">
                <h2>Perfil de Cliente</h2>
                <button class="btn btn-secondary" onclick="window.openEditProfileModal('${profile.id}', 'client')">
                    <i class="fas fa-edit"></i> Editar Perfil
                </button>
            </div>
            <div class="info-grid">
                <div class="info-item"><label>Nombre de Contacto:</label><span>${profile.name}</span></div>
                <div class="info-item"><label>Email:</label><span>${profile.email}</span></div>
                <div class="info-item"><label>Teléfono:</label><span>${profile.phone || 'N/A'}</span></div>
                <div class="info-item"><label>Tipo de Cliente:</label><span>${profile.clientType === 'empresa' ? 'Empresa / Agencia' : 'Particular'}</span></div>
                ${profile.clientType === 'empresa' && profile.companyName ? `<div class="info-item"><label>Empresa:</label><span>${profile.companyName}</span></div>` : ''}
            </div>
        `;
    }
}
window.displayUserProfile = displayUserProfile;

// Abrir modal de edición y poblarlo
window.openEditProfileModal = function(userId, userType) {
    const editModal = document.getElementById('editProfileModal');
    if (!editModal) return;

    // Asegurarse de que el perfil está cargado y los datos están disponibles
    loadUserProfile(userId); // Esto también poblará el modal si es exitoso
    
    editModal.style.display = 'flex';
};

// Poblar modal de edición con los datos del perfil
window.populateEditProfileModal = function(profile) {
    document.getElementById('editProfileUserId').value = profile.id;
    document.getElementById('editProfileUserType').value = profile.type;
    document.getElementById('editName').value = profile.name || '';
    document.getElementById('editEmail').value = profile.email || '';
    document.getElementById('editPhone').value = profile.phone || '';
    
    // Ocultar/Mostrar campos específicos
    const talentFields = document.getElementById('editTalentFields');
    const clientFields = document.getElementById('editClientFields');
    talentFields.style.display = profile.type === 'talent' ? 'block' : 'none';
    clientFields.style.display = profile.type === 'client' ? 'block' : 'none';

    if (profile.type === 'talent') {
        document.getElementById('editBio').value = profile.bio || '';
        document.getElementById('editGender').value = profile.gender || '';
        document.getElementById('editRealAge').value = profile.realAge || '';
        document.getElementById('editAgeRange').value = profile.ageRange || '';
        
        // Cargar demos actuales
        const currentDemosEdit = document.getElementById('currentDemosEdit');
        if (currentDemosEdit) {
             currentDemosEdit.innerHTML = profile.demos && profile.demos.length > 0 ? 
                `<h4>Demos Actuales (Serán reemplazados si subes nuevos):</h4>
                 ${profile.demos.map(demo => 
                    `<div class="demo-item"><span>${demo.name}</span><audio controls src="${demo.url}"></audio></div>`
                ).join('')}` : 
                '<p>No hay demos subidos. Sube hasta 2 archivos de audio.</p>';
        }
        
        // Cargar ubicación (Requiere locations.js y loadLocationData en app.js)
        const countrySelect = document.getElementById('editCountry');
        const stateSelect = document.getElementById('editState');
        const citySelect = document.getElementById('editCity');
        
        countrySelect.value = profile.country || '';
        window.loadStates(countrySelect.value, stateSelect.id); // Función de locations.js
        
        setTimeout(() => {
            stateSelect.value = profile.state || '';
            window.loadCities(countrySelect.value, stateSelect.value, citySelect.id); // Función de locations.js
        }, 500); // Pequeño delay para asegurar la carga de estados
        
        setTimeout(() => {
            citySelect.value = profile.city || '';
        }, 1000);
        
    } else if (profile.type === 'client') {
        document.getElementById('editClientType').value = profile.clientType || 'particular';
        // Activar el listener de app.js para toggleCompanyNameEdit
        const companyNameGroup = document.getElementById('editCompanyNameGroup');
        if (companyNameGroup) {
             companyNameGroup.style.display = profile.clientType === 'empresa' ? 'block' : 'none';
        }
        document.getElementById('editCompanyName').value = profile.companyName || '';
    }
};
window.populateEditProfileModal = populateEditProfileModal;


// 1. Guardar/Actualizar Perfil de Talento
window.updateTalentProfile = async function(e) {
    e.preventDefault();
    const userId = document.getElementById('editProfileUserId').value;
    const messageDiv = 'editProfileMessage';
    
    window.showMessage(messageDiv, '⏳ Guardando cambios...', 'warning');

    const name = document.getElementById('editName').value;
    const phone = document.getElementById('editPhone').value;
    const bio = document.getElementById('editBio').value;
    const gender = document.getElementById('editGender').value;
    const realAge = document.getElementById('editRealAge').value;
    const ageRange = document.getElementById('editAgeRange').value;
    const country = document.getElementById('editCountry').value;
    const state = document.getElementById('editState').value;
    const city = document.getElementById('editCity').value;
    const newAudioFiles = document.getElementById('editAudioFiles').files;
    
    if (newAudioFiles.length > 2) {
        window.showMessage(messageDiv, '❌ Error: Solo puedes subir un máximo de 2 demos.', 'error');
        return;
    }

    try {
        let demos = [];
        
        if (newAudioFiles.length > 0) {
            // Subir nuevos demos y reemplazar los existentes
            window.showMessage(messageDiv, `📤 Subiendo ${newAudioFiles.length} demo(s) a Cloudinary...`, 'warning');
            
            const uploadPromises = Array.from(newAudioFiles).map(file => {
                return window.uploadToCloudinary(file).then(result => ({
                    url: result.url,
                    publicId: result.publicId,
                    duration: result.duration || 0,
                    name: file.name
                }));
            });
            
            demos = await Promise.all(uploadPromises);
            window.showMessage(messageDiv, '✅ Demos subidos correctamente.', 'success');
        } else {
             // Si no hay nuevos archivos, mantener los demos existentes (opcional: el usuario puede querer borrarlos manualmente si se implementa esa lógica)
             // Por simplicidad, si no sube nuevos, mantengo los existentes al volver a cargar el perfil
             const currentDoc = await db.collection('talents').doc(userId).get();
             demos = currentDoc.data().demos || [];
        }


        const updateData = {
            name: name,
            phone: phone,
            bio: bio,
            gender: gender,
            realAge: realAge,
            ageRange: ageRange,
            country: country,
            state: state,
            city: city,
            demos: demos, // Actualizar demos
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        await db.collection('talents').doc(userId).update(updateData);
        
        window.showMessage(messageDiv, '✅ Perfil actualizado correctamente', 'success');
        
        // Recargar perfil después de un breve delay
        setTimeout(() => {
            window.closeEditProfileModal();
            window.loadUserProfile(userId);
            // Recargar la lista de talentos si estamos en index.html (opcional, pero útil)
            if (typeof window.loadTalents === 'function') window.loadTalents();
        }, 1500);
        
    } catch (error) {
        console.error('❌ Error actualizando perfil de talento:', error);
        window.showMessage(messageDiv, '❌ Error: ' + error.message, 'error');
    }
};

// 2. Guardar/Actualizar Perfil de Cliente
window.updateClientProfile = async function(e) {
    e.preventDefault();
    const userId = document.getElementById('editProfileUserId').value;
    const messageDiv = 'editProfileMessage';
    
    window.showMessage(messageDiv, '⏳ Guardando cambios...', 'warning');

    const name = document.getElementById('editName').value;
    const phone = document.getElementById('editPhone').value;
    const clientType = document.getElementById('editClientType').value;
    const companyName = clientType === 'empresa' ? document.getElementById('editCompanyName').value : '';

    try {
        const updateData = {
            name: name,
            phone: phone,
            clientType: clientType,
            companyName: companyName,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        await db.collection('clients').doc(userId).update(updateData);
        
        window.showMessage(messageDiv, '✅ Perfil actualizado correctamente', 'success');
        
        // Recargar perfil después de un breve delay
        setTimeout(() => {
            window.closeEditProfileModal();
            window.loadUserProfile(userId);
        }, 1500);
        
    } catch (error) {
        console.error('❌ Error actualizando perfil de cliente:', error);
        window.showMessage(messageDiv, '❌ Error: ' + error.message, 'error');
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
        
        window.loadUserProfile(userId);
        
    } catch (error) {
        console.error('Error eliminando demo:', error);
        alert('Error eliminando el demo');
    }
};

// Cerrar modal de edición
window.closeEditProfileModal = function() {
    const editModal = document.getElementById('editProfileModal');
    
    if (editModal) editModal.style.display = 'none';
};
