// Funciones principales de la aplicación

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    window.checkAuthState(); // Aseguramos que checkAuthState se ejecute al inicio
    
    // CORRECCIÓN: Asegurar que la carga de talentos solo corra en index.html
    if (!window.location.href.includes('profile.html')) {
        loadTalents();
        loadJobOffers();
        // Asegúrate que locations.js está cargado y define window.loadLocationData
        if (typeof window.loadLocationData === 'function') { 
            window.loadLocationData('countrySelectTalent', 'stateSelectTalent', 'citySelectTalent');
            window.loadLocationData('countrySelectClient', 'stateSelectClient', 'citySelectClient');
        }
    }
    
    // CORRECCIÓN: Agregar listener para el select de edición de cliente
    document.getElementById('editClientType')?.addEventListener('change', toggleCompanyNameEdit);
});

// Configurar event listeners 
function setupEventListeners() {
    // Listeners de Modales y Navegación
    document.getElementById('heroTalentBtn')?.addEventListener('click', () => document.getElementById('talentModal').style.display = 'flex');
    document.getElementById('heroClientBtn')?.addEventListener('click', () => document.getElementById('clientModal').style.display = 'flex');
    document.getElementById('registerBtn')?.addEventListener('click', () => document.getElementById('talentModal').style.display = 'flex');
    document.getElementById('loginBtn')?.addEventListener('click', () => document.getElementById('loginModal').style.display = 'flex');
    
    // Redirección al Dashboard/Profile
    document.getElementById('dashboardLink')?.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = 'profile.html';
    });
    
    document.getElementById('logoutBtn')?.addEventListener('click', logoutUser);

    document.querySelectorAll('.close-modal').forEach(button => {
        button.addEventListener('click', closeAllModals);
    });

    // Listeners de Formularios de Autenticación/Registro
    document.getElementById('talentForm')?.addEventListener('submit', registerTalent);
    document.getElementById('clientForm')?.addEventListener('submit', registerClient);
    document.getElementById('loginForm')?.addEventListener('submit', loginUser);

    document.getElementById('clientType')?.addEventListener('change', toggleCompanyName);
    document.getElementById('lang10')?.addEventListener('change', toggleOtherLanguages);
    
    // Listener para el formulario de edición de perfil (Llama a profile.js)
    document.getElementById('editProfileForm')?.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const isTalent = document.getElementById('editProfileUserType')?.value === 'talent';
        
        if (isTalent) {
            // Se asume que updateTalentProfile es global y definido en profile.js
            if (typeof window.updateTalentProfile === 'function') {
                window.updateTalentProfile(e);
            } else {
                 console.error('❌ Error: La función updateTalentProfile no está definida o no es global.');
                 window.showMessage('editProfileMessage', '❌ Funcionalidad de edición de talento no disponible.', 'error');
            }
        } else {
            // Se asume que updateClientProfile es global y definido en profile.js
            if (typeof window.updateClientProfile === 'function') {
                window.updateClientProfile(e);
            } else {
                 console.error('❌ Error: La función updateClientProfile no está definida o no es global.');
                 window.showMessage('editProfileMessage', '❌ Funcionalidad de edición de cliente no disponible.', 'error');
            }
        }
    });
    
    // Listener para filtros de búsqueda
    document.getElementById('applyFiltersBtn')?.addEventListener('click', loadTalents);

}

// Auxiliar para mostrar/ocultar el campo de Nombre de Empresa en Edición
function toggleCompanyNameEdit() {
    const editCompanyNameGroup = document.getElementById('editCompanyNameGroup');
    if (editCompanyNameGroup) {
        editCompanyNameGroup.style.display = document.getElementById('editClientType').value === 'empresa' ? 'block' : 'none';
    }
}

// Cargar talentos (función corregida para usar el botón de ver perfil)
async function loadTalents() {
    try {
        const talentsContainer = document.getElementById('talentsContainer');
        if (!talentsContainer) return;

        talentsContainer.innerHTML = '<div class="loading">Cargando talentos...</div>';

        // Recoger filtros (omitiendo la lógica de filtrado compleja por brevedad, se mantiene el filtro de Firestore)
        const filterGender = document.getElementById('filterGender')?.value;
        const filterLanguage = document.getElementById('filterLanguage')?.value;
        const filterCountry = document.getElementById('filterCountry')?.value;
        const filterHomeStudio = document.getElementById('filterHomeStudio')?.value;
        const filterSearch = document.getElementById('filterSearch')?.value.toLowerCase();

        let query = db.collection('talents');
        
        // Aplicar filtros a la query
        if (filterGender) {
            query = query.where('gender', '==', filterGender);
        }
        if (filterHomeStudio) {
            query = query.where('homeStudio', '==', filterHomeStudio);
        }
        if (filterCountry) {
            query = query.where('country', '==', filterCountry);
        }
        
        const snapshot = await query.get();
        let talentsHtml = '';
        let count = 0;

        snapshot.docs.forEach(doc => {
            const talent = doc.data();
            const talentId = doc.id;
            
            // Filtro por idioma y búsqueda de texto (en cliente)
            const matchesLanguage = !filterLanguage || (talent.languages && talent.languages.includes(filterLanguage));
            const matchesSearch = !filterSearch || 
                                  (talent.name && talent.name.toLowerCase().includes(filterSearch)) ||
                                  (talent.bio && talent.bio.toLowerCase().includes(filterSearch));

            if (matchesLanguage && matchesSearch) {
                const countryName = typeof getCountryName !== 'undefined' ? getCountryName(talent.country) : talent.country;
                const languages = talent.languages ? talent.languages.join(', ') : 'N/A';
                const homeStudio = talent.homeStudio === 'si' ? '<i class="fas fa-check-circle text-success"></i> Sí' : '<i class="fas fa-times-circle text-danger"></i> No';
                const profilePicture = talent.profilePictureUrl || 'img/default-avatar.png';

                talentsHtml += `
                    <div class="talent-card">
                        <div class="talent-card-header">
                            <img src="${profilePicture}" alt="${talent.name}" class="talent-profile-pic">
                            <h3>${talent.name || 'Talento Anónimo'}</h3>
                        </div>
                        <p><strong>País:</strong> ${countryName || 'N/A'}</p>
                        <p><strong>Idiomas:</strong> ${languages}</p>
                        <p><strong>Home Studio:</strong> ${homeStudio}</p>
                        <div class="card-actions">
                            <button class="btn btn-secondary btn-sm view-profile-btn" onclick="window.viewTalentProfile('${talentId}')">
                                <i class="fas fa-user"></i> Ver perfil
                            </button>
                            <button class="btn btn-outline btn-sm" onclick="window.addToFavorites('${talentId}')">
                                <i class="fas fa-heart"></i> Favorito
                            </button>
                        </div>
                    </div>
                `;
                count++;
            }
        });

        if (count > 0) {
            talentsContainer.innerHTML = talentsHtml;
        } else {
            talentsContainer.innerHTML = '<p>No se encontraron talentos que coincidan con los filtros.</p>';
        }

    } catch (error) {
        console.error('Error cargando talentos:', error);
        document.getElementById('talentsContainer').innerHTML = '<p class="text-danger">Error al cargar talentos. Inténtalo de nuevo más tarde.</p>';
    }
}
window.loadTalents = loadTalents;

// Implementación de Ver Perfil con restricción de login
window.viewTalentProfile = async function(talentId) {
    const profileModal = document.getElementById('viewTalentProfileModal');
    const profileContent = document.getElementById('profileViewContent');
    const authPrompt = document.getElementById('profileAuthPrompt');
    
    window.closeAllModals(); 
    profileModal.style.display = 'flex';
    profileContent.innerHTML = '<div class="loading" style="text-align:center;">Cargando perfil...</div>';
    authPrompt.style.display = 'none';

    try {
        const doc = await db.collection('talents').doc(talentId).get();
        if (!doc.exists) {
            profileContent.innerHTML = '<p class="text-danger" style="text-align:center;">Perfil no encontrado.</p>';
            return;
        }
        
        const talent = doc.data();
        const isLoggedIn = !!window.currentUser; // Verificar el estado de autenticación
        
        // Información pública
        const countryName = typeof getCountryName !== 'undefined' ? getCountryName(talent.country) : talent.country;
        const stateName = typeof getStateName !== 'undefined' ? getStateName(talent.country, talent.state) : talent.state;
        const locationInfo = (countryName && stateName && talent.city) ? `${talent.city}, ${stateName}, ${countryName}` : 'N/A';
        const languages = talent.languages ? talent.languages.join(', ') : 'N/A';
        const homeStudio = talent.homeStudio === 'si' ? '<i class="fas fa-check-circle text-success"></i> Sí' : '<i class="fas fa-times-circle text-danger"></i> No';
        const profilePicture = talent.profilePictureUrl || 'img/default-avatar.png';
        
        // Demos
        let demosHtml = talent.demos && talent.demos.length > 0 ? 
            talent.demos.map(demo => `
                <div class="demo-item-view">
                    <span>${demo.name}</span>
                    <audio controls src="${demo.url}"></audio>
                </div>
            `).join('') : '<p>No hay demos disponibles.</p>';

        // Información de contacto: Se oculta si no está logeado
        let contactInfoHtml = '';
        if (isLoggedIn) {
            contactInfoHtml = `
                <div class="info-grid">
                    <div class="info-item"><label>Email:</label><span>${talent.email || 'N/A'}</span></div>
                    <div class="info-item"><label>Teléfono:</label><span>${talent.phone || 'N/A'}</span></div>
                </div>
            `;
        } else {
            contactInfoHtml = `
                <div class="auth-prompt">
                    <p><i class="fas fa-lock"></i> Para ver la información de contacto, <a href="#" onclick="closeAllModals(); document.getElementById('loginModal').style.display='flex';">inicia sesión</a>.</p>
                </div>
            `;
        }

        profileContent.innerHTML = `
            <div class="profile-view-header">
                <img src="${profilePicture}" alt="${talent.name}" class="profile-view-pic">
                <div class="profile-view-info">
                    <h2>${talent.name || 'Talento Anónimo'}</h2>
                    <p class="profile-location"><i class="fas fa-map-marker-alt"></i> ${locationInfo}</p>
                </div>
            </div>
            
            <div class="profile-view-section">
                <h3>Información Personal</h3>
                <div class="info-grid">
                    <div class="info-item"><label>Género:</label><span>${talent.gender || 'N/A'}</span></div>
                    <div class="info-item"><label>Edad:</label><span>${talent.realAge || talent.ageRange || 'N/A'}</span></div>
                    <div class="info-item"><label>Nacionalidad:</label><span>${talent.nationality || 'N/A'}</span></div>
                    <div class="info-item"><label>Idiomas:</label><span>${languages}</span></div>
                    <div class="info-item"><label>Home Studio:</label><span>${homeStudio}</span></div>
                </div>
            </div>
            
            <div class="profile-view-section">
                <h3>Biografía</h3>
                <p class="profile-bio">${talent.bio || 'No hay biografía disponible.'}</p>
            </div>
            
            <div class="profile-view-section">
                <h3>Demos</h3>
                <div class="demos-container-view">
                    ${demosHtml}
                </div>
            </div>
            
            <div class="profile-view-section">
                <h3>Contacto</h3>
                ${contactInfoHtml}
            </div>
        `;
        
    } catch (error) {
        console.error('Error cargando perfil:', error);
        profileContent.innerHTML = '<p class="text-danger" style="text-align:center;">Error al cargar el perfil.</p>';
    }
};

// Cargar ofertas de trabajo
async function loadJobOffers() {
    try {
        const jobsContainer = document.getElementById('jobsContainer');
        if (!jobsContainer) return;

        jobsContainer.innerHTML = '<div class="loading">Cargando ofertas de trabajo...</div>';

        const snapshot = await db.collection('jobs').where('status', '==', 'active').get();
        let jobsHtml = '';
        let count = 0;

        snapshot.docs.forEach(doc => {
            const job = doc.data();
            const jobId = doc.id;
            const countryName = typeof getCountryName !== 'undefined' ? getCountryName(job.country) : job.country;
            const stateName = typeof getStateName !== 'undefined' ? getStateName(job.country, job.state) : job.state;
            const locationInfo = (countryName && stateName && job.city) ? `${job.city}, ${stateName}, ${countryName}` : 'N/A';
            const languages = job.languages ? job.languages.join(', ') : 'N/A';
            const budget = job.budget ? `$${job.budget}` : 'A convenir';

            jobsHtml += `
                <div class="job-card">
                    <h3>${job.title}</h3>
                    <p><strong>Cliente:</strong> ${job.clientName}</p>
                    <p><strong>Ubicación:</strong> ${locationInfo}</p>
                    <p><strong>Idiomas:</strong> ${languages}</p>
                    <p><strong>Presupuesto:</strong> ${budget}</p>
                    <p><strong>Descripción:</strong> ${job.description.substring(0, 100)}...</p>
                    <div class="card-actions">
                        <button class="btn btn-primary btn-sm" onclick="window.applyToJob('${jobId}')">
                            <i class="fas fa-paper-plane"></i> Postularse
                        </button>
                        <button class="btn btn-secondary btn-sm" onclick="window.viewJobDetails('${jobId}')">
                            <i class="fas fa-eye"></i> Ver detalles
                        </button>
                    </div>
                </div>
            `;
            count++;
        });

        if (count > 0) {
            jobsContainer.innerHTML = jobsHtml;
        } else {
            jobsContainer.innerHTML = '<p>No hay ofertas de trabajo activas en este momento.</p>';
        }

    } catch (error) {
        console.error('Error cargando ofertas de trabajo:', error);
        document.getElementById('jobsContainer').innerHTML = '<p class="text-danger">Error al cargar ofertas de trabajo. Inténtalo de nuevo más tarde.</p>';
    }
}
window.loadJobOffers = loadJobOffers;

// Función para aplicar a un trabajo (NUEVA)
window.applyToJob = async function(jobId) {
    if (!window.currentUser) {
        window.showMessage('jobsMessage', '❌ Debes iniciar sesión para postularte a trabajos.', 'error');
        document.getElementById('loginModal').style.display = 'flex';
        return;
    }

    if (window.currentUserData?.type !== 'talent') {
        window.showMessage('jobsMessage', '❌ Solo los talentos pueden postularse a trabajos.', 'error');
        return;
    }

    try {
        const jobDoc = await db.collection('jobs').doc(jobId).get();
        if (!jobDoc.exists) {
            window.showMessage('jobsMessage', '❌ La oferta de trabajo no existe.', 'error');
            return;
        }

        const job = jobDoc.data();
        const talentId = window.currentUser.uid;

        // Verificar si ya se postuló
        const existingApplication = await db.collection('jobApplications')
            .where('jobId', '==', jobId)
            .where('talentId', '==', talentId)
            .get();

        if (!existingApplication.empty) {
            window.showMessage('jobsMessage', 'ℹ️ Ya te has postulado a esta oferta.', 'info');
            return;
        }

        // Crear la postulación
        await db.collection('jobApplications').add({
            jobId: jobId,
            talentId: talentId,
            clientId: job.clientId,
            talentName: window.currentUserData.name,
            talentEmail: window.currentUserData.email,
            talentProfilePicture: window.currentUserData.profilePictureUrl || 'img/default-avatar.png',
            jobTitle: job.title,
            status: 'pending',
            appliedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Actualizar el array de postulaciones del talento
        await db.collection('talents').doc(talentId).update({
            jobApplications: firebase.firestore.FieldValue.arrayUnion(jobId)
        });

        // Crear notificación para el cliente
        await db.collection('notifications').add({
            type: 'new_application',
            clientId: job.clientId,
            talentId: talentId,
            talentName: window.currentUserData.name,
            talentProfilePicture: window.currentUserData.profilePictureUrl || 'img/default-avatar.png',
            jobId: jobId,
            jobTitle: job.title,
            message: `${window.currentUserData.name} se ha postulado a tu oferta "${job.title}"`,
            read: false,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        window.showMessage('jobsMessage', '✅ ¡Postulación enviada exitosamente!', 'success');
        
        // Recargar ofertas para actualizar la UI
        setTimeout(() => {
            loadJobOffers();
        }, 2000);

    } catch (error) {
        console.error('Error aplicando al trabajo:', error);
        window.showMessage('jobsMessage', '❌ Error al postularse. Inténtalo de nuevo.', 'error');
    }
};

// Función para ver detalles del trabajo
window.viewJobDetails = async function(jobId) {
    const jobModal = document.getElementById('jobDetailsModal');
    const jobDetailsContent = document.getElementById('jobDetailsContent');
    
    window.closeAllModals();
    jobModal.style.display = 'flex';
    jobDetailsContent.innerHTML = '<div class="loading">Cargando detalles del trabajo...</div>';

    try {
        const doc = await db.collection('jobs').doc(jobId).get();
        if (!doc.exists) {
            jobDetailsContent.innerHTML = '<p class="text-danger">La oferta de trabajo no existe.</p>';
            return;
        }

        const job = doc.data();
        const countryName = typeof getCountryName !== 'undefined' ? getCountryName(job.country) : job.country;
        const stateName = typeof getStateName !== 'undefined' ? getStateName(job.country, job.state) : job.state;
        const locationInfo = (countryName && stateName && job.city) ? `${job.city}, ${stateName}, ${countryName}` : 'N/A';
        const languages = job.languages ? job.languages.join(', ') : 'N/A';
        const budget = job.budget ? `$${job.budget}` : 'A convenir';
        const deadline = job.deadline ? new Date(job.deadline).toLocaleDateString() : 'No especificada';

        jobDetailsContent.innerHTML = `
            <div class="job-details-header">
                <h2>${job.title}</h2>
                <p class="job-client"><strong>Cliente:</strong> ${job.clientName}</p>
            </div>
            
            <div class="job-details-section">
                <h3>Información del Proyecto</h3>
                <div class="info-grid">
                    <div class="info-item"><label>Ubicación:</label><span>${locationInfo}</span></div>
                    <div class="info-item"><label>Idiomas:</label><span>${languages}</span></div>
                    <div class="info-item"><label>Presupuesto:</label><span>${budget}</span></div>
                    <div class="info-item"><label>Fecha límite:</label><span>${deadline}</span></div>
                    <div class="info-item"><label>Género de voz:</label><span>${job.gender || 'No especificado'}</span></div>
                    <div class="info-item"><label>Edad:</label><span>${job.ageRange || 'No especificado'}</span></div>
                </div>
            </div>
            
            <div class="job-details-section">
                <h3>Descripción Detallada</h3>
                <p class="job-description">${job.description || 'No hay descripción disponible.'}</p>
            </div>
            
            <div class="job-details-actions">
                ${window.currentUserData?.type === 'talent' ? 
                    `<button class="btn btn-primary" onclick="window.applyToJob('${jobId}')">
                        <i class="fas fa-paper-plane"></i> Postularse a este trabajo
                    </button>` : 
                    window.currentUserData?.type === 'client' ?
                    `<p class="text-info">Esta es una oferta publicada por otro cliente.</p>` :
                    `<p class="text-warning">Inicia sesión como talento para postularte.</p>`
                }
            </div>
        `;

    } catch (error) {
        console.error('Error cargando detalles del trabajo:', error);
        jobDetailsContent.innerHTML = '<p class="text-danger">Error al cargar los detalles del trabajo.</p>';
    }
};

// Función para agregar a favoritos
window.addToFavorites = async function(talentId) {
    if (!window.currentUser) {
        window.showMessage('talentsMessage', '❌ Debes iniciar sesión para agregar a favoritos.', 'error');
        document.getElementById('loginModal').style.display = 'flex';
        return;
    }

    if (window.currentUserData?.type !== 'client') {
        window.showMessage('talentsMessage', '❌ Solo los clientes pueden agregar talentos a favoritos.', 'error');
        return;
    }

    try {
        await db.collection('clients').doc(window.currentUser.uid).update({
            favorites: firebase.firestore.FieldValue.arrayUnion(talentId)
        });

        window.showMessage('talentsMessage', '✅ Talento agregado a favoritos.', 'success');

    } catch (error) {
        console.error('Error agregando a favoritos:', error);
        window.showMessage('talentsMessage', '❌ Error al agregar a favoritos.', 'error');
    }
};

// Función para mostrar mensajes
window.showMessage = function(elementId, message, type) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
        setTimeout(() => {
            element.innerHTML = '';
        }, 5000);
    }
};

// Función para cerrar todos los modales
window.closeAllModals = function() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
};

// Toggle para mostrar/ocultar el campo de empresa
function toggleCompanyName() {
    const companyNameGroup = document.getElementById('companyNameGroup');
    if (companyNameGroup) {
        companyNameGroup.style.display = document.getElementById('clientType').value === 'empresa' ? 'block' : 'none';
    }
}

// Toggle para mostrar/ocultar el campo de otros idiomas
function toggleOtherLanguages() {
    const otherLanguagesGroup = document.getElementById('otherLanguagesGroup');
    if (otherLanguagesGroup) {
        otherLanguagesGroup.style.display = document.getElementById('lang10').checked ? 'block' : 'none';
    }
}
