// script/utils.js - Funciones de utilidad y persistencia de datos

/**
 * Genera un ID único para transacciones.
 * @returns {string} Un ID único.
 */
function generateTransactionId() {
    return 'T' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5).toUpperCase();
}

/**
 * Genera un número de cuenta aleatorio de 9 dígitos.
 * @returns {string} El número de cuenta generado.
 */
function generateAccountNumber() {
    let accountNumber = '';
    do {
        accountNumber = String(Math.floor(100000000 + Math.random() * 900000000));
    } while (getAccount(accountNumber)); // Asegura que el número de cuenta no exista ya
    return accountNumber;
}

/**
 * Genera un número de referencia aleatorio para transacciones.
 * @returns {string} La referencia generada.
 */
function generateReference() {
    return 'REF' + Math.random().toString(36).substr(2, 9).toUpperCase();
}

// --- Funciones para interactuar con localStorage ---

/**
 * Obtiene todos los usuarios almacenados.
 * @returns {Array} Array de objetos de usuario.
 */
function getUsers() {
    return JSON.parse(localStorage.getItem('users')) || [];
}

/**
 * Guarda el array de usuarios en localStorage.
 * @param {Array} users - Array de objetos de usuario a guardar.
 */
function saveUsers(users) {
    localStorage.setItem('users', JSON.stringify(users));
}

/**
 * Obtiene todas las cuentas almacenadas.
 * @returns {Array} Array de objetos de cuenta.
 */
function getAccounts() {
    return JSON.parse(localStorage.getItem('accounts')) || [];
}

/**
 * Guarda el array de cuentas en localStorage.
 * @param {Array} accounts - Array de objetos de cuenta a guardar.
 */
function saveAccounts(accounts) {
    localStorage.setItem('accounts', JSON.stringify(accounts));
}

/**
 * Obtiene todas las transacciones almacenadas.
 * @returns {Array} Array de objetos de transacción.
 */
function getTransactions() {
    return JSON.parse(localStorage.getItem('transactions')) || [];
}

/**
 * Guarda el array de transacciones en localStorage.
 * @param {Array} transactions - Array de objetos de transacción a guardar.
 */
function saveTransactions(transactions) {
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

/**
 * Busca un usuario por tipo y número de identificación.
 * @param {string} idType - Tipo de identificación.
 * @param {string} idNumber - Número de identificación.
 * @returns {object|null} El objeto usuario si lo encuentra, de lo contrario null.
 */
function getUserByCredentials(idType, idNumber) {
    const users = getUsers();
    return users.find(user => user.idType === idType && user.idNumber === idNumber) || null;
}

/**
 * Busca un usuario por tipo de ID, número de ID y email.
 * @param {string} idType - Tipo de identificación.
 * @param {string} idNumber - Número de identificación.
 * @param {string} email - Correo electrónico.
 * @returns {object|null} El objeto usuario si lo encuentra, de lo contrario null.
 */
function findUserByIdAndEmail(idType, idNumber, email) {
    const users = getUsers();
    return users.find(user => 
        user.idType === idType && 
        user.idNumber === idNumber && 
        user.email === email
    ) || null;
}

/**
 * Autentica un usuario.
 * @param {string} idType - Tipo de identificación.
 * @param {string} idNumber - Número de identificación.
 * @param {string} password - Contraseña.
 * @returns {object|null} El objeto usuario autenticado, o null si las credenciales son incorrectas.
 */
function authenticateUser(idType, idNumber, password) {
    const user = getUserByCredentials(idType, idNumber);
    if (user && user.password === password) { // En un entorno real, comparar hashes
        return user;
    }
    return null;
}

/**
 * Registra un nuevo usuario y le asigna una cuenta bancaria.
 * @param {object} userData - Datos del usuario a registrar.
 * @returns {object} Resultado del registro (success, message, accountNumber, createdAt).
 */
function registerUser(userData) {
    const users = getUsers();
    const accounts = getAccounts();

    // Verificar si el usuario ya existe por ID
    const userExists = users.some(user => 
        user.idType === userData.idType && 
        user.idNumber === userData.idNumber
    );
    if (userExists) {
        return { success: false, message: 'Ya existe un usuario con este tipo y número de identificación.' };
    }
    
    // Verificar si el correo ya está registrado
    const emailExists = users.some(user => user.email === userData.email);
    if (emailExists) {
        return { success: false, message: 'El correo electrónico ya está registrado.' };
    }

    const accountNumber = generateAccountNumber();
    const currentDateTime = new Date().toISOString();

    const newUser = {
        ...userData,
        accounts: [accountNumber], // Asignar la cuenta al usuario
        createdAt: currentDateTime
    };

    const newAccount = {
        accountNumber,
        userId: userData.idNumber, // Vincula la cuenta al userId (idNumber del usuario)
        balance: 0,
        createdAt: currentDateTime,
        transactions: []
    };

    users.push(newUser);
    accounts.push(newAccount);

    saveUsers(users);
    saveAccounts(accounts);

    return { 
        success: true, 
        message: '¡Registro exitoso! Tu cuenta ha sido creada.',
        accountNumber: newAccount.accountNumber,
        createdAt: newAccount.createdAt
    };
}

/**
 * Actualiza la contraseña de un usuario.
 * @param {string} idType - Tipo de identificación.
 * @param {string} idNumber - Número de identificación.
 * @param {string} email - Correo electrónico.
 * @param {string} newPassword - La nueva contraseña.
 * @returns {boolean} True si la contraseña se actualizó, false en caso contrario.
 */
function updateUserPassword(idType, idNumber, email, newPassword) {
    const users = getUsers();
    const userIndex = users.findIndex(user => 
        user.idType === idType && 
        user.idNumber === idNumber && 
        user.email === email
    );

    if (userIndex === -1) return false;

    users[userIndex].password = newPassword; // En prod, aquí iría el hash
    saveUsers(users);
    return true;
}

/**
 * Obtiene una cuenta por su número de cuenta.
 * @param {string} accountNumber - Número de cuenta.
 * @returns {object|null} El objeto cuenta si lo encuentra, de lo contrario null.
 */
function getAccount(accountNumber) {
    const accounts = getAccounts();
    return accounts.find(acc => acc.accountNumber === accountNumber) || null;
}

/**
 * Realiza una transacción (depósito, retiro, pago de servicios).
 * @param {string} accountNumber - Número de cuenta del usuario.
 * @param {number} amount - Cantidad de la transacción.
 * @param {string} type - Tipo de transacción ('deposit', 'withdrawal', 'payment').
 * @param {string} description - Descripción del movimiento.
 * @returns {object} El objeto de la transacción creada.
 * @throws {Error} Si el saldo es insuficiente para un retiro/pago.
 */
function performTransaction(accountNumber, amount, type, description) {
    const accounts = getAccounts();
    const accountIndex = accounts.findIndex(acc => acc.accountNumber === accountNumber);

    if (accountIndex === -1) {
        throw new Error('Cuenta no encontrada.');
    }

    const account = accounts[accountIndex];
    let newBalance = account.balance;

    if (type === 'deposit') {
        newBalance += amount;
    } else if (type === 'withdrawal' || type === 'payment') {
        if (account.balance < amount) {
            throw new Error('Saldo insuficiente para realizar esta operación.');
        }
        newBalance -= amount;
    } else {
        throw new Error('Tipo de transacción inválido.');
    }

    const transaction = {
        id: generateTransactionId(),
        accountNumber,
        date: new Date().toISOString(),
        reference: generateReference(),
        type,
        description,
        amount,
        balanceAfter: newBalance
    };

    account.balance = newBalance;
    account.transactions.push(transaction.id);

    // Guardar transacción globalmente
    const allTransactions = getTransactions();
    allTransactions.push(transaction);

    saveAccounts(accounts);
    saveTransactions(allTransactions);

    return transaction;
}


// Exportar funciones para que puedan ser usadas por otros scripts
// En un entorno de navegador sin módulos ES6 directos, se exponen globalmente
window.getUsers = getUsers;
window.saveUsers = saveUsers;
window.getAccounts = getAccounts;
window.saveAccounts = saveAccounts;
window.getTransactions = getTransactions;
window.saveTransactions = saveTransactions;
window.getUserByCredentials = getUserByCredentials;
window.findUserByIdAndEmail = findUserByIdAndEmail;
window.authenticateUser = authenticateUser;
window.registerUser = registerUser;
window.updateUserPassword = updateUserPassword;
window.getAccount = getAccount;
window.performTransaction = performTransaction;
window.generateAccountNumber = generateAccountNumber; // Para la inicialización del demo
window.generateReference = generateReference;