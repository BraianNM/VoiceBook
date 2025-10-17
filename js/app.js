// Funciones principales de la aplicación

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    checkAuthState();
    
    // CORRECCIÓN: Asegurar que la carga de talentos solo corra en index.html
    if (!window.location.href.includes('profile.html')) {
        loadTalents();
        loadJobOffers();
        // Cargar la data de ubicación para todos los modales en index.html
        if (typeof window.loadLocationData === 'function') {
            window.loadLocationData('countrySelectTalent', 'stateSelectTalent', 'citySelectTalent');
            window.loadLocationData('countrySelectClient', 'stateSelectClient', 'citySelectClient');
            // La carga para el modal de edición se maneja aquí también para asegurar las opciones
            window.loadLocationData('editCountrySelect', 'editStateSelect', 'editCitySelect'); 
        }
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

// Cargar talentos (Se mantiene la funcionalidad existente)
async function loadTalents() {
    const talentList = document.getElementById('talentList');
    if (!talentList) return;
    talentList.innerHTML = '<h3>Cargando Talentos...</h3>';

    try {
        const talentsSnapshot = await db.collection('talents').get();
        let html = '';

        talentsSnapshot.forEach(doc => {
            const talent = doc.data();
            html += `
                <div class="talent-card">
                    <img src="${talent.profilePictureUrl || 'img/default-avatar.png'}" alt="${talent.name}">
                    <h4>${talent.name}</h4>
                    <p>${talent.ageRange} | ${talent.gender}</p>
                    <div class="talent-meta">
                        <span><i class="fas fa-map-marker-alt"></i> ${window.getCountryName(talent.country) || 'Global'}</span>
                        <span><i class="fas fa-volume-up"></i> ${talent.languages ? talent.languages[0] : 'N/A'}</span>
                        ${talent.hasHomeStudio ? '<span><i class="fas fa-home"></i> Home Studio</span>' : ''}
                    </div>
                    <div class="talent-actions">
                        <button class="btn btn-outline btn-sm" onclick="window.viewTalentProfile('${doc.id}')">Ver Perfil</button>
                        <button class="btn btn-primary btn-sm" onclick="window.addToFavorites('${doc.id}')"><i class="fas fa-heart"></i></button>
                    </div>
                </div>
            `;
        });

        talentList.innerHTML = html || '<p>No se encontraron talentos con los filtros seleccionados.</p>';

    } catch (error) {
        console.error('Error cargando talentos:', error);
        talentList.innerHTML = '<p class="error">Error al cargar la lista de talentos.</p>';
    }
}
window.loadTalents = loadTalents;


// Cargar ofertas de trabajo (MODIFICADO para incluir el botón de Postular)
async function loadJobOffers() {
    const jobOffersSection = document.getElementById('jobOffersList');
    if (!jobOffersSection) return;
    jobOffersSection.innerHTML = '<h3>Cargando Ofertas de Trabajo...</h3>';
    
    // Obtener información del usuario actual para el botón de postulación
    const user = firebase.auth().currentUser;
    const userId = user ? user.uid : null;
    let userType = null;
    let talentApplications = [];

    if (userId) {
        // Obtener el tipo de usuario y sus postulaciones
        const talentDoc = await db.collection('talents').doc(userId).get();
        if (talentDoc.exists) {
            userType = 'talent';
            talentApplications = talentDoc.data().jobApplications || [];
        } else {
            const clientDoc = await db.collection('clients').doc(userId).get();
            if (clientDoc.exists) {
                userType = 'client';
            }
        }
    }


    try {
        const jobsSnapshot = await db.collection('jobOffers').get();
        let html = '';

        jobsSnapshot.forEach(doc => {
            const job = doc.data();
            const jobId = doc.id;
            
            let actionButton = '';
            
            if (userType === 'talent') {
                const isApplied = talentApplications.includes(jobId);
                if (isApplied) {
                    actionButton = `<button class="btn btn-success btn-sm" disabled>✅ Postulado</button>`;
                } else {
                    // LLamada a la función de postulación CORRECTA
                    actionButton = `<button class="btn btn-primary btn-sm" onclick="window.applyToJob('${jobId}', '${userId}')">Postularme</button>`;
                }
            } else if (userType === 'client') {
                // Los clientes no postulan, y su gestión de ofertas/notificaciones está en profile.html
            } else {
                // Usuario no logueado
                actionButton = `<button class="btn btn-primary btn-sm" onclick="document.getElementById('loginModal').style.display = 'flex'">Iniciar Sesión</button>`;
            }

            // Usamos window.getCountryName del locations.js modificado
            html += `
                <div class="job-offer-card">
                    <div class="job-header">
                        <h3>${job.title}</h3>
                        <span class="job-budget">💰 ${job.budget}</span>
                    </div>
                    <p class="job-description">${job.description}</p>
                    <div class="job-meta">
                        <span><i class="fas fa-map-marker-alt"></i> ${window.getCountryName(job.country) || 'Global'}</span>
                        <span><i class="fas fa-tag"></i> ${job.category}</span>
                        <span><i class="fas fa-clock"></i> ${job.duration}</span>
                        <span><i class="fas fa-user-alt"></i> ${job.clientName}</span>
                    </div>
                    <div class="job-actions">
                        ${actionButton}
                    </div>
                </div>
            `;
        });

        jobOffersSection.innerHTML = html || '<p>No hay ofertas de trabajo publicadas aún.</p>';

    } catch (error) {
        console.error('Error cargando ofertas de trabajo:', error);
        jobOffersSection.innerHTML = '<p class="error">Error al cargar las ofertas de trabajo.</p>';
    }
}
window.loadJobOffers = loadJobOffers;


// Función de postulación a trabajo (IMPLEMENTACIÓN FUNCIONAL)
window.applyToJob = async function(jobId, talentId) {
    if (!talentId) {
        alert('Debes iniciar sesión para postularte.');
        return;
    }
    
    if (!confirm('¿Estás seguro de que quieres postularte a esta oferta?')) {
        return;
    }

    try {
        // 1. Obtener el ID del cliente que publicó la oferta
        const jobDoc = await db.collection('jobOffers').doc(jobId).get();
        if (!jobDoc.exists) {
            alert('Esta oferta de trabajo ya no existe.');
            return;
        }
        const clientId = jobDoc.data().clientId;

        // 2. Guardar la postulación en la nueva colección 'applications'
        // Esto facilitará al cliente la consulta de postulantes.
        await db.collection('applications').add({
            jobId: jobId,
            talentId: talentId,
            clientId: clientId,
            status: 'pending',
            appliedAt: new Date()
        });

        // 3. Actualizar el array 'jobApplications' del talento para marcar que se postuló
        await db.collection('talents').doc(talentId).update({
            jobApplications: firebase.firestore.FieldValue.arrayUnion(jobId)
        });

        alert('✅ ¡Postulación exitosa! El cliente ha sido notificado y puedes ver esta postulación en "Mis Postulaciones".');
        
        // 4. Recargar la lista de ofertas para actualizar el botón a "Postulado"
        loadJobOffers();

    } catch (error) {
        console.error('❌ Error al postularse:', error);
        alert(`❌ Error al postularse: ${error.message}`);
    }
};


// Hacemos que estas funciones sean globales (en caso de que sean llamadas desde HTML)
window.viewTalentProfile = function(talentId) {
    alert(`Ver perfil completo del talento ${talentId}. Funcionalidad pendiente.`);
};
window.addToFavorites = function(talentId) {
    alert(`Añadir talento ${talentId} a favoritos. Funcionalidad pendiente.`);
};

// Función auxiliar para mostrar mensajes (hecha global)
function showMessage(element, message, type) {
    const el = typeof element === 'string' ? document.getElementById(element) : element;
    if (el) {
        el.innerHTML = `<div class="${type}">${message}</div>`;
    }
}
window.showMessage = showMessage;

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
}
window.closeAllModals = closeAllModals; // Hacer global

function toggleCompanyName() {
    const companyNameGroup = document.getElementById('companyNameGroup') || document.getElementById('editCompanyNameGroup');
    const clientType = document.getElementById('clientType') || document.getElementById('editClientType');
    if (companyNameGroup && clientType) {
        companyNameGroup.style.display = clientType.value === 'empresa' ? 'block' : 'none';
    }
}
window.toggleCompanyName = toggleCompanyName;

function toggleOtherLanguages() {
    const otherLanguagesInput = document.getElementById('otherLanguages');
    if (otherLanguagesInput) {
        // Asume que lang10 es la opción de 'otros'
        otherLanguagesInput.style.display = document.getElementById('lang10').checked ? 'block' : 'none';
    }
}
window.toggleOtherLanguages = toggleOtherLanguages;
