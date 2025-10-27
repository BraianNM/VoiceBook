// Datos y funciones de ubicación

const locationData = {
    "ar": {
        "name": "Argentina",
        "states": {
            "C": {"name": "Ciudad Autónoma de Buenos Aires", "cities": ["Buenos Aires"]},
            "B": {"name": "Buenos Aires", "cities": ["La Plata", "Mar del Plata", "Bahía Blanca"]},
            "K": {"name": "Catamarca", "cities": ["San Fernando del Valle de Catamarca"]},
            "H": {"name": "Chaco", "cities": ["Resistencia"]},
            "U": {"name": "Chubut", "cities": ["Rawson", "Comodoro Rivadavia"]},
            "X": {"name": "Córdoba", "cities": ["Córdoba", "Río Cuarto", "Villa María"]},
            "W": {"name": "Corrientes", "cities": ["Corrientes", "Goya"]},
            "E": {"name": "Entre Ríos", "cities": ["Paraná", "Concordia"]},
            "P": {"name": "Formosa", "cities": ["Formosa"]},
            "Y": {"name": "Jujuy", "cities": ["San Salvador de Jujuy"]},
            "L": {"name": "La Pampa", "cities": ["Santa Rosa"]},
            "F": {"name": "La Rioja", "cities": ["La Rioja"]},
            "M": {"name": "Mendoza", "cities": ["Mendoza", "San Rafael"]},
            "N": {"name": "Misiones", "cities": ["Posadas", "Oberá"]},
            "Q": {"name": "Neuquén", "cities": ["Neuquén"]},
            "R": {"name": "Río Negro", "cities": ["Viedma", "Bariloche"]},
            "A": {"name": "Salta", "cities": ["Salta", "Tartagal"]},
            "J": {"name": "San Juan", "cities": ["San Juan"]},
            "D": {"name": "San Luis", "cities": ["San Luis"]},
            "Z": {"name": "Santa Cruz", "cities": ["Río Gallegos"]},
            "S": {"name": "Santa Fe", "cities": ["Santa Fe", "Rosario"]},
            "G": {"name": "Santiago del Estero", "cities": ["Santiago del Estero"]},
            "V": {"name": "Tierra del Fuego", "cities": ["Ushuaia"]},
            "T": {"name": "Tucumán", "cities": ["San Miguel de Tucumán"]}
        }
    },
    "mx": {
        "name": "México",
        "states": {
            "AGU": {"name": "Aguascalientes", "cities": ["Aguascalientes"]},
            "BCN": {"name": "Baja California", "cities": ["Mexicali", "Tijuana"]},
            "BCS": {"name": "Baja California Sur", "cities": ["La Paz"]},
            "CAM": {"name": "Campeche", "cities": ["Campeche"]},
            "CHP": {"name": "Chiapas", "cities": ["Tuxtla Gutiérrez"]},
            "CHH": {"name": "Chihuahua", "cities": ["Chihuahua", "Ciudad Juárez"]},
            "CMX": {"name": "Ciudad de México", "cities": ["Ciudad de México"]},
            "COA": {"name": "Coahuila", "cities": ["Saltillo", "Torreón"]},
            "COL": {"name": "Colima", "cities": ["Colima"]},
            "DUR": {"name": "Durango", "cities": ["Durango"]},
            "GUA": {"name": "Guanajuato", "cities": ["Guanajuato", "León"]},
            "GRO": {"name": "Guerrero", "cities": ["Chilpancingo", "Acapulco"]},
            "HID": {"name": "Hidalgo", "cities": ["Pachuca"]},
            "JAL": {"name": "Jalisco", "cities": ["Guadalajara"]},
            "MIC": {"name": "Michoacán", "cities": ["Morelia"]},
            "MOR": {"name": "Morelos", "cities": ["Cuernavaca"]},
            "NAY": {"name": "Nayarit", "cities": ["Tepic"]},
            "NLE": {"name": "Nuevo León", "cities": ["Monterrey"]},
            "OAX": {"name": "Oaxaca", "cities": ["Oaxaca"]},
            "PUE": {"name": "Puebla", "cities": ["Puebla"]},
            "QUE": {"name": "Querétaro", "cities": ["Querétaro"]},
            "ROO": {"name": "Quintana Roo", "cities": ["Cancún", "Chetumal"]},
            "SLP": {"name": "San Luis Potosí", "cities": ["San Luis Potosí"]},
            "SIN": {"name": "Sinaloa", "cities": ["Culiacán", "Mazatlán"]},
            "SON": {"name": "Sonora", "cities": ["Hermosillo"]},
            "TAB": {"name": "Tabasco", "cities": ["Villahermosa"]},
            "TAM": {"name": "Tamaulipas", "cities": ["Ciudad Victoria", "Reynosa"]},
            "TLA": {"name": "Tlaxcala", "cities": ["Tlaxcala"]},
            "VER": {"name": "Veracruz", "cities": ["Xalapa", "Veracruz"]},
            "YUC": {"name": "Yucatán", "cities": ["Mérida"]},
            "ZAC": {"name": "Zacatecas", "cities": ["Zacatecas"]}
        }
    },
    "es": {
        "name": "España",
        "states": {
            "AN": {"name": "Andalucía", "cities": ["Sevilla", "Málaga", "Granada"]},
            "AR": {"name": "Aragón", "cities": ["Zaragoza", "Huesca"]},
            "AS": {"name": "Asturias", "cities": ["Oviedo", "Gijón"]},
            "IB": {"name": "Baleares", "cities": ["Palma de Mallorca"]},
            "CN": {"name": "Canarias", "cities": ["Las Palmas", "Santa Cruz de Tenerife"]},
            "CB": {"name": "Cantabria", "cities": ["Santander"]},
            "CL": {"name": "Castilla y León", "cities": ["Valladolid", "León"]},
            "CM": {"name": "Castilla-La Mancha", "cities": ["Toledo", "Albacete"]},
            "CT": {"name": "Cataluña", "cities": ["Barcelona", "Tarragona"]},
            "EX": {"name": "Extremadura", "cities": ["Mérida", "Badajoz"]},
            "GA": {"name": "Galicia", "cities": ["Santiago de Compostela", "Vigo"]},
            "MD": {"name": "Madrid", "cities": ["Madrid"]},
            "MC": {"name": "Murcia", "cities": ["Murcia"]},
            "NC": {"name": "Navarra", "cities": ["Pamplona"]},
            "PV": {"name": "País Vasco", "cities": ["Vitoria", "Bilbao"]},
            "RI": {"name": "La Rioja", "cities": ["Logroño"]},
            "VC": {"name": "Valencia", "cities": ["Valencia", "Alicante"]}
        }
    },
    "us": {
        "name": "Estados Unidos",
        "states": {
            "AL": {"name": "Alabama", "cities": ["Montgomery", "Birmingham"]},
            "AK": {"name": "Alaska", "cities": ["Juneau", "Anchorage"]},
            "AZ": {"name": "Arizona", "cities": ["Phoenix", "Tucson"]},
            "AR": {"name": "Arkansas", "cities": ["Little Rock"]},
            "CA": {"name": "California", "cities": ["Sacramento", "Los Angeles"]},
            "CO": {"name": "Colorado", "cities": ["Denver"]},
            "CT": {"name": "Connecticut", "cities": ["Hartford", "New Haven"]},
            "DE": {"name": "Delaware", "cities": ["Dover", "Wilmington"]},
            "FL": {"name": "Florida", "cities": ["Tallahassee", "Miami"]},
            "GA": {"name": "Georgia", "cities": ["Atlanta"]},
            "HI": {"name": "Hawaii", "cities": ["Honolulu"]},
            "ID": {"name": "Idaho", "cities": ["Boise"]},
            "IL": {"name": "Illinois", "cities": ["Springfield", "Chicago"]},
            "IN": {"name": "Indiana", "cities": ["Indianapolis"]},
            "IA": {"name": "Iowa", "cities": ["Des Moines"]},
            "KS": {"name": "Kansas", "cities": ["Topeka", "Wichita"]},
            "KY": {"name": "Kentucky", "cities": ["Frankfort", "Louisville"]},
            "LA": {"name": "Louisiana", "cities": ["Baton Rouge", "New Orleans"]},
            "ME": {"name": "Maine", "cities": ["Augusta", "Portland"]},
            "MD": {"name": "Maryland", "cities": ["Annapolis", "Baltimore"]},
            "MA": {"name": "Massachusetts", "cities": ["Boston"]},
            "MI": {"name": "Michigan", "cities": ["Lansing", "Detroit"]},
            "MN": {"name": "Minnesota", "cities": ["Saint Paul", "Minneapolis"]},
            "MS": {"name": "Mississippi", "cities": ["Jackson"]},
            "MO": {"name": "Missouri", "cities": ["Jefferson City", "Kansas City"]},
            "MT": {"name": "Montana", "cities": ["Helena", "Billings"]},
            "NE": {"name": "Nebraska", "cities": ["Lincoln", "Omaha"]},
            "NV": {"name": "Nevada", "cities": ["Carson City", "Las Vegas"]},
            "NH": {"name": "New Hampshire", "cities": ["Concord", "Manchester"]},
            "NJ": {"name": "New Jersey", "cities": ["Trenton", "Newark"]},
            "NM": {"name": "New Mexico", "cities": ["Santa Fe", "Albuquerque"]},
            "NY": {"name": "New York", "cities": ["Albany", "New York"]},
            "NC": {"name": "North Carolina", "cities": ["Raleigh", "Charlotte"]},
            "ND": {"name": "North Dakota", "cities": ["Bismarck", "Fargo"]},
            "OH": {"name": "Ohio", "cities": ["Columbus", "Cleveland"]},
            "OK": {"name": "Oklahoma", "cities": ["Oklahoma City"]},
            "OR": {"name": "Oregon", "cities": ["Salem", "Portland"]},
            "PA": {"name": "Pennsylvania", "cities": ["Harrisburg", "Philadelphia"]},
            "RI": {"name": "Rhode Island", "cities": ["Providence"]},
            "SC": {"name": "South Carolina", "cities": ["Columbia", "Charleston"]},
            "SD": {"name": "South Dakota", "cities": ["Pierre", "Sioux Falls"]},
            "TN": {"name": "Tennessee", "cities": ["Nashville", "Memphis"]},
            "TX": {"name": "Texas", "cities": ["Austin", "Houston"]},
            "UT": {"name": "Utah", "cities": ["Salt Lake City"]},
            "VT": {"name": "Vermont", "cities": ["Montpelier", "Burlington"]},
            "VA": {"name": "Virginia", "cities": ["Richmond", "Virginia Beach"]},
            "WA": {"name": "Washington", "cities": ["Olympia", "Seattle"]},
            "WV": {"name": "West Virginia", "cities": ["Charleston"]},
            "WI": {"name": "Wisconsin", "cities": ["Madison", "Milwaukee"]},
            "WY": {"name": "Wyoming", "cities": ["Cheyenne"]}
        }
    },
    "co": {
        "name": "Colombia",
        "states": {
            "AMA": {"name": "Amazonas", "cities": ["Leticia"]},
            "ANT": {"name": "Antioquia", "cities": ["Medellín"]},
            "ARA": {"name": "Arauca", "cities": ["Arauca"]},
            "ATL": {"name": "Atlántico", "cities": ["Barranquilla"]},
            "BOL": {"name": "Bolívar", "cities": ["Cartagena"]},
            "BOY": {"name": "Boyacá", "cities": ["Tunja"]},
            "CAL": {"name": "Caldas", "cities": ["Manizales"]},
            "CAQ": {"name": "Caquetá", "cities": ["Florencia"]},
            "CAS": {"name": "Casanare", "cities": ["Yopal"]},
            "CAU": {"name": "Cauca", "cities": ["Popayán"]},
            "CES": {"name": "Cesar", "cities": ["Valledupar"]},
            "CHO": {"name": "Chocó", "cities": ["Quibdó"]},
            "COR": {"name": "Córdoba", "cities": ["Montería"]},
            "CUN": {"name": "Cundinamarca", "cities": ["Bogotá"]},
            "GUA": {"name": "Guainía", "cities": ["Inírida"]},
            "GUV": {"name": "Guaviare", "cities": ["San José del Guaviare"]},
            "HUI": {"name": "Huila", "cities": ["Neiva"]},
            "LAG": {"name": "La Guajira", "cities": ["Riohacha"]},
            "MAG": {"name": "Magdalena", "cities": ["Santa Marta"]},
            "MET": {"name": "Meta", "cities": ["Villavicencio"]},
            "NAR": {"name": "Nariño", "cities": ["Pasto"]},
            "NSA": {"name": "Norte de Santander", "cities": ["Cúcuta"]},
            "PUT": {"name": "Putumayo", "cities": ["Mocoa"]},
            "QUI": {"name": "Quindío", "cities": ["Armenia"]},
            "RIS": {"name": "Risaralda", "cities": ["Pereira"]},
            "SAP": {"name": "San Andrés", "cities": ["San Andrés"]},
            "SAN": {"name": "Santander", "cities": ["Bucaramanga"]},
            "SUC": {"name": "Sucre", "cities": ["Sincelejo"]},
            "TOL": {"name": "Tolima", "cities": ["Ibagué"]},
            "VAC": {"name": "Valle del Cauca", "cities": ["Cali"]},
            "VAU": {"name": "Vaupés", "cities": ["Mitú"]},
            "VID": {"name": "Vichada", "cities": ["Puerto Carreño"]}
        }
    }
};

// Función para cargar datos de ubicación en los selectores
window.loadLocationData = function(countrySelectId, stateSelectId, citySelectId) {
    const countrySelect = document.getElementById(countrySelectId);
    const stateSelect = document.getElementById(stateSelectId);
    const citySelect = document.getElementById(citySelectId);

    if (!countrySelect) return;

    // Limpiar y cargar países
    countrySelect.innerHTML = '<option value="">Seleccionar país</option>';
    for (const countryCode in locationData) {
        const option = document.createElement('option');
        option.value = countryCode;
        option.textContent = locationData[countryCode].name;
        countrySelect.appendChild(option);
    }

    // Event listener para cambio de país
    countrySelect.addEventListener('change', function() {
        const countryCode = this.value;
        
        // Limpiar estados y ciudades
        stateSelect.innerHTML = '<option value="">Seleccionar estado/provincia</option>';
        citySelect.innerHTML = '<option value="">Seleccionar ciudad</option>';

        if (countryCode && locationData[countryCode]) {
            // Cargar estados
            for (const stateCode in locationData[countryCode].states) {
                const option = document.createElement('option');
                option.value = stateCode;
                option.textContent = locationData[countryCode].states[stateCode].name;
                stateSelect.appendChild(option);
            }
        }
    });

    // Event listener para cambio de estado
    stateSelect.addEventListener('change', function() {
        const countryCode = countrySelect.value;
        const stateCode = this.value;
        
        // Limpiar ciudades
        citySelect.innerHTML = '<option value="">Seleccionar ciudad</option>';

        if (countryCode && stateCode && locationData[countryCode] && locationData[countryCode].states[stateCode]) {
            // Cargar ciudades
            locationData[countryCode].states[stateCode].cities.forEach(city => {
                const option = document.createElement('option');
                option.value = city;
                option.textContent = city;
                citySelect.appendChild(option);
            });
        }
    });
};

// Función para obtener nombre del país
window.getCountryName = function(countryCode) {
    return locationData[countryCode] ? locationData[countryCode].name : countryCode;
};

// Función para obtener nombre del estado
window.getStateName = function(countryCode, stateCode) {
    if (locationData[countryCode] && locationData[countryCode].states[stateCode]) {
        return locationData[countryCode].states[stateCode].name;
    }
    return stateCode;
};

console.log('Location.js cargado correctamente');
