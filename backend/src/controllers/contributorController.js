const supabase = require('../config/supabase');

const FIXED_WEEKLY_AMOUNT = 3500.00;

// Helper to calculate Monday date for any given date
function getMondayDate(dateString) {
  const d = dateString ? new Date(dateString) : new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().split('T')[0];
}

// 1. Get all contributors with calculated totals
const getContributors = async (req, res, next) => {
  try {
    const { search } = req.query;

    let query = supabase.from('contributors').select('*').order('created_at', { ascending: true });

    if (search && search.trim()) {
      const term = search.trim().toLowerCase();
      query = query.or(`name.ilike.%${term}%,contributor_code.ilike.%${term}%`);
    }

    const { data: contributors, error } = await query;
    if (error) throw error;

    // Fetch all paid payments to aggregate totals
    const { data: payments, error: payErr } = await supabase
      .from('contribution_payments')
      .select('contributor_id, amount, status')
      .eq('status', 'paid');

    if (payErr) throw payErr;

    // Aggregate paid totals per contributor
    const totalsMap = {};
    const paidWeeksMap = {};
    (payments || []).forEach(p => {
      const cid = p.contributor_id;
      totalsMap[cid] = (totalsMap[cid] || 0) + (parseFloat(p.amount) || FIXED_WEEKLY_AMOUNT);
      paidWeeksMap[cid] = (paidWeeksMap[cid] || 0) + 1;
    });

    const enrichedContributors = (contributors || []).map(c => ({
      ...c,
      total_contributed: totalsMap[c.id] || 0.00,
      paid_weeks_count: paidWeeksMap[c.id] || 0
    }));

    res.json({ contributors: enrichedContributors });
  } catch (err) {
    next(err);
  }
};

// 2. Create new contributor
const createContributor = async (req, res, next) => {
  try {
    const { name, phone, notes, start_date } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Contributor name is required.' });
    }

    const formattedStartDate = start_date ? start_date : new Date().toISOString().split('T')[0];

    // Try RPC first
    const { data: rpcData, error: rpcErr } = await supabase.rpc('fn_create_contributor', {
      p_name: name.trim(),
      p_phone: phone ? phone.trim() : null,
      p_notes: notes ? notes.trim() : null,
      p_start_date: formattedStartDate
    });

    if (!rpcErr && rpcData && rpcData.length > 0) {
      return res.status(201).json({ contributor: rpcData[0] });
    }

    // Fallback: Manual code generation if RPC is missing
    const { data: lastContributor } = await supabase
      .from('contributors')
      .select('contributor_code')
      .order('created_at', { ascending: false })
      .limit(1);

    let nextNum = 1;
    if (lastContributor && lastContributor.length > 0) {
      const match = lastContributor[0].contributor_code.match(/FS-(\d+)/);
      if (match) nextNum = parseInt(match[1], 10) + 1;
    }

    const contributor_code = `FS-${String(nextNum).padStart(4, '0')}`;

    const { data: inserted, error: insertErr } = await supabase
      .from('contributors')
      .insert([{
        contributor_code,
        name: name.trim(),
        phone: phone ? phone.trim() : null,
        notes: notes ? notes.trim() : null,
        start_date: formattedStartDate
      }])
      .select()
      .single();

    if (insertErr) throw insertErr;

    res.status(201).json({ contributor: inserted });
  } catch (err) {
    next(err);
  }
};

// 3. Get contributor by ID
const getContributorById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: contributor, error } = await supabase
      .from('contributors')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !contributor) {
      return res.status(404).json({ error: 'Contributor not found.' });
    }

    const { data: payments } = await supabase
      .from('contribution_payments')
      .select('amount, status')
      .eq('contributor_id', id)
      .eq('status', 'paid');

    const total_contributed = (payments || []).reduce((sum, p) => sum + (parseFloat(p.amount) || FIXED_WEEKLY_AMOUNT), 0);
    const paid_weeks_count = (payments || []).length;

    res.json({
      contributor: {
        ...contributor,
        total_contributed,
        paid_weeks_count
      }
    });
  } catch (err) {
    next(err);
  }
};

// 4. Delete contributor
const deleteContributor = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('contributors')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ success: true, message: 'Contributor deleted successfully.', id });
  } catch (err) {
    next(err);
  }
};

// 5. Get contributor payment history
const getContributorPayments = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { from, to, status } = req.query;

    let query = supabase
      .from('contribution_payments')
      .select('*')
      .eq('contributor_id', id)
      .order('week_date', { ascending: false });

    if (from) query = query.gte('week_date', from);
    if (to) query = query.lte('week_date', to);
    if (status && status !== 'all') query = query.eq('status', status);

    const { data: payments, error } = await query;
    if (error) throw error;

    res.json({ payments: payments || [] });
  } catch (err) {
    next(err);
  }
};

// 6. Toggle weekly contribution (Paid / Missed)
const toggleContribution = async (req, res, next) => {
  try {
    const { id: contributor_id } = req.params;
    const { week_date, status, date_paid, notes } = req.body;

    if (!week_date) {
      return res.status(400).json({ error: 'Week date is required.' });
    }

    if (!status || !['paid', 'missed'].includes(status)) {
      return res.status(400).json({ error: 'Status must be paid or missed.' });
    }

    const amount = status === 'paid' ? FIXED_WEEKLY_AMOUNT : 0.00;
    const actualDatePaid = status === 'paid' ? (date_paid || new Date().toISOString().split('T')[0]) : null;

    // Try RPC fn_toggle_contribution first
    const { data: rpcData, error: rpcErr } = await supabase.rpc('fn_toggle_contribution', {
      p_contributor_id: contributor_id,
      p_week_date: week_date,
      p_status: status,
      p_date_paid: actualDatePaid,
      p_notes: notes || null,
      p_amount: amount
    });

    if (!rpcErr && rpcData && rpcData.length > 0) {
      return res.json({ payment: rpcData[0] });
    }

    // Fallback: Direct UPSERT
    const { data: updated, error: upsertErr } = await supabase
      .from('contribution_payments')
      .upsert({
        contributor_id,
        week_date,
        status,
        amount,
        date_paid: actualDatePaid,
        notes: notes ? notes.trim() : null
      }, {
        onConflict: 'contributor_id,week_date'
      })
      .select()
      .single();

    if (upsertErr) throw upsertErr;

    res.json({ payment: updated });
  } catch (err) {
    next(err);
  }
};

// 7. Get weekly status across all contributors for a specific week_date
const getWeeklyContributions = async (req, res, next) => {
  try {
    const week_date = req.query.week_date || getMondayDate();

    // Fetch all contributors
    const { data: contributors, error: cErr } = await supabase
      .from('contributors')
      .select('*')
      .order('contributor_code', { ascending: true });

    if (cErr) throw cErr;

    // Fetch payments for this specific week_date
    const { data: payments, error: pErr } = await supabase
      .from('contribution_payments')
      .select('*')
      .eq('week_date', week_date);

    if (pErr) throw pErr;

    const paymentsMap = {};
    (payments || []).forEach(p => {
      paymentsMap[p.contributor_id] = p;
    });

    const records = (contributors || []).map(c => {
      const payment = paymentsMap[c.id];
      return {
        contributor_id: c.id,
        contributor_code: c.contributor_code,
        name: c.name,
        phone: c.phone,
        start_date: c.start_date,
        week_date,
        status: payment ? payment.status : 'unmarked',
        amount: payment && payment.status === 'paid' ? parseFloat(payment.amount) : 0.00,
        date_paid: payment ? payment.date_paid : null,
        payment_id: payment ? payment.id : null
      };
    });

    res.json({ week_date, records });
  } catch (err) {
    next(err);
  }
};

// 8. Get overall foodstuffs scheme metrics & stats
const getContributionStats = async (req, res, next) => {
  try {
    const currentWeekMonday = getMondayDate();

    // Total contributors count
    const { count: contributors_count, error: cErr } = await supabase
      .from('contributors')
      .select('*', { count: 'exact', head: true });

    if (cErr) throw cErr;

    // Sum of all paid payments
    const { data: paidPayments, error: pErr } = await supabase
      .from('contribution_payments')
      .select('amount')
      .eq('status', 'paid');

    if (pErr) throw pErr;

    const grand_total = (paidPayments || []).reduce((sum, p) => sum + (parseFloat(p.amount) || FIXED_WEEKLY_AMOUNT), 0);
    const total_paid_weeks = (paidPayments || []).length;

    // Current week collection stats
    const { data: currentWeekPayments, error: cwErr } = await supabase
      .from('contribution_payments')
      .select('status')
      .eq('week_date', currentWeekMonday);

    if (cwErr) throw cwErr;

    const current_week_paid_count = (currentWeekPayments || []).filter(p => p.status === 'paid').length;
    const current_week_missed_count = (currentWeekPayments || []).filter(p => p.status === 'missed').length;

    res.json({
      stats: {
        grand_total,
        total_paid_weeks,
        contributors_count: contributors_count || 0,
        current_week_monday: currentWeekMonday,
        current_week_paid_count,
        current_week_missed_count,
        fixed_weekly_amount: FIXED_WEEKLY_AMOUNT
      }
    });
  } catch (err) {
    next(err);
  }
};

// 9. Batch toggle contribution status for multiple contributors
const batchToggleContributions = async (req, res, next) => {
  try {
    const { week_date, status, contributor_ids, notes } = req.body;

    if (!week_date) {
      return res.status(400).json({ error: 'Week date is required.' });
    }

    if (!status || !['paid', 'missed'].includes(status)) {
      return res.status(400).json({ error: 'Status must be paid or missed.' });
    }

    let targetIds = contributor_ids;

    // If contributor_ids is not passed or empty array, target all contributors
    if (!targetIds || !Array.isArray(targetIds) || targetIds.length === 0) {
      const { data: allContributors, error: cErr } = await supabase
        .from('contributors')
        .select('id');
      if (cErr) throw cErr;
      targetIds = (allContributors || []).map(c => c.id);
    }

    if (targetIds.length === 0) {
      return res.json({ success: true, count: 0, message: 'No contributors found to mark.' });
    }

    const amount = status === 'paid' ? FIXED_WEEKLY_AMOUNT : 0.00;
    const actualDatePaid = status === 'paid' ? new Date().toISOString().split('T')[0] : null;

    const upsertRows = targetIds.map(cid => ({
      contributor_id: cid,
      week_date,
      status,
      amount,
      date_paid: actualDatePaid,
      notes: notes ? notes.trim() : null
    }));

    const { data: updated, error: upsertErr } = await supabase
      .from('contribution_payments')
      .upsert(upsertRows, {
        onConflict: 'contributor_id,week_date'
      })
      .select();

    if (upsertErr) throw upsertErr;

    res.json({
      success: true,
      count: (updated || []).length,
      status,
      week_date
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getContributors,
  createContributor,
  getContributorById,
  deleteContributor,
  getContributorPayments,
  toggleContribution,
  getWeeklyContributions,
  getContributionStats,
  batchToggleContributions
};
