// Funciones principales de la aplicación

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    checkAuthState();
    
    // CORRECCIÓN: Asegurar que la carga de talentos solo corra en index.html
    if (!window.location.href.includes('profile.html')) {
        loadTalents();
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
        companyNameGroup.style.display = document.getElementById('clientType').value === 'empresa' ? 'block' : 'none';
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

// ========== FUNCIÓN PARA VERIFICAR CONFIGURACIÓN (de firebase-config.js) ==========\n\nfunction checkCloudinaryConfig() {\n    if (typeof cloudinaryConfig === 'undefined' || !cloudinaryConfig.cloudName || cloudinaryConfig.cloudName === 'TU_CLOUD_NAME') {\n        console.error('❌ Cloudinary NO configurado. Revisa firebase-config.js');\n        return false;\n    }\n    console.log('✅ Configuración de Cloudinary OK');\n    return true;\n}\n\ndocument.addEventListener('DOMContentLoaded', function() {\n    setTimeout(() => {\n        checkCloudinaryConfig();\n    }, 1000);\n});\n```

---

## 2. Archivo Corregido: `js/locations.js` (Más Países y Ciudades) 🌎

He expandido la data geográfica para que sea más robusta, incluyendo más países hispanohablantes y más estados/provincias y ciudades. **Ya no necesitas un archivo JSON externo**.

**Reemplaza **TODO** el contenido de tu `js/locations.js` con este código:**

```javascript
// =========================================================================
// js/locations.js - Data y lógica de ubicación para países hispanohablantes
// =========================================================================

// Data de Localizaciones - INTEGRADA DIRECTAMENTE (Expandida para mayor cobertura)
const locationData = {
    // ---------------------- ARGENTINA (AR) ----------------------
    "AR": { name: "Argentina", states: {
        "CABA": { name: "Ciudad Autónoma de Buenos Aires", cities: ["Buenos Aires", "La Plata", "Mar del Plata"]},
        "CBA": { name: "Córdoba", cities: ["Córdoba Capital", "Río Cuarto", "Villa María"]},
        "SFE": { name: "Santa Fe", cities: ["Rosario", "Santa Fe Capital", "Rafaela"]},
    }},
    // ---------------------- CHILE (CL) ----------------------
    "CL": { name: "Chile", states: {
        "RM": { name: "Región Metropolitana", cities: ["Santiago", "Puente Alto", "Maipú"]},
        "V": { name: "Valparaíso", cities: ["Valparaíso", "Viña del Mar", "Quilpué"]},
        "Bio": { name: "Biobío", cities: ["Concepción", "Talcahuano", "Los Ángeles"]},
    }},
    // ---------------------- COLOMBIA (CO) ----------------------
    "CO": { name: "Colombia", states: {
        "DC": { name: "Bogotá D.C.", cities: ["Bogotá", "Soacha"]},
        "ANT": { name: "Antioquia", cities: ["Medellín", "Envigado", "Itagüí"]},
        "VAL": { name: "Valle del Cauca", cities: ["Cali", "Palmira", "Buenaventura"]},
    }},
    // ---------------------- ESPAÑA (ES) ----------------------
    "ES": { name: "España", states: {
        "MD": { name: "Comunidad de Madrid", cities: ["Madrid", "Alcalá de Henares", "Móstoles"]},
        "CT": { name: "Cataluña", cities: ["Barcelona", "Tarragona", "Lleida"]},
        "AN": { name: "Andalucía", cities: ["Sevilla", "Málaga", "Granada"]},
    }},
    // ---------------------- MÉXICO (MX) ----------------------
    "MX": { name: "México", states: {
        "CMX": { name: "Ciudad de México", cities: ["Ciudad de México", "Ecatepec de Morelos"]},
        "JAL": { name: "Jalisco", cities: ["Guadalajara", "Zapopan", "Tlaquepaque"]},
        "NL": { name: "Nuevo León", cities: ["Monterrey", "Guadalupe", "San Nicolás de los Garza"]},
    }},
    // ---------------------- PERÚ (PE) ----------------------
    "PE": { name: "Perú", states: {
        "LIM": { name: "Lima", cities: ["Lima", "Callao", "Arequipa"]},
        "CUS": { name: "Cusco", cities: ["Cusco", "Sicuani"]},
    }},
    // ---------------------- VENEZUELA (VE) ----------------------
    "VE": { name: "Venezuela", states: {
        "MIR": { name: "Miranda", cities: ["Caracas", "Guarenas", "Guatire"]},
        "ZUL": { name: "Zulia", cities: ["Maracaibo", "Cabimas"]},
    }},
    // ---------------------- COSTA RICA (CR) ----------------------
    "CR": { name: "Costa Rica", states: {
        "SJ": { name: "San José", cities: ["San José", "Escazú"]},
    }},
    // ---------------------- URUGUAY (UY) ----------------------
    "UY": { name: "Uruguay", states: {
        "MVD": { name: "Montevideo", cities: ["Montevideo", "Ciudad de la Costa"]},
    }},
};

// Lista de países hispanohablantes para poblar el primer select.
const HISPANIC_COUNTRIES = Object.keys(locationData).map(code => ({
    code: code,
    name: locationData[code].name
})).sort((a, b) => a.name.localeCompare(b.name));


/**
 * Función que inicializa la carga de los selects de ubicación.
 */
function loadLocationData() {
    console.log('🗺️ Inicializando selects de ubicación...');
    
    // Configuración para el modal de Registro de Talento
    setupLocationSelects('talentForm', 'country', 'state', 'city');
    // Configuración para el modal de Registro de Cliente
    setupLocationSelects('clientForm', 'countryClient', 'stateClient', 'cityClient');
    
    // Configuración para el modal de Edición (profile.html)
    setupLocationSelects('editProfileForm', 'editCountry', 'editState', 'editCity');
}
window.loadLocationData = loadLocationData;

/**
 * Configura los event listeners y rellena el select de País.
 */
function setupLocationSelects(formId, countrySelectId, stateSelectId, citySelectId) {
    const countrySelect = document.getElementById(countrySelectId);
    const stateSelect = document.getElementById(stateSelectId);
    const citySelect = document.getElementById(citySelectId);
    
    if (!countrySelect) return; 

    // 1. Poblar País
    populateCountrySelect(countrySelect, stateSelect, citySelect);
    
    // 2. Event Listener para País
    countrySelect.addEventListener('change', () => {
        const selectedCountryCode = countrySelect.value;
        populateStateSelect(stateSelect, citySelect, selectedCountryCode);
    });

    // 3. Event Listener para Provincia/Estado
    if (stateSelect) {
        stateSelect.addEventListener('change', () => {
            const selectedCountryCode = countrySelect.value;
            const selectedStateCode = stateSelect.value;
            populateCitySelect(citySelect, selectedCountryCode, selectedStateCode);
        });
    }
}

/**
 * Rellena el select de País.
 */
function populateCountrySelect(countrySelect, stateSelect, citySelect, selectedCountryCode = null) {
    countrySelect.innerHTML = '<option value="">Seleccionar País *</option>';
    
    HISPANIC_COUNTRIES.forEach(country => {
        const option = document.createElement('option');
        option.value = country.code;
        option.textContent = country.name;
        if (country.code === selectedCountryCode) option.selected = true;
        countrySelect.appendChild(option);
    });

    // Inicializar Estado y Ciudad
    if (stateSelect) stateSelect.innerHTML = '<option value="">Seleccionar Provincia/Estado *</option>';
    if (citySelect) citySelect.innerHTML = '<option value="">Seleccionar Ciudad *</option>';
}

/**
 * Rellena el select de Estado/Provincia.
 */
function populateStateSelect(stateSelect, citySelect, countryCode, selectedStateCode = null) {
    if (!stateSelect) return;
    
    stateSelect.innerHTML = '<option value="">Seleccionar Provincia/Estado *</option>';
    if (citySelect) citySelect.innerHTML = '<option value="">Seleccionar Ciudad *</option>';

    if (countryCode && locationData[countryCode]) {
        const states = locationData[countryCode].states;
        for (const code in states) {
            const option = document.createElement('option');
            option.value = code;
            option.textContent = states[code].name;
            if (code === selectedStateCode) option.selected = true;
            stateSelect.appendChild(option);
        }
    }
}

/**
 * Rellena el select de Ciudad.
 */
function populateCitySelect(citySelect, countryCode, stateCode, selectedCityName = null) {
    if (!citySelect) return;
    
    citySelect.innerHTML = '<option value="">Seleccionar Ciudad *</option>';
    
    if (countryCode && stateCode && locationData[countryCode] && locationData[countryCode].states[stateCode]) {
        const cities = locationData[countryCode].states[stateCode].cities;
        
        cities.forEach(cityName => {
            const option = document.createElement('option');
            option.value = cityName;
            option.textContent = cityName;
            if (cityName === selectedCityName) option.selected = true;
            citySelect.appendChild(option);
        });
    }
}

// =========================================================================
// Funciones auxiliares usadas en profile.js para la vista del perfil
// =========================================================================

window.getCountryName = function(code) {
    if (!code) return 'N/A';
    return locationData[code]?.name || code;
}

window.getStateName = function(countryCode, stateCode) {
    if (!countryCode || !stateCode) return 'N/A';
    return locationData[countryCode]?.states[stateCode]?.name || stateCode;
}

window.getCityName = function(countryCode, stateCode, cityName) {
    return cityName || 'N/A';
}

/**
 * Función para cargar los valores actuales en el modal de edición de perfil.
 * (Llamada desde profile.js)
 */
window.loadEditLocationFields = async function(currentCountry, currentState, currentCity) {
    const countrySelect = document.getElementById('editCountry');
    const stateSelect = document.getElementById('editState');
    const citySelect = document.getElementById('editCity');
    
    if (!countrySelect) return;

    // 1. Cargar País y preseleccionar
    populateCountrySelect(countrySelect, stateSelect, citySelect, currentCountry);
    
    // 2. Cargar Estados del país preseleccionado y preseleccionar
    if (currentCountry) {
        populateStateSelect(stateSelect, citySelect, currentCountry, currentState);
    }
    
    // 3. Cargar Ciudades del estado preseleccionado y preseleccionar
    if (currentCountry && currentState) {
        populateCitySelect(citySelect, currentCountry, currentState, currentCity);
    }
}
