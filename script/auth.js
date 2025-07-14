// Registrar nuevo usuario
function registerUser(userData) {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    
    // Verificar si usuario ya existe
    const userExists = users.some(user => 
        user.idType === userData.idType && 
        user.idNumber === userData.idNumber
    );
    
    if (userExists) {
        return { success: false, message: 'El usuario ya está registrado' };
    }
    
    // Crear cuenta bancaria
    const accountNumber = generateAccountNumber();
    const newAccount = {
        accountNumber,
        userId: userData.idNumber,
        balance: 0,
        createdAt: new Date().toISOString(),
        transactions: []
    };
    
    // Crear usuario
    const newUser = {
        ...userData,
        accounts: [accountNumber],
        createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    // Guardar cuenta
    const accounts = JSON.parse(localStorage.getItem('accounts')) || [];
    accounts.push(newAccount);
    localStorage.setItem('accounts', JSON.stringify(accounts));
    
    return { 
        success: true, 
        accountNumber,
        createdAt: newAccount.createdAt
    };
}

// Autenticar usuario
function authenticateUser(idType, idNumber, password) {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users.find(user => 
        user.idType === idType && 
        user.idNumber === idNumber && 
        user.password === password
    );
    
    return user || null;
}

if (!localStorage.getItem('accounts')) {
    localStorage.setItem('accounts', JSON.stringify([
      {
        accountNumber: '100000001',
        userId: '123456789',
        balance: 5000000,
        type: 'ahorros',
        status: 'active',
        transactions: [],
        createdAt: new Date().toISOString()
      }
    ]));
  }