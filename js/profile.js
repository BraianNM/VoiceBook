// Funciones de Perfil y Edición

// Cargar perfil del usuario
async function loadUserProfile(userId) {
    const profileContent = document.getElementById('userProfileContent');
    if (!profileContent) return; // Si no hay contenedor (no estamos en profile.html)

    try {
        let userProfile = null;
        
        // Intentar cargar como talento
        const talentDoc = await db.collection('talents').doc(userId).get();
        if (talentDoc.exists) {
            userProfile = {
                type: 'talent',
                ...talentDoc.data()
            };
        } else {
            // Intentar cargar como cliente
            const clientDoc = await db.collection('clients').doc(userId).get();
            if (clientDoc.exists) {
                userProfile = {
                    type: 'client',
                    ...clientDoc.data()
                };
            }
        }
        
        if (userProfile) {
            displayUserProfile(userProfile);
            // Mostrar u ocultar pestañas de dashboard
            document.getElementById('jobsTab').style.display = userProfile.type === 'client' ? 'block' : 'none';
            document.getElementById('applicationsTab').style.display = userProfile.type === 'talent' ? 'block' : 'none';
        } else {
            profileContent.innerHTML = 
                '<div class="error">No se encontró perfil. Completa tu registro en la sección correspondiente.</div>';
        }
        
    } catch (error) {
        console.error('Error cargando perfil:', error);
        profileContent.innerHTML = 
            '<div class="error">Error al cargar el perfil: ' + error.message + '</div>';
    }
}

// Mostrar perfil en el dashboard
function displayUserProfile(profile) {
    const profileContent = document.getElementById('userProfileContent');
    
    // Información de ubicación (si está disponible)
    const locationInfo = profile.country && profile.state && profile.city ? 
        `<div class="info-item">
            <label>Ubicación:</label>
            <span>${getCityName(profile.country, profile.state, profile.city)}, ${getStateName(profile.country, profile.state)}, ${getCountryName(profile.country)}</span>
        </div>` : '';
    
    let demosHTML = '';
    if (profile.type === 'talent' && profile.demos && profile.demos.length > 0) {
        demosHTML = `
            <div class="demos-section">
                <h4>Demos de Audio (${profile.demos.length})</h4>
                ${profile.demos.map(demo => `
                    <div class="demo-item">
                        <span class="demo-name">${demo.name || 'Demo sin nombre'}</span>
                        <audio controls src="${demo.url}"></audio>
                        <button class="btn btn-danger btn-sm" onclick="deleteDemo('${demo.publicId}', '${currentUser.uid}')">Eliminar</button>
                    </div>
                `).join('')}
            </div>
        `;
    }

    if (profile.type === 'talent') {
        profileContent.innerHTML = `
            <div class="profile-header">
                <h3>Mi Perfil - Talento</h3>
                <button class="btn btn-primary" onclick="editProfile()">
                    <i class="fas fa-edit"></i> Editar Perfil
                </button>
            </div>
            
            <div class="profile-info">
                <div class="info-grid">
                    <div class="info-item">
                        <label>Nombre:</label>
                        <span>${profile.name || 'No especificado'}</span>
                    </div>
                    <div class="info-item">
                        <label>Email:</label>
                        <span>${profile.email || 'No especificado'}</span>
                    </div>
                    <div class="info-item">
                        <label>Teléfono:</label>
                        <span>${profile.phone || 'No especificado'}</span>
                    </div>
                    ${locationInfo}
                    <div class="info-item">
                        <label>Género:</label>
                        <span>${profile.gender === 'hombre' ? 'Hombre' : 'Mujer'}</span>
                    </div>
                    <div class="info-item">
                        <label>Idiomas:</label>
                        <span>${Array.isArray(profile.languages) ? profile.languages.join(', ') : profile.languages || 'No especificado'}</span>
                    </div>
                    <div class="info-item">
                        <label>Home Studio:</label>
                        <span>${profile.homeStudio === 'si' ? 'Sí' : 'No'}</span>
                    </div>
                    <div class="info-item">
                        <label>Nacionalidad:</label>
                        <span>${profile.nationality || 'No especificado'}</span>
                    </div>
                    ${profile.realAge ? `
                    <div class="info-item">
                        <label>Edad real:</label>
                        <span>${profile.realAge} años</span>
                    </div>
                    ` : ''}
                    ${profile.ageRange ? `
                    <div class="info-item">
                        <label>Rango de edades:</label>
                        <span>${profile.ageRange}</span>
                    </div>
                    ` : ''}
                </div>
                
                <div class="description-section">
                    <label>Descripción:</label>
                    <p>${profile.description || 'Sin descripción'}</p>
                </div>
                ${demosHTML}
            </div>
        `;
    } else {
        // Perfil de Cliente
        profileContent.innerHTML = `
            <div class="profile-header">
                <h3>Mi Perfil - Cliente</h3>
                <button class="btn btn-primary" onclick="editProfile()">
                    <i class="fas fa-edit"></i> Editar Perfil
                </button>
            </div>
            
            <div class="profile-info">
                <div class="info-grid">
                    <div class="info-item">
                        <label>Nombre:</label>
                        <span>${profile.name || 'No especificado'}</span>
                    </div>
                    <div class="info-item">
                        <label>Email:</label>
                        <span>${profile.email || 'No especificado'}</span>
                    </div>
                    <div class="info-item">
                        <label>Teléfono:</label>
                        <span>${profile.phone || 'No especificado'}</span>
                    </div>
                    <div class="info-item">
                        <label>Tipo:</label>
                        <span>${profile.type === 'empresa' ? 'Empresa' : 'Particular'}</span>
                    </div>
                    ${profile.companyName ? `
                        <div class="info-item">
                            <label>Empresa:</label>
                            <span>${profile.companyName}</span>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }
}

// Iniciar proceso de edición
window.editProfile = function() {
    if (!currentUser) return;
    
    loadUserProfile(currentUser.uid).then(profile => {
        if (profile) {
            openEditProfileModal(profile);
        } else {
             alert('No se pudo cargar la información del perfil para edición.');
        }
    });
};

// Abrir modal de edición
window.openEditProfileModal = function(profile) {
    document.getElementById('editProfileMessage').innerHTML = ''; // Limpiar mensajes

    // 1. Campos comunes
    document.getElementById('editName').value = profile.name || '';
    document.getElementById('editPhone').value = profile.phone || '';

    // 2. Ocultar/Mostrar secciones
    const talentFields = document.getElementById('editTalentFields');
    const clientFields = document.getElementById('editClientFields');

    if (profile.type === 'talent') {
        // Mostrar Talento, Ocultar Cliente
        talentFields.style.display = 'block';
        clientFields.style.display = 'none';

        // 3. Llenar campos de Talento
        document.getElementById('editDescription').value = profile.description || '';
        document.getElementById('editNationality').value = profile.nationality || '';
        document.getElementById('editRealAge').value = profile.realAge || '';
        document.getElementById('editAgeRange').value = profile.ageRange || '';
        
        // Cargar demos actuales
        displayCurrentDemosForEdit(profile.demos);

    } else {
        // Mostrar Cliente, Ocultar Talento
        talentFields.style.display = 'none';
        clientFields.style.display = 'block';

        // 3. Llenar campos de Cliente
        const companyInput = document.getElementById('editCompanyName');
        if (companyInput) {
            companyInput.value = profile.companyName || '';
        }
    }
    
    // Limpiar el input de archivo al abrir el modal
    const audioInput = document.getElementById('editAudioFiles');
    if (audioInput) audioInput.value = '';

    document.getElementById('editProfileModal').style.display = 'flex';
};

// Mostrar demos en el modal de edición
window.displayCurrentDemosForEdit = function(demos) {
    const container = document.getElementById('currentDemosEdit');
    if (!container) return;

    if (demos && demos.length > 0) {
        container.innerHTML = `
            <h4 style="margin-top: 0;">Demos Actuales (${demos.length})</h4>
            ${demos.map(demo => `
                <div class="demo-item" style="justify-content: space-between;">
                    <span class="demo-name">${demo.name || 'Demo sin nombre'}</span>
                    <audio controls src="${demo.url}"></audio>
                    <button type="button" class="btn btn-danger btn-sm" onclick="deleteDemo('${demo.publicId}', '${currentUser.uid}')">Eliminar</button>
                </div>
            `).join('')}
        `;
    } else {
        container.innerHTML = `<p class="text-muted">No tienes demos de audio subidos.</p>`;
    }
}

// Actualizar perfil de talento (MODIFICADO para subida y validación)
window.updateTalentProfile = async function() {
    const messageDiv = document.getElementById('editProfileMessage');
    const demoFiles = document.getElementById('editAudioFiles').files;
    const userId = currentUser.uid;
    const MAX_FILES = 2;
    const MAX_SIZE_MB = 10;
    const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
    
    try {
        // 1. VALIDACIÓN DE ARCHIVOS
        if (demoFiles.length > MAX_FILES) {
            showMessage(messageDiv, `❌ Solo puedes subir un máximo de ${MAX_FILES} demos.`, 'error');
            return;
        }
        
        for (const file of demoFiles) {
            if (file.size > MAX_SIZE_BYTES) {
                showMessage(messageDiv, `❌ El archivo "${file.name}" supera el límite de ${MAX_SIZE_MB}MB.`, 'error');
                return;
            }
        }
        
        // 2. PREPARAR DEMOS
        showMessage(messageDiv, '🔄 Guardando cambios y subiendo demos (si aplica)...', 'success');

        let updatedDemos = [];
        const currentDoc = await db.collection('talents').doc(userId).get();
        
        if (demoFiles.length > 0) {
            // Si se suben nuevos demos, SOBREESCRIBIR todos los existentes
            for (const file of demoFiles) {
                const demoData = await uploadToCloudinary(file);
                updatedDemos.push({
                    url: demoData.url,
                    publicId: demoData.publicId,
                    name: file.name,
                    duration: demoData.duration,
                    size: file.size
                });
            }
        } else {
            // Si no se sube nada, mantener los demos actuales
            updatedDemos = currentDoc.data().demos || [];
        }

        // 3. PREPARAR DATOS DE PERFIL
        const updateData = {
            name: document.getElementById('editName').value,
            phone: document.getElementById('editPhone').value,
            description: document.getElementById('editDescription').value,
            nationality: document.getElementById('editNationality').value,
            realAge: document.getElementById('editRealAge').value ? parseInt(document.getElementById('editRealAge').value) : null,
            ageRange: document.getElementById('editAgeRange').value,
            demos: updatedDemos, // Guardar la lista actualizada de demos
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        if (!updateData.name || !updateData.phone) {
            showMessage(messageDiv, '❌ Nombre y teléfono son obligatorios', 'error');
            return;
        }
        
        // 4. ACTUALIZAR FIRESTORE
        await db.collection('talents').doc(userId).update(updateData);
        
        showMessage(messageDiv, '✅ Perfil actualizado correctamente', 'success');
        
        // 5. RECARGAR UI
        setTimeout(() => {
            closeEditProfileModal();
            loadUserProfile(userId); // Recargar perfil en profile.html
        }, 2000);
        
    } catch (error) {
        console.error('Error actualizando perfil:', error);
        showMessage(messageDiv, '❌ Error: ' + error.message, 'error');
    }
};

// Actualizar perfil de cliente
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
        // Filtra el demo a eliminar
        const updatedDemos = currentDemos.filter(demo => demo.publicId !== publicId);
        
        await db.collection('talents').doc(userId).update({
            demos: updatedDemos
        });
        
        // Recargar la vista de perfil
        loadUserProfile(userId);
        
    } catch (error) {
        console.error('Error eliminando demo:', error);
        alert('Error eliminando el demo');
    }
};

// Cerrar modal de edición (ahora vuelve a la vista de perfil completo)
window.closeEditProfileModal = function() {
    document.getElementById('editProfileModal').style.display = 'none';
};


// Exportar funciones
window.loadUserProfile = loadUserProfile;
