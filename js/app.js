// Funciones principales de la aplicación

// =========================================================
// CONSTANTES Y FUNCIONES DE FILTRO (NUEVO)
// =========================================================
const VOICE_TYPES = ['Masculina', 'Femenina', 'Infantil'];
const AGE_RANGES = ['Niño/Adolescente', 'Joven Adulto', 'Adulto', 'Mayor'];
const LANGUAGES = ['Español', 'Inglés', 'Portugués', 'Francés', 'Alemán', 'Italiano', 'Otro'];

function setupFilterControls() {
    const languageSelect = document.getElementById('filterLanguage');
    const filterForm = document.getElementById('talentFilterForm');
    const clearBtn = document.getElementById('clearFiltersBtn');
    
    // 1. Popular Idiomas dinámicamente
    if (languageSelect) {
        LANGUAGES.forEach(lang => {
            const option = document.createElement('option');
            option.value = lang;
            option.textContent = lang;
            languageSelect.appendChild(option);
        });
    }

    // 2. Listener de Formulario
    if (filterForm) {
        filterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const filters = {
                language: document.getElementById('filterLanguage').value,
                voiceType: document.getElementById('filterVoiceType').value,
                ageRange: document.getElementById('filterAgeRange').value,
                keyword: document.getElementById('filterKeyword').value,
            };
            loadTalents(filters);
        });
    }
    
    // 3. Listener de Limpiar Filtros
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            // Resetear valores
            if (languageSelect) languageSelect.value = '';
            if (document.getElementById('filterVoiceType')) document.getElementById('filterVoiceType').value = '';
            if (document.getElementById('filterAgeRange')) document.getElementById('filterAgeRange').value = '';
            if (document.getElementById('filterKeyword')) document.getElementById('filterKeyword').value = '';
            
            // Recargar todos los talentos
            loadTalents({});
        });
    }
}


// =========================================================
// FUNCIONES DE CARGA Y RENDERIZADO (MODIFICADAS)
// =========================================================

// Cargar y filtrar Talentos
async function loadTalents(filters = {}) {
    const talentList = document.getElementById('talentList');
    if (!talentList) return; 

    talentList.innerHTML = '<div class="loading">Cargando talentos de voz...</div>';

    try {
        let query = db.collection('talents');

        // Aplicar filtros de FireStore (solo si es necesario para índices)
        // Nota: FireStore solo permite un array-contains y una 'where' en la misma consulta sin índices compuestos.
        if (filters.language && filters.language !== '') {
            query = query.where('languages', 'array-contains', filters.language);
        }
        if (filters.voiceType && filters.voiceType !== '') {
            query = query.where('voiceType', '==', filters.voiceType);
        }
        if (filters.ageRange && filters.ageRange !== '') {
            query = query.where('ageRange', '==', filters.ageRange);
        }
        
        const snapshot = await query.get();
        let talents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Filtro de palabras clave en el cliente (para Nombre, Acento o Biografía)
        if (filters.keyword && filters.keyword !== '') {
            const keyword = filters.keyword.toLowerCase();
            talents = talents.filter(talent => 
                (talent.name && talent.name.toLowerCase().includes(keyword)) ||
                (talent.bio && talent.bio.toLowerCase().includes(keyword)) ||
                (Array.isArray(talent.accents) && talent.accents.some(accent => accent.toLowerCase().includes(keyword)))
            );
        }

        if (talents.length === 0) {
            talentList.innerHTML = '<p class="info-box">No se encontraron talentos que coincidan con los filtros.</p>';
            return;
        }
        
        renderTalentCards(talents, talentList);

    } catch (error) {
        console.error('Error cargando talentos con filtros:', error);
        talentList.innerHTML = '<p class="error-box">Error al cargar los talentos. Revisa la consola para más detalles (posiblemente falta un índice de FireStore).</p>';
    }
}
window.loadTalents = loadTalents;


function renderTalentCards(talents, container) {
    let talentHtml = '';
    talents.forEach(talent => {
        const languages = Array.isArray(talent.languages) ? talent.languages.join(', ') : (talent.languages || 'N/A');
        const accents = Array.isArray(talent.accents) ? talent.accents.join(', ') : (talent.accents || 'N/A');

        talentHtml += `
            <div class="talent-card">
                <div class="profile-pic-small" style="background-image: url('${talent.photoURL || 'images/default-profile.png'}');"></div>
                <h3>${talent.name} ${talent.lastName || ''}</h3>
                <p class="role-text">${talent.voiceType || 'N/A'} | ${talent.ageRange || 'N/A'}</p>
                <p class="bio-snippet">${talent.bio ? talent.bio.substring(0, 100) + '...' : 'Sin biografía'}</p>
                <p class="languages">Idiomas: ${languages}</p>
                <p class="accents">Acentos: ${accents}</p>
                <button class="btn btn-primary btn-small" onclick="viewTalentProfile('${talent.id}')">Ver Perfil</button>
                <button class="btn btn-warning btn-small" onclick="addToFavorites('${talent.id}')"><i class="fas fa-heart"></i></button>
            </div>
        `;
    });
    container.innerHTML = talentHtml;
}


// Cargar Ofertas de Trabajo
async function loadJobOffers() {
    const jobList = document.getElementById('jobList');
    if (!jobList) return;

    jobList.innerHTML = '<div class="loading">Cargando ofertas de trabajo...</div>';

    try {
        const snapshot = await db.collection('jobs').get();
        const jobs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        if (jobs.length === 0) {
            jobList.innerHTML = '<p class="info-box">No hay ofertas de trabajo disponibles en este momento.</p>';
            return;
        }

        let jobHtml = '';
        jobs.forEach(job => {
            jobHtml += `
                <div class="job-card">
                    <h3>${job.title}</h3>
                    <p><strong>Presupuesto:</strong> ${job.budget || 'A negociar'}</p>
                    <p><strong>Requisitos:</strong> ${job.requirements || 'N/A'}</p>
                    <button class="btn btn-primary btn-small" onclick="applyToJob('${job.id}')">Postular</button>
                </div>
            `;
        });
        
        jobList.innerHTML = jobHtml;

    } catch (error) {
        console.error('Error cargando ofertas de trabajo:', error);
        jobList.innerHTML = '<p class="error-box">Error al cargar las ofertas de trabajo.</p>';
    }
}
window.loadJobOffers = loadJobOffers;


// =========================================================
// FUNCIONES AUXILIARES Y EVENTOS
// =========================================================

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    checkAuthState();
    
    // CORRECCIÓN: Asegurar que la carga de talentos solo corra en index.html
    if (!window.location.href.includes('profile.html')) {
        setupFilterControls(); // Configurar los controles de filtro (NUEVO)
        loadTalents({}); // Cargar talentos inicialmente sin filtros
        loadJobOffers();
        loadLocationData(); // Cargar la data de ubicación para el modal de registro
    }
});

// Configurar event listeners (CORREGIDO: Llamada más robusta a funciones de edición)
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

    // Listeners de Forms
    document.getElementById('talentForm')?.addEventListener('submit', registerTalent);
    document.getElementById('clientForm')?.addEventListener('submit', registerClient);
    document.getElementById('loginForm')?.addEventListener('submit', loginUser);
    document.getElementById('jobForm')?.addEventListener('submit', postJobOffer); // Se asume que postJobOffer está en auth.js

    // Listeners de Campos Dinámicos
    document.getElementById('clientType')?.addEventListener('change', toggleCompanyName);
    document.getElementById('lang10')?.addEventListener('change', toggleOtherLanguages); // Asumiendo lang10 es el checkbox de 'otros'
}

// Funciones para cerrar modales
function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
}

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

// Funciones globales (aún pendientes de implementar su lógica completa)
window.viewTalentProfile = function(talentId) {
    // En una aplicación real, esto redirigiría a la página del perfil del talento
    alert(`Ver perfil completo del talento ${talentId}. Funcionalidad pendiente.`);
};
window.addToFavorites = function(talentId) {
    // La lógica de FireStore para añadir favoritos debe estar en profile.js o auth.js
    alert(`Añadir talento ${talentId} a favoritos. Funcionalidad pendiente.`);
};
window.applyToJob = function(jobId) {
    // La lógica de postulación debe estar en auth.js o app.js
    alert(`Postular al trabajo ${jobId}. Funcionalidad pendiente.`);
};

// Se asume que showMessage ya está definido globalmente en auth.js
function showMessage(element, message, type) {
    const el = typeof element === 'string' ? document.getElementById(element) : element;
    if (el) {
        el.innerHTML = `<div class=\"${type}\">${message}</div>`;
    }
}
window.showMessage = showMessage;
