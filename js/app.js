// Funciones principales de la aplicación

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    checkAuthState();
    loadTalents();
    loadJobOffers();
});

// Configurar event listeners
function setupEventListeners() {
    // Abrir modales
    document.getElementById('heroTalentBtn').addEventListener('click', () => document.getElementById('talentModal').style.display = 'flex');
    document.getElementById('heroClientBtn').addEventListener('click', () => document.getElementById('clientModal').style.display = 'flex');
    document.getElementById('registerBtn').addEventListener('click', () => document.getElementById('talentModal').style.display = 'flex');
    document.getElementById('loginBtn').addEventListener('click', () => document.getElementById('loginModal').style.display = 'flex');
    document.getElementById('dashboardLink').addEventListener('click', showDashboard);
    document.getElementById('logoutBtn').addEventListener('click', logoutUser);

    // Cerrar modales
    document.querySelectorAll('.close-modal').forEach(button => {
        button.addEventListener('click', closeAllModals);
    });

    // Formularios
    document.getElementById('talentForm').addEventListener('submit', registerTalent);
    document.getElementById('clientForm').addEventListener('submit', registerClient);
    document.getElementById('loginForm').addEventListener('submit', loginUser);

    // Otros controles
    document.getElementById('clientType').addEventListener('change', toggleCompanyName);
    document.getElementById('lang10').addEventListener('change', toggleOtherLanguages);
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

// Mostrar tarjeta de talento
function displayTalentCard(talent, talentId) {
    const talentsContainer = document.getElementById('talentsContainer');
    const talentCard = document.createElement('div');
    talentCard.className = 'talent-card';
    
    talentCard.innerHTML = `
        <div class="talent-img" style="background-color: #3498db; display: flex; align-items: center; justify-content: center; color: white; font-size: 48px;">
            <i class="fas fa-user"></i>
        </div>
        <div class="talent-info">
            <h3 class="talent-name">${talent.name}</h3>
            <p class="talent-details">${talent.gender === 'hombre' ? 'Hombre' : 'Mujer'} • ${talent.nationality || 'Nacionalidad no especificada'}</p>
            <p class="talent-details">${Array.isArray(talent.languages) ? talent.languages.join(', ') : talent.languages}</p>
            <p class="talent-details">Home Studio: ${talent.homeStudio === 'si' ? 'Sí' : 'No'}</p>
            <p>${talent.description ? talent.description.substring(0, 100) + '...' : 'Sin descripción'}</p>
            <div style="margin-top: 15px;">
                <button class="btn btn-primary" onclick="viewTalentProfile('${talentId}')">Ver Perfil</button>
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

// Funciones globales para usar en onclick
window.viewTalentProfile = function(talentId) {
    alert('Función de ver perfil - Próximamente');
};

window.addToFavorites = function(talentId) {
    alert('Función de favoritos - Próximamente');
};

window.applyToJob = function(jobId) {
    alert('Función de postulación - Próximamente');
};

window.showDashboard = function() {
    alert('Panel de control - Próximamente');
};

window.loadUserProfile = function(userId) {
    // Cargar perfil del usuario - Próximamente
};
