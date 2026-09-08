const supabase = require('../config/supabase');

// POST /api/clients - Create new client
exports.createClient = async (req, res) => {
  try {
    const { name, phone, notes } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Client name is required.' });
    }

    const { data, error } = await supabase.rpc('fn_create_client', {
      p_name: name.trim(),
      p_phone: phone ? phone.trim() : null,
      p_notes: notes ? notes.trim() : null
    });

    if (error) {
      console.error('Supabase RPC fn_create_client error:', error);
      return res.status(500).json({ error: error.message || 'Failed to create client.' });
    }

    // fn_create_client returns an array of matching rows
    const newClient = Array.isArray(data) ? data[0] : data;
    return res.status(201).json({
      message: 'Client created successfully.',
      client: newClient
    });
  } catch (err) {
    console.error('Create client exception:', err);
    return res.status(500).json({ error: 'Internal server error while creating client.' });
  }
};

// GET /api/clients - List & Search clients
exports.getClients = async (req, res) => {
  try {
    const { search } = req.query;
    let query = supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });

    if (search && search.trim()) {
      const term = search.trim();
      query = query.or(`name.ilike.%${term}%,client_code.ilike.%${term}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase getClients error:', error);
      return res.status(500).json({ error: error.message || 'Failed to fetch clients.' });
    }

    return res.json({ clients: data || [] });
  } catch (err) {
    console.error('Get clients exception:', err);
    return res.status(500).json({ error: 'Internal server error while fetching clients.' });
  }
};

// GET /api/clients/:id - Get client details with transaction summary
exports.getClientById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single();

    if (clientError || !client) {
      return res.status(404).json({ error: 'Client not found.' });
    }

    // Fetch summary stats for this client
    const { data: txs, error: txError } = await supabase
      .from('transactions')
      .select('type, amount')
      .eq('client_id', id);

    let totalPayments = 0;
    let totalWithdrawals = 0;

    if (txs) {
      txs.forEach(t => {
        const amt = parseFloat(t.amount) || 0;
        if (t.type === 'payment') totalPayments += amt;
        if (t.type === 'withdrawal') totalWithdrawals += amt;
      });
    }

    return res.json({
      client: {
        ...client,
        total_payments: totalPayments,
        total_withdrawals: totalWithdrawals,
        transaction_count: txs ? txs.length : 0
      }
    });
  } catch (err) {
    console.error('Get client by ID exception:', err);
    return res.status(500).json({ error: 'Internal server error while fetching client details.' });
  }
};
