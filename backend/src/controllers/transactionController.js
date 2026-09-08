const supabase = require('../config/supabase');

// POST /api/clients/:id/transactions - Add payment or withdrawal
exports.addTransaction = async (req, res) => {
  try {
    const clientId = req.params.id;
    const { type, amount, transaction_date, notes } = req.body;

    if (!type || !['payment', 'withdrawal'].includes(type)) {
      return res.status(400).json({ error: 'Type must be either "payment" or "withdrawal".' });
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ error: 'Amount must be a positive number greater than 0.' });
    }

    if (!transaction_date) {
      return res.status(400).json({ error: 'Transaction date is required.' });
    }

    // Call Supabase RPC fn_add_transaction
    const { data, error } = await supabase.rpc('fn_add_transaction', {
      p_client_id: clientId,
      p_type: type,
      p_amount: numericAmount,
      p_transaction_date: transaction_date,
      p_notes: notes ? notes.trim() : null
    });

    if (error) {
      // Check if error is overdraft / insufficient balance
      if (error.message && (error.message.includes('Insufficient balance') || error.message.includes('negative balance'))) {
        return res.status(400).json({ error: error.message });
      }
      console.error('Supabase fn_add_transaction error:', error);
      return res.status(500).json({ error: error.message || 'Failed to record transaction.' });
    }

    const insertedTx = Array.isArray(data) ? data[0] : data;

    // Fetch updated client balance to return in response
    const { data: clientData } = await supabase
      .from('clients')
      .select('current_balance, client_code, name')
      .eq('id', clientId)
      .single();

    return res.status(201).json({
      message: `${type === 'payment' ? 'Payment' : 'Withdrawal'} recorded successfully.`,
      transaction: insertedTx,
      client: clientData
    });
  } catch (err) {
    console.error('Add transaction exception:', err);
    return res.status(500).json({ error: 'Internal server error while recording transaction.' });
  }
};

// DELETE /api/transactions/:id - Delete transaction & recalculate history
exports.deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase.rpc('fn_delete_transaction', {
      p_transaction_id: id
    });

    if (error) {
      console.error('Supabase fn_delete_transaction error:', error);
      return res.status(400).json({ error: error.message || 'Failed to delete transaction.' });
    }

    return res.json({
      message: 'Transaction deleted and history recalculated successfully.',
      result: data
    });
  } catch (err) {
    console.error('Delete transaction exception:', err);
    return res.status(500).json({ error: 'Internal server error while deleting transaction.' });
  }
};

// GET /api/clients/:id/transactions - Get client transaction history
exports.getClientTransactions = async (req, res) => {
  try {
    const clientId = req.params.id;
    const { from, to, type } = req.query;

    let query = supabase
      .from('transactions')
      .select('*')
      .eq('client_id', clientId)
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (type && ['payment', 'withdrawal'].includes(type)) {
      query = query.eq('type', type);
    }

    if (from) {
      query = query.gte('transaction_date', from);
    }

    if (to) {
      query = query.lte('transaction_date', to);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase getClientTransactions error:', error);
      return res.status(500).json({ error: error.message || 'Failed to fetch client transactions.' });
    }

    return res.json({ transactions: data || [] });
  } catch (err) {
    console.error('Get client transactions exception:', err);
    return res.status(500).json({ error: 'Internal server error while fetching client transactions.' });
  }
};

// GET /api/transactions - Get global transaction history across all clients
exports.getGlobalTransactions = async (req, res) => {
  try {
    const { from, to, type, search } = req.query;

    let query = supabase
      .from('transactions')
      .select(`
        *,
        clients:client_id (
          id,
          client_code,
          name
        )
      `)
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (type && ['payment', 'withdrawal'].includes(type)) {
      query = query.eq('type', type);
    }

    if (from) {
      query = query.gte('transaction_date', from);
    }

    if (to) {
      query = query.lte('transaction_date', to);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase getGlobalTransactions error:', error);
      return res.status(500).json({ error: error.message || 'Failed to fetch global transactions.' });
    }

    let results = data || [];

    // Filter by client search if provided
    if (search && search.trim()) {
      const term = search.trim().toLowerCase();
      results = results.filter(tx => {
        const clientName = tx.clients?.name?.toLowerCase() || '';
        const clientCode = tx.clients?.client_code?.toLowerCase() || '';
        const notes = tx.notes?.toLowerCase() || '';
        return clientName.includes(term) || clientCode.includes(term) || notes.includes(term);
      });
    }

    return res.json({ transactions: results });
  } catch (err) {
    console.error('Get global transactions exception:', err);
    return res.status(500).json({ error: 'Internal server error while fetching global transactions.' });
  }
};

// GET /api/dashboard/stats - Aggregate stats across business
exports.getDashboardStats = async (req, res) => {
  try {
    // 1. Fetch total clients and total current balance sum
    const { data: clientsData, error: clientErr } = await supabase
      .from('clients')
      .select('current_balance');

    if (clientErr) {
      console.error('Error fetching clients for stats:', clientErr);
    }

    const totalClients = clientsData ? clientsData.length : 0;
    const totalBalance = clientsData ? clientsData.reduce((acc, c) => acc + (parseFloat(c.current_balance) || 0), 0) : 0;

    // 2. Fetch transaction aggregates
    const { data: txData, error: txErr } = await supabase
      .from('transactions')
      .select('type, amount');

    if (txErr) {
      console.error('Error fetching transactions for stats:', txErr);
    }

    let totalPayments = 0;
    let totalWithdrawals = 0;
    const totalTransactions = txData ? txData.length : 0;

    if (txData) {
      txData.forEach(t => {
        const amt = parseFloat(t.amount) || 0;
        if (t.type === 'payment') totalPayments += amt;
        if (t.type === 'withdrawal') totalWithdrawals += amt;
      });
    }

    return res.json({
      stats: {
        total_clients: totalClients,
        total_balance_held: totalBalance,
        total_payments: totalPayments,
        total_withdrawals: totalWithdrawals,
        total_transactions: totalTransactions
      }
    });
  } catch (err) {
    console.error('Get dashboard stats exception:', err);
    return res.status(500).json({ error: 'Internal server error while calculating stats.' });
  }
};
