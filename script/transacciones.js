// Realizar consignación
function makeDeposit(accountNumber, amount) {
    const accounts = JSON.parse(localStorage.getItem('accounts'));
    const account = accounts.find(acc => acc.accountNumber === accountNumber);
    
    if (!account) return false;
    
    // Crear transacción
    const transaction = {
        id: generateTransactionId(),
        accountNumber,
        date: new Date().toISOString(),
        reference: generateReference(),
        type: 'deposit',
        description: 'Consignación por canal electrónico',
        amount,
        balanceAfter: account.balance + amount
    };
    
    // Actualizar cuenta
    account.balance += amount;
    account.transactions.push(transaction.id);
    
    // Guardar transacción
    const transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    transactions.push(transaction);
    
    // Actualizar almacenamiento
    localStorage.setItem('accounts', JSON.stringify(accounts));
    localStorage.setItem('transactions', JSON.stringify(transactions));
    
    return transaction;
}

function updateAccountBalance(accountNumber, amount) {
    const accounts = JSON.parse(localStorage.getItem('accounts'));
    const account = accounts.find(acc => acc.accountNumber === accountNumber);
    
    if (account) {
      account.balance += amount;
      localStorage.setItem('accounts', JSON.stringify(accounts));
    }
  }