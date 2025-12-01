"use client";
import React, { useState, useEffect } from 'react';
import { getBalances, getChain, sendTransaction, mineBlock, attack51 } from '../lib/api';

interface Wallet {
  id: string;
  name: string;
  balance: number;
  currency: string;
  address: string;
}

interface Transaction {
  id: string;
  type: 'send' | 'receive';
  amount: number;
  currency: string;
  address: string;
  date: string;
  status: 'completed' | 'pending';
}

function Sidebar({ activeTab, setActiveTab }: { activeTab: string; setActiveTab: (tab: string) => void }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'transactions', label: 'Transactions', icon: '📜' },
    { id: 'send', label: 'Send', icon: '📤' },
    { id: 'receive', label: 'Receive', icon: '📥' },
    { id: 'attack', label: '51% Attack', icon: '⚔️' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <div className="w-64 h-screen bg-gradient-to-b from-gray-900 to-black text-white p-6 fixed left-0 top-0 shadow-2xl border-r border-gray-800">
      <div className="mb-8">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
         Crypto Wallet
        </h2>
        <p className="text-gray-400 text-sm mt-1">Blockchain Demo</p>
      </div>
      
      <nav>
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => setActiveTab(item.id)}
                className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 flex items-center gap-3 ${
                  activeTab === item.id
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50'
                    : 'hover:bg-gray-800 text-gray-300'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

export default function CryptoWallet() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [wallets, setWallets] = useState<Wallet[]>([
    { id: '1', name: 'Alice Wallet', balance: 0, currency: 'BTC', address: 'Alice' },
    { id: '2', name: 'Bob Wallet', balance: 0, currency: 'BTC', address: 'Bob' },
    { id: '3', name: 'Miner Wallet', balance: 0, currency: 'BTC', address: 'Miner' },
  ]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [sendForm, setSendForm] = useState({
    sender: 'Alice',
    recipient: 'Bob',
    amount: '10',
  });
  const [attackForm, setAttackForm] = useState({
    attacker: 'Mallory',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // Функция для загрузки всех данных
  const fetchAllData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Получаем балансы
      const balancesData = await getBalances();
      console.log('Balances data:', balancesData);
      
      // Преобразуем данные балансов в формат кошельков
      const formattedWallets: Wallet[] = [];
      
      if (balancesData && typeof balancesData === 'object') {
        Object.entries(balancesData).forEach(([address, balance], index) => {
          formattedWallets.push({
            id: String(index + 1),
            name: `${address} Wallet`,
            balance: typeof balance === 'number' ? balance : 0,
            currency: 'BTC',
            address: address
          });
        });
      }
      
      // Если нет данных, используем дефолтные
      if (formattedWallets.length === 0) {
        formattedWallets.push(
          { id: '1', name: 'Alice Wallet', balance: 100, currency: 'BTC', address: 'Alice' },
          { id: '2', name: 'Bob Wallet', balance: 50, currency: 'BTC', address: 'Bob' },
          { id: '3', name: 'Miner Wallet', balance: 0, currency: 'BTC', address: 'Miner' }
        );
      }
      
      setWallets(formattedWallets);
      
      // Получаем цепочку для транзакций
      const chainData = await getChain();
      console.log('Chain data:', chainData);
      
      const allTransactions: Transaction[] = [];
      
      if (chainData && Array.isArray(chainData)) {
        chainData.forEach((block: any, blockIndex: number) => {
          if (block.transactions && Array.isArray(block.transactions)) {
            block.transactions.forEach((tx: any, txIndex: number) => {
              // Пропускаем coinbase транзакции для отображения
              if (tx.sender === 'COINBASE') {
                allTransactions.push({
                  id: `block-${blockIndex}-tx-${txIndex}`,
                  type: 'receive',
                  amount: tx.amount,
                  currency: 'BTC',
                  address: `Miner (${tx.recipient})`,
                  date: new Date(block.timestamp * 1000).toLocaleDateString(),
                  status: 'completed'
                });
              } else {
                allTransactions.push({
                  id: `block-${blockIndex}-tx-${txIndex}`,
                  type: tx.recipient === 'Alice' ? 'receive' : 'send',
                  amount: tx.amount,
                  currency: 'BTC',
                  address: tx.sender === 'Alice' ? tx.recipient : tx.sender,
                  date: new Date(block.timestamp * 1000).toLocaleDateString(),
                  status: 'completed'
                });
              }
            });
          }
        });
      }
      
      setTransactions(allTransactions.reverse());
      
    } catch (err: any) {
      console.error('Failed to fetch data:', err);
      setError(`Failed to load data: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleSend = async () => {
    if (!sendForm.sender || !sendForm.recipient || !sendForm.amount || parseFloat(sendForm.amount) <= 0) {
      setError('Please fill in all fields with valid values');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setInfo(null);
      
      const amount = parseFloat(sendForm.amount);
      const response = await sendTransaction(sendForm.sender, sendForm.recipient, amount);
      
      console.log('Transaction response:', response);
      
      if (response && response.status === 'ok') {
        setInfo(`Transaction successful: ${sendForm.sender} → ${sendForm.recipient} ${amount} BTC`);
        
        // Обновляем данные
        await fetchAllData();
        
        // Сбрасываем форму
        setSendForm(prev => ({
          ...prev,
          amount: '10'
        }));
      } else {
        throw new Error(response?.message || 'Unknown error from server');
      }
    } catch (err: any) {
      console.error('Failed to send transaction:', err);
      setError(`Transaction failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMine = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setInfo(null);
      
      const response = await mineBlock('Miner');
      
      console.log('Mining response:', response);
      
      if (response) {
        setInfo('Block mined successfully! Miner received 50 BTC reward.');
        
        // Обновляем данные
        await fetchAllData();
      } else {
        throw new Error('No response from server');
      }
    } catch (err: any) {
      console.error('Failed to mine block:', err);
      setError(`Mining failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAttack = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setInfo(null);
      
      const response = await attack51(attackForm.attacker);
      
      console.log('Attack response:', response);
      
      if (response && response.success) {
        setInfo(`51% Attack successful! ${attackForm.attacker} took control.`);
      } else {
        setInfo(response?.message || 'Attack failed');
      }
      
      // Обновляем данные после атаки
      await fetchAllData();
      
    } catch (err: any) {
      console.error('Failed to execute attack:', err);
      setError(`Attack failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const renderDashboard = () => (
    <div>
      {(error || info) && (
        <div className={`mb-4 p-4 rounded-lg ${error ? 'bg-red-500/20 border border-red-500 text-red-400' : 'bg-green-500/20 border border-green-500 text-green-400'}`}>
          {error || info}
        </div>
      )}
      
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-white">Dashboard</h1>
        <button
          onClick={fetchAllData}
          disabled={isLoading}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg flex items-center gap-2"
        >
          {isLoading ? 'Refreshing...' : '⟳ Refresh Data'}
        </button>
      </div>
      
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          <p className="mt-4 text-gray-400">Loading blockchain data...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {wallets.map((w) => (
              <div key={w.id} className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
                <div className="flex justify-between items-start mb-3">
                  <h2 className="font-semibold text-lg text-white">{w.name}</h2>
                  <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm">
                    {w.currency}
                  </span>
                </div>
                <p className="text-2xl font-bold text-white mb-2">{w.balance.toFixed(4)} {w.currency}</p>
                <p className="text-sm text-gray-400 truncate">Address: {w.address}</p>
              </div>
            ))}
          </div>

          <div className="bg-gray-800 rounded-xl shadow-xl p-6 border border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Recent Transactions</h2>
              <span className="px-3 py-1 bg-gray-700 text-gray-300 rounded-full text-sm">
                {transactions.length} total
              </span>
            </div>
            
            {transactions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400">No transactions yet</p>
                <p className="text-sm text-gray-500 mt-2">Send some BTC or mine a block to get started</p>
              </div>
            ) : (
              <div className="space-y-4">
                {transactions.slice(0, 10).map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-4 bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors border border-gray-700">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${
                        tx.type === 'receive' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {tx.type === 'receive' ? '↓' : '↑'}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-100">
                          {tx.type === 'receive' ? 'Received from' : 'Sent to'} {tx.address}
                        </p>
                        <p className="text-sm text-gray-400">{tx.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-xl font-bold ${tx.type === 'receive' ? 'text-green-400' : 'text-red-400'}`}>
                        {tx.type === 'receive' ? '+' : '-'}{tx.amount.toFixed(4)} {tx.currency}
                      </p>
                      <span className={`text-xs px-2 py-1 rounded-full mt-2 inline-block ${
                        tx.status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {tx.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );

  const renderSend = () => (
    <div>
      <h1 className="text-4xl font-bold mb-8 text-white">Send BTC</h1>
      
      {(error || info) && (
        <div className={`mb-6 p-4 rounded-lg ${error ? 'bg-red-500/20 border border-red-500 text-red-400' : 'bg-green-500/20 border border-green-500 text-green-400'}`}>
          {error || info}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Форма отправки */}
        <div className="bg-gray-800 rounded-xl shadow-xl p-8 border border-gray-700">
          <h2 className="text-2xl font-bold mb-6 text-white">Send Transaction</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">From (Sender)</label>
              <select
                value={sendForm.sender}
                onChange={(e) => setSendForm({ ...sendForm, sender: e.target.value })}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
              >
                {wallets.map(wallet => (
                  <option key={wallet.address} value={wallet.address}>
                    {wallet.name} (Balance: {wallet.balance.toFixed(4)} BTC)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">To (Recipient)</label>
              <select
                value={sendForm.recipient}
                onChange={(e) => setSendForm({ ...sendForm, recipient: e.target.value })}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
              >
                <option value="Bob">Bob Wallet</option>
                <option value="Alice">Alice Wallet</option>
                <option value="Miner">Miner Wallet</option>
                <option value="Charlie">Charlie</option>
                <option value="David">David</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Amount (BTC)</label>
              <input
                type="number"
                value={sendForm.amount}
                onChange={(e) => setSendForm({ ...sendForm, amount: e.target.value })}
                placeholder="10.0"
                step="0.1"
                min="0.1"
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-500"
              />
              <p className="text-sm text-gray-400 mt-2">Current balance: {
                wallets.find(w => w.address === sendForm.sender)?.balance.toFixed(4) || '0.0000'
              } BTC</p>
            </div>

            <button
              onClick={handleSend}
              disabled={isLoading}
              className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-4 rounded-lg transition-colors duration-200 text-lg ${
                isLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? 'Processing...' : 'Send Transaction'}
            </button>
          </div>
        </div>

        {/* Панель майнинга */}
        <div className="bg-gray-800 rounded-xl shadow-xl p-8 border border-gray-700">
          <h2 className="text-2xl font-bold mb-6 text-white">Mine Block</h2>
          <div className="space-y-6">
            <div className="p-4 bg-gray-900 rounded-lg border border-gray-700">
              <h3 className="font-semibold text-white mb-2">Mining Info</h3>
              <p className="text-gray-300 mb-2">• Mine a new block to confirm pending transactions</p>
              <p className="text-gray-300 mb-2">• Miner receives 50 BTC reward</p>
              <p className="text-gray-300">• Proof of Work difficulty: 3 leading zeros</p>
            </div>

            <button
              onClick={handleMine}
              disabled={isLoading}
              className={`w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-4 rounded-lg transition-colors duration-200 text-lg ${
                isLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? 'Mining...' : 'Mine Block (Miner)'}
            </button>

            <div className="p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
              <h3 className="font-semibold text-yellow-400 mb-2">Pending Transactions</h3>
              <p className="text-yellow-300 text-sm">
                Mining will process all pending transactions and add them to the blockchain.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAttack = () => (
    <div>
      <h1 className="text-4xl font-bold mb-8 text-white">51% Attack Simulation</h1>
      
      {(error || info) && (
        <div className={`mb-6 p-4 rounded-lg ${error ? 'bg-red-500/20 border border-red-500 text-red-400' : 'bg-green-500/20 border border-green-500 text-green-400'}`}>
          {error || info}
        </div>
      )}
      
      <div className="bg-gray-800 rounded-xl shadow-xl p-8 max-w-2xl mx-auto border border-red-500/30">
        <div className="space-y-6">
          <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/30">
            <h3 className="text-lg font-semibold text-red-400 mb-2">⚠️ Warning: 51% Attack</h3>
            <p className="text-red-300">
              This simulates a 51% attack where an attacker tries to rewrite blockchain history.
              This is for educational purposes only.
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Attacker Name</label>
            <input
              type="text"
              value={attackForm.attacker}
              onChange={(e) => setAttackForm({ attacker: e.target.value })}
              placeholder="Enter attacker name"
              className="w-full px-4 py-3 bg-gray-900 border border-red-700 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-white"
            />
          </div>

          <div className="p-4 bg-gray-900 rounded-lg border border-gray-700">
            <h4 className="font-semibold text-white mb-2">How it works:</h4>
            <ul className="text-gray-300 text-sm space-y-1">
              <li>• Attacker creates a longer alternative chain</li>
              <li>• Includes a malicious coinbase transaction to themselves</li>
              <li>• If chain is longer, network accepts it as valid</li>
              <li>• Original transactions are effectively "erased"</li>
            </ul>
          </div>

          <button
            onClick={handleAttack}
            disabled={isLoading}
            className={`w-full bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-4 rounded-lg transition-colors duration-200 text-lg ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? 'Executing Attack...' : 'Execute 51% Attack'}
          </button>
        </div>
      </div>
    </div>
  );

  const renderTransactions = () => (
    <div>
      <h1 className="text-4xl font-bold mb-8 text-white">All Transactions</h1>
      
      <div className="bg-gray-800 rounded-xl shadow-xl p-6 border border-gray-700">
        <div className="space-y-4">
          {transactions.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between p-4 border-b border-gray-700 last:border-b-0 hover:bg-gray-900 transition-colors">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${
                  tx.type === 'receive' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {tx.type === 'receive' ? '↓' : '↑'}
                </div>
                <div>
                  <p className="font-semibold text-gray-100">
                    {tx.type === 'receive' ? 'Received from' : 'Sent to'} <span className="font-mono">{tx.address}</span>
                  </p>
                  <p className="text-sm text-gray-400">{tx.date}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-xl font-bold ${tx.type === 'receive' ? 'text-green-400' : 'text-red-400'}`}>
                  {tx.type === 'receive' ? '+' : '-'}{tx.amount.toFixed(4)} BTC
                </p>
                <span className={`text-xs px-3 py-1 rounded-full inline-block mt-2 ${
                  tx.status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {tx.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderReceive = () => (
    <div>
      <h1 className="text-4xl font-bold mb-8 text-white">Receive BTC</h1>
      <div className="bg-gray-800 rounded-xl shadow-xl p-8 max-w-2xl border border-gray-700">
        <div className="space-y-6">
          {wallets.map((wallet) => (
            <div key={wallet.id} className="border border-gray-700 rounded-lg p-6 hover:border-blue-500 transition-colors bg-gray-900">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-100">{wallet.name}</h3>
                <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm font-semibold border border-blue-500/30">
                  {wallet.currency}
                </span>
              </div>
              <p className="text-sm text-gray-400 mb-2">Your {wallet.currency} Address:</p>
              <div className="flex items-center gap-2 bg-gray-800 p-3 rounded-lg border border-gray-700">
                <code className="text-sm font-mono text-gray-300 flex-1">{wallet.address}</code>
                <button 
                  onClick={() => navigator.clipboard.writeText(wallet.address)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold"
                >
                  Copy
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">Share this address to receive BTC</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div>
      <h1 className="text-4xl font-bold mb-8 text-white">Settings</h1>
      <div className="bg-gray-800 rounded-xl shadow-xl p-8 max-w-2xl space-y-6 border border-gray-700">
        <div className="border-b border-gray-700 pb-6">
          <h3 className="text-lg font-semibold text-gray-100 mb-4">Blockchain Info</h3>
          <div className="space-y-3 text-gray-300">
            <p>• Proof of Work Difficulty: 3 leading zeros</p>
            <p>• Coinbase Reward: 50 BTC per block</p>
            <p>• Network: Local Testnet</p>
            <p>• Node Count: 2 (A and B)</p>
          </div>
        </div>
        
        <div className="border-b border-gray-700 pb-6">
          <h3 className="text-lg font-semibold text-gray-100 mb-4">Reset Data</h3>
          <button 
            onClick={() => {
              if (confirm('Reset all blockchain data? This will restart the demo.')) {
                // Можно добавить сброс через API
                alert('Reset feature would restart blockchain here');
              }
            }}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Reset Blockchain
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="ml-64 p-8">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'transactions' && renderTransactions()}
        {activeTab === 'send' && renderSend()}
        {activeTab === 'receive' && renderReceive()}
        {activeTab === 'attack' && renderAttack()}
        {activeTab === 'settings' && renderSettings()}
      </div>
    </div>
  );
}