const BASE_URL = 'http://127.0.0.1:8000';

// Вспомогательная функция для безопасных запросов
async function safeFetch(url: string, options?: RequestInit) {
  try {
    const response = await fetch(url, options);
    
    // Проверяем, что ответ существует
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const text = await response.text();
    
    // Если ответ пустой, возвращаем null
    if (!text) {
      return null;
    }
    
    try {
      return JSON.parse(text);
    } catch (e) {
      console.error('Failed to parse JSON response:', text.substring(0, 200));
      throw new Error(`Invalid JSON response from server: ${text.substring(0, 100)}...`);
    }
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
}

export async function getBalances() {
  return safeFetch(`${BASE_URL}/balances`);
}

export async function getChain() {
  return safeFetch(`${BASE_URL}/chain`);
}

export async function sendTransaction(sender: string, recipient: string, amount: number) {
  const params = new URLSearchParams({
    sender: sender,
    recipient: recipient,
    amount: amount.toString()
  });
  
  return safeFetch(`${BASE_URL}/transaction?${params}`, { 
    method: 'POST' 
  });
}

export async function mineBlock(minerName: string = 'Miner') {
  const params = new URLSearchParams({
    miner_name: minerName
  });
  
  return safeFetch(`${BASE_URL}/mine?${params}`, { 
    method: 'POST' 
  });
}

export async function attack51(attacker: string) {
  const params = new URLSearchParams({
    attacker: attacker
  });
  
  return safeFetch(`${BASE_URL}/attack?${params}`, { 
    method: 'POST' 
  });
}