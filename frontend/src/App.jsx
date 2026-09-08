import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import ClientsPage from './pages/ClientsPage';
import GlobalTransactionsPage from './pages/GlobalTransactionsPage';
import ClientModal from './components/ClientModal';
import TransactionModal from './components/TransactionModal';
import ClientDetailModal from './components/ClientDetailModal';
import DeleteConfirmModal from './components/DeleteConfirmModal';
import Toast from './components/Toast';
import { api } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  // Core Data State
  const [stats, setStats] = useState({});
  const [clients, setClients] = useState([]);
  const [globalTransactions, setGlobalTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Modal States
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [presetClientForTx, setPresetClientForTx] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [deleteTxTarget, setDeleteTxTarget] = useState(null);

  // Submitting / Error States
  const [submittingClient, setSubmittingClient] = useState(false);
  const [submittingTx, setSubmittingTx] = useState(false);
  const [submittingDelete, setSubmittingDelete] = useState(false);
  const [txErrorMsg, setTxErrorMsg] = useState('');

  // Toast Notification
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
  }, []);

  // Fetch application dashboard metrics & database records
  const loadData = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const [statsRes, clientsRes, txRes] = await Promise.all([
        api.getDashboardStats().catch(() => ({ stats: {} })),
        api.getClients().catch(() => ({ clients: [] })),
        api.getGlobalTransactions().catch(() => ({ transactions: [] }))
      ]);

      setStats(statsRes.stats || {});
      setClients(clientsRes.clients || []);
      setGlobalTransactions(txRes.transactions || []);
    } catch (err) {
      console.error('Failed to load application data:', err);
      showToast('Could not connect to backend server. Verify server is running on port 5000.', 'error');
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData(true);

    // Background auto-refresh polling every 10 seconds to keep dashboard & ledger in sync
    const interval = setInterval(() => {
      loadData(false);
    }, 10000);

    return () => clearInterval(interval);
  }, [loadData, refreshTrigger]);

  const triggerRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Create Client Submit Handler
  const handleCreateClient = async (clientData) => {
    setSubmittingClient(true);
    try {
      const res = await api.createClient(clientData);
      showToast(`Client Account ${res.client.name} (${res.client.client_code}) created successfully!`);
      setIsClientModalOpen(false);
      triggerRefresh();
    } catch (err) {
      showToast(err.message || 'Failed to create client.', 'error');
    } finally {
      setSubmittingClient(false);
    }
  };

  // Open Transaction Modal
  const handleOpenTransactionModal = (client = null, defaultType = 'payment') => {
    setPresetClientForTx(client);
    setTxErrorMsg('');
    setIsTxModalOpen(true);
  };

  // Add Transaction Submit Handler
  const handleAddTransaction = async ({ clientId, type, amount, transaction_date, notes }) => {
    setSubmittingTx(true);
    setTxErrorMsg('');
    try {
      await api.addTransaction(clientId, {
        type,
        amount,
        transaction_date,
        notes
      });

      showToast(`${type === 'payment' ? 'Payment' : 'Withdrawal'} recorded successfully!`);
      setIsTxModalOpen(false);

      // If client detail modal is currently open for this client, refresh selectedClient balance
      if (selectedClient && selectedClient.id === clientId) {
        const updated = await api.getClientById(clientId);
        if (updated.client) {
          setSelectedClient(updated.client);
        }
      }

      triggerRefresh();
    } catch (err) {
      setTxErrorMsg(err.message || 'Failed to record transaction.');
      showToast(err.message || 'Transaction rejected.', 'error');
    } finally {
      setSubmittingTx(false);
    }
  };

  // Request Transaction Deletion
  const handleDeleteTransactionRequest = (tx) => {
    setDeleteTxTarget(tx);
  };

  // Confirm Transaction Deletion
  const handleConfirmDeleteTransaction = async () => {
    if (!deleteTxTarget) return;
    setSubmittingDelete(true);
    try {
      await api.deleteTransaction(deleteTxTarget.id);
      showToast('Transaction deleted & balance recalculated!');
      setDeleteTxTarget(null);

      // If detail modal is open, refresh selected client
      if (selectedClient && selectedClient.id === deleteTxTarget.client_id) {
        const updated = await api.getClientById(deleteTxTarget.client_id);
        if (updated.client) {
          setSelectedClient(updated.client);
        }
      }

      triggerRefresh();
    } catch (err) {
      showToast(err.message || 'Failed to delete transaction.', 'error');
    } finally {
      setSubmittingDelete(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0b1c30] flex flex-col font-sans selection:bg-[#0051d5] selection:text-white">
      
      {/* Navbar Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewClient={() => setIsClientModalOpen(true)}
        onOpenNewTransaction={(client) => handleOpenTransactionModal(client)}
      />

      {/* Main Content Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        {activeTab === 'dashboard' && (
          <Dashboard
            stats={stats}
            clients={clients}
            transactions={globalTransactions}
            loading={loading}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            onOpenNewClient={() => setIsClientModalOpen(true)}
            onOpenNewTransaction={(client) => handleOpenTransactionModal(client)}
            onSelectClient={(c) => setSelectedClient(c)}
            onDeleteTransactionRequest={handleDeleteTransactionRequest}
            onManualRefresh={() => loadData(true)}
          />
        )}

        {activeTab === 'clients' && (
          <ClientsPage
            clients={clients}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            onOpenNewClient={() => setIsClientModalOpen(true)}
            onSelectClient={(c) => setSelectedClient(c)}
            onRecordTransaction={(client, type) => handleOpenTransactionModal(client, type)}
          />
        )}

        {activeTab === 'transactions' && (
          <GlobalTransactionsPage
            onSelectClient={(c) => setSelectedClient(c)}
            onDeleteTransactionRequest={handleDeleteTransactionRequest}
            refreshTrigger={refreshTrigger}
          />
        )}
      </main>

      {/* Modals */}
      <ClientModal
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        onSubmit={handleCreateClient}
        submitting={submittingClient}
      />

      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        onSubmit={handleAddTransaction}
        clients={clients}
        presetClient={presetClientForTx}
        submitting={submittingTx}
        errorMsg={txErrorMsg}
      />

      <ClientDetailModal
        isOpen={!!selectedClient}
        onClose={() => setSelectedClient(null)}
        client={selectedClient}
        onRecordTransaction={(client, type) => handleOpenTransactionModal(client, type)}
        onDeleteTransactionRequest={handleDeleteTransactionRequest}
      />

      <DeleteConfirmModal
        isOpen={!!deleteTxTarget}
        onClose={() => setDeleteTxTarget(null)}
        onConfirm={handleConfirmDeleteTransaction}
        transaction={deleteTxTarget}
        submitting={submittingDelete}
      />

      {/* Floating Toast Notification */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
