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
            window.loadLocationData('country', 'state', 'city'); // Cargar la data de ubicación para el modal de registro (Asumo IDs: country, state, city)
            window.loadLocationData('clientCountry', 'clientState', 'clientCity'); // Cargar para el registro de clientes
        }
    }
    
    // CORRECCIÓN: Agregar listener para el select de edición de cliente (para cuando se cargue el modal)
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
    
    // Listeners de formularios de registro y login
    document.getElementById('talentRegistrationForm')?.addEventListener('submit', registerTalent);
    document.getElementById('clientRegistrationForm')?.addEventListener('submit', registerClient);
    document.getElementById('loginForm')?.addEventListener('submit', loginUser);

    // Listeners de campos condicionales
    document.getElementById('clientType')?.addEventListener('change', toggleCompanyName);
    document.getElementById('lang10')?.addEventListener('change', toggleOtherLanguages);
}
window.setupEventListeners = setupEventListeners;


// Lógica para cargar Talentos (Se mantiene)
async function loadTalents() {
    // ... (Tu código existente para loadTalents)
    try {
        const talentsContainer = document.getElementById('talentsContainer');
        if (!talentsContainer) return;

        let talentsHtml = '';
        const snapshot = await db.collection('talents').limit(12).get(); // Limitar para el inicio
        
        if (snapshot.empty) {
            talentsHtml = '<p>No se encontraron talentos. ¡Sé el primero en registrarte!</p>';
        } else {
            snapshot.docs.forEach(doc => {
                const talent = doc.data();
                const talentId = doc.id;
                const location = talent.city && talent.country ? `${talent.city}, ${window.getCountryName(talent.country)}` : 'Ubicación no especificada';
                
                talentsHtml += `
                    <div class="talent-card">
                        <div class="card-header">
                            <img src="${talent.profilePhotoUrl || 'https://via.placeholder.com/80?text=V'}" alt="Foto de ${talent.name}" class="profile-photo-small">
                            <div class="talent-info">
                                <h4>${talent.name || 'Talento de Voz'}</h4>
                                <p class="talent-meta">${talent.gender || 'N/A'} | ${talent.ageRange || 'N/A'}</p>
                                <p class="talent-meta"><i class="fas fa-map-marker-alt"></i> ${location}</p>
                            </div>
                        </div>
                        <div class="card-actions">
                            <button class="btn btn-primary btn-sm" onclick="window.viewTalentProfile('${talentId}')">Ver Perfil</button>
                            <button class="btn btn-outline-secondary btn-sm" onclick="window.addToFavorites('${talentId}')"><i class="fas fa-heart"></i></button>
                        </div>
                    </div>
                `;
            });
        }
        talentsContainer.innerHTML = talentsHtml;

    } catch (error) {
        console.error('Error cargando talentos:', error);
        document.getElementById('talentsContainer').innerHTML = '<p class="text-danger">Error al cargar talentos. Inténtalo de nuevo más tarde.</p>';
    }
}
window.loadTalents = loadTalents;


// Lógica para cargar Ofertas de Trabajo (Se mantiene)
async function loadJobOffers() {
    // ... (Tu código existente para loadJobOffers)
    try {
        const offersContainer = document.getElementById('jobOffersContainer');
        if (!offersContainer) return;

        let offersHtml = '';
        const snapshot = await db.collection('jobOffers').limit(12).get();

        if (snapshot.empty) {
            offersHtml = '<p>No hay ofertas de trabajo publicadas por ahora.</p>';
        } else {
            snapshot.docs.forEach(doc => {
                const job = doc.data();
                const jobId = doc.id;
                const clientName = job.clientName || 'Cliente Anónimo';
                const location = job.country && typeof getCountryName !== 'undefined' ? `${getCountryName(job.country)}` : 'Remoto/N/A';
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


// Implementación de Ver Perfil con restricción de login (CORREGIDO: Usa el estado de Auth de Firebase)
window.viewTalentProfile = async function(talentId) {
    const viewModal = document.getElementById('viewProfileModal');
    const profileViewContent = document.getElementById('profileViewContent');
    const authPrompt = document.getElementById('profileAuthPrompt');

    if (!viewModal || !profileViewContent || !authPrompt) {
        console.error("No se encontraron elementos del modal de vista de perfil.");
        return;
    }

    // Limpiar contenido anterior
    profileViewContent.innerHTML = '<h2>Cargando perfil...</h2>';
    authPrompt.style.display = 'none';
    viewModal.style.display = 'flex';

    try {
        const talentDoc = await db.collection('talents').doc(talentId).get();
        if (!talentDoc.exists) {
            profileViewContent.innerHTML = '<h2>Perfil no encontrado.</h2>';
            return;
        }

        const talent = talentDoc.data();
        
        // CORRECCIÓN CLAVE: Usar el estado de Auth de Firebase para la verificación
        const authUser = firebase.auth().currentUser;
        const isLoggedIn = !!authUser; 
        
        // Obtener nombres completos de ubicación
        const countryName = typeof window.getCountryName === 'function' ? window.getCountryName(talent.country) : talent.country;
        const stateName = typeof window.getStateName === 'function' ? window.getStateName(talent.country, talent.state) : talent.state;
        const locationDisplay = countryName && stateName ? `${talent.city}, ${stateName}, ${countryName}` : 'Ubicación no especificada';

        // Información de contacto: Se oculta si no está logeado
        let contactInfoHtml = '';
        if (isLoggedIn) {
            contactInfoHtml = `
                <div class="info-grid contact-info-grid">
                    <div class="info-item"><label><i class="fas fa-envelope"></i> Email:</label><span>${talent.email || 'N/A'}</span></div>
                    <div class="info-item"><label><i class="fas fa-phone"></i> Teléfono:</label><span>${talent.phone || 'N/A'}</span></div>
                </div>
            `;
            authPrompt.style.display = 'none'; // Ocultar el prompt
        } else {
            contactInfoHtml = '<div style="text-align:center; padding: 10px;">Información de contacto oculta. Debes iniciar sesión para verla.</div>';
            authPrompt.style.display = 'block'; // Mostrar el prompt
        }

        const profileHtml = `
            <div class="profile-header-view">
                <div class="profile-avatar-container-view">
                    <img src="${talent.profilePhotoUrl || 'https://via.placeholder.com/80?text=V'}" alt="Foto de Perfil" class="profile-avatar-view">
                </div>
                <div class="profile-info-intro-view">
                    <h1>${talent.name || 'Talento de Voz'}</h1>
                    <p class="profile-type-view">Talento de Voz | ${talent.gender || 'N/A'}</p>
                    <p class="profile-location-view"><i class="fas fa-map-marker-alt"></i> ${locationDisplay}</p>
                </div>
                <button class="btn btn-secondary btn-sm" onclick="window.addToFavorites('${talentId}')"><i class="fas fa-heart"></i> Favorito</button>
            </div>
            
            <hr>
            
            <div class="info-section">
                <h2>Información de Contacto</h2>
                ${contactInfoHtml}
            </div>

            <hr>
            
            <div class="info-section">
                <h2>Idiomas</h2>
                <p>${talent.languages ? talent.languages.join(', ') : 'No especificado'}</p>
            </div>
            
            <div class="info-section">
                <h2>Características de la Voz</h2>
                <div class="info-grid">
                    <div class="info-item"><label>Edad Real:</label><span>${talent.realAge || 'N/A'}</span></div>
                    <div class="info-item"><label>Rango de Edad:</label><span>${talent.ageRange || 'N/A'}</span></div>
                </div>
            </div>

            <div class="info-section">
                <h2>Demos de Audio (${talent.demos?.length || 0})</h2>
                <div class="demos-section">
                    ${talent.demos && talent.demos.length > 0 ? 
                        talent.demos.map(demo => `
                            <div class="demo-item">
                                <audio controls src="${demo.url}"></audio>
                                <span>${demo.name || 'Demo de audio'}</span>
                            </div>
                        `).join('')
                        : '<p>Este talento aún no ha subido demos.</p>'
                    }
                </div>
            </div>

            <div class="info-section">
                <h2>Acerca de mí</h2>
                <p>${talent.description || 'Sin descripción.'}</p>
            </div>
        `;

        profileViewContent.innerHTML = profileHtml;

    } catch (error) {
        console.error('Error al cargar el perfil:', error);
        profileViewContent.innerHTML = '<h2>Error al cargar el perfil.</h2><p>' + error.message + '</p>';
    }
};
window.viewTalentProfile = viewTalentProfile; 

window.closeViewProfileModal = function() {
    const viewModal = document.getElementById('viewProfileModal');
    if (viewModal) viewModal.style.display = 'none';
};

// Funciones auxiliares
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
window.toggleCompanyName = toggleCompanyName;

function toggleOtherLanguages() {
    const otherLanguagesInput = document.getElementById('otherLanguages');
    if (otherLanguagesInput) {
        otherLanguagesInput.style.display = document.getElementById('lang10').checked ? 'block' : 'none';
    }
}
window.toggleOtherLanguages = toggleOtherLanguages;

// Función auxiliar para mostrar mensajes (hecha global)
function showMessage(element, message, type) {
    const el = typeof element === 'string' ? document.getElementById(element) : element;
    if (el) {
        el.innerHTML = `<div class=\"${type}\">${message}</div>`;
    }
}
window.showMessage = showMessage;

// Funciones placeholder
window.addToFavorites = function(talentId) {
    if (firebase.auth().currentUser) {
        alert(`Añadir talento ${talentId} a favoritos. Funcionalidad pendiente.`);
    } else {
         window.closeAllModals(); 
         document.getElementById('loginModal').style.display = 'flex';
         showMessage('loginMessage', 'Debes iniciar sesión para añadir a favoritos.', 'error');
    }
};
window.applyToJob = function(jobId) {
    if (firebase.auth().currentUser) {
        alert(`Postular al trabajo ${jobId}. Funcionalidad pendiente.`);
    } else {
         window.closeAllModals(); 
         document.getElementById('loginModal').style.display = 'flex';
         showMessage('loginMessage', 'Debes iniciar sesión para postularte.', 'error');
    }
};
