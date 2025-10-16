// Funciones principales de la aplicación

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    checkAuthState();
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
    document.getElementById('dashboardLink').addEventListener('click', showDashboard);
    document.getElementById('logoutBtn').addEventListener('click', logoutUser);

    document.querySelectorAll('.close-modal').forEach(button => {
        button.addEventListener('click', closeAllModals);
    });

    document.getElementById('talentForm').addEventListener('submit', registerTalent);
    document.getElementById('clientForm').addEventListener('submit', registerClient);
    document.getElementById('loginForm').addEventListener('submit', loginUser);

    document.getElementById('clientType').addEventListener('change', toggleCompanyName);
    document.getElementById('lang10').addEventListener('change', toggleOtherLanguages);

    document.querySelectorAll('.dashboard-tabs .tab').forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.dashboard-tabs .tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            
            this.classList.add('active');
            const tabId = this.getAttribute('data-tab');
            document.getElementById(tabId + 'Tab').classList.add('active');
        });
    });
}

// Cargar talentos
async function loadTalents() {
    try {
        const snapshot = await db.collection('talents').get();
        const talentsContainer = document.getElementById('talentsContainer');
        
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
        document.getElementById('talentsContainer').innerHTML = '<p>Error al cargar talentos.</p>';
    }
}

// Mostrar tarjeta de talento - FUNCIÓN MEJORADA (INFO PRIVADA OCULTA)
function displayTalentCard(talent, talentId) {
    const talentsContainer = document.getElementById('talentsContainer');
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
    
    // Información de contacto solo para usuarios logueados
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
        document.getElementById('jobOffersContainer').innerHTML = '<p>Error al cargar ofertas.</p>';
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
                <button class="btn btn-primary" onclick="applyToJob('${jobId}')">Postularme</button>
            </div>
        ` : ''}
    `;
    
    jobOffersContainer.appendChild(jobCard);
}

// Funciones auxiliares
function showMessage(element, message, type) {
    element.innerHTML = `<div class="${type}">${message}</div>`;
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
}

function toggleCompanyName() {
    const companyNameGroup = document.getElementById('companyNameGroup');
    companyNameGroup.style.display = document.getElementById('clientType').value === 'empresa' ? 'block' : 'none';
}

function toggleOtherLanguages() {
    const otherLanguagesInput = document.getElementById('otherLanguages');
    otherLanguagesInput.style.display = document.getElementById('lang10').checked ? 'block' : 'none';
}

function getSelectedLanguages() {
    const languages = [];
    for (let i = 1; i <= 10; i++) {
        const checkbox = document.getElementById('lang' + i);
        if (checkbox.checked) {
            languages.push(checkbox.value);
        }
    }
    
    if (document.getElementById('lang10').checked && document.getElementById('otherLanguages').value) {
        languages.push(document.getElementById('otherLanguages').value);
    }
    
    return languages;
}

// ========== FUNCIONES CORREGIDAS ==========

window.viewTalentProfile = function(talentId) {
    showTalentDetails(talentId);
};

async function showTalentDetails(talentId) {
    try {
        const talentDoc = await db.collection('talents').doc(talentId).get();
        
        if (talentDoc.exists) {
            const talent = talentDoc.data();
            
            const existingModal = document.getElementById('talentDetailsModal');
            if (existingModal) {
                existingModal.remove();
            }
            
            let demosHTML = '';
            if (talent.demos && talent.demos.length > 0) {
                demosHTML = `
                    <div class="demos-section">
                        <h3>Demos de Audio</h3>
                        ${talent.demos.map((demo, index) => `
                            <div class="demo-item" style="margin-bottom: 20px; padding: 15px; background: white; border: 1px solid #e9ecef; border-radius: 8px;">
                                <p style="font-weight: 600; margin-bottom: 10px; color: #333;">
                                    ${demo.name || `Demo ${index + 1}`}
                                </p>
                                <audio controls style="width: 100%; height: 45px; border-radius: 22px;">
                                    <source src="${demo.url}" type="audio/mpeg">
                                </audio>
                                <div style="font-size: 12px; color: #666; margin-top: 8px; display: flex; justify-content: space-between;">
                                    <span>${Math.round(demo.duration || 0)} segundos</span>
                                    <span>${demo.size ? (demo.size / 1024 / 1024).toFixed(1) + ' MB' : ''}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `;
            } else {
                demosHTML = '<p style="color: #666; text-align: center; padding: 20px;">No hay demos de audio disponibles</p>';
            }
            
            // Información de ubicación (siempre visible)
            const locationInfo = talent.city && talent.state && talent.country ? 
                `<div class="info-item">
                    <label>Ubicación:</label>
                    <span>${getCityName(talent.country, talent.state, talent.city)}, ${getStateName(talent.country, talent.state)}, ${getCountryName(talent.country)}</span>
                </div>` : '';
            
            // Información de contacto protegida - solo para usuarios logueados
            const contactInfo = currentUser ? `
                <div class="info-grid">
                    <div class="info-item">
                        <label>Nombre:</label>
                        <span>${talent.name || 'No especificado'}</span>
                    </div>
                    <div class="info-item">
                        <label>Email:</label>
                        <span>${talent.email || 'No especificado'}</span>
                    </div>
                    <div class="info-item">
                        <label>Teléfono:</label>
                        <span>${talent.phone || 'No especificado'}</span>
                    </div>
                    ${locationInfo}
                    <div class="info-item">
                        <label>Género:</label>
                        <span>${talent.gender === 'hombre' ? 'Hombre' : 'Mujer'}</span>
                    </div>
                    <div class="info-item">
                        <label>Idiomas:</label>
                        <span>${Array.isArray(talent.languages) ? talent.languages.join(', ') : talent.languages || 'No especificado'}</span>
                    </div>
                    <div class="info-item">
                        <label>Home Studio:</label>
                        <span>${talent.homeStudio === 'si' ? 'Sí' : 'No'}</span>
                    </div>
                    <div class="info-item">
                        <label>Nacionalidad:</label>
                        <span>${talent.nationality || 'No especificado'}</span>
                    </div>
                    ${talent.realAge ? `
                    <div class="info-item">
                        <label>Edad real:</label>
                        <span>${talent.realAge} años</span>
                    </div>
                    ` : ''}
                    ${talent.ageRange ? `
                    <div class="info-item">
                        <label>Rango de edades:</label>
                        <span>${talent.ageRange}</span>
                    </div>
                    ` : ''}
                </div>
            ` : `
                <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
                    <i class="fas fa-lock" style="font-size: 24px; color: #856404; margin-bottom: 10px;"></i>
                    <h4 style="color: #856404; margin-bottom: 10px;">Información restringida</h4>
                    <p style="color: #856404; margin-bottom: 15px;">Inicia sesión para ver toda la información de contacto y detalles del talento.</p>
                    <button class="btn btn-primary" onclick="document.getElementById('loginModal').style.display = 'flex'; closeAllModals();">Iniciar Sesión</button>
                </div>
                <div class="info-grid">
                    <div class="info-item">
                        <label>Nombre:</label>
                        <span>${talent.name || 'No especificado'}</span>
                    </div>
                    ${locationInfo}
                    <div class="info-item">
                        <label>Género:</label>
                        <span>${talent.gender === 'hombre' ? 'Hombre' : 'Mujer'}</span>
                    </div>
                    <div class="info-item">
                        <label>Idiomas:</label>
                        <span>${Array.isArray(talent.languages) ? talent.languages.join(', ') : talent.languages || 'No especificado'}</span>
                    </div>
                    <div class="info-item">
                        <label>Home Studio:</label>
                        <span>${talent.homeStudio === 'si' ? 'Sí' : 'No'}</span>
                    </div>
                    <div class="info-item">
                        <label>Nacionalidad:</label>
                        <span>${talent.nationality || 'No especificado'}</span>
                    </div>
                    ${talent.realAge ? `
                    <div class="info-item">
                        <label>Edad real:</label>
                        <span>${talent.realAge} años</span>
                    </div>
                    ` : ''}
                    ${talent.ageRange ? `
                    <div class="info-item">
                        <label>Rango de edades:</label>
                        <span>${talent.ageRange}</span>
                    </div>
                    ` : ''}
                </div>
            `;
            
            const modalHTML = `
                <div class="modal" id="talentDetailsModal" style="display: flex;">
                    <div class="modal-content" style="max-width: 800px; max-height: 90vh; overflow-y: auto;">
                        <span class="close-modal" onclick="document.getElementById('talentDetailsModal').remove()">&times;</span>
                        <h2>Perfil del Talento</h2>
                        
                        <div class="talent-profile-header">
                            <div class="talent-avatar" style="background-color: #3498db; width: 80px; height: 80px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 36px; margin-right: 20px;">
                                <i class="fas fa-user"></i>
                            </div>
                            <div>
                                <h3 style="margin: 0 0 5px 0; color: #333;">${talent.name}</h3>
                                <p style="margin: 0; color: #666;">${talent.gender === 'hombre' ? 'Hombre' : 'Mujer'} • ${talent.nationality || 'Nacionalidad no especificada'}</p>
                            </div>
                        </div>
                        
                        ${contactInfo}
                        
                        <div class="description-section">
                            <h3>Descripción</h3>
                            <p>${talent.description || 'No hay descripción disponible.'}</p>
                        </div>
                        
                        ${demosHTML}
                        
                        <div style="margin-top: 30px; text-align: center;">
                            ${currentUser ? `
                                <button class="btn btn-success" onclick="addToFavorites('${talentId}')">
                                    <i class="fas fa-heart"></i> Agregar a Favoritos
                                </button>
                            ` : ''}
                            <button class="btn btn-outline" onclick="document.getElementById('talentDetailsModal').remove()">Cerrar</button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', modalHTML);
        }
    } catch (error) {
        console.error('Error cargando detalles del talento:', error);
        alert('Error al cargar el perfil del talento');
    }
}

// Funciones placeholder para funcionalidades futuras
window.addToFavorites = function(talentId) {
    if (!currentUser) {
        alert('Debes iniciar sesión para agregar a favoritos');
        return;
    }
    alert('Funcionalidad de favoritos - Próximamente');
};

window.applyToJob = function(jobId) {
    if (!currentUser) {
        alert('Debes iniciar sesión para postularte');
        return;
    }
    alert('Funcionalidad de postulación - Próximamente');
};

// ========== DASHBOARD FUNCIONAL ==========

window.showDashboard = function() {
    if (!currentUser) {
        alert('Debes iniciar sesión para acceder al panel');
        document.getElementById('loginModal').style.display = 'flex';
        return;
    }
    
    document.getElementById('dashboardModal').style.display = 'flex';
    
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    document.querySelector('[data-tab="profile"]').classList.add('active');
    document.getElementById('profileTab').classList.add('active');
    
    loadUserProfile(currentUser.uid);
};

// ========== FUNCIONES DE AUTENTICACIÓN ==========

// Verificar estado de autenticación
function checkAuthState() {
    auth.onAuthStateChanged((user) => {
        if (user) {
            currentUser = user;
            updateUIAfterLogin();
        } else {
            currentUser = null;
            updateUIAfterLogout();
        }
    });
}

// Actualizar UI después del login
function updateUIAfterLogin() {
    document.getElementById('authButtons').style.display = 'none';
    document.getElementById('userMenu').style.display = 'block';
    document.getElementById('userName').textContent = currentUser.email;
    document.getElementById('dashboardLink').style.display = 'block';
}

// Actualizar UI después del logout
function updateUIAfterLogout() {
    document.getElementById('authButtons').style.display = 'flex';
    document.getElementById('userMenu').style.display = 'none';
    document.getElementById('dashboardLink').style.display = 'none';
}

// Cerrar sesión
async function logoutUser() {
    try {
        await auth.signOut();
        closeAllModals();
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
    }
}

// ========== FUNCIONES DE REGISTRO ==========

// Registrar talento
async function registerTalent(e) {
    e.preventDefault();
    const messageDiv = document.getElementById('talentFormMessage');
    
    try {
        const email = document.getElementById('talentEmail').value;
        const password = document.getElementById('talentPassword').value;
        
        showMessage(messageDiv, 'Creando cuenta...', 'success');
        
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Obtener datos del formulario
        const talentData = {
            name: document.getElementById('talentName').value,
            email: email,
            phone: document.getElementById('talentPhone').value,
            gender: document.getElementById('talentGender').value,
            country: document.getElementById('talentCountry').value,
            state: document.getElementById('talentState').value,
            city: document.getElementById('talentCity').value,
            description: document.getElementById('talentDescription').value,
            languages: getSelectedLanguages(),
            homeStudio: document.getElementById('talentHomeStudio').value,
            ageRange: document.getElementById('talentAgeRange').value,
            nationality: document.getElementById('talentNationality').value,
            realAge: document.getElementById('talentRealAge').value ? parseInt(document.getElementById('talentRealAge').value) : null,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        await db.collection('talents').doc(user.uid).set(talentData);
        
        showMessage(messageDiv, '🎉 ¡Registro exitoso!', 'success');
        
        setTimeout(() => {
            closeAllModals();
            document.getElementById('talentForm').reset();
            loadTalents();
        }, 2000);
        
    } catch (error) {
        showMessage(messageDiv, '❌ Error: ' + error.message, 'error');
    }
}

// Registrar cliente
async function registerClient(e) {
    e.preventDefault();
    const messageDiv = document.getElementById('clientFormMessage');
    
    try {
        const email = document.getElementById('clientEmail').value;
        const password = document.getElementById('clientPassword').value;
        
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        const clientData = {
            name: document.getElementById('clientName').value,
            email: email,
            phone: document.getElementById('clientPhone').value,
            type: document.getElementById('clientType').value,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        if (clientData.type === 'empresa') {
            clientData.companyName = document.getElementById('companyName').value;
        }
        
        await db.collection('clients').doc(user.uid).set(clientData);
        
        showMessage(messageDiv, '¡Registro exitoso!', 'success');
        setTimeout(() => {
            closeAllModals();
            document.getElementById('clientForm').reset();
        }, 2000);
        
    } catch (error) {
        showMessage(messageDiv, 'Error: ' + error.message, 'error');
    }
}

// Iniciar sesión
async function loginUser(e) {
    e.preventDefault();
    const messageDiv = document.getElementById('loginFormMessage');
    
    try {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        await auth.signInWithEmailAndPassword(email, password);
        showMessage(messageDiv, '¡Inicio de sesión exitoso!', 'success');
        setTimeout(() => closeAllModals(), 1000);
        
    } catch (error) {
        showMessage(messageDiv, 'Error: ' + error.message, 'error');
    }
}

// ========== FUNCIONES DE PERFIL ==========

// Cargar perfil de usuario
async function loadUserProfile(userId) {
    try {
        let userProfile = null;
        
        // Intentar cargar como talento primero
        const talentDoc = await db.collection('talents').doc(userId).get();
        if (talentDoc.exists) {
            userProfile = {
                type: 'talent',
                ...talentDoc.data()
            };
        } else {
            // Si no es talento, intentar cargar como cliente
            const clientDoc = await db.collection('clients').doc(userId).get();
            if (clientDoc.exists) {
                userProfile = {
                    type: 'client',
                    ...clientDoc.data()
                };
            }
        }
        
        if (userProfile) {
            displayUserProfile(userProfile);
        } else {
            document.getElementById('userProfileContent').innerHTML = 
                '<div class="error">No se encontró perfil. Completa tu registro en la sección correspondiente.</div>';
        }
        
    } catch (error) {
        console.error('Error cargando perfil:', error);
        document.getElementById('userProfileContent').innerHTML = 
            '<div class="error">Error al cargar el perfil: ' + error.message + '</div>';
    }
}

// Mostrar perfil de usuario
function displayUserProfile(profile) {
    const profileContent = document.getElementById('userProfileContent');
    
    if (profile.type === 'talent') {
        // Información de ubicación
        const locationInfo = profile.country && profile.state && profile.city ? 
            `<div class="info-item">
                <label>Ubicación:</label>
                <span>${getCityName(profile.country, profile.state, profile.city)}, ${getStateName(profile.country, profile.state)}, ${getCountryName(profile.country)}</span>
            </div>` : '';
        
        profileContent.innerHTML = `
            <div class="profile-header">
                <h3>Mi Perfil - Talento</h3>
                <button class="btn btn-primary" onclick="editProfile()">
                    <i class="fas fa-edit"></i> Editar Perfil
                </button>
            </div>
            
            <div class="profile-info">
                <div class="info-grid">
                    <div class="info-item">
                        <label>Nombre:</label>
                        <span>${profile.name || 'No especificado'}</span>
                    </div>
                    <div class="info-item">
                        <label>Email:</label>
                        <span>${profile.email || 'No especificado'}</span>
                    </div>
                    <div class="info-item">
                        <label>Teléfono:</label>
                        <span>${profile.phone || 'No especificado'}</span>
                    </div>
                    ${locationInfo}
                    <div class="info-item">
                        <label>Género:</label>
                        <span>${profile.gender === 'hombre' ? 'Hombre' : 'Mujer'}</span>
                    </div>
                    <div class="info-item">
                        <label>Idiomas:</label>
                        <span>${Array.isArray(profile.languages) ? profile.languages.join(', ') : profile.languages || 'No especificado'}</span>
                    </div>
                    <div class="info-item">
                        <label>Home Studio:</label>
                        <span>${profile.homeStudio === 'si' ? 'Sí' : 'No'}</span>
                    </div>
                    <div class="info-item">
                        <label>Nacionalidad:</label>
                        <span>${profile.nationality || 'No especificado'}</span>
                    </div>
                    ${profile.realAge ? `
                    <div class="info-item">
                        <label>Edad real:</label>
                        <span>${profile.realAge} años</span>
                    </div>
                    ` : ''}
                    ${profile.ageRange ? `
                    <div class="info-item">
                        <label>Rango de edades:</label>
                        <span>${profile.ageRange}</span>
                    </div>
                    ` : ''}
                </div>
                
                <div class="description-section">
                    <label>Descripción:</label>
                    <p>${profile.description || 'Sin descripción'}</p>
                </div>
            </div>
        `;
    } else {
        profileContent.innerHTML = `
            <div class="profile-header">
                <h3>Mi Perfil - Cliente</h3>
                <button class="btn btn-primary" onclick="editProfile()">
                    <i class="fas fa-edit"></i> Editar Perfil
                </button>
            </div>
            
            <div class="profile-info">
                <div class="info-grid">
                    <div class="info-item">
                        <label>Nombre:</label>
                        <span>${profile.name || 'No especificado'}</span>
                    </div>
                    <div class="info-item">
                        <label>Email:</label>
                        <span>${profile.email || 'No especificado'}</span>
                    </div>
                    <div class="info-item">
                        <label>Teléfono:</label>
                        <span>${profile.phone || 'No especificado'}</span>
                    </div>
                    <div class="info-item">
                        <label>Tipo:</label>
                        <span>${profile.type === 'empresa' ? 'Empresa' : 'Particular'}</span>
                    </div>
                    ${profile.companyName ? `
                        <div class="info-item">
                            <label>Empresa:</label>
                            <span>${profile.companyName}</span>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }
}

// ========== FUNCIONES DE EDICIÓN DE PERFIL ==========

window.editProfile = function() {
    if (!currentUser) return;
    
    loadUserProfile(currentUser.uid).then(profile => {
        if (profile) {
            openEditProfileModal(profile);
        }
    });
};

window.openEditProfileModal = function(profile) {
    document.getElementById('dashboardModal').style.display = 'none';
    
    let formHTML = '';
    
    if (profile.type === 'talent') {
        formHTML = `
            <h3>Editar Perfil - Talento</h3>
            <form id="editProfileForm">
                <div class="form-group">
                    <label for="editName">Nombre Completo *</label>
                    <input type="text" id="editName" class="form-control" value="${profile.name || ''}" required>
                </div>
                <div class="form-group">
                    <label for="editPhone">Teléfono *</label>
                    <input type="tel" id="editPhone" class="form-control" value="${profile.phone || ''}" required>
                </div>
                <div class="form-group">
                    <label for="editDescription">Descripción</label>
                    <textarea id="editDescription" class="form-control" rows="4">${profile.description || ''}</textarea>
                </div>
                <div class="form-group">
                    <label for="editNationality">Nacionalidad</label>
                    <input type="text" id="editNationality" class="form-control" value="${profile.nationality || ''}">
                </div>
                <div class="form-group">
                    <label for="editRealAge">Edad real</label>
                    <input type="number" id="editRealAge" class="form-control" value="${profile.realAge || ''}">
                </div>
                <div class="form-group">
                    <label for="editAgeRange">Rango de edades que puede interpretar</label>
                    <input type="text" id="editAgeRange" class="form-control" value="${profile.ageRange || ''}">
                </div>
                <div id="editProfileMessage"></div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="closeEditProfileModal()">Cancelar</button>
                    <button type="button" class="btn btn-primary" onclick="updateTalentProfile()">Guardar Cambios</button>
                </div>
            </form>
        `;
    } else {
        formHTML = `
            <h3>Editar Perfil - Cliente</h3>
            <form id="editProfileForm">
                <div class="form-group">
                    <label for="editName">Nombre Completo *</label>
                    <input type="text" id="editName" class="form-control" value="${profile.name || ''}" required>
                </div>
                <div class="form-group">
                    <label for="editPhone">Teléfono</label>
                    <input type="tel" id="editPhone" class="form-control" value="${profile.phone || ''}">
                </div>
                ${profile.companyName ? `
                <div class="form-group">
                    <label for="editCompanyName">Nombre de la Empresa</label>
                    <input type="text" id="editCompanyName" class="form-control" value="${profile.companyName || ''}">
                </div>
                ` : ''}
                <div id="editProfileMessage"></div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="closeEditProfileModal()">Cancelar</button>
                    <button type="button" class="btn btn-primary" onclick="updateClientProfile()">Guardar Cambios</button>
                </div>
            </form>
        `;
    }
    
    document.getElementById('editProfileForm').innerHTML = formHTML;
    document.getElementById('editProfileModal').style.display = 'flex';
};

window.closeEditProfileModal = function() {
    document.getElementById('editProfileModal').style.display = 'none';
    document.getElementById('dashboardModal').style.display = 'flex';
};

window.updateTalentProfile = async function() {
    const messageDiv = document.getElementById('editProfileMessage');
    
    try {
        const userId = currentUser.uid;
        const updateData = {
            name: document.getElementById('editName').value,
            phone: document.getElementById('editPhone').value,
            description: document.getElementById('editDescription').value,
            nationality: document.getElementById('editNationality').value,
            realAge: document.getElementById('editRealAge').value ? parseInt(document.getElementById('editRealAge').value) : null,
            ageRange: document.getElementById('editAgeRange').value,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        if (!updateData.name || !updateData.phone) {
            showMessage(messageDiv, '❌ Nombre y teléfono son obligatorios', 'error');
            return;
        }
        
        showMessage(messageDiv, '🔄 Guardando cambios...', 'success');
        
        await db.collection('talents').doc(userId).update(updateData);
        
        showMessage(messageDiv, '✅ Perfil actualizado correctamente', 'success');
        
        setTimeout(() => {
            closeEditProfileModal();
            loadUserProfile(userId);
        }, 2000);
        
    } catch (error) {
        console.error('Error actualizando perfil:', error);
        showMessage(messageDiv, '❌ Error: ' + error.message, 'error');
    }
};

window.updateClientProfile = async function() {
    const messageDiv = document.getElementById('editProfileMessage');
    
    try {
        const userId = currentUser.uid;
        const updateData = {
            name: document.getElementById('editName').value,
            phone: document.getElementById('editPhone').value,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        const companyNameInput = document.getElementById('editCompanyName');
        if (companyNameInput) {
            updateData.companyName = companyNameInput.value;
        }
        
        if (!updateData.name) {
            showMessage(messageDiv, '❌ Nombre es obligatorio', 'error');
            return;
        }
        
        showMessage(messageDiv, '🔄 Guardando cambios...', 'success');
        
        await db.collection('clients').doc(userId).update(updateData);
        
        showMessage(messageDiv, '✅ Perfil actualizado correctamente', 'success');
        
        setTimeout(() => {
            closeEditProfileModal();
            loadUserProfile(userId);
        }, 2000);
        
    } catch (error) {
        console.error('Error actualizando perfil:', error);
        showMessage(messageDiv, '❌ Error: ' + error.message, 'error');
    }
};

// ========== FUNCIÓN PARA VERIFICAR CONFIGURACIÓN ==========

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
