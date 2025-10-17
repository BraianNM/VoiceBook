// js/locations.js - Datos de ubicación de países hispanohablantes (simplificado)
const locationData = {
    "AR": { name: "Argentina", states: {
        "CABA": { name: "Ciudad Autónoma de Buenos Aires", cities: ["Buenos Aires"]},
        "CBA": { name: "Córdoba", cities: ["Córdoba Capital", "Río Cuarto", "Villa María"]},
        "SFE": { name: "Santa Fe", cities: ["Rosario", "Santa Fe Capital", "Rafaela"]},
    }},
    "CL": { name: "Chile", states: {
        "RM": { name: "Región Metropolitana", cities: ["Santiago", "Puente Alto", "Maipú"]},
        "V": { name: "Valparaíso", cities: ["Valparaíso", "Viña del Mar", "Quilpué"]},
    }},
    "CO": { name: "Colombia", states: {
        "DC": { name: "Bogotá D.C.", cities: ["Bogotá"]},
        "ANT": { name: "Antioquia", cities: ["Medellín", "Envigado", "Itagüí"]},
    }},
    "ES": { name: "España", states: {
        "MD": { name: "Madrid", cities: ["Madrid", "Alcalá de Henares", "Móstoles"]},
        "CT": { name: "Cataluña", cities: ["Barcelona", "Tarragona", "Lleida"]},
    }},
    "MX": { name: "México", states: {
        "CMX": { name: "Ciudad de México", cities: ["Ciudad de México"]},
        "JAL": { name: "Jalisco", cities: ["Guadalajara", "Zapopan", "Tlaquepaque"]},
    }},
};

// Función para cargar los datos en los selectores
function loadLocationData(countryId, stateId, cityId, selectedCountryCode = null, selectedStateCode = null, selectedCityName = null) {
    const countrySelect = document.getElementById(countryId);
    const stateSelect = document.getElementById(stateId);
    const citySelect = document.getElementById(cityId);

    if (!countrySelect || !stateSelect || !citySelect) return;

    // 1. Cargar Países
    countrySelect.innerHTML = '<option value="">Selecciona tu país *</option>';
    for (const code in locationData) {
        const option = document.createElement('option');
        option.value = code;
        option.textContent = locationData[code].name;
        countrySelect.appendChild(option);
    }
    
    if (selectedCountryCode) {
        countrySelect.value = selectedCountryCode;
    }

    // Función auxiliar para cargar estados y ciudades
    const loadStates = (selectedCountry = null, selectedState = null) => {
        stateSelect.innerHTML = '<option value="">Selecciona tu provincia/estado *</option>';
        citySelect.innerHTML = '<option value="">Selecciona tu ciudad *</option>';
        stateSelect.disabled = !selectedCountry;
        citySelect.disabled = true;

        if (selectedCountry && locationData[selectedCountry]) {
            const states = locationData[selectedCountry].states;
            for (const code in states) {
                const option = document.createElement('option');
                option.value = code;
                option.textContent = states[code].name;
                stateSelect.appendChild(option);
            }
        }
        
        if (selectedState) {
            stateSelect.value = selectedState;
            loadCities(selectedCountry, selectedState, selectedCityName);
        }
    };
    
    const loadCities = (selectedCountry, selectedState, selectedCity) => {
        citySelect.innerHTML = '<option value="">Selecciona tu ciudad *</option>';
        citySelect.disabled = !selectedState;

        if (selectedCountry && selectedState && locationData[selectedCountry].states[selectedState]) {
            const cities = locationData[selectedCountry].states[selectedState].cities;
            cities.forEach(city => {
                const option = document.createElement('option');
                option.value = city;
                option.textContent = city;
                citySelect.appendChild(option);
            });
        }
        
        if (selectedCity) {
            citySelect.value = selectedCity;
        }
    };
    
    // Inicializar o cargar preselección
    if (selectedCountryCode) {
        loadStates(selectedCountryCode, selectedStateCode);
    } else {
        stateSelect.disabled = true;
        citySelect.disabled = true;
    }

    // Event Listeners
    countrySelect.addEventListener('change', () => loadStates(countrySelect.value));
    stateSelect.addEventListener('change', () => loadCities(countrySelect.value, stateSelect.value));
}
window.loadLocationData = loadLocationData; // Hacer global para que app.js lo use

// Funciones Auxiliares para obtener nombres (usadas en profile.js para mostrar)
function getCountryName(countryCode) {
    return locationData[countryCode] ? locationData[countryCode].name : countryCode;
}
window.getCountryName = getCountryName;

function getStateName(countryCode, stateCode) {
    return locationData[countryCode] && locationData[countryCode].states[stateCode] ? 
        locationData[countryCode].states[stateCode].name : stateCode;
}
window.getStateName = getStateName;

function getCityName(countryCode, stateCode, cityName) {
    // Las ciudades se almacenan como el nombre completo
    return cityName;
}
window.getCityName = getCityName;
