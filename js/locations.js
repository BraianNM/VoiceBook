// js/locations.js - Datos de ubicación de países hispanohablantes (ampliado)
const locationData = {
    "AR": { name: "Argentina", states: {
        "CABA": { name: "Ciudad Autónoma de Buenos Aires", cities: ["Buenos Aires", "Palermo", "Recoleta", "Belgrano", "San Telmo"] },
        "BA": { name: "Buenos Aires", cities: ["La Plata", "Mar del Plata", "Bahía Blanca", "Quilmes", "Lomas de Zamora"] },
        "CBA": { name: "Córdoba", cities: ["Córdoba Capital", "Río Cuarto", "Villa María", "Carlos Paz", "Alta Gracia"] },
        "SFE": { name: "Santa Fe", cities: ["Rosario", "Santa Fe Capital", "Rafaela", "Venado Tuerto", "Reconquista"] },
        "MEN": { name: "Mendoza", cities: ["Mendoza", "San Rafael", "Godoy Cruz", "Guaymallén", "Maipú"] }
    }},
    "CL": { name: "Chile", states: {
        "RM": { name: "Región Metropolitana", cities: ["Santiago", "Puente Alto", "Maipú", "La Florida", "Las Condes"] },
        "V": { name: "Valparaíso", cities: ["Valparaíso", "Viña del Mar", "Quilpué", "Villa Alemana", "Quillota"] },
        "BIO": { name: "Biobío", cities: ["Concepción", "Talcahuano", "Chillán", "Los Ángeles", "Coronel"] },
        "ARA": { name: "La Araucanía", cities: ["Temuco", "Padre Las Casas", "Villarrica", "Angol", "Pucón"] }
    }},
    "CO": { name: "Colombia", states: {
        "DC": { name: "Bogotá D.C.", cities: ["Bogotá", "Usaquén", "Chapinero", "Suba", "Engativá"] },
        "ANT": { name: "Antioquia", cities: ["Medellín", "Envigado", "Itagüí", "Bello", "Rionegro"] },
        "VAL": { name: "Valle del Cauca", cities: ["Cali", "Palmira", "Buenaventura", "Tuluá", "Cartago"] },
        "ATL": { name: "Atlántico", cities: ["Barranquilla", "Soledad", "Malambo", "Puerto Colombia", "Baranoa"] }
    }},
    "ES": { name: "España", states: {
        "MD": { name: "Madrid", cities: ["Madrid", "Alcalá de Henares", "Móstoles", "Fuenlabrada", "Leganés"] },
        "CT": { name: "Cataluña", cities: ["Barcelona", "Hospitalet", "Badalona", "Sabadell", "Tarrasa"] },
        "AN": { name: "Andalucía", cities: ["Sevilla", "Málaga", "Córdoba", "Granada", "Almería"] },
        "VC": { name: "Valencia", cities: ["Valencia", "Alicante", "Elche", "Castellón", "Torrevieja"] }
    }},
    "MX": { name: "México", states: {
        "CMX": { name: "Ciudad de México", cities: ["Ciudad de México", "Iztapalapa", "Gustavo A. Madero", "Álvaro Obregón", "Coyoacán"] },
        "JAL": { name: "Jalisco", cities: ["Guadalajara", "Zapopan", "Tlaquepaque", "Tonalá", "Puerto Vallarta"] },
        "NL": { name: "Nuevo León", cities: ["Monterrey", "Guadalupe", "San Nicolás", "Apodaca", "Santa Catarina"] },
        "PUE": { name: "Puebla", cities: ["Puebla", "Tehuacán", "San Martín", "Atlixco", "Cholula"] }
    }},
    "PE": { name: "Perú", states: {
        "LMA": { name: "Lima Metropolitana", cities: ["Lima", "Callao", "Miraflores", "San Isidro", "Barranco"] },
        "ARE": { name: "Arequipa", cities: ["Arequipa", "Camaná", "Mollendo", "Chivay", "Pedregal"] },
        "CUS": { name: "Cusco", cities: ["Cusco", "Sacsayhuamán", "Ollantaytambo", "Pisac", "Chinchero"] }
    }},
    "UY": { name: "Uruguay", states: {
        "MON": { name: "Montevideo", cities: ["Montevideo", "Ciudad Vieja", "Pocitos", "Carrasco", "Malvín"] },
        "CAN": { name: "Canelones", cities: ["Ciudad de la Costa", "Las Piedras", "Pando", "La Paz", "Progreso"] }
    }},
    "VE": { name: "Venezuela", states: {
        "CAP": { name: "Caracas", cities: ["Caracas", "Chacao", "Baruta", "El Hatillo", "Sucre"] },
        "MAR": { name: "Miranda", cities: ["Los Teques", "Petare", "Guatire", "Santa Teresa", "Ocumare"] }
    }},
    "CR": { name: "Costa Rica", states: {
        "SJ": { name: "San José", cities: ["San José", "Escazú", "Desamparados", "Curridabat", "Alajuelita"] }
    }},
    "PA": { name: "Panamá", states: {
        "PM": { name: "Panamá", cities: ["Ciudad de Panamá", "San Miguelito", "Tocumen", "Panamá Viejo", "Bethania"] }
    }},
    "DO": { name: "República Dominicana", states: {
        "DN": { name: "Distrito Nacional", cities: ["Santo Domingo", "Gazcue", "Ensanche Naco", "Bella Vista", "Piantini"] }
    }},
    "CU": { name: "Cuba", states: {
        "LH": { name: "La Habana", cities: ["La Habana", "Vedado", "Miramar", "Centro Habana", "Playa"] }
    }}
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
            stateSelect.disabled = false;
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
            citySelect.disabled = false;
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
window.loadLocationData = loadLocationData;

// Funciones auxiliares para cargar estados y ciudades individualmente
window.loadStates = function(countryCode, stateSelectId) {
    const stateSelect = document.getElementById(stateSelectId);
    if (!stateSelect) return;
    
    stateSelect.innerHTML = '<option value="">Selecciona tu provincia/estado *</option>';
    
    if (countryCode && locationData[countryCode]) {
        const states = locationData[countryCode].states;
        for (const code in states) {
            const option = document.createElement('option');
            option.value = code;
            option.textContent = states[code].name;
            stateSelect.appendChild(option);
        }
        stateSelect.disabled = false;
    } else {
        stateSelect.disabled = true;
    }
};

window.loadCities = function(countryCode, stateCode, citySelectId) {
    const citySelect = document.getElementById(citySelectId);
    if (!citySelect) return;
    
    citySelect.innerHTML = '<option value="">Selecciona tu ciudad *</option>';
    
    if (countryCode && stateCode && locationData[countryCode].states[stateCode]) {
        const cities = locationData[countryCode].states[stateCode].cities;
        cities.forEach(city => {
            const option = document.createElement('option');
            option.value = city;
            option.textContent = city;
            citySelect.appendChild(option);
        });
        citySelect.disabled = false;
    } else {
        citySelect.disabled = true;
    }
};

// Funciones Auxiliares para obtener nombres
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
    return cityName;
}
window.getCityName = getCityName;
