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

// =========================================================
// 4. CORRECCIÓN: Mostrar perfil y Demos en el dashboard
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
            <span>${getCityName(profile.country, profile.state, profile.city)}, ${getStateName(profile.country, profile.state)}, ${getCountryName(profile.country)}</span>
        </div>` : '';

    let profileHtml = `
        <div class="profile-header">
            <div class="profile-pic-container">
                <img src="${profile.photoURL || 'images/default-profile.png'}" alt="Foto de perfil" class="profile-image">
            </div>
            <div class="profile-info-header">
                <h2>${profile.name || 'Usuario'} ${profile.lastName || ''}</h2>
                <span class="user-role">${profile.type === 'talent' ? 'Talento de Voz' : 'Cliente'}</span>
                <button class="btn btn-primary" onclick="openEditProfileModal('${profile.type}')">
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
                ${profile.accents && profile.accents.length > 0 ? `<div class="info-item"><label>Acentos:</label><span>${profile.accents.join(', ')}</span></div>` : ''}
                ${profile.voiceType ? `<div class="info-item"><label>Tipo de voz:</label><span>${profile.voiceType}</span></div>` : ''}
                ${profile.realAge ? `<div class="info-item"><label>Edad Real:</label><span>${profile.realAge}</span></div>` : ''}
                ${profile.ageRange ? `<div class="info-item"><label>Rango de Edad:</label><span>${profile.ageRange}</span></div>` : ''}
            </div>
        ` : ''}
    `;

    profileContent.innerHTML = profileHtml;
    
    // Configuración de pestañas específicas
    if (profile.type === 'client') {
        // Cliente: Mis Ofertas, Favoritos
        if (jobsTab) jobsTab.style.display = 'block';
        // 3. Cargar trabajos y postulantes
        loadClientJobs(profile.id);
    } else if (profile.type === 'talent') {
        // Talento: Demos, Favoritos, Mis Postulaciones
        if (document.getElementById('demosTab')) document.getElementById('demosTab').style.display = 'block';
        if (applicationsTab) applicationsTab.style.display = 'block';
        // 3. Cargar postulaciones
        loadTalentApplications(profile.id);
    }
    
    // 4. CORRECCIÓN: Cargar Demos
    if (demosTabContent && profile.type === 'talent') {
        let demosHtml = '';
        if (profile.demos && profile.demos.length > 0) {
            demosHtml = profile.demos.map(demo => `
                <div class="demo-item">
                    <span>${demo.name || 'Demo de Audio'} (${demo.duration ? Math.round(demo.duration) + 's' : 'N/A'})</span>
                    <audio controls src="${demo.url}"></audio>
                    <button class="btn btn-danger btn-small" onclick="deleteDemo('${demo.publicId}', '${profile.id}')">Eliminar</button>
                </div>
            `).join('');
            
        } else {
            demosHtml = '<p class="info-box">Aún no has subido demos de audio. Sube uno desde "Editar Perfil".</p>';
        }
        demosTabContent.innerHTML = demosHtml;
    }

    // 5. CORRECCIÓN: Cargar Favoritos
    if (favoritesTab) {
        document.getElementById('favoritesContent').innerHTML = '<div class="loading">Cargando favoritos...</div>';
        loadFavorites(profile.id);
    }
}
window.displayUserProfile = displayUserProfile;


// =========================================================
// 5. Corrección: Funcionalidad de Favoritos (Talento o Cliente)
// =========================================================
window.loadFavorites = async function(userId) {
    const favoritesContent = document.getElementById('favoritesContent');
    if (!favoritesContent) return;
    
    favoritesContent.innerHTML = '<div class="loading">Cargando favoritos...</div>';

    try {
        const userType = await getUserType(userId);
        const collectionName = userType === 'talent' ? 'talents' : 'clients';
        const userDoc = await db.collection(collectionName).doc(userId).get();
        
        if (!userDoc.exists) {
            favoritesContent.innerHTML = '<p class="error-box">Perfil de usuario no encontrado.</p>';
            return;
        }

        const favoriteIds = userDoc.data().favorites || [];
        
        if (favoriteIds.length === 0) {
            favoritesContent.innerHTML = '<p class="info-box">Aún no tienes talentos favoritos.</p>';
            return;
        }
        
        // Cargar los perfiles de los talentos favoritos
        let favoritesHtml = '';
        for (const talentId of favoriteIds) {
            const talentDoc = await db.collection('talents').doc(talentId).get();
            if (talentDoc.exists) {
                const talent = talentDoc.data();
                favoritesHtml += `
                    <div class="talent-card">
                        <div class="profile-pic-small" style="background-image: url('${talent.photoURL || 'images/default-profile.png'}');"></div>
                        <h3>${talent.name} ${talent.lastName}</h3>
                        <p>${talent.bio ? talent.bio.substring(0, 100) + '...' : 'Sin biografía'}</p>
                        <p class="languages">Idiomas: ${talent.languages ? talent.languages.join(', ') : 'N/A'}</p>
                        <button class="btn btn-outline btn-small" onclick="viewTalentProfile('${talentId}')">Ver Perfil</button>
                        <button class="btn btn-warning btn-small" onclick="addToFavorites('${talentId}')">Quitar Fav</button>
                    </div>
                `;
            }
        }
        
        favoritesContent.innerHTML = favoritesHtml;

    } catch (error) {
        console.error('Error cargando favoritos:', error);
        favoritesContent.innerHTML = '<p class="error-box">Error al cargar la lista de favoritos.</p>';
    }
};


// =========================================================
// 3. Corrección: Funcionalidad de Postulaciones (Cliente: Mis Ofertas y Postulantes)
// =========================================================
window.loadClientJobs = async function(clientId) {
    const jobsContainer = document.getElementById('jobsContent');
    if (!jobsContainer) return;
    
    jobsContainer.innerHTML = '<div class="loading">Cargando mis ofertas y postulantes...</div>';

    try {
        // Cargar ofertas creadas por el cliente
        const snapshot = await db.collection('jobs').where('clientId', '==', clientId).get();
        
        if (snapshot.empty) {
            jobsContainer.innerHTML = '<p class="info-box">Aún no has publicado ninguna oferta de trabajo.</p>';
            return;
        }
        
        let jobsHtml = '';
        
        for (const doc of snapshot.docs) {
            const job = doc.data();
            const jobId = doc.id;
            const applicants = job.applicants || [];
            
            jobsHtml += `
                <div class="client-job-card">
                    <h3>${job.title}</h3>
                    <p><strong>Requisitos:</strong> ${job.requirements || 'N/A'}</p>
                    <p><strong>Postulantes:</strong> ${applicants.length}</p>
                    <div class="applicants-list" id="applicants-${jobId}">
                        <h4>Postulantes (${applicants.length}):</h4>
            `;
            
            if (applicants.length === 0) {
                jobsHtml += '<p class="info-box-small">No hay postulantes aún.</p>';
            } else {
                for (const talentId of applicants) {
                    const talentDoc = await db.collection('talents').doc(talentId).get();
                    const talent = talentDoc.exists ? talentDoc.data() : { name: 'Talento Eliminado', lastName: '' };
                    
                    // Al hacer click en el perfil, se redirige a viewTalentProfile (que permite ver info de contacto si el cliente está logeado)
                    jobsHtml += `
                        <div class="applicant-item">
                            <span>${talent.name} ${talent.lastName}</span>
                            <button class="btn btn-outline btn-small" onclick="viewTalentProfile('${talentId}')">Ver Perfil</button>
                        </div>
                    `;
                }
            }
            
            jobsHtml += `
                    </div>
                </div>
            `;
        }
        
        jobsContainer.innerHTML = jobsHtml;

    } catch (error) {
        console.error('Error cargando ofertas del cliente:', error);
        jobsContainer.innerHTML = '<p class="error-box">Error al cargar tus ofertas de trabajo.</p>';
    }
};

// =========================================================
// 3. Corrección: Funcionalidad de Postulaciones (Talento: Mis Postulaciones)
// =========================================================
window.loadTalentApplications = async function(talentId) {
    const appsContainer = document.getElementById('applicationsContent');
    if (!appsContainer) return;
    
    appsContainer.innerHTML = '<div class="loading">Cargando mis postulaciones...</div>';

    try {
        const talentDoc = await db.collection('talents').doc(talentId).get();
        if (!talentDoc.exists) {
            appsContainer.innerHTML = '<p class="error-box">Tu perfil no fue encontrado.</p>';
            return;
        }
        
        const jobIds = talentDoc.data().applications || []; 
        
        if (jobIds.length === 0) {
            appsContainer.innerHTML = '<p class="info-box">Aún no te has postulado a ninguna oferta de trabajo.</p>';
            return;
        }
        
        let applicationsHtml = '';
        
        for (const jobId of jobIds) {
            const jobDoc = await db.collection('jobs').doc(jobId).get();
            
            if (jobDoc.exists) {
                const job = jobDoc.data();
                
                // Cargar datos del cliente que publicó la oferta
                const clientDoc = await db.collection('clients').doc(job.clientId).get();
                const client = clientDoc.exists ? clientDoc.data() : { name: 'Cliente Eliminado' };
                
                applicationsHtml += `
                    <div class="application-item">
                        <h4>${job.title}</h4>
                        <p><strong>Publicado por:</strong> ${client.companyName || client.name || 'N/A'}</p>
                        <p><strong>Requisitos:</strong> ${job.requirements ? job.requirements.substring(0, 100) + '...' : 'N/A'}</p>
                        <p><strong>Estado:</strong> En espera de respuesta del cliente.</p>
                    </div>
                `;
            } else {
                 applicationsHtml += `
                    <div class="application-item deleted-job">
                        <h4>Oferta Eliminada</h4>
                        <p>Esta oferta de trabajo ya no está disponible.</p>
                    </div>
                `;
            }
        }
        
        appsContainer.innerHTML = applicationsHtml;

    } catch (error) {
        console.error('Error cargando postulaciones del talento:', error);
        appsContainer.innerHTML = '<p class="error-box">Error al cargar tus postulaciones.</p>';
    }
};


// [ ... existing functions like openEditProfileModal, updateTalentProfile, deleteDemo, closeEditProfileModal, showMessage ... ]
// (Asegúrate de tener las funciones auxiliares restantes como updateTalentProfile, updateClientProfile, deleteDemo, etc. en el archivo)
// Las que no se muestran aquí son por espacio, pero deben estar en el archivo real.
