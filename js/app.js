// Funciones principales de la aplicación

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    checkAuthState();
    
    // CORRECCIÓN: Asegurar que la carga de talentos solo corra en index.html
    if (!window.location.href.includes('profile.html')) {
        loadTalents();
        loadJobOffers();
        loadLocationData(); // Cargar la data de ubicación para los modales de registro
    }
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

    // Listeners de Formularios
    document.getElementById('talentForm')?.addEventListener('submit', registerTalent);
    document.getElementById('clientForm')?.addEventListener('submit', registerClient);
    document.getElementById('loginForm')?.addEventListener('submit', loginUser);
    
    // Listeners Auxiliares
    document.getElementById('clientType')?.addEventListener('change', toggleCompanyName);
    document.getElementById('lang10')?.addEventListener('change', toggleOtherLanguages);
    
    // Listener de Foto de Perfil en el modal de edición (de profile.js)
    document.getElementById('editPhotoInput')?.addEventListener('change', window.handleProfilePhotoUpload);
    
    // Listener de guardado de perfil en el modal de edición (de profile.js)
    document.getElementById('editProfileForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const userId = currentUser.uid;
        if (currentUser.isTalent) {
            window.updateTalentProfile(userId);
        } else {
            window.updateClientProfile(userId);
        }
    });

}


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
        // Asumiendo que 'db' está definido en firebase-config.js
        const snapshot = await db.collection('talents').limit(6).get();
        const talents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        if (talents.length === 0) {
            talentCardsContainer.innerHTML = '<p class="loading">No se encontraron talentos registrados aún.</p>';
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

// =========================================================================
// FUNCIONES AUXILIARES GLOBALES
// =========================================================================

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
}
window.closeAllModals = closeAllModals;

function toggleCompanyName() {
    const companyNameGroup = document.getElementById('companyNameGroup');
    if (companyNameGroup) {
        document.getElementById('companyNameGroup').style.display = document.getElementById('clientType').value === 'empresa' ? 'block' : 'none';
    }
}

function toggleOtherLanguages() {
    const otherLanguagesInput = document.getElementById('otherLanguagesInput');
    const lang10Checkbox = document.getElementById('lang10');
    if (otherLanguagesInput && lang10Checkbox) {
        otherLanguagesInput.style.display = lang10Checkbox.checked ? 'block' : 'none';
    }
}

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

// Se asume que showMessage está definido globalmente en auth.js o profile.js.
// Se define aquí por si acaso
function showMessage(element, message, type) {
    const el = typeof element === 'string' ? document.getElementById(element) : element;
    if (el) {
        el.innerHTML = `<div class=\"${type}\">${message}</div>`;
    }
}
window.showMessage = showMessage;
