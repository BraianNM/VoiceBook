// Funciones de Perfil y Edición

// Variable global para almacenar los datos del perfil (usada por las tabs)
window.currentUserData = null;

// Cargar perfil del usuario (MODIFICADO para mostrar imagen y ocultar/mostrar tabs)
async function loadUserProfile(userId) {
    try {
        let userProfile = null;
        let userType = '';
        
        // 1. Intentar cargar como talento
        const talentDoc = await db.collection('talents').doc(userId).get();
        if (talentDoc.exists) {
            userType = 'talent';
            userProfile = {
                type: userType,
                ...talentDoc.data(),
                id: talentDoc.id
            };
        } else {
            // 2. Intentar cargar como cliente
            const clientDoc = await db.collection('clients').doc(userId).get();
            if (clientDoc.exists) {
                userType = 'client';
                userProfile = {
                    type: userType,
                    ...clientDoc.data(),
                    id: clientDoc.id
                };
            }
        }
        
        window.currentUserData = userProfile;

        if (userProfile) {
            // 3. Mostrar tabs correctas (Talento o Cliente)
            const isTalent = userType === 'talent';
            document.querySelectorAll('.talent-only').forEach(el => el.style.display = isTalent ? 'block' : 'none');
            document.querySelectorAll('.client-only').forEach(el => el.style.display = !isTalent ? 'block' : 'none');
            
            // 4. Mostrar info de cabecera (Imagen y Nombre)
            const defaultAvatar = isTalent ? 'img/default-avatar.png' : 'img/default-avatar-client.png';
            document.getElementById('userProfilePicture').src = userProfile.profilePictureUrl || defaultAvatar;
            document.getElementById('userProfileName').textContent = userProfile.name || userProfile.email;
            document.getElementById('userProfileType').textContent = isTalent ? 'Perfil de Talento' : 'Perfil de Cliente';
            
            // 5. Mostrar detalles
            displayUserProfile(userProfile);
            
            // Si el cliente está en su pestaña de notificaciones, recargarlas
            if (userType === 'client' && document.getElementById('client-notificationsTabContent')?.classList.contains('active')) {
                window.loadClientApplications(userId);
            }
            
        } else {
             const profileContent = document.getElementById('userProfileContent');
             if (profileContent) profileContent.innerHTML = '<p>Tu perfil no está completo. Por favor, completa tu registro.</p>';
        }
        
    } catch (error) {
        console.error('Error cargando perfil:', error);
    }
}
window.loadUserProfile = loadUserProfile; // Hacer global

// Mostrar perfil en el dashboard (MODIFICADO para usar imagen y ubicación)
function displayUserProfile(profile) {
    const profileContent = document.getElementById('userProfileContent');
    if (!profileContent) return; 
    
    // Información de ubicación (usando helper functions de locations.js)
    const locationInfo = profile.country && profile.state && profile.city && typeof getCountryName !== 'undefined' ? 
        `<div class="info-item">
            <label>Ubicación:</label>
            <span>${window.getCityName(profile.country, profile.state, profile.city)}, ${window.getStateName(profile.country, profile.state)}, ${window.getCountryName(profile.country)}</span>
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
                <h2>Detalles de Talento</h2>
                <button class="btn btn-secondary" onclick="window.openEditProfileModal('${profile.id}', 'talent')">
                    <i class="fas fa-edit"></i> Editar Perfil
                </button>
            </div>
            <div class="info-grid">
                <div class="info-item"><label>Nombre:</label><span>${profile.name}</span></div>
                <div class="info-item"><label>Email:</label><span>${profile.email}</span></div>
                <div class="info-item"><label>Teléfono:</label><span>${profile.phone || 'N/A'}</span></div>
                ${locationInfo} 
                <div class="info-item"><label>Género:</label><span>${profile.gender || 'N/A'}</span></div>
                <div class="info-item"><label>Edad (Real):</label><span>${profile.realAge || 'N/A'}</span></div>
                <div class="info-item"><label>Rango de edad (Roles):</label><span>${profile.ageRange || 'N/A'}</span></div>
                <div class="info-item"><label>Nacionalidad:</label><span>${profile.nationality || 'N/A'}</span></div>
                <div class="info-item"><label>Home Studio:</label><span>${profile.hasHomeStudio ? 'Sí' : 'No'}</span></div>
                <div class="info-item full-width"><label>Idiomas:</label><span>${profile.languages && profile.languages.length > 0 ? profile.languages.join(', ') : 'N/A'}</span></div>
                <div class="info-item full-width"><label>Biografía:</label><span>${profile.bio || 'Aún no has agregado una biografía.'}</span></div>
            </div>
            <div class="demos-section">
                <h3>Demos de Audio</h3>
                ${demosHtml}
            </div>
        `;
    } else if (profile.type === 'client') {
        profileContent.innerHTML = `
            <div class="profile-header">
                <h2>Detalles de Cliente</h2>
                <button class="btn btn-secondary" onclick="window.openEditProfileModal('${profile.id}', 'client')">
                    <i class="fas fa-edit"></i> Editar Perfil
                </button>
            </div>
            <div class="info-grid">
                <div class="info-item"><label>Nombre:</label><span>${profile.name}</span></div>
                <div class="info-item"><label>Email:</label><span>${profile.email}</span></div>
                <div class="info-item"><label>Teléfono:</label><span>${profile.phone || 'N/A'}</span></div>
                ${locationInfo} 
                <div class="info-item"><label>Tipo de Cliente:</label><span>${profile.clientType === 'empresa' ? 'Empresa' : 'Particular'}</span></div>
                ${profile.companyName ? `<div class="info-item"><label>Empresa:</label><span>${profile.companyName}</span></div>` : ''}
            </div>
        `;
    }
}
window.displayUserProfile = displayUserProfile;

// Abrir modal de edición y poblar campos (MODIFICADO para imagen y ubicación)
window.openEditProfileModal = async function(userId, userType) {
    const modal = document.getElementById('editProfileModal');
    if (!modal) return;

    modal.style.display = 'flex';
    document.getElementById('editUserId').value = userId;
    document.getElementById('editUserType').value = userType;
    document.getElementById('editProfileMessage').innerHTML = '';

    // Poblar los campos con datos actuales
    let docRef = userType === 'talent' ? db.collection('talents').doc(userId) : db.collection('clients').doc(userId);
    
    try {
        const doc = await docRef.get();
        if (doc.exists) {
            const data = doc.data();

            document.getElementById('editName').value = data.name || '';
            document.getElementById('editPhone').value = data.phone || '';
            
            // NUEVO: Imagen de perfil
            const currentPicDiv = document.getElementById('currentProfilePicture');
            const defaultAvatar = userType === 'talent' ? 'img/default-avatar.png' : 'img/default-avatar-client.png';
            
            if (userType === 'talent') {
                 document.getElementById('editProfilePictureGroup').style.display = 'block';
                 currentPicDiv.innerHTML = data.profilePictureUrl && data.profilePictureUrl !== defaultAvatar ? 
                    `<small>Foto actual:</small><img src="${data.profilePictureUrl}" style="width:50px; height:50px; border-radius:50%; object-fit:cover;">` : 
                    '<small>No hay foto de perfil cargada.</small>';
            } else {
                 document.getElementById('editProfilePictureGroup').style.display = 'none';
            }


            // NUEVO: Lógica para poblar ubicaciones.
            if (typeof window.loadLocationData === 'function') {
                // Llama a loadLocationData con los datos actuales para preseleccionar
                window.loadLocationData('editCountrySelect', 'editStateSelect', 'editCitySelect', data.country, data.state, data.city);
            }

            // Lógica para campos específicos
            if (userType === 'talent') {
                document.getElementById('editTalentFields').style.display = 'block';
                document.getElementById('editClientFields').style.display = 'none';

                // Poblar campos de talento
                document.getElementById('editGender').value = data.gender || '';
                document.getElementById('editRealAge').value = data.realAge || '';
                document.getElementById('editAgeRange').value = data.ageRange || '';
                document.getElementById('editNationality').value = data.nationality || '';
                document.getElementById('editBio').value = data.bio || '';
                document.getElementById('editHasHomeStudio').checked = data.hasHomeStudio || false;

                // Mostrar demos actuales
                const currentDemosDiv = document.getElementById('currentDemosEdit');
                if (data.demos && data.demos.length > 0) {
                    currentDemosDiv.innerHTML = '<h4>Demos Actuales:</h4>' + data.demos.map(demo => `
                        <div class="demo-item-edit">
                            <span>${demo.name}</span>
                            <audio controls src="${demo.url}"></audio>
                            <button type="button" class="btn btn-danger btn-sm" onclick="window.deleteDemo('${demo.publicId}', '${userId}')">Eliminar</button>
                        </div>
                    `).join('');
                } else {
                    currentDemosDiv.innerHTML = '<p>No hay demos subidos.</p>';
                }
                
            } else if (userType === 'client') {
                document.getElementById('editTalentFields').style.display = 'none';
                document.getElementById('editClientFields').style.display = 'block';

                // Poblar campos de cliente
                document.getElementById('editClientType').value = data.clientType || 'particular';
                document.getElementById('editCompanyName').value = data.companyName || '';
                window.toggleCompanyName(); // Para mostrar/ocultar el campo de empresa
            }
        }
    } catch (error) {
        console.error('Error poblando modal de edición:', error);
        window.showMessage('editProfileMessage', '❌ Error al cargar datos para edición.', 'error');
    }
}
window.openEditProfileModal = openEditProfileModal;

// Actualizar perfil de Talento (MODIFICADO para imagen y ubicación)
window.updateTalentProfile = async function(e) {
    e.preventDefault();
    const userId = document.getElementById('editUserId').value;
    const messageDiv = 'editProfileMessage';
    window.showMessage(messageDiv, '⌛ Guardando cambios de talento...', 'info');

    const profilePictureFile = document.getElementById('editProfilePicture').files[0];
    let profilePictureUrl = null;

    try {
        // 1. Subir Imagen de Perfil si existe
        if (profilePictureFile) {
            window.showMessage(messageDiv, '🖼️ Subiendo nueva foto de perfil...', 'info');
            const uploadResult = await window.uploadToCloudinary(profilePictureFile);
            profilePictureUrl = uploadResult.url;
        }

        // 2. Preparar datos de ubicación
        const country = document.getElementById('editCountrySelect').value;
        const state = document.getElementById('editStateSelect').value;
        const city = document.getElementById('editCitySelect').value;
        
        // 3. Validar ubicación
        if (!country || !state || !city) {
            window.showMessage(messageDiv, '❌ Error: Por favor, selecciona País, Provincia/Estado y Ciudad.', 'error');
            return;
        }

        // 4. Preparar datos para Firestore
        const updateData = {
            name: document.getElementById('editName').value,
            phone: document.getElementById('editPhone').value,
            // NUEVO: Ubicación
            country: country,
            state: state,
            city: city,

            // Campos de Talento
            gender: document.getElementById('editGender').value,
            realAge: document.getElementById('editRealAge').value,
            ageRange: document.getElementById('editAgeRange').value,
            nationality: document.getElementById('editNationality').value,
            bio: document.getElementById('editBio').value,
            hasHomeStudio: document.getElementById('editHasHomeStudio').checked,
        };

        // Si se subió una nueva imagen, agregarla a los datos de actualización
        if (profilePictureUrl) {
            updateData.profilePictureUrl = profilePictureUrl;
        }

        // 5. Subir Demos si existen
        const audioFiles = document.getElementById('editAudioFiles').files;
        if (audioFiles.length > 0) {
            window.showMessage(messageDiv, `🎧 Subiendo ${audioFiles.length} demos de audio...`, 'info');
            let newDemos = [];
            
            for (const file of audioFiles) {
                const uploadResult = await window.uploadToCloudinary(file);
                newDemos.push({
                    name: file.name,
                    url: uploadResult.url,
                    publicId: uploadResult.publicId,
                    duration: uploadResult.duration
                });
            }
            updateData.demos = newDemos; // Reemplaza los demos existentes
        }


        // 6. Actualizar Firestore
        await db.collection('talents').doc(userId).update(updateData);
        
        window.showMessage(messageDiv, '✅ Perfil actualizado correctamente', 'success');
        
        setTimeout(() => {
            window.closeEditProfileModal();
            window.loadUserProfile(userId);
        }, 2000);
        
    } catch (error) {
        console.error('❌ Error actualizando perfil:', error);
        window.showMessage(messageDiv, '❌ Error: ' + error.message, 'error');
    }
};
window.updateTalentProfile = updateTalentProfile;

// Actualizar perfil de Cliente (MODIFICADO para ubicación)
window.updateClientProfile = async function(e) {
    e.preventDefault();
    const userId = document.getElementById('editUserId').value;
    const messageDiv = 'editProfileMessage';
    window.showMessage(messageDiv, '⌛ Guardando cambios de cliente...', 'info');

    try {
        // Preparar datos de ubicación
        const country = document.getElementById('editCountrySelect').value;
        const state = document.getElementById('editStateSelect').value;
        const city = document.getElementById('editCitySelect').value;
        
        // Validar ubicación
        if (!country || !state || !city) {
            window.showMessage(messageDiv, '❌ Error: Por favor, selecciona País, Provincia/Estado y Ciudad.', 'error');
            return;
        }

        // Preparar datos para Firestore
        const clientType = document.getElementById('editClientType').value;
        const updateData = {
            name: document.getElementById('editName').value,
            phone: document.getElementById('editPhone').value,
            clientType: clientType,
            companyName: clientType === 'empresa' ? document.getElementById('editCompanyName').value : '',
            // NUEVO: Ubicación
            country: country,
            state: state,
            city: city,
        };
        
        // Actualizar Firestore
        await db.collection('clients').doc(userId).update(updateData);
        
        window.showMessage(messageDiv, '✅ Perfil actualizado correctamente', 'success');
        
        setTimeout(() => {
            window.closeEditProfileModal();
            window.loadUserProfile(userId);
        }, 2000);
        
    } catch (error) {
        console.error('❌ Error actualizando perfil:', error);
        window.showMessage(messageDiv, '❌ Error: ' + error.message, 'error');
    }
};
window.updateClientProfile = updateClientProfile;


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
window.deleteDemo = deleteDemo;

// Cerrar modal de edición
window.closeEditProfileModal = function() {
    const editModal = document.getElementById('editProfileModal');
    
    if (editModal) editModal.style.display = 'none';
};
window.closeEditProfileModal = closeEditProfileModal;


// ======================================================
// NUEVO: Funcionalidad de Postulaciones y Notificaciones
// ======================================================

// 1. Cliente recibe notificaciones de postulaciones
window.loadClientApplications = async function(clientId) {
    const listElement = document.getElementById('clientNotificationsList');
    if (!listElement) return;

    listElement.innerHTML = '<h3>Cargando Postulaciones...</h3>';

    try {
        // Buscar todas las postulaciones donde el trabajo pertenezca al cliente.
        const applicationsSnapshot = await db.collection('applications')
            .where('clientId', '==', clientId)
            .get();

        if (applicationsSnapshot.empty) {
            listElement.innerHTML = '<p>Aún no has recibido postulaciones a tus ofertas de trabajo.</p>';
            return;
        }

        let html = '<div class="application-list">';
        
        // Obtener IDs de trabajos y talentos para batching (más eficiente)
        const jobIds = [...new Set(applicationsSnapshot.docs.map(doc => doc.data().jobId))];
        const talentIds = [...new Set(applicationsSnapshot.docs.map(doc => doc.data().talentId))];
        
        // Mapas para almacenar data y evitar múltiples lecturas
        const jobMap = {};
        const talentMap = {};

        // Cargar data de trabajos (max 10, si hay más se puede optimizar con arrays)
        if (jobIds.length > 0) {
            const jobDocs = await db.collection('jobOffers').where(firebase.firestore.FieldPath.documentId(), 'in', jobIds).get();
            jobDocs.forEach(doc => jobMap[doc.id] = doc.data());
        }
        
        // Cargar data de talentos
        if (talentIds.length > 0) {
            const talentDocs = await db.collection('talents').where(firebase.firestore.FieldPath.documentId(), 'in', talentIds).get();
            talentDocs.forEach(doc => talentMap[doc.id] = doc.data());
        }


        applicationsSnapshot.docs.forEach(doc => {
            const app = doc.data();
            const jobTitle = jobMap[app.jobId] ? jobMap[app.jobId].title : 'Oferta Eliminada';
            const applicantName = talentMap[app.talentId] ? talentMap[app.talentId].name : 'Talento Eliminado';
            
            html += `
                <div class="application-item">
                    <div>
                        <span>El talento 
                            <a href="#" class="applicant-link" onclick="window.viewTalentProfile('${app.talentId}'); return false;">
                                ${applicantName}
                            </a> se ha postulado a tu oferta: 
                            <strong>${jobTitle}</strong>.
                        </span>
                        <small style="display:block; color:#777;">Postulado el: ${app.appliedAt ? new Date(app.appliedAt.seconds * 1000).toLocaleDateString() : 'N/A'}</small>
                    </div>
                    <button class="btn btn-success btn-sm" onclick="alert('Funcionalidad de Contactar a ${applicantName} (${app.talentId}) pendiente.');">Contactar</button>
                </div>
            `;
        });

        html += '</div>';
        listElement.innerHTML = html;

    } catch (error) {
        console.error('Error cargando postulaciones de cliente:', error);
        listElement.innerHTML = '<p class="error">❌ Error al cargar las postulaciones. Intenta de nuevo.</p>';
    }
};
window.loadClientApplications = loadClientApplications;


// 2. Cliente puede ver el perfil del postulante haciendo click en su nombre
window.viewTalentProfile = function(talentId) {
    // Alerta simple para mostrar que la función es clickable.
    // Aquí podrías implementar la lógica para abrir un modal con la información del talento
    alert(`Cargando perfil público del talento con ID: ${talentId}. Funcionalidad completa de visualización de perfil pendiente.`);
};
window.viewTalentProfile = viewTalentProfile;


// Funciones de las otras tabs (Mis Postulaciones, Mis Ofertas)
// Placeholder para que los event listeners de profile.html no fallen.
window.loadTalentApplications = function(talentId) {
    const listElement = document.getElementById('talentApplicationsList');
    if (listElement) listElement.innerHTML = '<p>Funcionalidad de "Mis Postulaciones Realizadas" pendiente de desarrollo.</p>';
};

window.loadClientJobOffers = function(clientId) {
    const listElement = document.getElementById('myJobsList');
    if (listElement) listElement.innerHTML = '<p>Funcionalidad de "Mis Ofertas Publicadas" pendiente de desarrollo.</p>';
};
