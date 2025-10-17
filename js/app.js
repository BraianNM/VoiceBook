// Funciones principales de la aplicación

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    window.setupEventListeners();
    window.checkAuthState();
    
    // CORRECCIÓN: Asegurar que la carga de talentos solo corra en index.html
    if (!window.location.pathname.includes('profile.html')) {
        window.loadTalents();
        window.loadJobOffers();
        window.loadLocationData(); // Cargar la data de ubicación para los modales de registro
    }
});

// Configurar event listeners
function setupEventListeners() {
    // Listeners de Modales y Navegación
    document.getElementById('heroTalentBtn')?.addEventListener('click', () => window.openModal('talentModal'));
    document.getElementById('heroClientBtn')?.addEventListener('click', () => window.openModal('clientModal'));
    document.getElementById('registerBtn')?.addEventListener('click', () => window.openModal('talentModal'));
    document.getElementById('loginBtn')?.addEventListener('click', () => window.openModal('loginModal'));
    
    // Redirección al Dashboard/Profile
    document.getElementById('dashboardLink')?.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = 'profile.html';
    });
    
    document.getElementById('logoutBtn')?.addEventListener('click', window.logoutUser);

    document.querySelectorAll('.close-modal').forEach(button => {
        button.addEventListener('click', window.closeAllModals);
    });

    // Listeners de Formularios de Autenticación
    document.getElementById('talentForm')?.addEventListener('submit', window.registerTalent);
    document.getElementById('clientForm')?.addEventListener('submit', window.registerClient);
    document.getElementById('loginForm')?.addEventListener('submit', window.loginUser);
    
    // Listeners Auxiliares de registro
    document.getElementById('clientType')?.addEventListener('change', window.toggleCompanyName);
    document.getElementById('lang10')?.addEventListener('change', window.toggleOtherLanguages);
    
    // Listeners de Edición de Perfil (Solo en profile.html)
    document.getElementById('editPhotoInput')?.addEventListener('change', window.handleProfilePhotoUpload);
    document.getElementById('editProfileForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const userId = window.currentUser.uid;
        if (window.currentUser.isTalent) {
            window.updateTalentProfile(userId);
        } else {
            window.updateClientProfile(userId);
        }
    });

}
window.setupEventListeners = setupEventListeners; // Hacer global para profile.html

// =========================================================================
// FUNCIONES DE CARGA EN PÁGINA PRINCIPAL (INDEX.HTML)
// =========================================================================

/**
 * Carga y muestra los perfiles de talento en la página principal.
 */
async function loadTalents() {
    const talentCardsContainer = document.getElementById('talentCards');
    if (!talentCardsContainer) return;
    
    talentCardsContainer.innerHTML = '<div class="loading">Cargando talentos...</div>';

    try {
        const snapshot = await db.collection('talents').limit(6).get();
        const talents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        if (talents.length === 0) {
            talentCardsContainer.innerHTML = '<p class="loading">No se encontraron talentos registrados aún. ¡Sé el primero en registrarte!</p>';
            return;
        }

        talentCardsContainer.innerHTML = talents.map(talent => {
            // Utilizar el nombre del país desde locations.js
            const countryName = window.getCountryName ? window.getCountryName(talent.country) : talent.country;

            // Mostrar el primer demo si existe
            const firstDemo = talent.demos && talent.demos.length > 0 ? talent.demos[0] : null;

            return `
                <div class="card talent-card">
                    <div class="card-header">
                        <img src="${talent.photoURL || 'https://via.placeholder.com/100/3498db/ffffff?text=V'}" alt="${talent.name}" class="profile-picture-sm">
                        <h3>${talent.name}</h3>
                    </div>
                    <p><strong>Especialidad:</strong> ${talent.specialty || 'No especificada'}</p>
                    <p><strong>Idiomas:</strong> ${talent.languages ? talent.languages.join(', ') : 'N/A'}</p>
                    <p><strong>Ubicación:</strong> ${countryName || 'Global'}</p>
                    
                    ${firstDemo ? 
                        `<div class="audio-preview">
                            <label>Demo:</label>
                            <audio controls src="${firstDemo.url}"></audio>
                        </div>` : ''}

                    <div class="card-actions">
                        <button class="btn btn-primary" onclick="window.viewTalentProfile('${talent.id}')">Ver Perfil</button>
                        <button class="btn btn-outline" onclick="window.addToFavorites('${talent.id}')"><i class="far fa-heart"></i></button>
                    </div>
                </div>
            `;
        }).join('');

    } catch (error) {
        console.error('Error cargando talentos:', error);
        talentCardsContainer.innerHTML = '<p class="error">❌ Error al cargar los talentos. Inténtalo de nuevo más tarde.</p>';
    }
}
window.loadTalents = loadTalents;

/**
 * Carga y muestra las ofertas de trabajo (funcionalidad pendiente).
 */
function loadJobOffers() {
    const jobOffersContainer = document.getElementById('jobOffers');
    if (!jobOffersContainer) return;
    
    // Simulación de ofertas
    jobOffersContainer.innerHTML = `
        <div class="card job-card">
            <h3>Locutor para Audiolibro</h3>
            <p>Cliente: Editorial XYZ</p>
            <p>Requisitos: Voz grave, Español neutro.</p>
            <div class="card-actions">
                <button class="btn btn-primary" onclick="window.applyToJob('job1')">Postular</button>
            </div>
        </div>
        <div class="card job-card">
            <h3>Voz para Comercial de Radio</h3>
            <p>Cliente: Agencia Digital</p>
            <p>Requisitos: Voz juvenil, Home Studio.</p>
            <div class="card-actions">
                <button class="btn btn-primary" onclick="window.applyToJob('job2')">Postular</button>
            </div>
        </div>
    `;
}
window.loadJobOffers = loadJobOffers;

// =========================================================================
// FUNCIONES AUXILIARES GLOBALES
// =========================================================================

function openModal(modalId) {
    window.closeAllModals(); // Cierra cualquier modal abierto
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'flex';
}
window.openModal = openModal;

function toggleCompanyName() {
    const companyNameGroup = document.getElementById('companyNameGroup');
    if (companyNameGroup) {
        companyNameGroup.style.display = document.getElementById('clientType').value === 'empresa' ? 'block' : 'none';
    }
}
window.toggleCompanyName = toggleCompanyName;


function toggleOtherLanguages() {
    const otherLanguagesInput = document.getElementById('otherLanguagesInput');
    const lang10Checkbox = document.getElementById('lang10');
    if (otherLanguagesInput && lang10Checkbox) {
        otherLanguagesInput.style.display = lang10Checkbox.checked ? 'block' : 'none';
        if (!lang10Checkbox.checked) {
            document.getElementById('otherLanguages').value = ''; // Limpiar campo al ocultar
        }
    }
}
window.toggleOtherLanguages = toggleOtherLanguages;


// Funciones para acciones futuras (se definen globalmente para los onclick en HTML)
window.viewTalentProfile = function(talentId) {
    alert(`Ver perfil completo del talento ${talentId}. Funcionalidad pendiente.`);
};
window.addToFavorites = function(talentId) {
    alert(`Añadir talento ${talentId} a favoritos. Funcionalidad pendiente.`);
};
window.applyToJob = function(jobId) {
    alert(`Postular al trabajo ${jobId}. Funcionalidad pendiente.`);
};
