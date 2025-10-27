// Funciones principales de la aplicación - VOICEBOOK (COMPLETO)

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    console.log('App.js inicializando VoiceBook...');
    setupEventListeners();
    
    // Verificar autenticación
    if (typeof window.checkAuthState === 'function') {
        window.checkAuthState();
    } else {
        console.error('checkAuthState no está disponible');
        auth.onAuthStateChanged((user) => {
            currentUser = user;
            updateAuthUI();
        });
    }
    
    // Cargar datos solo en index.html
    if (!window.location.href.includes('profile.html')) {
        loadTalents();
        loadJobOffers();
        
        // Cargar datos de ubicación
        if (typeof window.loadLocationData === 'function') { 
            window.loadLocationData('talentCountry', 'talentState', 'talentCity');
            window.loadLocationData('clientCountry', 'clientState', 'clientCity');
            loadCountriesFilter();
        }
    }
});

// Actualizar UI de autenticación
function updateAuthUI() {
    const authButtons = document.getElementById('authButtons');
    const userMenu = document.getElementById('userMenu');
    const userNameSpan = document.getElementById('userName');
    const dashboardLink = document.getElementById('dashboardLink');
    
    if (currentUser) {
        if (authButtons) authButtons.style.display = 'none';
        if (userMenu) userMenu.style.display = 'flex';
        if (userNameSpan) userNameSpan.textContent = currentUserData?.name || currentUser.email || 'Usuario';
        if (dashboardLink) dashboardLink.style.display = 'block';
    } else {
        if (authButtons) authButtons.style.display = 'flex';
        if (userMenu) userMenu.style.display = 'none';
        if (dashboardLink) dashboardLink.style.display = 'none';
    }
}

// Cargar países en el filtro
function loadCountriesFilter() {
    const filterCountry = document.getElementById('filterCountry');
    if (!filterCountry) return;

    filterCountry.innerHTML = '<option value="">Cualquiera</option>';
    
    if (typeof locationData !== 'undefined') {
        for (const countryCode in locationData) {
            const option = document.createElement('option');
            option.value = countryCode;
            option.textContent = locationData[countryCode].name;
            filterCountry.appendChild(option);
        }
    }
}

// Configurar event listeners 
function setupEventListeners() {
    console.log('Configurando event listeners...');
    
    // Listeners de Modales y Navegación
    document.getElementById('heroTalentBtn')?.addEventListener('click', () => {
        document.getElementById('talentModal').style.display = 'flex';
    });
    
    document.getElementById('heroClientBtn')?.addEventListener('click', () => {
        document.getElementById('clientModal').style.display = 'flex';
    });
    
    document.getElementById('ctaTalentBtn')?.addEventListener('click', () => {
        document.getElementById('talentModal').style.display = 'flex';
    });
    
    document.getElementById('ctaClientBtn')?.addEventListener('click', () => {
        document.getElementById('clientModal').style.display = 'flex';
    });
    
    document.getElementById('registerBtn')?.addEventListener('click', () => {
        document.getElementById('talentModal').style.display = 'flex';
    });
    
    document.getElementById('loginBtn')?.addEventListener('click', () => {
        document.getElementById('loginModal').style.display = 'flex';
    });
    
    document.getElementById('publishJobBtn')?.addEventListener('click', () => {
        if (!currentUser) {
            document.getElementById('loginModal').style.display = 'flex';
        } else if (currentUserData?.type === 'client') {
            alert('Funcionalidad de publicar trabajo en desarrollo');
        } else {
            alert('Solo los clientes pueden publicar ofertas de trabajo');
        }
    });
    
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
    document.getElementById('lang9')?.addEventListener('change', toggleOtherLanguages);

    // Listener para filtros de búsqueda
    document.getElementById('applyFiltersBtn')?.addEventListener('click', loadTalents);

    console.log('Event listeners configurados correctamente');
}

// Cargar talentos (función corregida con filtros mejorados)
async function loadTalents() {
    try {
        const talentsContainer = document.getElementById('talentsContainer');
        if (!talentsContainer) return;

        talentsContainer.innerHTML = '<div class="loading">Cargando talentos...</div>';

        const snapshot = await db.collection('talents').get();
        let talentsHtml = '';
        let count = 0;

        snapshot.docs.forEach(doc => {
            const talent = doc.data();
            const talentId = doc.id;
            
            // Aplicar filtros
            const filterGender = document.getElementById('filterGender')?.value;
            const filterLanguage = document.getElementById('filterLanguage')?.value;
            const filterCountry = document.getElementById('filterCountry')?.value;
            const filterHomeStudio = document.getElementById('filterHomeStudio')?.value;
            const filterSearch = document.getElementById('filterSearch')?.value.toLowerCase();

            const matchesGender = !filterGender || talent.gender === filterGender;
            const matchesLanguage = !filterLanguage || (talent.languages && talent.languages.includes(filterLanguage));
            const matchesCountry = !filterCountry || talent.country === filterCountry;
            const matchesHomeStudio = !filterHomeStudio || talent.homeStudio === filterHomeStudio;
            const matchesSearch = !filterSearch || 
                                  (talent.name && talent.name.toLowerCase().includes(filterSearch)) ||
                                  (talent.bio && talent.bio.toLowerCase().includes(filterSearch));

            if (matchesGender && matchesLanguage && matchesCountry && matchesHomeStudio && matchesSearch) {
                const countryName = typeof getCountryName !== 'undefined' ? getCountryName(talent.country) : talent.country;
                const languages = talent.languages ? talent.languages.join(', ') : 'N/A';
                const homeStudio = talent.homeStudio === 'si' ? '<i class="fas fa-check-circle text-success"></i> Sí' : '<i class="fas fa-times-circle text-danger"></i> No';
                const profilePicture = talent.profilePictureUrl || 'https://via.placeholder.com/150/007bff/ffffff?text=VO';

                talentsHtml += `
                    <div class="talent-card">
                        <div class="talent-card-header">
                            <img src="${profilePicture}" alt="${talent.name}" class="talent-profile-pic" onerror="this.src='https://via.placeholder.com/150/007bff/ffffff?text=VO'">
                            <h3>${talent.name || 'Talento Anónimo'}</h3>
                        </div>
                        <p><strong>País:</strong> ${countryName || 'N/A'}</p>
                        <p><strong>Idiomas:</strong> ${languages}</p>
                        <p><strong>Home Studio:</strong> ${homeStudio}</p>
                        <p><strong>Biografía:</strong> ${talent.bio ? (talent.bio.length > 100 ? talent.bio.substring(0, 100) + '...' : talent.bio) : 'Sin biografía'}</p>
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

// Función para ver perfil de talento (COMPLETAMENTE FUNCIONAL)
window.viewTalentProfile = async function(talentId) {
    console.log('Ver perfil del talento:', talentId);
    
    const profileModal = document.getElementById('viewTalentProfileModal');
    const profileContent = document.getElementById('profileViewContent');
    
    if (!profileModal) {
        console.error('Modal no encontrado');
        return;
    }
    
    window.closeAllModals(); 
    profileModal.style.display = 'flex';
    profileContent.innerHTML = '<div class="loading" style="text-align:center;">Cargando perfil...</div>';

    try {
        const doc = await db.collection('talents').doc(talentId).get();
        if (!doc.exists) {
            profileContent.innerHTML = '<p class="text-danger" style="text-align:center;">Perfil no encontrado.</p>';
            return;
        }
        
        const talent = doc.data();
        const isLoggedIn = !!currentUser;

        // Información pública
        const countryName = typeof getCountryName !== 'undefined' ? getCountryName(talent.country) : talent.country;
        const stateName = typeof getStateName !== 'undefined' ? getStateName(talent.country, talent.state) : talent.state;
        const locationInfo = (countryName && stateName && talent.city) ? `${talent.city}, ${stateName}, ${countryName}` : 'N/A';
        const languages = talent.languages ? talent.languages.join(', ') : 'N/A';
        const homeStudio = talent.homeStudio === 'si' ? '<i class="fas fa-check-circle text-success"></i> Sí' : '<i class="fas fa-times-circle text-danger"></i> No';
        const profilePicture = talent.profilePictureUrl || 'https://via.placeholder.com/150/007bff/ffffff?text=VO';
        
        // Demos
        let demosHtml = talent.demos && talent.demos.length > 0 ? 
            talent.demos.map(demo => `
                <div class="demo-item-view">
                    <span>${demo.name || 'Demo'}</span>
                    <audio controls src="${demo.url}"></audio>
                </div>
            `).join('') : '<p>No hay demos disponibles.</p>';

        // Información de contacto: Se oculta si no está logeado
        let contactInfoHtml = '';
        if (isLoggedIn) {
            contactInfoHtml = `
                <div class="profile-view-section">
                    <h3>Información de Contacto</h3>
                    <div class="info-grid">
                        <div class="info-item"><label>Email:</label><span>${talent.email || 'N/A'}</span></div>
                        <div class="info-item"><label>Teléfono:</label><span>${talent.phone || 'N/A'}</span></div>
                    </div>
                </div>
            `;
        } else {
            contactInfoHtml = `
                <div class="profile-view-section">
                    <h3>Información de Contacto</h3>
                    <div class="auth-prompt">
                        <p><i class="fas fa-lock"></i> Para ver la información de contacto, <a href="#" onclick="closeAllModals(); document.getElementById('loginModal').style.display='flex';">inicia sesión</a>.</p>
                    </div>
                </div>
            `;
        }

        profileContent.innerHTML = `
            <div class="profile-view-header">
                <img src="${profilePicture}" alt="${talent.name}" class="profile-view-pic" onerror="this.src='https://via.placeholder.com/150/007bff/ffffff?text=VO'">
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
            
            ${contactInfoHtml}
            
            <div class="profile-view-actions">
                <button class="btn btn-primary" onclick="window.closeViewProfileModal()">
                    <i class="fas fa-times"></i> Cerrar
                </button>
            </div>
        `;
        
    } catch (error) {
        console.error('Error cargando perfil:', error);
        profileContent.innerHTML = '<p class="text-danger" style="text-align:center;">Error al cargar el perfil.</p>';
    }
};

window.closeViewProfileModal = function() {
    const modal = document.getElementById('viewTalentProfileModal');
    if (modal) {
        modal.style.display = 'none';
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
            const budget = job.budget ? `$${job.budget}` : 'A convenir';

            jobsHtml += `
                <div class="job-card">
                    <div class="job-card-header">
                        <h3>${job.title}</h3>
                        <span class="job-status active">Activa</span>
                    </div>
                    <p><strong>Cliente:</strong> ${job.clientName}</p>
                    <p><strong>Ubicación:</strong> ${countryName || 'Remoto'}</p>
                    <p><strong>Presupuesto:</strong> ${budget}</p>
                    <p><strong>Descripción:</strong> ${job.description ? job.description.substring(0, 100) + '...' : 'Sin descripción'}</p>
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

// Función para aplicar a un trabajo
window.applyToJob = async function(jobId) {
    if (!currentUser) {
        alert('Debes iniciar sesión para postularte a trabajos.');
        document.getElementById('loginModal').style.display = 'flex';
        return;
    }

    // Obtener datos del usuario actual si no están disponibles
    if (!currentUserData) {
        try {
            const talentDoc = await db.collection('talents').doc(currentUser.uid).get();
            if (talentDoc.exists) {
                currentUserData = talentDoc.data();
                currentUserData.type = 'talent';
            } else {
                alert('Solo los talentos pueden postularse a trabajos.');
                return;
            }
        } catch (error) {
            console.error('Error obteniendo datos del usuario:', error);
            alert('Error al verificar tu perfil.');
            return;
        }
    }

    if (currentUserData?.type !== 'talent') {
        alert('Solo los talentos pueden postularse a trabajos.');
        return;
    }

    try {
        const jobDoc = await db.collection('jobs').doc(jobId).get();
        if (!jobDoc.exists) {
            alert('La oferta de trabajo no existe.');
            return;
        }

        const job = jobDoc.data();
        const talentId = currentUser.uid;

        // Verificar si ya se postuló
        const existingApplication = await db.collection('jobApplications')
            .where('jobId', '==', jobId)
            .where('talentId', '==', talentId)
            .get();

        if (!existingApplication.empty) {
            alert('Ya te has postulado a esta oferta.');
            return;
        }

        // Crear la postulación
        await db.collection('jobApplications').add({
            jobId: jobId,
            talentId: talentId,
            clientId: job.clientId,
            talentName: currentUserData.name,
            talentEmail: currentUserData.email,
            talentProfilePicture: currentUserData.profilePictureUrl || 'https://via.placeholder.com/150/007bff/ffffff?text=VO',
            jobTitle: job.title,
            status: 'pending',
            appliedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        alert('¡Postulación enviada exitosamente!');
        
        // Recargar ofertas para actualizar la UI
        setTimeout(() => {
            loadJobOffers();
        }, 2000);

    } catch (error) {
        console.error('Error aplicando al trabajo:', error);
        alert('Error al postularse. Inténtalo de nuevo.');
    }
};

// Función para ver detalles del trabajo
window.viewJobDetails = async function(jobId) {
    const jobModal = document.getElementById('jobDetailsModal');
    const jobDetailsContent = document.getElementById('jobDetailsContent');
    
    // Crear modal si no existe
    if (!jobModal) {
        createJobDetailsModal();
    }
    
    window.closeAllModals();
    document.getElementById('jobDetailsModal').style.display = 'flex';
    document.getElementById('jobDetailsContent').innerHTML = '<div class="loading">Cargando detalles del trabajo...</div>';

    try {
        const doc = await db.collection('jobs').doc(jobId).get();
        if (!doc.exists) {
            document.getElementById('jobDetailsContent').innerHTML = '<p class="text-danger">La oferta de trabajo no existe.</p>';
            return;
        }

        const job = doc.data();
        const countryName = typeof getCountryName !== 'undefined' ? getCountryName(job.country) : job.country;
        const budget = job.budget ? `$${job.budget}` : 'A convenir';
        const deadline = job.deadline ? new Date(job.deadline).toLocaleDateString() : 'No especificada';

        document.getElementById('jobDetailsContent').innerHTML = `
            <div class="job-details-header">
                <h2>${job.title}</h2>
                <p class="job-client"><strong>Cliente:</strong> ${job.clientName}</p>
            </div>
            
            <div class="job-details-section">
                <h3>Información del Proyecto</h3>
                <div class="info-grid">
                    <div class="info-item"><label>Ubicación:</label><span>${countryName || 'Remoto'}</span></div>
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
                ${currentUserData?.type === 'talent' ? 
                    `<button class="btn btn-primary" onclick="window.applyToJob('${jobId}')">
                        <i class="fas fa-paper-plane"></i> Postularse a este trabajo
                    </button>` : 
                    `<p class="text-warning">Inicia sesión como talento para postularte.</p>`
                }
                <button class="btn btn-outline" onclick="window.closeJobDetailsModal()">
                    <i class="fas fa-times"></i> Cerrar
                </button>
            </div>
        `;

    } catch (error) {
        console.error('Error cargando detalles del trabajo:', error);
        document.getElementById('jobDetailsContent').innerHTML = '<p class="text-danger">Error al cargar los detalles del trabajo.</p>';
    }
};

// Crear modal de detalles de trabajo dinámicamente
function createJobDetailsModal() {
    const modalHTML = `
        <div id="jobDetailsModal" class="modal">
            <div class="modal-content large-modal">
                <div class="modal-header">
                    <h3>Detalles del Trabajo</h3>
                    <span class="close-modal" onclick="window.closeJobDetailsModal()">&times;</span>
                </div>
                <div class="modal-body">
                    <div id="jobDetailsContent"></div>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

window.closeJobDetailsModal = function() {
    const modal = document.getElementById('jobDetailsModal');
    if (modal) {
        modal.style.display = 'none';
    }
};

// Función para agregar a favoritos - COMPLETA
window.addToFavorites = async function(talentId) {
    if (!currentUser) {
        alert('Debes iniciar sesión para agregar a favoritos.');
        document.getElementById('loginModal').style.display = 'flex';
        return;
    }

    // Obtener datos del usuario actual si no están disponibles
    if (!currentUserData) {
        try {
            const clientDoc = await db.collection('clients').doc(currentUser.uid).get();
            if (clientDoc.exists) {
                currentUserData = clientDoc.data();
                currentUserData.type = 'client';
            } else {
                alert('Solo los clientes pueden agregar talentos a favoritos.');
                return;
            }
        } catch (error) {
            console.error('Error obteniendo datos del usuario:', error);
            alert('Error al verificar tu perfil.');
            return;
        }
    }

    if (currentUserData?.type !== 'client') {
        alert('Solo los clientes pueden agregar talentos a favoritos.');
        return;
    }

    try {
        // Obtener favoritos actuales
        const clientDoc = await db.collection('clients').doc(currentUser.uid).get();
        const currentFavorites = clientDoc.data()?.favorites || [];

        // Verificar si ya está en favoritos
        if (currentFavorites.includes(talentId)) {
            alert('Este talento ya está en tus favoritos.');
            return;
        }

        // Agregar a favoritos
        await db.collection('clients').doc(currentUser.uid).update({
            favorites: firebase.firestore.FieldValue.arrayUnion(talentId)
        });

        alert('✅ Talento agregado a favoritos correctamente.');

    } catch (error) {
        console.error('Error agregando a favoritos:', error);
        alert('Error al agregar a favoritos: ' + error.message);
    }
};

// Función auxiliar para mostrar mensajes
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
    const otherLanguagesInput = document.getElementById('otherLanguages');
    if (otherLanguagesInput) {
        otherLanguagesInput.style.display = document.getElementById('lang9').checked ? 'block' : 'none';
    }
}

// Función de logout mejorada
async function logoutUser() {
    try {
        await auth.signOut();
        console.log('Sesión cerrada');
        currentUser = null;
        currentUserData = null;
        
        // Actualizar UI inmediatamente
        updateAuthUI();
        
        // Redirigir a index.html si está en profile.html
        if (window.location.href.includes('profile.html')) {
            window.location.href = 'index.html';
        } else {
            // Recargar talentos para actualizar la UI
            loadTalents();
        }
        
    } catch (error) {
        console.error('Error cerrando sesión:', error);
        alert('Error al cerrar sesión: ' + error.message);
    }
}

console.log('App.js cargado correctamente - VoiceBook Main Application');
