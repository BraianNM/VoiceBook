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
            // Actualizar datos globales (fundamental para la edición)
            window.currentUserData = userProfile; 
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

// Mostrar perfil en el dashboard (CORREGIDO: Muestra la foto de perfil)
function displayUserProfile(profile) {
    const profileContent = document.getElementById('userProfileContent');
    const profileNameEl = document.getElementById('profileName');
    const profileTypeEl = document.getElementById('profileType');
    const profilePhotoEl = document.getElementById('profilePhoto'); // Nuevo elemento

    if (!profileContent) return; 
    
    // CORRECCIÓN: Asignar nombre, tipo y foto
    profileNameEl.textContent = profile.name || 'Usuario';
    // Usar profilePhotoUrl, si no existe, usar un placeholder
    profilePhotoEl.src = profile.profilePhotoUrl || 'https://via.placeholder.com/120?text=V';
    
    // Información de ubicación
    const countryName = typeof window.getCountryName === 'function' ? window.getCountryName(profile.country) : profile.country;
    const stateName = typeof window.getStateName === 'function' ? window.getStateName(profile.country, profile.state) : profile.state;
    const locationDisplay = countryName && stateName ? `${profile.city}, ${stateName}, ${countryName}` : 'Ubicación no especificada';
    
    let contentHtml = `<div class="info-section"><h2>Información General</h2>
        <div class="info-grid">
            <div class="info-item"><label>Email:</label><span>${profile.email || 'N/A'}</span></div>
            <div class="info-item"><label>Teléfono:</label><span>${profile.phone || 'N/A'}</span></div>
            <div class="info-item"><label>Ubicación:</label><span>${locationDisplay}</span></div>
        </div>
    </div>`;

    if (profile.type === 'talent') {
        profileTypeEl.textContent = 'Talento de Voz';
        
        contentHtml += `
            <div class="info-section"><h2>Características de la Voz</h2>
                <div class="info-grid">
                    <div class="info-item"><label>Edad Real:</label><span>${profile.realAge || 'N/A'}</span></div>
                    <div class="info-item"><label>Rango de Edad:</label><span>${profile.ageRange || 'N/A'}</span></div>
                    <div class="info-item"><label>Género de Voz:</label><span>${profile.gender || 'N/A'}</span></div>
                </div>
            </div>
            <div class="info-section"><h2>Idiomas</h2>
                <p>${profile.languages ? profile.languages.join(', ') : 'No especificado'}</p>
            </div>
            <div class="info-section"><h2>Demos de Audio (${profile.demos?.length || 0})</h2>
                <div class="demos-section">
                    ${profile.demos && profile.demos.length > 0 ? 
                        profile.demos.map(demo => `
                            <div class="demo-item">
                                <audio controls src="${demo.url}"></audio>
                                <span>${demo.name || 'Demo de audio'}</span>
                                <button class="btn btn-danger btn-sm" onclick="window.deleteDemo('${demo.publicId}', '${profile.id}')"><i class="fas fa-trash"></i></button>
                            </div>
                        `).join('')
                        : '<p>Aún no has subido demos de audio. Sube hasta 2 en el modal de edición.</p>'
                    }
                </div>
            </div>
        `;
        // Mostrar pestañas específicas de Talento
        document.getElementById('favoritesTabBtn').style.display = 'block';
        document.getElementById('applicationsTabBtn').style.display = 'block';
        document.getElementById('jobsTabBtn').style.display = 'none';
        document.getElementById('clientNotificationsTabBtn').style.display = 'none';
        
    } else { // Client
        profileTypeEl.textContent = profile.clientType === 'empresa' ? 'Cliente Empresa' : 'Cliente Particular';
        if (profile.clientType === 'empresa') {
            contentHtml += `<div class="info-section"><h2>Datos de la Empresa</h2>
                <div class="info-grid">
                    <div class="info-item"><label>Nombre Empresa:</label><span>${profile.companyName || 'N/A'}</span></div>
                    <div class="info-item"><label>Tipo de Cliente:</label><span>Empresa</span></div>
                </div>
            </div>`;
        }
        // Mostrar pestañas específicas de Cliente
        document.getElementById('favoritesTabBtn').style.display = 'block';
        document.getElementById('applicationsTabBtn').style.display = 'none';
        document.getElementById('jobsTabBtn').style.display = 'block';
        document.getElementById('clientNotificationsTabBtn').style.display = 'block';
    }
    
    profileContent.innerHTML = contentHtml;
}


// Abre el modal y precarga los datos 
window.openEditProfileModal = function() {
     if (window.currentUserData) {
        // Asegurar que la función de populate se haya ejecutado al cargar el perfil
        // Si no se ejecutó, la volvemos a llamar
        window.populateEditProfileModal(window.currentUserData); 
        document.getElementById('editProfileModal').style.display = 'flex';
     } else {
        alert('Por favor, espera a que se carguen tus datos de perfil antes de editar.');
     }
}

// Llenar el modal de edición con los datos actuales (CORREGIDO: Carga de Ubicación)
window.populateEditProfileModal = async function(profile) {
    const editModal = document.getElementById('editProfileModal');
    if (!editModal) return;
    
    document.getElementById('editProfileUserId').value = profile.id;
    
    // Asignar campos comunes
    document.getElementById('editName').value = profile.name || '';
    document.getElementById('editEmail').value = profile.email || ''; 
    document.getElementById('editPhone').value = profile.phone || '';
    
    // CORRECCIÓN CLAVE: Carga de Ubicación para Edición
    // Llama a la función de locations.js para llenar los selects y preseleccionar
    if (typeof window.loadLocationData === 'function') {
        window.loadLocationData('editCountry', 'editState', 'editCity', profile.country, profile.state, profile.city);
    } 

    // Manejar campos de Talento vs Cliente
    const editTalentFields = document.getElementById('editTalentFields');
    const editClientFields = document.getElementById('editClientFields');
    
    // Limpiar inputs de archivo al abrir el modal para evitar subidas accidentales
    document.getElementById('editProfilePhoto')?.value = '';
    document.getElementById('editProfilePhotoClient')?.value = ''; 
    document.getElementById('editAudioFiles')?.value = ''; 


    if (profile.type === 'talent') {
        editTalentFields.style.display = 'block';
        editClientFields.style.display = 'none';
        
        document.getElementById('editGender').value = profile.gender || '';
        document.getElementById('editRealAge').value = profile.realAge || '';
        document.getElementById('editAgeRange').value = profile.ageRange || '';

        // Precargar idiomas (asumo que se usa un prefijo 'edit' para los checkboxes)
        document.querySelectorAll('[name="editLanguages"]').forEach(cb => {
            cb.checked = profile.languages && profile.languages.includes(cb.value);
            if (cb.value === 'otros') {
                document.getElementById('editOtherLanguages').value = profile.languages.find(lang => !document.getElementById(cb.id).value.includes(lang)) || '';
                document.getElementById('editOtherLanguages').style.display = cb.checked ? 'block' : 'none';
            }
        });
        
        // Mostrar demos actuales
        const currentDemosEdit = document.getElementById('currentDemosEdit');
        if (currentDemosEdit) {
            currentDemosEdit.innerHTML = profile.demos && profile.demos.length > 0 ? 
                `<h4>Demos Actuales:</h4>` + profile.demos.map(demo => `
                    <div class="demo-item">
                        <audio controls src="${demo.url}"></audio>
                        <span>${demo.name || 'Demo de audio'}</span>
                    </div>
                `).join('')
                : '<p>No hay demos subidos aún.</p>';
        }

    } else { // Client
        editTalentFields.style.display = 'none';
        editClientFields.style.display = 'block';
        
        document.getElementById('editClientType').value = profile.clientType || 'particular';
        document.getElementById('editCompanyName').value = profile.companyName || '';
        
        // Función auxiliar para mostrar/ocultar el campo de empresa
        const toggleCompanyNameEdit = () => {
             document.getElementById('editCompanyNameGroup').style.display = (document.getElementById('editClientType').value === 'empresa') ? 'block' : 'none';
        };
        // Inicializar
        toggleCompanyNameEdit();
        // Añadir listener si no existe (se añade en app.js para la inicialización)
    }
};


// Delegar el submit al handler correcto
window.handleEditProfileSubmit = function(e) {
    e.preventDefault();
    if (!window.currentUserData) {
        alert('Error: Datos de usuario no cargados. Intenta recargar la página.');
        return;
    }
    
    if (window.currentUserData.type === 'talent') {
        window.updateTalentProfile(e);
    } else if (window.currentUserData.type === 'client') {
        window.updateClientProfile(e);
    }
};


// Actualizar perfil de Talento (CORREGIDO: Maneja subida de Foto de Perfil)
window.updateTalentProfile = async function(e) {
    e.preventDefault();
    const userId = document.getElementById('editProfileUserId').value;
    const messageDiv = document.getElementById('editProfileMessage');
    window.showMessage(messageDiv, 'Actualizando perfil...', 'warning');

    try {
        // 1. Obtener campos comunes
        const newName = document.getElementById('editName').value;
        const newPhone = document.getElementById('editPhone').value;
        const newCountry = document.getElementById('editCountry').value;
        const newState = document.getElementById('editState').value;
        const newCity = document.getElementById('editCity').value;
        
        // 2. Obtener la nueva foto de perfil (NUEVO)
        const photoFile = document.getElementById('editProfilePhoto').files[0];
        let newProfilePhotoUrl = null;
        
        if (photoFile) {
             window.showMessage(messageDiv, 'Subiendo nueva foto de perfil...', 'warning');
             // Usar la función global de auth.js
             const uploadResult = await window.uploadToCloudinary(photoFile);
             newProfilePhotoUrl = uploadResult.url;
             window.showMessage(messageDiv, 'Foto subida. Guardando datos...', 'warning');
        }

        // 3. Crear el objeto de actualización 
        let updateData = {
            name: newName,
            phone: newPhone,
            country: newCountry,
            state: newState,
            city: newCity,
            gender: document.getElementById('editGender').value,
            realAge: document.getElementById('editRealAge').value,
            ageRange: document.getElementById('editAgeRange').value,
            languages: window.getSelectedLanguages('edit'), 
            lastUpdate: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Agregar la URL de la foto si se subió una nueva
        if (newProfilePhotoUrl) {
            updateData.profilePhotoUrl = newProfilePhotoUrl;
        }
        
        // 4. Actualizar Firestore
        await db.collection('talents').doc(userId).update(updateData);
        
        // Actualizar datos globales y recargar
        window.currentUserData = { ...window.currentUserData, ...updateData };
        
        window.showMessage(messageDiv, '✅ Perfil actualizado correctamente', 'success');
        
        setTimeout(() => {
            window.closeEditProfileModal();
            window.loadUserProfile(userId);
        }, 1500); 
        
    } catch (error) {
        console.error('❌ Error actualizando perfil:', error);
        window.showMessage(messageDiv, '❌ Error: ' + error.message, 'error');
    }
};

// Actualizar perfil de Cliente (CORREGIDO: Maneja subida de Foto de Perfil)
window.updateClientProfile = async function(e) {
    e.preventDefault();
    const userId = document.getElementById('editProfileUserId').value;
    const messageDiv = document.getElementById('editProfileMessage');
    window.showMessage(messageDiv, 'Actualizando perfil de cliente...', 'warning');

    try {
        // 1. Obtener campos comunes
        const newName = document.getElementById('editName').value;
        const newPhone = document.getElementById('editPhone').value;
        const newCountry = document.getElementById('editCountry').value;
        const newState = document.getElementById('editState').value;
        const newCity = document.getElementById('editCity').value;
        
        // 2. Obtener la nueva foto de perfil (NUEVO)
        const photoFile = document.getElementById('editProfilePhotoClient').files[0]; 
        let newProfilePhotoUrl = null;
        
        if (photoFile) {
             window.showMessage(messageDiv, 'Subiendo nueva foto de perfil...', 'warning');
             const uploadResult = await window.uploadToCloudinary(photoFile);
             newProfilePhotoUrl = uploadResult.url;
             window.showMessage(messageDiv, 'Foto subida. Guardando datos...', 'warning');
        }

        // 3. Crear el objeto de actualización 
        const clientType = document.getElementById('editClientType').value;
        let updateData = {
            name: newName,
            phone: newPhone,
            country: newCountry,
            state: newState,
            city: newCity,
            clientType: clientType,
            companyName: clientType === 'empresa' ? document.getElementById('editCompanyName').value : null,
            lastUpdate: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Agregar la URL de la foto si se subió una nueva
        if (newProfilePhotoUrl) {
            updateData.profilePhotoUrl = newProfilePhotoUrl;
        }

        // 4. Actualizar Firestore
        await db.collection('clients').doc(userId).update(updateData);
        
        // Actualizar datos globales y recargar
        window.currentUserData = { ...window.currentUserData, ...updateData };
        
        window.showMessage(messageDiv, '✅ Perfil actualizado correctamente', 'success');
        
        setTimeout(() => {
            window.closeEditProfileModal();
            window.loadUserProfile(userId);
        }, 1500);
        
    } catch (error) {
        console.error('❌ Error actualizando perfil de cliente:', error);
        window.showMessage(messageDiv, '❌ Error: ' + error.message, 'error');
    }
};


// Eliminar demo de audio... (se mantiene)
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

// Cerrar modal de edición (Corregido para limpiar inputs de archivo)
window.closeEditProfileModal = function() {
    const editModal = document.getElementById('editProfileModal');
    // Limpiar mensaje
    const messageDiv = document.getElementById('editProfileMessage');
    if (messageDiv) messageDiv.innerHTML = '';
    
    // Limpiar inputs de archivo
    document.getElementById('editProfilePhoto')?.value = '';
    document.getElementById('editProfilePhotoClient')?.value = '';
    document.getElementById('editAudioFiles')?.value = '';
    
    if (editModal) editModal.style.display = 'none';
};

// Función auxiliar para el cambio de tipo de cliente en edición
function toggleCompanyNameEdit() {
    const companyNameGroup = document.getElementById('editCompanyNameGroup');
    const clientTypeSelect = document.getElementById('editClientType');
    if (companyNameGroup && clientTypeSelect) {
        companyNameGroup.style.display = clientTypeSelect.value === 'empresa' ? 'block' : 'none';
    }
}
window.toggleCompanyNameEdit = toggleCompanyNameEdit;
