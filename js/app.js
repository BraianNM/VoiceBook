// Funciones principales de la aplicación

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    window.checkAuthState(); // Aseguramos que checkAuthState se ejecute al inicio
    
    // CORRECCIÓN: Asegurar que la carga de talentos solo corra en index.html
    if (!window.location.href.includes('profile.html')) {
        loadTalents();
        loadJobOffers();
        window.loadLocationData(); // Cargar la data de ubicación para el modal de registro
    }
    
    // CORRECCIÓN: Agregar listener para el select de edición de cliente
    document.getElementById('editClientType')?.addEventListener('change', toggleCompanyNameEdit);
});

// Configurar event listeners (CORRECCIÓN CLAVE AQUÍ)
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
            if (typeof window.updateTalentProfile === 'function') {
                window.updateTalentProfile(e);
            } else {
                 console.error('❌ Error: La función updateTalentProfile no está definida o no es global.');
                 window.showMessage('editProfileMessage', '❌ Funcionalidad de edición de talento no disponible.', 'error');
            }
        } else {
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

// Cargar talentos
async function loadTalents() {
    try {
        const talentsContainer = document.getElementById('talentsContainer');
        if (!talentsContainer) return;

        talentsContainer.innerHTML = '<div class="loading">Cargando talentos...</div>';

        // Recoger filtros
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
        // Nota: Filtrar por idioma o nombre debe hacerse en cliente después de la consulta
        
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

                talentsHtml += `
                    <div class="talent-card">
                        <h3>${talent.name || 'Talento Anónimo'}</h3>
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
        const locationInfo = (countryName && talent.state) ? `${talent.city}, ${getCountryName(talent.country)}` : 'N/A';
        const languages = talent.languages ? talent.languages.join(', ') : 'N/A';
        const homeStudio = talent.homeStudio === 'si' ? '<i class="fas fa-check-circle text-success"></i> Sí' : '<i class="fas fa-times-circle text-danger"></i> No';
        
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
            authPrompt.style.display = 'none';
        } else {
            contactInfoHtml = '<div style="text-align:center; padding: 10px;">Información de contacto oculta.</div>';
            authPrompt.style.display = 'block';
        }
        
        // Renderizar el contenido
        profileContent.innerHTML = `
            <div class="profile-header">
                <h2>${talent.name || 'Talento'}</h2>
            </div>
            
            <h3>Datos Públicos</h3>
            <div class="info-grid">
                <div class="info-item"><label>Ubicación:</label><span>${locationInfo}</span></div>
                <div class="info-item"><label>Género:</label><span>${talent.gender || 'N/A'}</span></div>
                <div class="info-item"><label>Rango de edad (Roles):</label><span>${talent.ageRange || 'N/A'}</span></div>
                <div class="info-item"><label>Home Studio:</label><span>${homeStudio}</span></div>
            </div>
            
            <p style="margin-top: 15px;"><strong>Biografía:</strong> ${talent.bio || 'Sin biografía.'}</p>
            <p><strong>Idiomas:</strong> ${languages}</p>
            
            <h3 style="margin-top: 20px;">Demos de Voz</h3>
            <div class="demos-section">
                ${demosHtml}
            </div>

            <h3 style="margin-top: 20px;">Información de Contacto</h3>
            ${contactInfoHtml}
        `;

    } catch (error) {
        console.error('Error al ver perfil:', error);
        profileContent.innerHTML = '<p class="text-danger" style="text-align:center;">Error al cargar el perfil.</p>';
    }
};

window.closeViewProfileModal = function() {
    document.getElementById('viewTalentProfileModal').style.display = 'none';
};

// Funciones auxiliares para modales y otros (no modificadas, solo se muestra el fin del archivo por si lo necesitas)
function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
}
window.closeAllModals = closeAllModals; // Hacer global

function toggleCompanyName() {
    const companyNameGroup = document.getElementById('companyNameGroup');
    if (companyNameGroup) {
        companyNameGroup.style.display = document.getElementById('clientType').value === 'empresa' ? 'block' : 'none';
    }
}

function toggleOtherLanguages() {
    const otherLanguagesInput = document.getElementById('otherLanguages');
    if (otherLanguagesInput) {
        otherLanguagesInput.style.display = document.getElementById('lang10').checked ? 'block' : 'none';
    }
}

window.addToFavorites = function(talentId) {
    alert(`Añadir talento ${talentId} a favoritos. Funcionalidad pendiente.`);
};
window.applyToJob = function(jobId) {
    alert(`Postular al trabajo ${jobId}. Funcionalidad pendiente.`);
};

// Función auxiliar para mostrar mensajes (hecha global)
function showMessage(element, message, type) {
    const el = typeof element === 'string' ? document.getElementById(element) : element;
    if (el) {
        el.innerHTML = `<div class="${type}">${message}</div>`;
    }
}
window.showMessage = showMessage;

// Cargar ofertas de trabajo (función completa)
async function loadJobOffers() {
    try {
        const offersContainer = document.getElementById('jobOffersContainer');
        if (!offersContainer) return;

        offersContainer.innerHTML = '<div class="loading">Cargando ofertas...</div>';

        // Ordenar por fecha de creación descendente
        const snapshot = await db.collection('job_offers').orderBy('createdAt', 'desc').get(); 
        let offersHtml = '';
        
        if (snapshot.empty) {
            offersHtml = '<p>Aún no hay ofertas de trabajo publicadas.</p>';
        } else {
            snapshot.docs.forEach(doc => {
                const job = doc.data();
                const jobId = doc.id;
                const clientName = job.clientName || 'Cliente Anónimo';
                const location = job.country ? `${job.city}, ${getCountryName(job.country)}` : 'Remoto';
                const jobType = job.jobType || 'Locución';
                
                offersHtml += `
                    <div class="job-offer-card">
                        <h3>${job.title || 'Oferta sin título'}</h3>
                        <p><strong>Cliente:</strong> ${clientName}</p>
                        <p><strong>Tipo de Trabajo:</strong> ${jobType}</p>
                        <p><strong>Ubicación:</strong> ${location}</p>
                        <p>${job.description ? job.description.substring(0, 100) + '...' : 'Sin descripción.'}</p>
                        <div class="card-actions">
                            <button class="btn btn-primary btn-sm" onclick="window.applyToJob('${jobId}')">Postular</button>
                        </div>
                    </div>
                `;
            });
        }

        offersContainer.innerHTML = offersHtml;

    } catch (error) {
        console.error('Error cargando ofertas de trabajo:', error);
        document.getElementById('jobOffersContainer').innerHTML = '<p class="text-danger">Error al cargar ofertas. Inténtalo de nuevo más tarde.</p>';
    }
}
window.loadJobOffers = loadJobOffers;
