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

// Configurar event listeners (CORRECCIÓN CLAVE AQUÍ)
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

    // Listeners de Formularios de Autenticación/Registro
    document.getElementById('talentForm')?.addEventListener('submit', registerTalent);
    document.getElementById('clientForm')?.addEventListener('submit', registerClient);
    document.getElementById('loginForm')?.addEventListener('submit', loginUser);

    document.getElementById('clientType')?.addEventListener('change', toggleCompanyName);
    document.getElementById('lang10')?.addEventListener('change', toggleOtherLanguages);
    
    // Listener para el formulario de edición de perfil 
    document.getElementById('editProfileForm')?.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const isTalent = document.getElementById('editTalentFields')?.style.display !== 'none';
        
        // CORRECCIÓN: Usamos `window.` y verificamos que la función exista 
        if (isTalent) {
            if (typeof window.updateTalentProfile === 'function') {
                window.updateTalentProfile(e); // Llama a la función de profile.js
            } else {
                 console.error('❌ Error: La función updateTalentProfile no está definida o no es global.');
                 window.showMessage('editProfileMessage', '❌ Funcionalidad de edición de talento no disponible.', 'error');
            }
        } else {
            if (typeof window.updateClientProfile === 'function') {
                window.updateClientProfile(e); // Llama a la función de profile.js
            } else {
                 console.error('❌ Error: La función updateClientProfile no está definida o no es global.');
                 window.showMessage('editProfileMessage', '❌ Funcionalidad de edición de cliente no disponible.', 'error');
            }
        }
    });

}

// Cargar talentos
async function loadTalents() {
    try {
        const snapshot = await db.collection('talents').get();
        const talentsContainer = document.getElementById('talentsContainer');
        
        if (!talentsContainer) return; 
        
        if (snapshot.empty) {
            talentsContainer.innerHTML = '<p>No hay talentos registrados aún.</p>';
            return;
        }
        
        talentsContainer.innerHTML = '';
        snapshot.forEach(doc => {
            const talent = doc.data();
            displayTalentCard(talent, doc.id);
        });
        
    } catch (error) {
        console.error('Error cargando talentos:', error);
        const talentsContainer = document.getElementById('talentsContainer');
        if (talentsContainer) {
            talentsContainer.innerHTML = '<p>Error al cargar talentos.</p>';
        }
    }
}

// Mostrar tarjeta de talento (CORREGIDA PARA OCULTAR CONTACTO)
function displayTalentCard(talent, talentId) {
    const talentsContainer = document.getElementById('talentsContainer');
    const talentCard = document.createElement('div');
    talentCard.className = 'talent-card';
    
    let audioPlayers = '';
    if (talent.demos && talent.demos.length > 0) {
        audioPlayers = `
            <div class="audio-demos" style="margin-top: 15px;">
                <p><strong>Demos de Audio (${talent.demos.length}):</strong></p>
                ${talent.demos.map((demo, index) => `
                    <div style="margin-bottom: 15px; padding: 10px; background: #f8f9fa; border-radius: 5px;">
                        <p style="font-size: 14px; margin-bottom: 8px; font-weight: 500;">
                            ${demo.name || `Demo ${index + 1}`}
                        </p>
                        <audio controls style="width: 100%; height: 40px; border-radius: 20px;">
                            <source src="${demo.url}" type="audio/mpeg">
                            Tu navegador no soporta audio.
                        </audio>
                        <div style="font-size: 12px; color: #666; margin-top: 5px;">
                            ${demo.duration ? Math.round(demo.duration) + ' segundos' : ''} • ${demo.size ? (demo.size / 1024 / 1024).toFixed(1) + ' MB' : 'Tamaño no disponible'}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    } else {
        audioPlayers = '<p style="color: #666; font-size: 14px; margin-top: 10px;">No hay demos de audio disponibles</p>';
    }
    
    const locationInfo = (talent.city && talent.state && talent.country && typeof getCountryName === 'function') ? 
        `<p class="talent-details"><i class="fas fa-map-marker-alt"></i> ${getCityName(talent.country, talent.state, talent.city)}, ${getCountryName(talent.country)}</p>` :
        '<p class="talent-details"><i class="fas fa-map-marker-alt"></i> Ubicación no especificada</p>';
    
    let contactInfo = '';
    if (currentUser) {
        contactInfo = `
            <p class="talent-details"><strong>Email:</strong> ${talent.email || 'No disponible'}</p>
            <p class="talent-details"><strong>Teléfono:</strong> ${talent.phone || 'No disponible'}</p>
        `;
    } else {
        contactInfo = `
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 10px; margin: 10px 0;">
                <p style="margin: 0; color: #856404; font-size: 14px;">
                    <i class="fas fa-lock"></i> **Debes iniciar sesión** para ver la información de contacto
                </p>
            </div>
        `;
    }
    
    talentCard.innerHTML = `
        <div class="talent-img" style="background-color: #3498db; display: flex; align-items: center; justify-content: center; color: white; font-size: 48px;">
            <i class="fas fa-user"></i>
        </div>
        <div class="talent-info">
            <h3 class="talent-name">${talent.name}</h3>
            <p class="talent-details">${talent.gender === 'hombre' ? 'Hombre' : 'Mujer'} • ${talent.nationality || 'Nacionalidad no especificada'}</p>
            ${locationInfo}
            <p class="talent-details">${Array.isArray(talent.languages) ? talent.languages.join(', ') : talent.languages || 'Idiomas no especificados'}</p>
            <p class="talent-details">Home Studio: ${talent.homeStudio === 'si' ? 'Sí' : 'No'}</p>
            <p>${talent.description ? talent.description.substring(0, 100) + '...' : 'Sin descripción'}</p>
            ${contactInfo}
            ${audioPlayers}
            <div style="margin-top: 15px;">
                <button class="btn btn-primary" onclick="window.viewTalentProfile('${talentId}')">Ver Perfil Completo</button>
                ${currentUser ? `<button class="btn btn-success" onclick="window.addToFavorites('${talentId}')"><i class="fas fa-heart"></i> Favorito</button>` : ''}
            </div>
        </div>
    `;
    
    talentsContainer.appendChild(talentCard);
}

// Cargar ofertas de trabajo
async function loadJobOffers() {
    try {
        const snapshot = await db.collection('jobs').get();
        const jobOffersContainer = document.getElementById('jobOffersContainer');
        
        if (!jobOffersContainer) return;

        if (snapshot.empty) {
            jobOffersContainer.innerHTML = '<p>No hay ofertas de trabajo publicadas aún.</p>';
            return;
        }
        
        jobOffersContainer.innerHTML = '';
        snapshot.forEach(doc => {
            const job = doc.data();
            displayJobCard(job, doc.id);
        });
        
    } catch (error) {
        console.error('Error cargando ofertas:', error);
        const jobOffersContainer = document.getElementById('jobOffersContainer');
        if (jobOffersContainer) {
            jobOffersContainer.innerHTML = '<p>Error al cargar ofertas.</p>';
        }
    }
}

// Mostrar tarjeta de trabajo
function displayJobCard(job, jobId) {
    const jobOffersContainer = document.getElementById('jobOffersContainer');
    const jobCard = document.createElement('div');
    jobCard.className = 'job-card';
    
    jobCard.innerHTML = `
        <div class="job-header">
            <h3 class="job-title">${job.title}</h3>
        </div>
        <div class="job-description">
            <p>${job.description}</p>
        </div>
        <div>
            <p><strong>Contacto:</strong> ${job.contact}</p>
            <p><strong>Fecha de publicación:</strong> ${job.createdAt?.toDate?.().toLocaleDateString() || 'Fecha no disponible'}</p>
        </div>
        ${currentUser ? `
            <div style="margin-top: 15px;">
                <button class="btn btn-primary" onclick="window.applyToJob('${jobId}')">Postularme</button>
            </div>
        ` : ''}
    `;
    
    jobOffersContainer.appendChild(jobCard);
}

// Funciones auxiliares
function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
}
window.closeAllModals = closeAllModals; // Hacer global

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

// Hacemos que estas funciones sean globales (en caso de que sean llamadas desde HTML)
window.viewTalentProfile = function(talentId) {
    alert(`Ver perfil completo del talento ${talentId}. Funcionalidad pendiente.`);
};
window.addToFavorites = function(talentId) {
    alert(`Añadir talento ${talentId} a favoritos. Funcionalidad pendiente.`);
};
window.applyToJob = function(jobId) {
    alert(`Postular al trabajo ${jobId}. Funcionalidad pendiente.`);
};

// Función auxiliar para mostrar mensajes (hecha global)
function showMessage(element, message, type) {
    const el = typeof element === 'string' ? document.getElementById(element) : element;
    if (el) {
        el.innerHTML = `<div class="${type}">${message}</div>`;
    }
}
window.showMessage = showMessage; 
