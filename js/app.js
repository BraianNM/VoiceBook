// Funciones principales de la aplicación

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    // checkAuthState(); // Ya se llama en el index, o en profile.html
    loadTalents();
    loadJobOffers();
    loadLocationData();
});

// Configurar event listeners
function setupEventListeners() {
    document.getElementById('heroTalentBtn').addEventListener('click', () => document.getElementById('talentModal').style.display = 'flex');
    document.getElementById('heroClientBtn').addEventListener('click', () => document.getElementById('clientModal').style.display = 'flex');
    document.getElementById('registerBtn').addEventListener('click', () => document.getElementById('talentModal').style.display = 'flex');
    document.getElementById('loginBtn').addEventListener('click', () => document.getElementById('loginModal').style.display = 'flex');
    // REMOVIDO: document.getElementById('dashboardLink').addEventListener('click', showDashboard); // Ya no es un modal
    document.getElementById('logoutBtn').addEventListener('click', logoutUser);

    document.querySelectorAll('.close-modal').forEach(button => {
        button.addEventListener('click', closeAllModals);
    });

    document.getElementById('talentForm').addEventListener('submit', registerTalent);
    document.getElementById('clientForm').addEventListener('submit', registerClient);
    document.getElementById('loginForm').addEventListener('submit', loginUser);

    document.getElementById('clientType').addEventListener('change', toggleCompanyName);
    document.getElementById('lang10').addEventListener('change', toggleOtherLanguages);

    // Los listeners del dashboard ahora están en profile.html
}

// Funciones auxiliares de UI

function closeAllModals() {
    document.getElementById('talentModal').style.display = 'none';
    document.getElementById('clientModal').style.display = 'none';
    document.getElementById('loginModal').style.display = 'none';
}

function toggleCompanyName() {
    const type = document.getElementById('clientType').value;
    document.getElementById('companyNameGroup').style.display = type === 'empresa' ? 'block' : 'none';
}

function toggleOtherLanguages() {
    const checkbox = document.getElementById('lang10');
    document.getElementById('otherLanguages').style.display = checkbox.checked ? 'block' : 'none';
}

// Cargar talentos
async function loadTalents() {
    try {
        const snapshot = await db.collection('talents').get();
        const talentsContainer = document.getElementById('talentsContainer');
        
        if (!talentsContainer) return; // Si no estamos en index.html, salimos
        
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
        if (document.getElementById('talentsContainer')) {
            document.getElementById('talentsContainer').innerHTML = '<p>Error al cargar talentos.</p>';
        }
    }
}

// Mostrar tarjeta de talento - FUNCIÓN MEJORADA (INFO PRIVADA OCULTA)
function displayTalentCard(talent, talentId) {
    const talentsContainer = document.getElementById('talentsContainer');
    if (!talentsContainer) return;
    
    const talentCard = document.createElement('div');
    talentCard.className = 'talent-card';
    
    let audioPlayers = '';
    if (talent.demos && talent.demos.length > 0) {
        console.log(`🎵 Mostrando ${talent.demos.length} demos para ${talent.name}`);
        audioPlayers = `
            <div class="audio-demos" style="margin-top: 15px;">
                <p><strong>Demos de Audio:</strong></p>
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
                            ${Math.round(demo.duration || 0)} segundos • ${demo.size ? (demo.size / 1024 / 1024).toFixed(1) + ' MB' : 'Tamaño no disponible'}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    } else {
        audioPlayers = '<p style="color: #666; font-size: 14px; margin-top: 10px;">No hay demos de audio disponibles</p>';
    }
    
    // Información de ubicación (siempre visible)
    const locationInfo = talent.city && talent.state && talent.country ? 
        `<p class="talent-details"><i class="fas fa-map-marker-alt"></i> ${talent.city}, ${talent.state}, ${talent.country}</p>` :
        '<p class="talent-details"><i class="fas fa-map-marker-alt"></i> Ubicación no especificada</p>';
    
    // Información de contacto solo para usuarios logueados (usando la variable global currentUser)
    const contactInfo = currentUser ? `
        <p class="talent-details"><strong>Email:</strong> ${talent.email || 'No disponible'}</p>
        <p class="talent-details"><strong>Teléfono:</strong> ${talent.phone || 'No disponible'}</p>
    ` : `
        <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 10px; margin: 10px 0;">
            <p style="margin: 0; color: #856404; font-size: 14px;">
                <i class="fas fa-lock"></i> Inicia sesión para ver información de contacto
            </p>
        </div>
    `;
    
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
                <button class="btn btn-primary" onclick="viewTalentProfile('${talentId}')">Ver Perfil Completo</button>
                ${currentUser ? `<button class="btn btn-success" onclick="addToFavorites('${talentId}')"><i class="fas fa-heart"></i> Favorito</button>` : ''}
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

        if (!jobOffersContainer) return; // Si no estamos en index.html, salimos
        
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
        if (document.getElementById('jobOffersContainer')) {
            document.getElementById('jobOffersContainer').innerHTML = '<p>Error al cargar ofertas.</p>';
        }
    }
}

// Mostrar tarjeta de trabajo
function displayJobCard(job, jobId) {
    const jobOffersContainer = document.getElementById('jobOffersContainer');
    if (!jobOffersContainer) return;
    
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
            <button class="btn btn-primary" onclick="applyToJob('${jobId}')">Postularme</button>
        </div>
        ` : ''}
    `;
    
    jobOffersContainer.appendChild(jobCard);
}

// Funciones auxiliares
function showMessage(element, message, type) {
    if (element) {
        element.innerHTML = `<div class=\"${type}\">${message}</div>`;
    }
}

// Lógica de filtros (Asumiendo que existe loadFilteredTalents)
window.applyTalentFilters = function() {
    // Implementar lógica de filtrado aquí
    console.log('Aplicando filtros...');
}
window.resetTalentFilters = function() {
    // Implementar lógica de reseteo de filtros aquí
    console.log('Reseteando filtros...');
}

// Lógica de perfil (Asumiendo que existe viewTalentProfile, addToFavorites, applyToJob)
window.viewTalentProfile = function(talentId) {
    console.log('Ver perfil completo de talento:', talentId);
}
window.addToFavorites = function(talentId) {
    console.log('Añadiendo a favoritos:', talentId);
}
window.applyToJob = function(jobId) {
    console.log('Postulando al trabajo:', jobId);
}


// ========== FUNCIÓN PARA VERIFICAR CONFIGURACIÓN (opcional) ==========

function checkCloudinaryConfig() {
    console.log('🔍 Verificando configuración de Cloudinary:');
    console.log('☁️  Cloud Name:', typeof cloudinaryConfig !== 'undefined' ? cloudinaryConfig.cloudName : 'No definido');
    console.log('📝 Upload Preset:', typeof cloudinaryConfig !== 'undefined' ? cloudinaryConfig.uploadPreset : 'No definido');
    
    if (typeof cloudinaryConfig === 'undefined') {
        console.warn('⚠️  cloudinaryConfig no está definido');
        return false;
    }
    
    if (!cloudinaryConfig.cloudName || cloudinaryConfig.cloudName === 'TU_CLOUD_NAME') {
        console.error('❌ Cloud Name no configurado');
        return false;
    }
    
    if (!cloudinaryConfig.uploadPreset || cloudinaryConfig.uploadPreset === 'TU_UPLOAD_PRESET') {
        console.error('❌ Upload Preset no configurado');
        return false;
    }
    
    console.log('✅ Configuración de Cloudinary OK');
    return true;
}

document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        checkCloudinaryConfig();
    }, 1000);
});
