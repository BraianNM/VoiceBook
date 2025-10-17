// Funciones principales de la aplicación

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    checkAuthState();
    
    // CORRECCIÓN: Asegurar que la carga de talentos solo corra en index.html
    if (!window.location.href.includes('profile.html')) {
        loadTalents();
        loadJobOffers(); // 6. CORRECCIÓN: Eliminar ofertas (Asegura carga desde DB)
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

    // Listeners de Formularios de Autenticación/Registro
    document.getElementById('talentForm')?.addEventListener('submit', registerTalent);
    document.getElementById('clientForm')?.addEventListener('submit', registerClient);
    document.getElementById('loginForm')?.addEventListener('submit', loginUser);
    
    // Listeners de UI
    document.getElementById('clientType')?.addEventListener('change', toggleCompanyName);
}

// Función auxiliar para cerrar todos los modales
function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
}
window.closeAllModals = closeAllModals;

// Función auxiliar para alternar el campo 'Nombre de la Empresa'
function toggleCompanyName() {
    const companyNameGroup = document.getElementById('companyNameGroup');
    if (companyNameGroup) {
        companyNameGroup.style.display = document.getElementById('clientType').value === 'empresa' ? 'block' : 'none';
    }
}

// Función auxiliar para obtener el tipo de usuario (necesario para Favoritos y Postulaciones)
async function getUserType(userId) {
    const talentDoc = await db.collection('talents').doc(userId).get();
    if (talentDoc.exists) return 'talent';
    const clientDoc = await db.collection('clients').doc(userId).get();
    if (clientDoc.exists) return 'client';
    return null;
}
window.getUserType = getUserType;


// =========================================================
// 1. CORRECCIÓN: Ver perfil contacto (solo logueado, con mensaje de registro)
// =========================================================
window.viewTalentProfile = function(talentId) {
    if (!currentUser) {
        // Muestra el recuadro de registro requerido
        document.getElementById('loginRequiredModal').style.display = 'flex'; 
        return;
    }
    
    // Si está logueado, se podría mostrar la info de contacto o redirigir
    // Por simplicidad, muestra un mensaje de éxito
    console.log(`Usuario logeado: Cargando perfil detallado del talento ${talentId}`);
    alert(`Aquí se mostraría la información de contacto completa del talento ${talentId}`);
};


// =========================================================
// 3. CORRECCIÓN: Postular al trabajo (real)
// =========================================================
window.applyToJob = async function(jobId) {
    if (!currentUser) {
        alert("Para postularte a un trabajo, debes iniciar sesión como Talento.");
        document.getElementById('loginModal').style.display = 'flex';
        return;
    }

    const userType = await getUserType(currentUser.uid);
    if (userType !== 'talent') {
        alert("Solo los usuarios registrados como Talento pueden postularse a trabajos.");
        return;
    }
    
    const applyBtn = document.getElementById(`applyBtn_${jobId}`);
    const originalText = applyBtn ? applyBtn.textContent : 'Postularme';
    if(applyBtn) {
        applyBtn.disabled = true;
        applyBtn.textContent = 'Postulando...';
    }

    try {
        // 1. Añadir el ID del talento a la lista de postulantes del trabajo
        const jobRef = db.collection('jobs').doc(jobId);
        await jobRef.update({
            applicants: firebase.firestore.FieldValue.arrayUnion(currentUser.uid)
        });

        // 2. Añadir el ID del trabajo a las postulaciones del talento
        const talentRef = db.collection('talents').doc(currentUser.uid);
        await talentRef.update({
            applications: firebase.firestore.FieldValue.arrayUnion(jobId)
        });

        if(applyBtn) {
            applyBtn.textContent = '✅ Postulado';
            applyBtn.classList.remove('btn-primary');
            applyBtn.classList.add('btn-success');
        }
        alert(`✅ ¡Postulación exitosa al trabajo! Revisa la pestaña "Mis Postulaciones" en tu perfil.`);
        
    } catch (error) {
        console.error('Error al postularse:', error);
        alert('❌ Error al procesar la postulación. Podrías ya haberte postulado o hubo un error de red.');
        if(applyBtn) {
            applyBtn.textContent = originalText;
            applyBtn.disabled = false;
        }
    }
};


// =========================================================
// 5. CORRECCIÓN: Añadir a Favoritos (real)
// =========================================================
window.addToFavorites = async function(talentId) {
    if (!currentUser) {
        alert("Debes iniciar sesión para añadir talentos a favoritos.");
        document.getElementById('loginModal').style.display = 'flex';
        return;
    }
    
    // Asumimos que tanto clientes como talentos pueden tener favoritos
    try {
        const userType = await getUserType(currentUser.uid);
        if (!userType) {
            alert('❌ No se pudo determinar tu tipo de usuario. No puedes guardar favoritos.');
            return;
        }
        
        const collectionName = userType === 'talent' ? 'talents' : 'clients';
        const userRef = db.collection(collectionName).doc(currentUser.uid);
        const userDoc = await userRef.get();
        
        if (userDoc.exists) {
            const currentFavorites = userDoc.data().favorites || [];
            let message = '';
            
            if (currentFavorites.includes(talentId)) {
                // Quitar de favoritos
                await userRef.update({
                    favorites: firebase.firestore.FieldValue.arrayRemove(talentId)
                });
                message = 'Talento eliminado de favoritos.';
            } else {
                // Añadir a favoritos
                await userRef.update({
                    favorites: firebase.firestore.FieldValue.arrayUnion(talentId)
                });
                message = 'Talento añadido a favoritos. ¡Revisa tu pestaña!';
            }
            
            alert(`✅ ${message}`);
            // Si estamos en la página de perfil, recargar favoritos
            if(window.location.href.includes('profile.html') && typeof loadFavorites === 'function') {
                loadFavorites(currentUser.uid);
            }
        }
    } catch (error) {
        console.error('Error al manejar favoritos:', error);
        alert('❌ Error al procesar la acción de favoritos.');
    }
};


// =========================================================
// 6. CORRECCIÓN: Eliminar Ofertas (Asegurar que solo carga de DB)
// =========================================================
// Reemplaza la función loadJobOffers existente
window.loadJobOffers = async function() {
    const jobOffersContainer = document.getElementById('jobOffersList');
    if (!jobOffersContainer) return;

    jobOffersContainer.innerHTML = '<div class="loading">Cargando ofertas...</div>';

    try {
        // Carga las ofertas de trabajo desde Firestore
        const snapshot = await db.collection('jobs').get();
        
        if (snapshot.empty) {
            jobOffersContainer.innerHTML = '<p class="info-box">No hay ofertas de trabajo publicadas por el momento.</p>';
            return;
        }

        let jobsHtml = '';
        snapshot.forEach(doc => {
            const job = doc.data();
            const jobId = doc.id;
            
            // Asumiendo que el cliente ID está en 'clientId' y hay una colección 'clients'
            const clientName = job.clientName || 'Anónimo'; 

            jobsHtml += `
                <div class="job-card" data-job-id="${jobId}">
                    <h3>${job.title || 'Título no especificado'}</h3>
                    <p><strong>Cliente:</strong> ${clientName}</p>
                    <p><strong>Requisitos:</strong> ${job.requirements || 'N/A'}</p>
                    <p><strong>Tipo:</strong> ${job.type || 'Locución'}</p>
                    <button class="btn btn-primary" id="applyBtn_${jobId}" onclick="applyToJob('${jobId}')">
                        Postularme
                    </button>
                </div>
            `;
        });

        jobOffersContainer.innerHTML = jobsHtml;

    } catch (error) {
        console.error('Error al cargar ofertas de trabajo:', error);
        jobOffersContainer.innerHTML = '<p class="error-box">Error al cargar las ofertas de trabajo.</p>';
    }
};


// ========== FUNCIÓN PARA CARGAR TALENTOS (SIN CAMBIOS MAYORES) ==========
// Función para cargar y mostrar talentos en el index.html
window.loadTalents = async function() {
    const talentList = document.getElementById('talentList');
    if (!talentList) return;

    talentList.innerHTML = '<div class="loading">Cargando talentos...</div>';

    try {
        const snapshot = await db.collection('talents').limit(12).get(); // Limitar para prueba
        
        if (snapshot.empty) {
            talentList.innerHTML = '<p class="info-box">No se encontraron talentos en este momento.</p>';
            return;
        }

        let talentsHtml = '';
        snapshot.forEach(doc => {
            const talent = doc.data();
            const talentId = doc.id;
            
            // Usamos la clase profile-pic-small para la foto circular
            talentsHtml += `
                <div class="talent-card" data-talent-id="${talentId}">
                    <div class="profile-pic-container" style="margin: 0 auto;">
                        <img src="${talent.photoURL || 'images/default-profile.png'}" alt="Foto de perfil" class="profile-image">
                    </div>
                    <h3>${talent.name || 'Talento'} ${talent.lastName || ''}</h3>
                    <p>${talent.bio ? talent.bio.substring(0, 80) + '...' : 'Sin biografía disponible.'}</p>
                    <div class="btn-group">
                        <button class="btn btn-outline btn-small" onclick="viewTalentProfile('${talentId}')">Ver Contacto</button>
                        <button class="btn btn-warning btn-small" onclick="addToFavorites('${talentId}')">
                            <i class="fas fa-star"></i>
                        </button>
                    </div>
                </div>
            `;
        });

        talentList.innerHTML = talentsHtml;
        
    } catch (error) {
        console.error('Error al cargar talentos:', error);
        talentList.innerHTML = '<p class="error-box">Error al cargar la lista de talentos.</p>';
    }
};

// Se asume que showMessage ya está definido globalmente en auth.js o aquí.
function showMessage(element, message, type) {
    const el = typeof element === 'string' ? document.getElementById(element) : element;
    if (el) {
        el.innerHTML = `<div class=\"${type}\">${message}</div>`;
    }
}
window.showMessage = showMessage;
