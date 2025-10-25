// app.js - VoiceBook Application (COMPLETO Y CORREGIDO)
console.log('VoiceBook app.js cargado');

// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyC6dG8l1cLJc6c6X6Q6Q6Q6Q6Q6Q6Q6Q6Q6Q",
    authDomain: "voicebook-app.firebaseapp.com",
    projectId: "voicebook-app",
    storageBucket: "voicebook-app.firebasestorage.app",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456"
};

// Inicializar Firebase
try {
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    console.log('Firebase inicializado correctamente');
} catch (error) {
    console.error('Error inicializando Firebase:', error);
}

// Referencias globales
const auth = firebase.auth();
const db = firebase.firestore();
let currentUser = null;
let currentUserData = null;

// Verificar estado de autenticación
function checkAuthState() {
    console.log('Verificando estado de autenticación...');
    
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            console.log('Usuario autenticado:', user.uid);
            currentUser = user;
            
            try {
                await loadUserData(user.uid);
                showAuthenticatedUI();
                
                // Cargar datos según el tipo de usuario
                if (currentUserData && currentUserData.type === 'talent') {
                    await loadJobs();
                } else if (currentUserData && currentUserData.type === 'client') {
                    await loadTalents();
                }
            } catch (error) {
                console.error('Error en checkAuthState:', error);
            }
        } else {
            console.log('Usuario no autenticado');
            showUnauthenticatedUI();
        }
    });
}

// Cargar datos del usuario
async function loadUserData(userId) {
    console.log('Cargando datos del usuario:', userId);
    
    try {
        // Intentar cargar como talento primero
        const talentDoc = await db.collection('talents').doc(userId).get();
        if (talentDoc.exists) {
            currentUserData = talentDoc.data();
            currentUserData.type = 'talent';
            currentUserData.id = userId;
            console.log('Usuario cargado como talento');
            return;
        }
        
        // Si no es talento, intentar como cliente
        const clientDoc = await db.collection('clients').doc(userId).get();
        if (clientDoc.exists) {
            currentUserData = clientDoc.data();
            currentUserData.type = 'client';
            currentUserData.id = userId;
            console.log('Usuario cargado como cliente');
            return;
        }
        
        console.log('Usuario no encontrado en ninguna colección');
        currentUserData = null;
    } catch (error) {
        console.error('Error cargando datos del usuario:', error);
        currentUserData = null;
    }
}

// Mostrar UI autenticado
function showAuthenticatedUI() {
    console.log('Mostrando UI autenticado');
    
    const authSection = document.getElementById('authSection');
    const mainAppSection = document.getElementById('mainAppSection');
    const authButtons = document.getElementById('authButtons');
    const userMenu = document.getElementById('userMenu');
    const userName = document.getElementById('userName');
    const userPicture = document.getElementById('userPicture');
    
    if (authSection) authSection.style.display = 'none';
    if (mainAppSection) mainAppSection.style.display = 'block';
    if (authButtons) authButtons.style.display = 'none';
    if (userMenu) userMenu.style.display = 'block';
    
    if (currentUserData && userName) {
        userName.textContent = currentUserData.name || 'Usuario';
    }
    
    if (currentUserData && userPicture) {
        userPicture.src = currentUserData.profilePictureUrl || 
            (currentUserData.type === 'talent' ? './img/default-avatar.png' : './img/default-avatar-client.png');
        userPicture.onerror = function() {
            this.src = currentUserData.type === 'talent' ? './img/default-avatar.png' : './img/default-avatar-client.png';
        };
    }
    
    // Mostrar contenido según tipo de usuario
    if (currentUserData) {
        if (currentUserData.type === 'talent') {
            showTalentUI();
        } else if (currentUserData.type === 'client') {
            showClientUI();
        }
    }
}

// Mostrar UI no autenticado
function showUnauthenticatedUI() {
    console.log('Mostrando UI no autenticado');
    
    const authSection = document.getElementById('authSection');
    const mainAppSection = document.getElementById('mainAppSection');
    const authButtons = document.getElementById('authButtons');
    const userMenu = document.getElementById('userMenu');
    
    if (authSection) authSection.style.display = 'block';
    if (mainAppSection) mainAppSection.style.display = 'none';
    if (authButtons) authButtons.style.display = 'flex';
    if (userMenu) userMenu.style.display = 'none';
    
    // Resetear formularios
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    if (loginForm) loginForm.reset();
    if (registerForm) registerForm.reset();
}

// Mostrar UI para talento
function showTalentUI() {
    console.log('Mostrando UI para talento');
    
    const talentSections = document.querySelectorAll('.talent-section');
    const clientSections = document.querySelectorAll('.client-section');
    
    talentSections.forEach(section => {
        section.style.display = 'block';
    });
    
    clientSections.forEach(section => {
        section.style.display = 'none';
    });
    
    showSection('jobsSection');
}

// Mostrar UI para cliente
function showClientUI() {
    console.log('Mostrando UI para cliente');
    
    const talentSections = document.querySelectorAll('.talent-section');
    const clientSections = document.querySelectorAll('.client-section');
    
    talentSections.forEach(section => {
        section.style.display = 'none';
    });
    
    clientSections.forEach(section => {
        section.style.display = 'block';
    });
    
    showSection('talentsSection');
}

// Mostrar sección específica
function showSection(sectionId) {
    console.log('Mostrando sección:', sectionId);
    
    const sections = document.querySelectorAll('.main-section');
    sections.forEach(section => {
        section.style.display = 'none';
    });
    
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.style.display = 'block';
    }
    
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.classList.remove('active');
    });
    
    const activeNav = document.querySelector(`[onclick="showSection('${sectionId}')"]`);
    if (activeNav) {
        activeNav.classList.add('active');
    }
}

// Cargar talentos
async function loadTalents() {
    console.log('Cargando talentos...');
    
    const talentsGrid = document.getElementById('talentsGrid');
    if (!talentsGrid) return;
    
    try {
        talentsGrid.innerHTML = '<p>Cargando talentos...</p>';
        
        const talentsSnapshot = await db.collection('talents').get();
        const talents = [];
        
        talentsSnapshot.forEach(doc => {
            const talent = doc.data();
            talent.id = doc.id;
            talents.push(talent);
        });
        
        console.log('Talentos cargados:', talents.length);
        
        if (talents.length === 0) {
            talentsGrid.innerHTML = '<p>No hay talentos registrados todavía.</p>';
            return;
        }
        
        let talentsHtml = '';
        talents.forEach(talent => {
            const countryName = getCountryName(talent.country) || talent.country;
            const stateName = getStateName(talent.country, talent.state) || talent.state;
            const location = talent.city && stateName && countryName ? 
                `${talent.city}, ${stateName}, ${countryName}` : 'Ubicación no especificada';
            
            const languages = talent.languages ? talent.languages.slice(0, 3).join(', ') : 'No especificado';
            
            talentsHtml += `
                <div class="talent-card">
                    <div class="talent-header">
                        <img src="${talent.profilePictureUrl || './img/default-avatar.png'}" 
                             alt="${talent.name}" 
                             class="talent-photo"
                             onerror="this.src='./img/default-avatar.png'">
                        <div class="talent-basic-info">
                            <h3>${talent.name || 'Talento'}</h3>
                            <p class="talent-location">${location}</p>
                        </div>
                    </div>
                    <div class="talent-details">
                        <p><strong>Edad:</strong> ${talent.realAge || 'No especificado'}</p>
                        <p><strong>Género:</strong> ${talent.gender || 'No especificado'}</p>
                        <p><strong>Idiomas:</strong> ${languages}</p>
                        <p><strong>Home Studio:</strong> ${talent.homeStudio === 'si' ? 'Sí' : 'No'}</p>
                    </div>
                    <div class="talent-actions">
                        <button class="btn btn-primary" onclick="viewTalentProfile('${talent.id}')">
                            Ver Perfil
                        </button>
                        <button class="btn btn-secondary" onclick="contactTalent('${talent.id}')">
                            Contactar
                        </button>
                    </div>
                </div>
            `;
        });
        
        talentsGrid.innerHTML = talentsHtml;
    } catch (error) {
        console.error('Error cargando talentos:', error);
        talentsGrid.innerHTML = '<p class="text-danger">Error al cargar los talentos.</p>';
    }
}

// Cargar trabajos
async function loadJobs() {
    console.log('Cargando trabajos...');
    
    const jobsGrid = document.getElementById('jobsGrid');
    if (!jobsGrid) return;
    
    try {
        jobsGrid.innerHTML = '<p>Cargando ofertas de trabajo...</p>';
        
        const jobsSnapshot = await db.collection('jobs').where('status', '==', 'active').get();
        const jobs = [];
        
        jobsSnapshot.forEach(doc => {
            const job = doc.data();
            job.id = doc.id;
            jobs.push(job);
        });
        
        console.log('Trabajos cargados:', jobs.length);
        
        if (jobs.length === 0) {
            jobsGrid.innerHTML = '<p>No hay ofertas de trabajo activas.</p>';
            return;
        }
        
        let jobsHtml = '';
        jobs.forEach(job => {
            const budget = job.budget ? `$${job.budget}` : 'A convenir';
            const deadline = job.deadline ? new Date(job.deadline).toLocaleDateString() : 'No especificada';
            
            jobsHtml += `
                <div class="job-card">
                    <div class="job-header">
                        <h3>${job.title || 'Oferta de Trabajo'}</h3>
                        <span class="job-budget">${budget}</span>
                    </div>
                    <div class="job-client">
                        <p><strong>Cliente:</strong> ${job.clientName || 'Cliente'}</p>
                    </div>
                    <div class="job-details">
                        <p><strong>Descripción:</strong> ${job.description || 'Sin descripción'}</p>
                        <p><strong>Fecha límite:</strong> ${deadline}</p>
                        <p><strong>Idiomas:</strong> ${job.languages ? job.languages.join(', ') : 'No especificado'}</p>
                        <p><strong>Género:</strong> ${job.gender || 'No especificado'}</p>
                        <p><strong>Edad:</strong> ${job.ageRange || 'No especificado'}</p>
                    </div>
                    <div class="job-actions">
                        <button class="btn btn-primary" onclick="viewJobDetails('${job.id}')">
                            Ver Detalles
                        </button>
                        <button class="btn btn-success" onclick="applyToJob('${job.id}')">
                            Postularme
                        </button>
                    </div>
                </div>
            `;
        });
        
        jobsGrid.innerHTML = jobsHtml;
    } catch (error) {
        console.error('Error cargando trabajos:', error);
        jobsGrid.innerHTML = '<p class="text-danger">Error al cargar las ofertas de trabajo.</p>';
    }
}

// Ver perfil de talento
async function viewTalentProfile(talentId) {
    console.log('Viendo perfil de talento:', talentId);
    
    try {
        const talentDoc = await db.collection('talents').doc(talentId).get();
        if (!talentDoc.exists) {
            alert('Talento no encontrado');
            return;
        }
        
        const talent = talentDoc.data();
        showTalentModal(talent);
    } catch (error) {
        console.error('Error cargando perfil de talento:', error);
        alert('Error al cargar el perfil del talento');
    }
}

// Mostrar modal de talento
function showTalentModal(talent) {
    const countryName = getCountryName(talent.country) || talent.country;
    const stateName = getStateName(talent.country, talent.state) || talent.state;
    const location = talent.city && stateName && countryName ? 
        `${talent.city}, ${stateName}, ${countryName}` : 'Ubicación no especificada';
    
    const languages = talent.languages ? talent.languages.join(', ') : 'No especificado';
    const homeStudio = talent.homeStudio === 'si' ? 'Sí' : 'No';
    
    let demosHtml = '';
    if (talent.demos && talent.demos.length > 0) {
        demosHtml = talent.demos.map(demo => `
            <div class="demo-item">
                <p><strong>${demo.name || 'Demo'}</strong></p>
                <audio controls src="${demo.url}"></audio>
            </div>
        `).join('');
    } else {
        demosHtml = '<p>No hay demos disponibles.</p>';
    }
    
    const modalHtml = `
        <div class="modal fade" id="talentModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Perfil de ${talent.name || 'Talento'}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="talent-profile-header">
                            <img src="${talent.profilePictureUrl || './img/default-avatar.png'}" 
                                 alt="${talent.name}" 
                                 class="profile-picture-large"
                                 onerror="this.src='./img/default-avatar.png'">
                            <div class="talent-basic-info">
                                <h4>${talent.name || 'Talento'}</h4>
                                <p class="text-muted">${location}</p>
                            </div>
                        </div>
                        
                        <div class="profile-details">
                            <div class="row">
                                <div class="col-md-6">
                                    <p><strong>Email:</strong> ${talent.email || 'No especificado'}</p>
                                    <p><strong>Teléfono:</strong> ${talent.phone || 'No especificado'}</p>
                                    <p><strong>Género:</strong> ${talent.gender || 'No especificado'}</p>
                                    <p><strong>Edad Real:</strong> ${talent.realAge || 'No especificado'}</p>
                                </div>
                                <div class="col-md-6">
                                    <p><strong>Rango de Edad:</strong> ${talent.ageRange || 'No especificado'}</p>
                                    <p><strong>Nacionalidad:</strong> ${talent.nationality || 'No especificado'}</p>
                                    <p><strong>Idiomas:</strong> ${languages}</p>
                                    <p><strong>Home Studio:</strong> ${homeStudio}</p>
                                </div>
                            </div>
                            
                            <div class="bio-section">
                                <h5>Biografía</h5>
                                <p>${talent.bio || 'No hay biografía disponible.'}</p>
                            </div>
                            
                            <div class="demos-section">
                                <h5>Demos de Voz</h5>
                                ${demosHtml}
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                        <button type="button" class="btn btn-primary" onclick="contactTalent('${talent.id}')">Contactar</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    const existingModal = document.getElementById('talentModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    const modal = new bootstrap.Modal(document.getElementById('talentModal'));
    modal.show();
}

// Ver detalles de trabajo
async function viewJobDetails(jobId) {
    console.log('Viendo detalles de trabajo:', jobId);
    
    try {
        const jobDoc = await db.collection('jobs').doc(jobId).get();
        if (!jobDoc.exists) {
            alert('Trabajo no encontrado');
            return;
        }
        
        const job = jobDoc.data();
        showJobModal(job);
    } catch (error) {
        console.error('Error cargando detalles del trabajo:', error);
        alert('Error al cargar los detalles del trabajo');
    }
}

// Mostrar modal de trabajo
function showJobModal(job) {
    const budget = job.budget ? `$${job.budget}` : 'A convenir';
    const deadline = job.deadline ? new Date(job.deadline).toLocaleDateString() : 'No especificada';
    const languages = job.languages ? job.languages.join(', ') : 'No especificado';
    
    const modalHtml = `
        <div class="modal fade" id="jobModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${job.title || 'Oferta de Trabajo'}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="job-header-info">
                            <p><strong>Cliente:</strong> ${job.clientName || 'Cliente'}</p>
                            <p><strong>Presupuesto:</strong> ${budget}</p>
                            <p><strong>Fecha límite:</strong> ${deadline}</p>
                        </div>
                        
                        <div class="job-details">
                            <h6>Descripción del Proyecto</h6>
                            <p>${job.description || 'Sin descripción detallada.'}</p>
                            
                            <div class="row mt-3">
                                <div class="col-md-6">
                                    <h6>Requisitos</h6>
                                    <p><strong>Género:</strong> ${job.gender || 'No especificado'}</p>
                                    <p><strong>Rango de Edad:</strong> ${job.ageRange || 'No especificado'}</p>
                                    <p><strong>Idiomas:</strong> ${languages}</p>
                                </div>
                                <div class="col-md-6">
                                    <h6>Especificaciones Técnicas</h6>
                                    <p><strong>Home Studio Requerido:</strong> ${job.requiresHomeStudio ? 'Sí' : 'No'}</p>
                                    <p><strong>Formato de Audio:</strong> ${job.audioFormat || 'No especificado'}</p>
                                    <p><strong>Duración Estimada:</strong> ${job.estimatedDuration || 'No especificado'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                        <button type="button" class="btn btn-success" onclick="applyToJob('${job.id}')">Postularme</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    const existingModal = document.getElementById('jobModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    const modal = new bootstrap.Modal(document.getElementById('jobModal'));
    modal.show();
}

// Aplicar a trabajo
function applyToJob(jobId) {
    if (!currentUser || currentUserData.type !== 'talent') {
        alert('Debes ser un talento registrado para postularte a trabajos.');
        return;
    }
    
    alert(`Funcionalidad de postulación en desarrollo. Trabajo ID: ${jobId}`);
}

// Contactar talento
function contactTalent(talentId) {
    if (!currentUser || currentUserData.type !== 'client') {
        alert('Debes ser un cliente registrado para contactar talentos.');
        return;
    }
    
    alert(`Funcionalidad de contacto en desarrollo. Talento ID: ${talentId}`);
}

// Cerrar sesión
function logout() {
    console.log('Cerrando sesión...');
    
    auth.signOut().then(() => {
        console.log('Sesión cerrada correctamente');
        currentUser = null;
        currentUserData = null;
        window.location.href = 'index.html';
    }).catch((error) => {
        console.error('Error cerrando sesión:', error);
        alert('Error al cerrar sesión: ' + error.message);
    });
}

// Manejar login
async function handleLogin(e) {
    e.preventDefault();
    console.log('Manejando login...');
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const messageDiv = document.getElementById('loginMessage');
    
    if (!email || !password) {
        showMessage(messageDiv, '❌ Por favor, completa todos los campos.', 'error');
        return;
    }
    
    showMessage(messageDiv, '⌛ Iniciando sesión...', 'info');
    
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        console.log('Login exitoso:', userCredential.user.uid);
        showMessage(messageDiv, '✅ Sesión iniciada correctamente.', 'success');
        
        setTimeout(() => {
            window.location.href = 'profile.html';
        }, 1000);
    } catch (error) {
        console.error('Error en login:', error);
        let errorMessage = 'Error al iniciar sesión. ';
        
        switch (error.code) {
            case 'auth/user-not-found':
                errorMessage += 'Usuario no encontrado.';
                break;
            case 'auth/wrong-password':
                errorMessage += 'Contraseña incorrecta.';
                break;
            case 'auth/invalid-email':
                errorMessage += 'Email inválido.';
                break;
            default:
                errorMessage += error.message;
        }
        
        showMessage(messageDiv, '❌ ' + errorMessage, 'error');
    }
}

// Manejar registro
async function handleRegister(e) {
    e.preventDefault();
    console.log('Manejando registro...');
    
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const userType = document.getElementById('registerUserType').value;
    const messageDiv = document.getElementById('registerMessage');
    
    if (!name || !email || !password || !userType) {
        showMessage(messageDiv, '❌ Por favor, completa todos los campos.', 'error');
        return;
    }
    
    if (password.length < 6) {
        showMessage(messageDiv, '❌ La contraseña debe tener al menos 6 caracteres.', 'error');
        return;
    }
    
    showMessage(messageDiv, '⌛ Creando cuenta...', 'info');
    
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        console.log('Usuario creado en Auth:', user.uid);
        
        const userData = {
            name: name,
            email: email,
            type: userType,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            profilePictureUrl: userType === 'talent' ? './img/default-avatar.png' : './img/default-avatar-client.png'
        };
        
        if (userType === 'talent') {
            await db.collection('talents').doc(user.uid).set(userData);
            console.log('Perfil de talento creado');
        } else if (userType === 'client') {
            await db.collection('clients').doc(user.uid).set(userData);
            console.log('Perfil de cliente creado');
        }
        
        showMessage(messageDiv, '✅ Cuenta creada correctamente. Redirigiendo...', 'success');
        
        setTimeout(() => {
            window.location.href = 'profile.html';
        }, 1500);
    } catch (error) {
        console.error('Error en registro:', error);
        let errorMessage = 'Error al crear la cuenta. ';
        
        switch (error.code) {
            case 'auth/email-already-in-use':
                errorMessage += 'El email ya está en uso.';
                break;
            case 'auth/weak-password':
                errorMessage += 'La contraseña es demasiado débil.';
                break;
            case 'auth/invalid-email':
                errorMessage += 'Email inválido.';
                break;
            default:
                errorMessage += error.message;
        }
        
        showMessage(messageDiv, '❌ ' + errorMessage, 'error');
    }
}

// Función auxiliar para mostrar mensajes
function showMessage(element, message, type) {
    if (!element) return;
    
    element.textContent = message;
    element.className = 'alert ' + (type === 'error' ? 'alert-danger' : 
                                  type === 'success' ? 'alert-success' : 'alert-info');
    element.style.display = 'block';
    
    if (type !== 'error') {
        setTimeout(() => {
            element.style.display = 'none';
        }, 5000);
    }
}

// Funciones auxiliares para ubicación
function getCountryName(countryCode) {
    const countries = {
        'AR': 'Argentina',
        'BR': 'Brasil',
        'CL': 'Chile',
        'CO': 'Colombia',
        'MX': 'México',
        'PE': 'Perú',
        'ES': 'España',
        'US': 'Estados Unidos'
    };
    return countries[countryCode] || countryCode;
}

function getStateName(countryCode, stateCode) {
    return stateCode;
}

// Configurar event listeners
function setupEventListeners() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
}

// =============================================
// FUNCIONES PARA CREAR TRABAJOS - NUEVAS
// =============================================

// Funciones para crear trabajos
function showCreateJobModal() {
    console.log('Mostrando modal de creación de trabajo');
    
    if (!currentUser || currentUserData.type !== 'client') {
        alert('Solo los clientes pueden crear ofertas de trabajo.');
        return;
    }
    
    const modal = document.getElementById('createJobModal');
    if (modal) {
        modal.style.display = 'flex';
        
        // Limpiar formulario
        const form = document.getElementById('createJobForm');
        if (form) form.reset();
        
        // Limpiar mensajes
        const messageDiv = document.getElementById('createJobMessage');
        if (messageDiv) {
            messageDiv.style.display = 'none';
            messageDiv.textContent = '';
        }
    }
}

function closeCreateJobModal() {
    const modal = document.getElementById('createJobModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Función para crear trabajo (submit del formulario)
async function createJob(e) {
    if (e) e.preventDefault();
    console.log('Creando nuevo trabajo...');
    
    const messageDiv = document.getElementById('createJobMessage');
    
    if (!currentUser || currentUserData.type !== 'client') {
        showMessage(messageDiv, '❌ Solo los clientes pueden crear trabajos.', 'error');
        return;
    }
    
    // Obtener datos del formulario
    const title = document.getElementById('jobTitle')?.value;
    const description = document.getElementById('jobDescription')?.value;
    const budget = document.getElementById('jobBudget')?.value;
    const deadline = document.getElementById('jobDeadline')?.value;
    const gender = document.getElementById('jobGender')?.value;
    const ageRange = document.getElementById('jobAgeRange')?.value;
    
    // Obtener idiomas seleccionados
    const languages = [];
    for (let i = 1; i <= 5; i++) {
        const checkbox = document.getElementById('jobLang' + i);
        if (checkbox && checkbox.checked) {
            languages.push(checkbox.value);
        }
    }
    
    // Validaciones básicas
    if (!title || !description) {
        showMessage(messageDiv, '❌ Título y descripción son obligatorios.', 'error');
        return;
    }
    
    if (languages.length === 0) {
        showMessage(messageDiv, '❌ Selecciona al menos un idioma.', 'error');
        return;
    }
    
    showMessage(messageDiv, '⌛ Creando oferta de trabajo...', 'info');
    
    try {
        const jobData = {
            title: title,
            description: description,
            budget: budget ? parseFloat(budget) : 0,
            deadline: deadline,
            gender: gender || '',
            ageRange: ageRange || '',
            languages: languages,
            clientId: currentUser.uid,
            clientName: currentUserData.name || 'Cliente',
            clientEmail: currentUserData.email,
            status: 'active',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            applicants: []
        };
        
        // Guardar en Firestore
        await db.collection('jobs').add(jobData);
        
        showMessage(messageDiv, '✅ Oferta de trabajo creada exitosamente!', 'success');
        
        // Cerrar modal y recargar después de 2 segundos
        setTimeout(() => {
            closeCreateJobModal();
            
            // Recargar la lista de trabajos si estamos en esa sección
            if (typeof loadClientJobs === 'function') {
                loadClientJobs();
            }
        }, 2000);
        
    } catch (error) {
        console.error('Error creando trabajo:', error);
        showMessage(messageDiv, '❌ Error al crear el trabajo: ' + error.message, 'error');
    }
}

// Función para cargar trabajos del cliente
async function loadClientJobs() {
    console.log('Cargando trabajos del cliente...');
    
    const jobsList = document.getElementById('jobsList');
    if (!jobsList) return;
    
    if (!currentUser || currentUserData.type !== 'client') {
        jobsList.innerHTML = '<p>Solo los clientes pueden ver esta sección.</p>';
        return;
    }
    
    try {
        jobsList.innerHTML = '<p>Cargando trabajos...</p>';
        
        const jobsSnapshot = await db.collection('jobs')
            .where('clientId', '==', currentUser.uid)
            .orderBy('createdAt', 'desc')
            .get();
        
        const jobs = [];
        jobsSnapshot.forEach(doc => {
            const job = doc.data();
            job.id = doc.id;
            jobs.push(job);
        });
        
        console.log('Trabajos del cliente cargados:', jobs.length);
        
        if (jobs.length === 0) {
            jobsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-briefcase fa-3x text-muted mb-3"></i>
                    <h3>No hay ofertas de trabajo</h3>
                    <p>Crea tu primera oferta para encontrar talentos</p>
                    <button class="btn btn-primary" onclick="showCreateJobModal()">
                        <i class="fas fa-plus"></i> Crear Primera Oferta
                    </button>
                </div>
            `;
            return;
        }
        
        let jobsHtml = '';
        jobs.forEach(job => {
            const budget = job.budget ? `$${job.budget}` : 'A convenir';
            const deadline = job.deadline ? new Date(job.deadline).toLocaleDateString() : 'Sin fecha límite';
            const status = job.status === 'active' ? 'Activa' : 'Inactiva';
            const statusClass = job.status === 'active' ? 'status-active' : 'status-inactive';
            
            jobsHtml += `
                <div class="job-item">
                    <div class="job-item-header">
                        <h4>${job.title}</h4>
                        <span class="job-budget">${budget}</span>
                    </div>
                    <div class="job-item-details">
                        <p class="job-description">${job.description}</p>
                        <div class="job-meta">
                            <span class="job-deadline"><i class="fas fa-calendar"></i> ${deadline}</span>
                            <span class="job-status ${statusClass}"><i class="fas fa-circle"></i> ${status}</span>
                            <span class="job-applicants"><i class="fas fa-users"></i> ${job.applicants?.length || 0} postulantes</span>
                        </div>
                        <div class="job-tags">
                            ${job.languages?.map(lang => `<span class="tag">${lang}</span>`).join('') || ''}
                        </div>
                    </div>
                    <div class="job-item-actions">
                        <button class="btn btn-outline btn-sm" onclick="viewJobApplications('${job.id}')">
                            <i class="fas fa-eye"></i> Ver Postulantes
                        </button>
                        <button class="btn btn-outline btn-sm" onclick="editJob('${job.id}')">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                    </div>
                </div>
            `;
        });
        
        jobsList.innerHTML = jobsHtml;
        
    } catch (error) {
        console.error('Error cargando trabajos del cliente:', error);
        jobsList.innerHTML = '<p class="text-danger">Error al cargar los trabajos.</p>';
    }
}

// Funciones placeholder para otras funcionalidades
function viewJobApplications(jobId) {
    alert(`Funcionalidad en desarrollo - Ver postulantes del trabajo: ${jobId}`);
}

function editJob(jobId) {
    alert(`Funcionalidad en desarrollo - Editar trabajo: ${jobId}`);
}

function loadTalentApplications() {
    const applicationsList = document.getElementById('applicationsList');
    if (applicationsList) {
        applicationsList.innerHTML = '<p>Funcionalidad en desarrollo. Aquí se mostrarán tus postulaciones.</p>';
    }
}

function loadUserNotifications() {
    const notificationsList = document.getElementById('notificationsList');
    if (notificationsList) {
        notificationsList.innerHTML = '<p>Funcionalidad en desarrollo. Aquí se mostrarán tus notificaciones.</p>';
    }
}

// =============================================
// INICIALIZACIÓN
// =============================================

// Inicialización cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
    console.log('VoiceBook inicializando...');
    
    setupEventListeners();
    
    setTimeout(() => {
        checkAuthState();
    }, 100);
    
    console.log('VoiceBook inicializado correctamente');
});

// Hacer funciones globales
window.showSection = showSection;
window.viewTalentProfile = viewTalentProfile;
window.viewJobDetails = viewJobDetails;
window.applyToJob = applyToJob;
window.contactTalent = contactTalent;
window.logout = logout;
window.checkAuthState = checkAuthState;
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.showCreateJobModal = showCreateJobModal;
window.closeCreateJobModal = closeCreateJobModal;
window.createJob = createJob;
window.loadClientJobs = loadClientJobs;
window.loadTalentApplications = loadTalentApplications;
window.loadUserNotifications = loadUserNotifications;
window.viewJobApplications = viewJobApplications;
window.editJob = editJob;
