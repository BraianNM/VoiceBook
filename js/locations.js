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
    
    // Configuración para el modal de Registro de Talento (IDs: country, state, city)
    setupLocationSelects('talentForm', 'country', 'state', 'city');
    // Configuración para el modal de Registro de Cliente (IDs: clientCountry, clientState, clientCity)
    setupLocationSelects('clientForm', 'clientCountry', 'clientState', 'clientCity');
    
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
