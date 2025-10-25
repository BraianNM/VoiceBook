// location-data.js - Datos de ubicación (CORREGIDO)

const locationData = {
    "ar": {
        "name": "Argentina",
        "states": {
            "CABA": ["Buenos Aires"],
            "Buenos Aires": ["La Plata", "Mar del Plata", "Bahía Blanca", "Quilmes", "Merlo"],
            "Córdoba": ["Córdoba", "Río Cuarto", "Villa María", "San Francisco", "Alta Gracia"],
            "Santa Fe": ["Rosario", "Santa Fe", "Rafaela", "Venado Tuerto", "Reconquista"],
            "Mendoza": ["Mendoza", "San Rafael", "Godoy Cruz", "Guaymallén", "Maipú"],
            "Tucumán": ["San Miguel de Tucumán", "Yerba Buena", "Tafí Viejo", "Alderetes", "Banda del Río Salí"],
            "Salta": ["Salta", "San Ramón de la Nueva Orán", "Tartagal", "Metán", "Rosario de Lerma"],
            "Entre Ríos": ["Paraná", "Concordia", "Gualeguaychú", "Concepción del Uruguay", "Victoria"],
            "Misiones": ["Posadas", "Oberá", "Eldorado", "Puerto Iguazú", "Apóstoles"],
            "Corrientes": ["Corrientes", "Goya", "Mercedes", "Curuzú Cuatiá", "Paso de los Libres"]
        }
    },
    "mx": {
        "name": "México",
        "states": {
            "Ciudad de México": ["Ciudad de México"],
            "Estado de México": ["Toluca", "Ecatepec", "Nezahualcóyotl", "Naucalpan", "Tlalnepantla"],
            "Jalisco": ["Guadalajara", "Zapopan", "Tlaquepaque", "Tonalá", "Puerto Vallarta"],
            "Nuevo León": ["Monterrey", "Guadalupe", "San Nicolás de los Garza", "Apodaca", "General Escobedo"],
            "Puebla": ["Puebla", "Tehuacán", "San Martín Texmelucan", "Atlixco", "San Pedro Cholula"],
            "Veracruz": ["Veracruz", "Xalapa", "Coatzacoalcos", "Córdoba", "Poza Rica"],
            "Guanajuato": ["León", "Irapuato", "Celaya", "Salamanca", "Guanajuato"],
            "Chihuahua": ["Ciudad Juárez", "Chihuahua", "Cuauhtémoc", "Delicias", "Parral"],
            "Baja California": ["Tijuana", "Mexicali", "Ensenada", "Rosarito", "Tecate"],
            "Sonora": ["Hermosillo", "Ciudad Obregón", "Nogales", "San Luis Río Colorado", "Navojoa"]
        }
    },
    "es": {
        "name": "España",
        "states": {
            "Madrid": ["Madrid", "Móstoles", "Alcalá de Henares", "Fuenlabrada", "Leganés"],
            "Cataluña": ["Barcelona", "Hospitalet de Llobregat", "Badalona", "Sabadell", "Tarrasa"],
            "Andalucía": ["Sevilla", "Málaga", "Córdoba", "Granada", "Jerez de la Frontera"],
            "Comunidad Valenciana": ["Valencia", "Alicante", "Elche", "Castellón de la Plana", "Torrevieja"],
            "Galicia": ["La Coruña", "Vigo", "Orense", "Lugo", "Santiago de Compostela"],
            "País Vasco": ["Bilbao", "Vitoria", "San Sebastián", "Baracaldo", "Getxo"],
            "Canarias": ["Las Palmas de Gran Canaria", "Santa Cruz de Tenerife", "San Cristóbal de La Laguna", "Telde", "Arona"],
            "Castilla y León": ["Valladolid", "León", "Burgos", "Salamanca", "Palencia"],
            "Aragón": ["Zaragoza", "Huesca", "Teruel", "Calatayud", "Utebo"],
            "Murcia": ["Murcia", "Cartagena", "Lorca", "Molina de Segura", "Alcantarilla"]
        }
    },
    "us": {
        "name": "Estados Unidos",
        "states": {
            "California": ["Los Angeles", "San Francisco", "San Diego", "San Jose", "Sacramento"],
            "Texas": ["Houston", "Dallas", "San Antonio", "Austin", "Fort Worth"],
            "Florida": ["Miami", "Orlando", "Tampa", "Jacksonville", "Fort Lauderdale"],
            "New York": ["New York City", "Buffalo", "Rochester", "Yonkers", "Syracuse"],
            "Illinois": ["Chicago", "Aurora", "Naperville", "Joliet", "Rockford"],
            "Georgia": ["Atlanta", "Augusta", "Columbus", "Savannah", "Athens"],
            "Washington": ["Seattle", "Spokane", "Tacoma", "Vancouver", "Bellevue"],
            "Colorado": ["Denver", "Colorado Springs", "Aurora", "Fort Collins", "Lakewood"],
            "Arizona": ["Phoenix", "Tucson", "Mesa", "Chandler", "Glendale"],
            "Nevada": ["Las Vegas", "Reno", "Henderson", "North Las Vegas", "Sparks"]
        }
    },
    "co": {
        "name": "Colombia",
        "states": {
            "Bogotá D.C.": ["Bogotá"],
            "Antioquia": ["Medellín", "Bello", "Itagüí", "Envigado", "Rionegro"],
            "Valle del Cauca": ["Cali", "Buenaventura", "Palmira", "Tuluá", "Cartago"],
            "Cundinamarca": ["Soacha", "Facatativá", "Zipaquirá", "Girardot", "Fusagasugá"],
            "Santander": ["Bucaramanga", "Floridablanca", "Girón", "Piedecuesta", "Barrancabermeja"],
            "Bolívar": ["Cartagena", "Magangué", "El Carmen de Bolívar", "Turbaco", "Arjona"],
            "Atlántico": ["Barranquilla", "Soledad", "Malambo", "Sabanalarga", "Puerto Colombia"],
            "Nariño": ["Pasto", "Tumaco", "Ipiales", "Samaniego", "La Unión"],
            "Córdoba": ["Montería", "Cereté", "Lorica", "Sahagún", "Planeta Rica"],
            "Boyacá": ["Tunja", "Sogamoso", "Duitama", "Chiquinquirá", "Villa de Leyva"]
        }
    },
    "cl": {
        "name": "Chile",
        "states": {
            "Metropolitana": ["Santiago", "Puente Alto", "Maipú", "La Florida", "Las Condes"],
            "Valparaíso": ["Valparaíso", "Viña del Mar", "Quilpué", "Villa Alemana", "San Antonio"],
            "Biobío": ["Concepción", "Talcahuano", "Chillán", "Los Ángeles", "Coronel"],
            "Maule": ["Talca", "Curicó", "Linares", "Constitución", "Cauquenes"],
            "Araucanía": ["Temuco", "Padre Las Casas", "Villarrica", "Angol", "Pucón"],
            "Antofagasta": ["Antofagasta", "Calama", "Tocopilla", "Mejillones", "Taltal"],
            "Los Lagos": ["Puerto Montt", "Osorno", "Castro", "Ancud", "Puerto Varas"],
            "Coquimbo": ["La Serena", "Coquimbo", "Ovalle", "Illapel", "Vicuña"],
            "Arica y Parinacota": ["Arica", "Putre", "Camarones", "General Lagos"],
            "Magallanes": ["Punta Arenas", "Puerto Natales", "Porvenir", "Puerto Williams"]
        }
    },
    "pe": {
        "name": "Perú",
        "states": {
            "Lima": ["Lima", "Callao", "Arequipa", "Trujillo", "Chiclayo"],
            "Arequipa": ["Arequipa", "Camaná", "Mollendo", "Chivay", "Pedregal"],
            "La Libertad": ["Trujillo", "Chepén", "Pacasmayo", "Guadalupe", "Cascas"],
            "Piura": ["Piura", "Sullana", "Paita", "Catacaos", "Talara"],
            "Lambayeque": ["Chiclayo", "Lambayeque", "Ferreñafe", "Mochumí", "Túcume"],
            "Cusco": ["Cusco", "Sicuani", "Quillabamba", "Calca", "Urubamba"],
            "Junín": ["Huancayo", "Jauja", "Concepción", "Chupaca", "Tarma"],
            "Ancash": ["Huaraz", "Chimbote", "Casma", "Caraz", "Yungay"],
            "Ica": ["Ica", "Chincha Alta", "Pisco", "Nazca", "Palpa"],
            "Loreto": ["Iquitos", "Yurimaguas", "Nauta", "Requena", "Contamana"]
        }
    }
};

// Función para cargar países en un select
function loadCountries(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;
    
    select.innerHTML = '<option value="">Seleccionar país</option>';
    
    for (const countryCode in locationData) {
        const option = document.createElement('option');
        option.value = countryCode;
        option.textContent = locationData[countryCode].name;
        select.appendChild(option);
    }
}

// Función para cargar estados/provincias
function loadStates(countryCode, stateSelectId, citySelectId) {
    const stateSelect = document.getElementById(stateSelectId);
    const citySelect = document.getElementById(citySelectId);
    
    if (!stateSelect) return;
    
    stateSelect.innerHTML = '<option value="">Seleccionar provincia/estado</option>';
    if (citySelect) citySelect.innerHTML = '<option value="">Seleccionar ciudad</option>';
    
    if (countryCode && locationData[countryCode]) {
        const states = locationData[countryCode].states;
        for (const stateName in states) {
            const option = document.createElement('option');
            option.value = stateName;
            option.textContent = stateName;
            stateSelect.appendChild(option);
        }
        
        stateSelect.disabled = false;
    } else {
        stateSelect.disabled = true;
        if (citySelect) citySelect.disabled = true;
    }
}

// Función para cargar ciudades
function loadCities(countryCode, stateName, citySelectId) {
    const citySelect = document.getElementById(citySelectId);
    if (!citySelect) return;
    
    citySelect.innerHTML = '<option value="">Seleccionar ciudad</option>';
    
    if (countryCode && stateName && locationData[countryCode] && locationData[countryCode].states[stateName]) {
        const cities = locationData[countryCode].states[stateName];
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
}

// Función principal para cargar datos de ubicación
function loadLocationData(countrySelectId, stateSelectId, citySelectId) {
    const countrySelect = document.getElementById(countrySelectId);
    const stateSelect = document.getElementById(stateSelectId);
    const citySelect = document.getElementById(citySelectId);
    
    if (!countrySelect) return;
    
    // Cargar países
    loadCountries(countrySelectId);
    
    // Event listener para cambios en país
    countrySelect.addEventListener('change', function() {
        loadStates(this.value, stateSelectId, citySelectId);
        if (citySelect) citySelect.innerHTML = '<option value="">Seleccionar ciudad</option>';
    });
    
    // Event listener para cambios en estado/provincia
    if (stateSelect) {
        stateSelect.addEventListener('change', function() {
            loadCities(countrySelect.value, this.value, citySelectId);
        });
    }
}

// Función para obtener nombre del país
function getCountryName(countryCode) {
    return locationData[countryCode]?.name || countryCode;
}

// Función para obtener nombre del estado
function getStateName(countryCode, stateName) {
    if (locationData[countryCode] && locationData[countryCode].states[stateName]) {
        return stateName;
    }
    return stateName;
}

// Hacer funciones disponibles globalmente
window.locationData = locationData;
window.loadCountries = loadCountries;
window.loadStates = loadStates;
window.loadCities = loadCities;
window.loadLocationData = loadLocationData;
window.getCountryName = getCountryName;
window.getStateName = getStateName;

console.log('✅ Location data cargado correctamente');
