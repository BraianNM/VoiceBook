// auth.js - Manejo de autenticación (COMPLETO Y CORREGIDO)
console.log('Auth.js cargado');

// Referencias globales
const auth = firebase.auth();
const db = firebase.firestore();

// Verificar autenticación global
function checkAuthState() {
    console.log('Verificando estado de autenticación...');
    
    return new Promise((resolve) => {
        auth.onAuthStateChanged(async (user) => {
            if (user) {
                console.log('Usuario autenticado:', user.uid);
                
                // Cargar datos del usuario
                const userData = await loadUserData(user.uid);
                
                resolve({
                    user: user,
                    userData: userData
                });
            } else {
                console.log('Usuario no autenticado');
                resolve({
                    user: null,
                    userData: null
                });
            }
        });
    });
}

// Cargar datos del usuario
async function loadUserData(userId) {
    console.log('Cargando datos del usuario:', userId);
    
    try {
        // Intentar cargar como talento primero
        const talentDoc = await db.collection('talents').doc(userId).get();
        if (talentDoc.exists) {
            const data = talentDoc.data();
            data.type = 'talent';
            data.id = userId;
            console.log('Usuario cargado como talento');
            return data;
        }
        
        // Si no es talento, intentar como cliente
        const clientDoc = await db.collection('clients').doc(userId).get();
        if (clientDoc.exists) {
            const data = clientDoc.data();
            data.type = 'client';
            data.id = userId;
            console.log('Usuario cargado como cliente');
            return data;
        }
        
        console.log('Usuario no encontrado en ninguna colección');
        return null;
        
    } catch (error) {
        console.error('Error cargando datos del usuario:', error);
        return null;
    }
}

// Iniciar sesión
async function login(email, password) {
    console.log('Iniciando sesión para:', email);
    
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        console.log('Login exitoso:', userCredential.user.uid);
        
        return {
            success: true,
            user: userCredential.user
        };
        
    } catch (error) {
        console.error('Error en login:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Registrar usuario
async function register(userData) {
    console.log('Registrando usuario:', userData.email);
    
    try {
        // Crear usuario en Auth
        const userCredential = await auth.createUserWithEmailAndPassword(
            userData.email, 
            userData.password
        );
        const user = userCredential.user;
        
        console.log('Usuario creado en Auth:', user.uid);
        
        // Preparar datos para Firestore
        const profileData = {
            name: userData.name,
            email: userData.email,
            type: userData.type,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            profilePictureUrl: userData.type === 'talent' ? 
                './img/default-avatar.png' : './img/default-avatar-client.png'
        };
        
        // Crear perfil en Firestore según el tipo
        if (userData.type === 'talent') {
            await db.collection('talents').doc(user.uid).set(profileData);
            console.log('Perfil de talento creado');
        } else if (userData.type === 'client') {
            await db.collection('clients').doc(user.uid).set(profileData);
            console.log('Perfil de cliente creado');
        }
        
        return {
            success: true,
            user: user
        };
        
    } catch (error) {
        console.error('Error en registro:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Cerrar sesión
async function logout() {
    console.log('Cerrando sesión...');
    
    try {
        await auth.signOut();
        console.log('Sesión cerrada correctamente');
        return { success: true };
    } catch (error) {
        console.error('Error cerrando sesión:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Restablecer contraseña
async function resetPassword(email) {
    console.log('Solicitando restablecimiento para:', email);
    
    try {
        await auth.sendPasswordResetEmail(email);
        console.log('Email de restablecimiento enviado');
        return { success: true };
    } catch (error) {
        console.error('Error restableciendo contraseña:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Verificar si el usuario está autenticado
function isAuthenticated() {
    return auth.currentUser !== null;
}

// Obtener usuario actual
function getCurrentUser() {
    return auth.currentUser;
}

// Hacer funciones globales
window.checkAuthState = checkAuthState;
window.login = login;
window.register = register;
window.logout = logout;
window.resetPassword = resetPassword;
window.isAuthenticated = isAuthenticated;
window.getCurrentUser = getCurrentUser;

console.log('Auth.js inicializado correctamente');
