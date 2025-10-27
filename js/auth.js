// Autenticación y registro de usuarios

// Verificar estado de autenticación
window.checkAuthState = function() {
    auth.onAuthStateChanged(async (user) => {
        currentUser = user;
        const authButtons = document.getElementById('authButtons');
        const userMenu = document.getElementById('userMenu');
        const userNameSpan = document.getElementById('userName');

        if (user) {
            console.log('Usuario autenticado:', user.uid);
            
            try {
                let userDoc;
                
                // Intentar obtener como talento primero
                userDoc = await db.collection('talents').doc(user.uid).get();
                if (userDoc.exists) {
                    currentUserData = userDoc.data();
                    currentUserData.type = 'talent';
                } else {
                    // Intentar obtener como cliente
                    userDoc = await db.collection('clients').doc(user.uid).get();
                    if (userDoc.exists) {
                        currentUserData = userDoc.data();
                        currentUserData.type = 'client';
                    } else {
                        console.log('Usuario no encontrado en ninguna colección');
                        currentUserData = null;
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

            // Redirigir a index.html si está en profile.html sin autenticación
            if (window.location.href.includes('profile.html')) {
                window.location.href = 'index.html';
            }
        }
    });
};

// Registrar talento
async function registerTalent(e) {
    e.preventDefault();
    console.log('Iniciando registro de talento...');

    const formData = new FormData(e.target);
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;

    try {
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registrando...';
        submitBtn.disabled = true;

        // Validar contraseña
        const password = formData.get('password');
        const confirmPassword = formData.get('confirmPassword');
        
        if (password !== confirmPassword) {
            throw new Error('Las contraseñas no coinciden');
        }

        if (password.length < 6) {
            throw new Error('La contraseña debe tener al menos 6 caracteres');
        }

        // Crear usuario en Firebase Auth
        const userCredential = await auth.createUserWithEmailAndPassword(
            formData.get('email'), 
            password
        );
        
        const user = userCredential.user;
        console.log('Usuario creado:', user.uid);

        // Preparar datos para Firestore
        const talentData = {
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            country: formData.get('country'),
            state: formData.get('state'),
            city: formData.get('city'),
            gender: formData.get('gender'),
            ageRange: formData.get('ageRange'),
            realAge: formData.get('realAge'),
            nationality: formData.get('nationality'),
            bio: formData.get('bio'),
            homeStudio: formData.get('homeStudio'),
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        // Procesar idiomas
        const languages = [];
        for (let i = 1; i <= 10; i++) {
            if (formData.get(`lang${i}`)) {
                languages.push(formData.get(`lang${i}`));
            }
        }
        if (formData.get('otherLanguages')) {
            languages.push(formData.get('otherLanguages'));
        }
        talentData.languages = languages;

        // Subir foto de perfil si existe
        const profilePicture = formData.get('profilePicture');
        if (profilePicture && profilePicture.size > 0) {
            try {
                const storageRef = storage.ref(`profile-pictures/${user.uid}`);
                const snapshot = await storageRef.put(profilePicture);
                const downloadURL = await snapshot.ref.getDownloadURL();
                talentData.profilePictureUrl = downloadURL;
            } catch (uploadError) {
                console.error('Error subiendo foto de perfil:', uploadError);
            }
        }

        // Guardar en Firestore
        await db.collection('talents').doc(user.uid).set(talentData);
        console.log('Talento guardado en Firestore');

        // Cerrar modal y mostrar mensaje
        window.closeAllModals();
        alert('¡Registro exitoso! Bienvenido/a a VoiceBook.');
        
        // Recargar la página para actualizar el estado
        setTimeout(() => {
            window.location.reload();
        }, 2000);

    } catch (error) {
        console.error('Error en registro de talento:', error);
        let errorMessage = 'Error en el registro: ';
        
        switch (error.code) {
            case 'auth/email-already-in-use':
                errorMessage += 'El email ya está registrado.';
                break;
            case 'auth/invalid-email':
                errorMessage += 'El email no es válido.';
                break;
            case 'auth/weak-password':
                errorMessage += 'La contraseña es demasiado débil.';
                break;
            default:
                errorMessage += error.message;
        }
        
        alert(errorMessage);
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Registrar cliente
async function registerClient(e) {
    e.preventDefault();
    console.log('Iniciando registro de cliente...');

    const formData = new FormData(e.target);
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;

    try {
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registrando...';
        submitBtn.disabled = true;

        // Validar contraseña
        const password = formData.get('password');
        const confirmPassword = formData.get('confirmPassword');
        
        if (password !== confirmPassword) {
            throw new Error('Las contraseñas no coinciden');
        }

        if (password.length < 6) {
            throw new Error('La contraseña debe tener al menos 6 caracteres');
        }

        // Crear usuario en Firebase Auth
        const userCredential = await auth.createUserWithEmailAndPassword(
            formData.get('email'), 
            password
        );
        
        const user = userCredential.user;
        console.log('Cliente creado:', user.uid);

        // Preparar datos para Firestore
        const clientData = {
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            country: formData.get('country'),
            state: formData.get('state'),
            city: formData.get('city'),
            clientType: formData.get('clientType'),
            companyName: formData.get('clientType') === 'empresa' ? formData.get('companyName') : '',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        // Guardar en Firestore
        await db.collection('clients').doc(user.uid).set(clientData);
        console.log('Cliente guardado en Firestore');

        // Cerrar modal y mostrar mensaje
        window.closeAllModals();
        alert('¡Registro exitoso! Bienvenido/a a VoiceBook.');
        
        // Recargar la página para actualizar el estado
        setTimeout(() => {
            window.location.reload();
        }, 2000);

    } catch (error) {
        console.error('Error en registro de cliente:', error);
        let errorMessage = 'Error en el registro: ';
        
        switch (error.code) {
            case 'auth/email-already-in-use':
                errorMessage += 'El email ya está registrado.';
                break;
            case 'auth/invalid-email':
                errorMessage += 'El email no es válido.';
                break;
            case 'auth/weak-password':
                errorMessage += 'La contraseña es demasiado débil.';
                break;
            default:
                errorMessage += error.message;
        }
        
        alert(errorMessage);
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Iniciar sesión - CORREGIDO
async function loginUser(e) {
    e.preventDefault();
    console.log('Iniciando proceso de login...');

    const formData = new FormData(e.target);
    const email = formData.get('email');
    const password = formData.get('password');
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;

    // CORRECCIÓN: Validar que el email no esté vacío
    if (!email || email.trim() === '') {
        alert('Por favor ingresa tu email');
        return;
    }

    try {
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Iniciando sesión...';
        submitBtn.disabled = true;

        console.log('Intentando login con:', email);
        
        // Iniciar sesión con Firebase Auth
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        console.log('Login exitoso:', user.uid);

        // Cerrar modal
        window.closeAllModals();
        
        // Mostrar mensaje de éxito
        alert('¡Inicio de sesión exitoso!');
        
        // Recargar para actualizar la UI
        setTimeout(() => {
            window.location.reload();
        }, 1000);

    } catch (error) {
        console.error('Error en login:', error);
        let errorMessage = 'Error al iniciar sesión: ';
        
        switch (error.code) {
            case 'auth/user-not-found':
                errorMessage += 'No existe una cuenta con este email.';
                break;
            case 'auth/wrong-password':
                errorMessage += 'Contraseña incorrecta.';
                break;
            case 'auth/invalid-email':
                errorMessage += 'El email no es válido.';
                break;
            case 'auth/user-disabled':
                errorMessage += 'Esta cuenta ha sido deshabilitada.';
                break;
            default:
                errorMessage += error.message;
        }
        
        alert(errorMessage);
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Función para cerrar sesión
window.logoutUser = async function() {
    try {
        await auth.signOut();
        console.log('Sesión cerrada exitosamente');
        
        // Limpiar variables globales
        currentUser = null;
        currentUserData = null;
        
        // Redirigir a index.html si está en profile.html
        if (window.location.href.includes('profile.html')) {
            window.location.href = 'index.html';
        } else {
            // Recargar para actualizar la UI
            window.location.reload();
        }
        
    } catch (error) {
        console.error('Error cerrando sesión:', error);
        alert('Error al cerrar sesión: ' + error.message);
    }
};

console.log('Auth.js cargado correctamente');
