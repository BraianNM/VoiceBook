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
window.loadUserProfile = loadUserProfile;

// =========================================================
// CORRECCIÓN: Mostrar perfil y Foto de Perfil Robusta
// =========================================================
function displayUserProfile(profile) {
    const profileContent = document.getElementById('userProfileContent');
    const demosTabContent = document.getElementById('demosTabContent');
    const favoritesTab = document.getElementById('favoritesTab');
    const jobsTab = document.getElementById('jobsTab');
    const applicationsTab = document.getElementById('applicationsTab');
    
    if (!profileContent) return; 

    // Ocultar todas las pestañas específicas por defecto
    if (document.getElementById('demosTab')) document.getElementById('demosTab').style.display = 'none';
    if (jobsTab) jobsTab.style.display = 'none';
    if (applicationsTab) applicationsTab.style.display = 'none';

    // Información de ubicación (si está disponible)
    const locationInfo = profile.country && profile.state && profile.city && typeof getCountryName !== 'undefined' ? 
        `<div class="info-item">
            <label>Ubicación:</label>
            <span>${getCityName(profile.country, profile.state, profile.city)}, ${getStateName(profile.country, profile.state, profile.city)}, ${getCountryName(profile.country)}</span>
        </div>` : '';
    
    // Nueva URL de la foto de perfil con fallback
    const photoUrl = profile.photoURL || 'images/default-profile.png';

    let profileHtml = `
        <div class="profile-header">
            <div class="profile-pic-container" style="background-image: url('${photoUrl}');">
            </div>
            <div class="profile-info-header">
                <h2>${profile.name || 'Usuario'} ${profile.lastName || ''}</h2>
                <span class="user-role">${profile.type === 'talent' ? 'Talento de Voz' : 'Cliente'}</span>
                <button class="btn btn-primary" onclick="openEditProfileModal('${profile.type}', '${profile.id}')">
                    <i class="fas fa-edit"></i> Editar Perfil
                </button>
            </div>
        </div>
        
        <div class="info-grid">
            ${profile.phone ? `<div class="info-item"><label>Teléfono:</label><span>${profile.phone}</span></div>` : ''}
            ${locationInfo}
            ${profile.email ? `<div class="info-item"><label>Email:</label><span>${profile.email}</span></div>` : ''}
            ${profile.type === 'client' && profile.companyName ? `<div class="info-item"><label>Empresa:</label><span>${profile.companyName}</span></div>` : ''}
        </div>
        
        ${profile.type === 'talent' ? `
            <h3>Acerca de mí</h3>
            <p>${profile.bio || 'Sin biografía.'}</p>
            
            <h3>Habilidades y Voz</h3>
            <div class="info-grid">
                ${profile.languages && profile.languages.length > 0 ? `<div class="info-item"><label>Idiomas:</label><span>${profile.languages.join(', ')}</span></div>` : ''}
                ${profile.accents && profile.accents.length > 0 ? `<div class="info-item"><label>Acentos:</label><span>${(Array.isArray(profile.accents) ? profile.accents.join(', ') : profile.accents) || 'N/A'}</span></div>` : ''}
                ${profile.voiceType ? `<div class="info-item"><label>Tipo de voz:</label><span>${profile.voiceType}</span></div>` : ''}
                ${profile.realAge ? `<div class="info-item"><label>Edad Real:</label><span>${profile.realAge}</span></div>` : ''}
                ${profile.ageRange ? `<div class="info-item"><label>Rango de Edad:</label><span>${profile.ageRange}</span></div>` : ''}
            </div>
        ` : ''}
    `;

    profileContent.innerHTML = profileHtml;
    
    // Configuración de pestañas específicas
    if (profile.type === 'client') {
        if (jobsTab) jobsTab.style.display = 'block';
        loadClientJobs(profile.id);
    } else if (profile.type === 'talent') {
        if (document.getElementById('demosTab')) document.getElementById('demosTab').style.display = 'block';
        if (applicationsTab) applicationsTab.style.display = 'block';
        loadTalentApplications(profile.id);
    }
    
    // Cargar Demos
    if (demosTabContent && profile.type === 'talent') {
        let demosHtml = `<h4>Demos de Audio Subidos (${profile.demos ? profile.demos.length : 0})</h4>`;
        if (profile.demos && profile.demos.length > 0) {
            demosHtml += profile.demos.map(demo => `
                <div class="demo-item">
                    <span>${demo.name || 'Demo de Audio'} (${demo.duration ? Math.round(demo.duration) + 's' : 'N/A'})</span>
                    <audio controls src="${demo.url}"></audio>
                    <button class="btn btn-danger btn-small" onclick="deleteDemo('${demo.publicId}', '${profile.id}')">Eliminar</button>
                </div>
            `).join('');
            
        } else {
            demosHtml += '<p class="info-box">Aún no has subido demos de audio. Sube uno desde "Editar Perfil".</p>';
        }
        demosTabContent.innerHTML = `<div id="demosContent">${demosHtml}</div>`;
    }

    // Cargar Favoritos
    if (favoritesTab) {
        document.getElementById('favoritesContent').innerHTML = '<div class="loading">Cargando favoritos...</div>';
        loadFavorites(profile.id);
    }
}
window.displayUserProfile = displayUserProfile;


// =========================================================
// FUNCIONES DE EDICIÓN DE PERFIL
// =========================================================

// Abrir modal de edición y cargar datos
window.openEditProfileModal = async function(userType, userId) {
    const modal = document.getElementById('editProfileModal');
    const form = document.getElementById('editProfileForm');
    if (!modal || !form) return;

    modal.style.display = 'flex';
    document.getElementById('editUserType').value = userType;
    document.getElementById('talentSpecificFields').style.display = userType === 'talent' ? 'block' : 'none';
    document.getElementById('editCompanyNameGroup').style.display = userType === 'client' ? 'block' : 'none';

    try {
        const collectionName = userType === 'talent' ? 'talents' : 'clients';
        const doc = await db.collection(collectionName).doc(userId).get();
        if (!doc.exists) throw new Error('Usuario no encontrado');

        const data = doc.data();

        // Campos Comunes
        document.getElementById('editName').value = data.name || '';
        document.getElementById('editLastName').value = data.lastName || '';
        document.getElementById('editPhone').value = data.phone || '';
        document.getElementById('editBio').value = data.bio || '';
        if (userType === 'client' && document.getElementById('editCompanyName')) {
            document.getElementById('editCompanyName').value = data.companyName || '';
        }

        // Campos Específicos de Talento
        if (userType === 'talent') {
            document.getElementById('editVoiceType').value = data.voiceType || '';
            document.getElementById('editAccents').value = Array.isArray(data.accents) ? data.accents.join(', ') : data.accents || '';
            document.getElementById('editRealAge').value = data.realAge || '';
            document.getElementById('editAgeRange').value = data.ageRange || '';

            // Cargar demos actuales para posible eliminación
            const currentDemosEdit = document.getElementById('currentDemosEdit');
            currentDemosEdit.innerHTML = `<h4>Demos Actuales:</h4>`;
            if (data.demos && data.demos.length > 0) {
                 data.demos.forEach(demo => {
                    currentDemosEdit.innerHTML += `
                        <div class="demo-item">
                            <span>${demo.name || 'Demo'}</span>
                            <audio controls src="${demo.url}"></audio>
                            <button class="btn btn-danger btn-small" onclick="deleteDemo('${demo.publicId}', '${userId}')">Eliminar</button>
                        </div>
                    `;
                 });
            } else {
                 currentDemosEdit.innerHTML += `<p class="info-box-small">No hay demos subidos aún.</p>`;
            }

            // Marcar idiomas
            document.querySelectorAll('#talentSpecificFields input[type="checkbox"]').forEach(checkbox => {
                checkbox.checked = data.languages?.includes(checkbox.value) || false;
            });
        }
        
    } catch (error) {
        console.error('Error cargando datos para edición:', error);
        alert('Error al cargar datos del perfil. Intenta de nuevo.');
        closeEditProfileModal();
    }

    form.onsubmit = (e) => {
        e.preventDefault();
        const type = document.getElementById('editUserType').value;
        if (type === 'talent') {
            updateTalentProfile(userId);
        } else {
            updateClientProfile(userId);
        }
    };
};

// Función auxiliar para obtener los idiomas seleccionados del modal
function getSelectedLanguagesFromEditModal() {
    const languages = [];
    document.querySelectorAll('#talentSpecificFields input[type="checkbox"]').forEach(checkbox => {
        if (checkbox.checked) {
            languages.push(checkbox.value);
        }
    });
    return languages;
}


// Actualizar perfil de talento 
window.updateTalentProfile = async function(userId) {
    const messageDiv = document.getElementById('editProfileMessage');
    showMessage(messageDiv, '🔄 Subiendo archivos y guardando cambios... Esto puede tardar.', 'warning');
    
    try {
        const photoFile = document.getElementById('editPhoto').files[0];
        const audioFiles = document.getElementById('editAudioFiles').files;
        
        let photoURL = null;
        if (photoFile) {
            // CORRECCIÓN: Llamada a función global uploadFile (definida en auth.js)
            const photoResult = await uploadFile(photoFile, 'profile_pics'); 
            photoURL = photoResult.url;
        }

        let newDemos = [];
        if (audioFiles.length > 0) {
            for (const file of audioFiles) {
                // CORRECCIÓN: Llamada a función global uploadToCloudinary (definida en auth.js)
                const demoResult = await uploadToCloudinary(file); 
                newDemos.push({
                    url: demoResult.url,
                    publicId: demoResult.publicId,
                    duration: demoResult.duration,
                    name: file.name
                });
            }
        }
        
        const updateData = {
            name: document.getElementById('editName').value,
            lastName: document.getElementById('editLastName').value,
            phone: document.getElementById('editPhone').value,
            bio: document.getElementById('editBio').value,
            languages: getSelectedLanguagesFromEditModal(),
            voiceType: document.getElementById('editVoiceType').value,
            accents: document.getElementById('editAccents').value.split(',').map(s => s.trim()).filter(s => s),
            realAge: parseInt(document.getElementById('editRealAge').value) || null,
            ageRange: document.getElementById('editAgeRange').value,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        if (photoURL) {
            updateData.photoURL = photoURL;
        }

        // Si hay nuevos demos, los adjuntamos/reemplazamos.
        if (newDemos.length > 0) {
            updateData.demos = newDemos;
        }

        await db.collection('talents').doc(userId).update(updateData);
        
        showMessage(messageDiv, '✅ Perfil de Talento actualizado correctamente', 'success');
        
        setTimeout(() => {
            closeEditProfileModal();
            loadUserProfile(userId);
        }, 2000);
        
    } catch (error) {
        console.error('Error actualizando perfil:', error);
        showMessage(messageDiv, '❌ Error: ' + error.message, 'error');
    }
};

// Actualizar perfil de cliente
window.updateClientProfile = async function(userId) {
    const messageDiv = document.getElementById('editProfileMessage');
    
    try {
        const photoFile = document.getElementById('editPhoto').files[0];
        let photoURL = null;
        if (photoFile) {
            showMessage(messageDiv, '🔄 Subiendo foto de perfil...', 'warning');
            // CORRECCIÓN: Llamada a función global uploadFile (definida en auth.js)
            const photoResult = await uploadFile(photoFile, 'profile_pics'); 
            photoURL = photoResult.url;
        }

        const updateData = {
            name: document.getElementById('editName').value,
            lastName: document.getElementById('editLastName').value,
            phone: document.getElementById('editPhone').value,
            bio: document.getElementById('editBio').value,
            companyName: document.getElementById('editCompanyName').value,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        if (photoURL) {
            updateData.photoURL = photoURL;
        }
        
        if (!updateData.name) {
            showMessage(messageDiv, '❌ Nombre es obligatorio', 'error');
            return;
        }
        
        showMessage(messageDiv, '🔄 Guardando cambios...', 'success');
        
        await db.collection('clients').doc(userId).update(updateData);
        
        showMessage(messageDiv, '✅ Perfil de Cliente actualizado correctamente', 'success');
        
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
        // Filtra para mantener solo los demos que NO coinciden con el publicId a eliminar
        const updatedDemos = currentDemos.filter(demo => demo.publicId !== publicId);
        
        await db.collection('talents').doc(userId).update({
            demos: updatedDemos
        });
        
        // Recarga el perfil para refrescar la vista de demos
        loadUserProfile(userId);
        
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
window.closeEditProfileModal = closeEditProfileModal;


// =========================================================
// Funcionalidad de Favoritos, Ofertas, Postulaciones (Auxiliares)
// (Implementación completa debe estar aquí, se deja solo la estructura)
// =========================================================

window.loadFavorites = async function(userId) {
    // ... lógica de favoritos ...
    document.getElementById('favoritesContent').innerHTML = '<p class="info-box">Funcionalidad de favoritos cargada (simulado).</p>';
};

window.loadClientJobs = async function(clientId) {
    // ... lógica de ofertas de cliente ...
    document.getElementById('jobsContent').innerHTML = '<p class="info-box">Ofertas de trabajo cargadas (simulado).</p>';
};

window.loadTalentApplications = async function(talentId) {
    // ... lógica de postulaciones de talento ...
    document.getElementById('applicationsContent').innerHTML = '<p class="info-box">Postulaciones cargadas (simulado).</p>';
};

window.viewTalentProfile = function(talentId) {
    // En una aplicación real, esto redirigiría a la página del perfil del talento
    alert(`Ver perfil completo del talento ${talentId}. Funcionalidad pendiente.`);
};
