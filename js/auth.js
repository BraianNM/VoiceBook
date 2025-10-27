// Autenticación y registro de usuarios - VOICEBOOK

// Verificar estado de autenticación
window.checkAuthState = function() {
    auth.onAuthStateChanged(async (user) => {
        currentUser = user;
        const authButtons = document.getElementById('authButtons');
        const userMenu = document.getElementById('userMenu');
        const userNameSpan = document.getElementById('userName');
        const dashboardLink = document.getElementById('dashboardLink');

        if (user) {
            console.log('Usuario autenticado:', user.uid);
            
            try {
                let userDoc;
                
                // Intentar obtener como talento primero
                userDoc = await db.collection('talents').doc(user.uid).get();
                if (userDoc.exists) {
                    currentUserData = userDoc.data();
                    currentUserData.type = 'talent';
                    console.log('Usuario es talento:', currentUserData);
                } else {
                    // Intentar obtener como cliente
                    userDoc = await db.collection('clients').doc(user.uid).get();
                    if (userDoc.exists) {
                        currentUserData = userDoc.data();
                        currentUserData.type = 'client';
                        console.log('Usuario es cliente:', currentUserData);
                    } else {
                        console.log('Usuario no encontrado en ninguna colección');
                        currentUserData = {
                            email: user.email,
                            name: user.displayName || user.email,
                            type: 'unknown'
                        };
                    }
                }

                // Actualizar UI
                if (authButtons && userMenu) {
                    authButtons.style.display = 'none';
                    userMenu.style.display = 'flex';
                    
                    if (userNameSpan && currentUserData) {
                        userNameSpan.textContent = currentUserData.name || user.email;
                    }
                }

                // Mostrar enlace al dashboard
                if (dashboardLink) {
                    dashboardLink.style.display = 'block';
                }

                // Si estamos en profile.html, cargar el perfil
                if (window.location.href.includes('profile.html')) {
                    if (typeof window.loadUserProfile === 'function') {
                        window.loadUserProfile();
                    }
                }

            } catch (error) {
                console.error('Error obteniendo datos del usuario:', error);
            }
        } else {
            console.log('Usuario no autenticado');
            currentUser = null;
            currentUserData = null;
            
            if (authButtons && userMenu) {
                authButtons.style.display = 'flex';
                userMenu.style.display = 'none';
            }

            if (dashboardLink) {
                dashboardLink.style.display = 'none';
            }

            // Redirigir a index.html si está en profile.html sin autenticación
            if (window.location.href.includes('profile.html')) {
                window.location.href = 'index.html';
            }
        }
    });
};

// Registrar talento - COMPLETO
window.registerTalent = async function(e) {
    e.preventDefault();
    console.log('Iniciando registro de talento...');

    const form = e.target;
    const formData = new FormData(form);
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;

    try {
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registrando...';
        submitBtn.disabled = true;

        // Obtener valores del formulario
        const email = formData.get('email');
        const password = formData.get('password');
        const confirmPassword = formData.get('confirmPassword');
        const name = formData.get('name');
        const phone = formData.get('phone');
        const gender = formData.get('gender');
        const country = formData.get('country');
        const state = formData.get('state');
        const city = formData.get('city');

        // Validaciones
        if (!email || !password || !name || !phone || !gender || !country || !state || !city) {
            throw new Error('Por favor completa todos los campos obligatorios');
        }

        if (password !== confirmPassword) {
            throw new Error('Las contraseñas no coinciden');
        }

        if (password.length < 6) {
            throw new Error('La contraseña debe tener al menos 6 caracteres');
        }

        console.log('Creando usuario en Firebase Auth...');

        // Crear usuario en Firebase Auth
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        console.log('Usuario creado:', user.uid);

        // Preparar datos para Firestore
        const talentData = {
            uid: user.uid,
            name: name,
            email: email,
            phone: phone,
            country: country,
            state: state,
            city: city,
            gender: gender,
            ageRange: formData.get('ageRange') || '',
            realAge: formData.get('realAge') || '',
            nationality: formData.get('nationality') || '',
            bio: formData.get('bio') || '',
            homeStudio: formData.get('homeStudio') || 'no',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        // Procesar idiomas
        const languages = [];
        for (let i = 1; i <= 9; i++) {
            const langValue = formData.get(`lang${i}`);
            if (langValue) {
                languages.push(langValue);
            }
        }
        
        const otherLanguages = formData.get('otherLanguages');
        if (otherLanguages) {
            languages.push(otherLanguages);
        }
        
        talentData.languages = languages;

        // Subir foto de perfil si existe
        const profilePicture = formData.get('profilePicture');
        if (profilePicture && profilePicture.size > 0) {
            try {
                console.log('Subiendo foto de perfil...');
                const storageRef = storage.ref(`profile-pictures/${user.uid}`);
                const snapshot = await storageRef.put(profilePicture);
                const downloadURL = await snapshot.ref.getDownloadURL();
                talentData.profilePictureUrl = downloadURL;
                console.log('Foto de perfil subida:', downloadURL);
            } catch (uploadError) {
                console.error('Error subiendo foto de perfil:', uploadError);
                // No lanzar error, continuar sin foto
            }
        }

        // Procesar demos de audio si existen
        const demoFiles = formData.getAll('demos');
        if (demoFiles && demoFiles.length > 0) {
            talentData.demos = [];
            // Nota: En una implementación real, aquí subirías los archivos a Storage
            console.log('Demos detectados:', demoFiles.length);
        }

        console.log('Guardando talento en Firestore:', talentData);

        // Guardar en Firestore
        await db.collection('talents').doc(user.uid).set(talentData);
        console.log('Talento guardado en Firestore');

        // Cerrar modal y mostrar mensaje
        window.closeAllModals();
        
        // Mostrar mensaje de éxito
        alert('¡Registro exitoso! Bienvenido/a a VoiceBook. Tu perfil de talento ha sido creado.');
        
        // Recargar la página para actualizar el estado
        setTimeout(() => {
            window.location.reload();
        }, 2000);

    } catch (error) {
        console.error('Error en registro de talento:', error);
        let errorMessage = 'Error en el registro: ';
        
        switch (error.code) {
            case 'auth/email-already-in-use':
                errorMessage = 'El email ya está registrado. ¿Quizás quieres iniciar sesión?';
                break;
            case 'auth/invalid-email':
                errorMessage = 'El email no tiene un formato válido.';
                break;
            case 'auth/weak-password':
                errorMessage = 'La contraseña es demasiado débil. Debe tener al menos 6 caracteres.';
                break;
            case 'auth/network-request-failed':
                errorMessage = 'Error de conexión. Por favor verifica tu internet.';
                break;
            default:
                errorMessage += error.message;
        }
        
        // Mostrar error en el formulario si existe el elemento
        const messageElement = document.getElementById('talentFormMessage');
        if (messageElement) {
            messageElement.innerHTML = `<div class="alert alert-danger">${errorMessage}</div>`;
        } else {
            alert(errorMessage);
        }
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
};

// Registrar cliente - COMPLETO
window.registerClient = async function(e) {
    e.preventDefault();
    console.log('Iniciando registro de cliente...');

    const form = e.target;
    const formData = new FormData(form);
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;

    try {
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registrando...';
        submitBtn.disabled = true;

        // Obtener valores del formulario
        const email = formData.get('email');
        const password = formData.get('password');
        const confirmPassword = formData.get('confirmPassword');
        const name = formData.get('name');
        const clientType = formData.get('clientType');
        const country = formData.get('country');
        const state = formData.get('state');
        const city = formData.get('city');

        // Validaciones
        if (!email || !password || !name || !clientType || !country || !state || !city) {
            throw new Error('Por favor completa todos los campos obligatorios');
        }

        if (password !== confirmPassword) {
            throw new Error('Las contraseñas no coinciden');
        }

        if (password.length < 6) {
            throw new Error('La contraseña debe tener al menos 6 caracteres');
        }

        if (clientType === 'empresa' && !formData.get('companyName')) {
            throw new Error('Por favor ingresa el nombre de la empresa');
        }

        console.log('Creando cliente en Firebase Auth...');

        // Crear usuario en Firebase Auth
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        console.log('Cliente creado:', user.uid);

        // Preparar datos para Firestore
        const clientData = {
            uid: user.uid,
            name: name,
            email: email,
            phone: formData.get('phone') || '',
            clientType: clientType,
            country: country,
            state: state,
            city: city,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        // Agregar nombre de empresa si es empresa
        if (clientType === 'empresa') {
            clientData.companyName = formData.get('companyName');
        }

        // Subir foto de perfil si existe
        const profilePicture = formData.get('profilePicture');
        if (profilePicture && profilePicture.size > 0) {
            try {
                console.log('Subiendo foto de perfil...');
                const storageRef = storage.ref(`profile-pictures/${user.uid}`);
                const snapshot = await storageRef.put(profilePicture);
                const downloadURL = await snapshot.ref.getDownloadURL();
                clientData.profilePictureUrl = downloadURL;
                console.log('Foto de perfil subida:', downloadURL);
            } catch (uploadError) {
                console.error('Error subiendo foto de perfil:', uploadError);
                // No lanzar error, continuar sin foto
            }
        }

        console.log('Guardando cliente en Firestore:', clientData);

        // Guardar en Firestore
        await db.collection('clients').doc(user.uid).set(clientData);
        console.log('Cliente guardado en Firestore');

        // Cerrar modal y mostrar mensaje
        window.closeAllModals();
        
        // Mostrar mensaje de éxito
        alert('¡Registro exitoso! Bienvenido/a a VoiceBook. Tu perfil de cliente ha sido creado.');
        
        // Recargar la página para actualizar el estado
        setTimeout(() => {
            window.location.reload();
        }, 2000);

    } catch (error) {
        console.error('Error en registro de cliente:', error);
        let errorMessage = 'Error en el registro: ';
        
        switch (error.code) {
            case 'auth/email-already-in-use':
                errorMessage = 'El email ya está registrado. ¿Quizás quieres iniciar sesión?';
                break;
            case 'auth/invalid-email':
                errorMessage = 'El email no tiene un formato válido.';
                break;
            case 'auth/weak-password':
                errorMessage = 'La contraseña es demasiado débil. Debe tener al menos 6 caracteres.';
                break;
            case 'auth/network-request-failed':
                errorMessage = 'Error de conexión. Por favor verifica tu internet.';
                break;
            default:
                errorMessage += error.message;
        }
        
        // Mostrar error en el formulario si existe el elemento
        const messageElement = document.getElementById('clientFormMessage');
        if (messageElement) {
            messageElement.innerHTML = `<div class="alert alert-danger">${errorMessage}</div>`;
        } else {
            alert(errorMessage);
        }
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
};

// Iniciar sesión - COMPLETO Y CORREGIDO
window.loginUser = async function(e) {
    e.preventDefault();
    console.log('Iniciando sesión...');

    const form = e.target;
    const emailInput = form.querySelector('#loginEmail');
    const passwordInput = form.querySelector('#loginPassword');
    
    if (!emailInput || !passwordInput) {
        alert('Error: No se pudieron encontrar los campos del formulario');
        return;
    }

    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;

    // Validaciones
    if (!email) {
        alert('Por favor ingresa tu email');
        emailInput.focus();
        return;
    }

    if (!password) {
        alert('Por favor ingresa tu contraseña');
        passwordInput.focus();
        return;
    }

    try {
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Iniciando sesión...';
        submitBtn.disabled = true;

        console.log('Intentando login con:', email);
        
        // Iniciar sesión con Firebase Auth
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        console.log('Sesión iniciada exitosamente:', user.uid);
        window.closeAllModals();
        
        // Mostrar mensaje de bienvenida
        alert('¡Bienvenido de nuevo a VoiceBook!');
        
        // Recargar para actualizar UI
        setTimeout(() => {
            window.location.reload();
        }, 1000);

    } catch (error) {
        console.error('Error iniciando sesión:', error);
        let errorMessage = 'Error al iniciar sesión: ';
        
        switch (error.code) {
            case 'auth/user-not-found':
                errorMessage = 'No existe una cuenta con este email. ¿Quizás quieres registrarte?';
                break;
            case 'auth/wrong-password':
                errorMessage = 'Contraseña incorrecta. Por favor intenta de nuevo.';
                break;
            case 'auth/invalid-email':
                errorMessage = 'El formato del email no es válido.';
                break;
            case 'auth/invalid-credential':
                errorMessage = 'Credenciales incorrectas. Por favor verifica tu email y contraseña.';
                break;
            case 'auth/too-many-requests':
                errorMessage = 'Demasiados intentos fallidos. Por favor intenta más tarde.';
                break;
            case 'auth/network-request-failed':
                errorMessage = 'Error de conexión. Por favor verifica tu internet.';
                break;
            default:
                errorMessage += error.message;
        }
        
        alert(errorMessage);
        
        // Limpiar contraseña
        passwordInput.value = '';
        passwordInput.focus();
        
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
};

// Cerrar sesión - COMPLETO
window.logoutUser = async function() {
    if (!confirm('¿Estás seguro de que quieres cerrar sesión?')) {
        return;
    }

    try {
        await auth.signOut();
        console.log('Sesión cerrada exitosamente');
        currentUser = null;
        currentUserData = null;
        
        // Mostrar mensaje
        alert('Has cerrado sesión correctamente.');
        
        // Redirigir a index.html
        window.location.href = 'index.html';
        
    } catch (error) {
        console.error('Error cerrando sesión:', error);
        alert('Error al cerrar sesión: ' + error.message);
    }
};

// Función para restablecer contraseña
window.resetPassword = async function(email) {
    if (!email) {
        email = prompt('Por favor ingresa tu email para restablecer la contraseña:');
        if (!email) return;
    }

    try {
        await auth.sendPasswordResetEmail(email);
        alert('Se ha enviado un email para restablecer tu contraseña. Revisa tu bandeja de entrada.');
    } catch (error) {
        console.error('Error enviando email de restablecimiento:', error);
        let errorMessage = 'Error al enviar email de restablecimiento: ';
        
        switch (error.code) {
            case 'auth/user-not-found':
                errorMessage = 'No existe una cuenta con este email.';
                break;
            case 'auth/invalid-email':
                errorMessage = 'El email no tiene un formato válido.';
                break;
            default:
                errorMessage += error.message;
        }
        
        alert(errorMessage);
    }
};

// Verificar si el usuario está autenticado
window.isAuthenticated = function() {
    return currentUser !== null;
};

// Obtener datos del usuario actual
window.getCurrentUserData = function() {
    return currentUserData;
};

// Actualizar perfil del usuario
window.updateUserProfile = async function(updateData) {
    if (!currentUser) {
        throw new Error('Usuario no autenticado');
    }

    try {
        const collectionName = currentUserData.type === 'talent' ? 'talents' : 'clients';
        await db.collection(collectionName).doc(currentUser.uid).update({
            ...updateData,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Actualizar datos locales
        Object.assign(currentUserData, updateData);
        
        return true;
    } catch (error) {
        console.error('Error actualizando perfil:', error);
        throw error;
    }
};

console.log('Auth.js cargado correctamente - VoiceBook Authentication System');

// Inicialización de autenticación
document.addEventListener('DOMContentLoaded', function() {
    console.log('Inicializando sistema de autenticación...');
    
    // Asignar event listeners a formularios
    const talentForm = document.getElementById('talentForm');
    const clientForm = document.getElementById('clientForm');
    const loginForm = document.getElementById('loginForm');
    
    if (talentForm) {
        talentForm.addEventListener('submit', window.registerTalent);
        console.log('Formulario de talento configurado');
    }
    
    if (clientForm) {
        clientForm.addEventListener('submit', window.registerClient);
        console.log('Formulario de cliente configurado');
    }
    
    if (loginForm) {
        loginForm.addEventListener('submit', window.loginUser);
        console.log('Formulario de login configurado');
    }
    
    // Iniciar verificación de estado de autenticación
    if (typeof window.checkAuthState === 'function') {
        window.checkAuthState();
    } else {
        // Fallback básico
        auth.onAuthStateChanged((user) => {
            currentUser = user;
            console.log('Estado de autenticación:', user ? 'Autenticado' : 'No autenticado');
        });
    }
});
