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
    "PE": { name: "Perú", states: {
        "LIM": { name: "Lima", cities: ["Lima Metropolitana", "Callao"]},
        "ARE": { name: "Arequipa", cities: ["Arequipa"]},
    }},
    // Puedes añadir más países hispanohablantes
};

// Funciones auxiliares globales para obtener nombres completos
window.getCountryName = (code) => locationData[code]?.name || 'País Desconocido';
window.getStateName = (countryCode, stateCode) => locationData[countryCode]?.states[stateCode]?.name || 'Provincia Desconocida';
window.getCityName = (countryCode, stateCode, city) => city || 'Ciudad Desconocida';


// Lógica para cargar los selectores de ubicación en el modal de registro
window.loadLocationData = function() {
    const countrySelect = document.getElementById('talentCountry');
    const stateSelect = document.getElementById('talentState');
    const citySelect = document.getElementById('talentCity');

    if (!countrySelect) return; // Salir si no estamos en el formulario de registro

    // 1. Llenar Países
    countrySelect.innerHTML = '<option value="">Selecciona tu país *</option>';
    for (const code in locationData) {
        const option = document.createElement('option');
        option.value = code;
        option.textContent = locationData[code].name;
        countrySelect.appendChild(option);
    }

    // 2. Event Listener para País
    countrySelect.addEventListener('change', () => {
        const selectedCountry = countrySelect.value;
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
    });

    // 3. Event Listener para Provincia/Estado
    stateSelect.addEventListener('change', () => {
        const selectedCountry = countrySelect.value;
        const selectedState = stateSelect.value;
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
    });
    
    // Inicializar deshabilitado
    stateSelect.disabled = true;
    citySelect.disabled = true;
};
