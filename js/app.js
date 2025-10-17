// Funciones principales de la aplicación

// =========================================================
// CONSTANTES Y FUNCIONES DE FILTRO
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
            if (languageSelect) languageSelect.value = '';
            if (document.getElementById('filterVoiceType')) document.getElementById('filterVoiceType').value = '';
            if (document.getElementById('filterAgeRange')) document.getElementById('filterAgeRange').value = '';
            if (document.getElementById('filterKeyword')) document.getElementById('filterKeyword').value = '';
            
            loadTalents({}); // Recargar todos los talentos
        });
    }
}


// =========================================================
// FUNCIONES DE CARGA Y RENDERIZADO
// =========================================================

// Cargar y filtrar Talentos
async function loadTalents(filters = {}) {
    const talentList = document.getElementById('talentList');
    if (!talentList) return; 

    talentList.innerHTML = '<div class="loading">Cargando talentos de voz...</div>';

    try {
        let query = db.collection('talents');

        // FireStore Query: Solo podemos usar UNA where clause de array-contains y UNA de igualdad.
        // Optamos por usar 'language' y 'voiceType' para la query de FireStore
        if (filters.language && filters.language !== '') {
            query = query.where('languages', 'array-contains', filters.language);
        }
        
        // Si usamos voiceType también como query, FireStore requerirá un índice compuesto.
        // Si no se usa, el filtrado se hace en el cliente. Usaremos solo lenguaje para la query,
        // y el resto para filtrado en el cliente para evitar problemas de índices complejos.
        
        const snapshot = await query.get();
        let talents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Filtrado en el cliente para voiceType, ageRange y keyword (más flexible)
        talents = talents.filter(talent => {
            const matchesVoiceType = !filters.voiceType || filters.voiceType === '' || talent.voiceType === filters.voiceType;
            const matchesAgeRange = !filters.ageRange || filters.ageRange === '' || talent.ageRange === filters.ageRange;
            
            let matchesKeyword = true;
            if (filters.keyword && filters.keyword !== '') {
                const keyword = filters.keyword.toLowerCase();
                matchesKeyword = (talent.name && talent.name.toLowerCase().includes(keyword)) ||
                                 (talent.bio && talent.bio.toLowerCase().includes(keyword)) ||
                                 (Array.isArray(talent.accents) && talent.accents.some(accent => accent.toLowerCase().includes(keyword)));
            }

            return matchesVoiceType && matchesAgeRange && matchesKeyword;
        });


        if (talents.length === 0) {
            talentList.innerHTML = '<p class="info-box">No se encontraron talentos que coincidan con los filtros.</p>';
            return;
        }
        
        renderTalentCards(talents, talentList);

    } catch (error) {
        console.error('Error cargando talentos con filtros:', error);
        talentList.innerHTML = '<p class="error-box">Error al cargar los talentos. Revisa la consola para más detalles.</p>';
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
                    <p><strong>Requisitos:</strong> ${job.requirements ? job.requirements.substring(0, 100) + '...' : 'N/A'}</p>
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

// Inicialización: Asegura que la carga de talentos y filtros se hace solo en index.html
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    checkAuthState();
    
    // CORRECCIÓN: Ejecutar la lógica de carga solo en la página principal
    if (!window.location.href.includes('profile.html')) {
        setupFilterControls(); // 1. Configurar los controles de filtro
        loadTalents({});      // 2. Cargar talentos (usando los filtros iniciales)
        loadJobOffers();      // 3. Cargar ofertas
        // loadLocationData() se asume que está en locations.js y se carga con el script
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
    
    // CORRECCIÓN: logoutUser y loginUser ya son globales desde auth.js
    document.getElementById('logoutBtn')?.addEventListener('click', logoutUser); 

    document.querySelectorAll('.close-modal').forEach(button => {
        button.addEventListener('click', closeAllModals);
    });

    // Listeners de Forms
    document.getElementById('talentForm')?.addEventListener('submit', registerTalent);
    document.getElementById('clientForm')?.addEventListener('submit', registerClient);
    document.getElementById('loginForm')?.addEventListener('submit', loginUser);
    document.getElementById('jobForm')?.addEventListener('submit', postJobOffer);

    // Listeners de Campos Dinámicos
    document.getElementById('clientType')?.addEventListener('change', toggleCompanyName);
    document.getElementById('lang10')?.addEventListener('change', toggleOtherLanguages);
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


// Funciones globales (stubs)
window.viewTalentProfile = function(talentId) {
    alert(`Ver perfil completo del talento ${talentId}. Funcionalidad pendiente.`);
};
window.addToFavorites = function(talentId) {
    alert(`Añadir talento ${talentId} a favoritos. Funcionalidad pendiente.`);
};
window.applyToJob = function(jobId) {
    alert(`Postular al trabajo ${jobId}. Funcionalidad pendiente.`);
};
