import { BusinessEvent, CashTransaction, EventFinancialSummary, DashboardStats } from '@/types';

/**
 * Calculates comprehensive financial metrics for a single event
 */
export function calculateEventFinances(event: BusinessEvent): EventFinancialSummary {
  const materials = event.materials || [];
  const expenses = event.expenses || [];
  const payments = event.payments || [];

  const materialExpenses = materials.reduce((sum, item) => {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.unit_price) || 0;
    return sum + (qty * price);
  }, 0);

  const additionalExpenses = expenses.reduce((sum, item) => {
    return sum + (Number(item.amount) || 0);
  }, 0);

  const totalExpenses = materialExpenses + additionalExpenses;
  const clientCharge = Number(event.total_client_charge) || 0;

  const totalReceived = payments.reduce((sum, p) => {
    return sum + (Number(p.amount) || 0);
  }, 0);

  const pendingPayment = Math.max(0, clientCharge - totalReceived);
  const expectedProfit = clientCharge - totalExpenses;

  // Paid event expenses: only expenses marked as 'paid'
  const paidAdditional = expenses
    .filter((e) => e.payment_status === 'paid')
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const paidMaterials = materials
    .filter((m) => (m as any).payment_status === 'paid')
    .reduce((sum, m) => sum + (Number(m.total_expense) || 0), 0);
  const paidExpenses = paidAdditional + paidMaterials;

  const unpaidAdditional = expenses
    .filter((e) => e.payment_status === 'unpaid')
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const unpaidMaterials = materials
    .filter((m) => (m as any).payment_status !== 'paid')
    .reduce((sum, m) => sum + (Number(m.total_expense) || 0), 0);
  const unpaidExpenses = unpaidAdditional + unpaidMaterials;

  return {
    materialExpenses,
    additionalExpenses,
    totalExpenses,
    clientCharge,
    totalReceived,
    pendingPayment,
    expectedProfit,
    paidExpenses,
    unpaidExpenses,
  };
}

/**
 * Calculates overall business dashboard stats and exact Business Balance:
 * Current Business Balance = Original Opening Balance + Total Client Payments Received
 *                           - Total Paid Event Expenses + Manual Money Added
 *                           - Manual Money Withdrawn
 */
export function calculateDashboardStats(
  events: BusinessEvent[],
  cashTransactions: CashTransaction[],
  openingBalance: number = 0
): DashboardStats {
  let completedEvents = 0;
  let upcomingEvents = 0;
  let cancelledEvents = 0;

  let totalRevenue = 0;
  let totalMaterialExpenses = 0;
  let totalAdditionalExpenses = 0;
  let totalExpenses = 0;
  let overallProfit = 0;
  let totalReceived = 0;
  let pendingPayments = 0;
  let totalPaidExpenses = 0;
  let unpaidExpenses = 0;

  for (const event of events) {
    if (event.status === 'completed') completedEvents++;
    else if (event.status === 'upcoming') upcomingEvents++;
    else if (event.status === 'cancelled') cancelledEvents++;

    // Non-cancelled events contribute to financials
    if (event.status !== 'cancelled') {
      const fin = calculateEventFinances(event);
      totalRevenue += fin.clientCharge;
      totalMaterialExpenses += fin.materialExpenses;
      totalAdditionalExpenses += fin.additionalExpenses;
      totalExpenses += fin.totalExpenses;
      overallProfit += fin.expectedProfit;
      totalReceived += fin.totalReceived;
      pendingPayments += fin.pendingPayment;
      totalPaidExpenses += fin.paidExpenses;
      unpaidExpenses += fin.unpaidExpenses;
    }
  }

  // Manual Money Management sums
  let manualMoneyAdded = 0;
  let manualMoneyWithdrawn = 0;

  for (const tx of cashTransactions) {
    if (tx.transaction_type === 'cash_added') {
      manualMoneyAdded += Number(tx.amount) || 0;
    } else if (tx.transaction_type === 'cash_withdrawn') {
      manualMoneyWithdrawn += Number(tx.amount) || 0;
    } else if (tx.transaction_type === 'correction') {
      const amt = Number(tx.amount) || 0;
      if (amt >= 0) {
        manualMoneyAdded += amt;
      } else {
        manualMoneyWithdrawn += Math.abs(amt);
      }
    }
  }

  // EXACT FORMULA REQUIRED BY SECTION E:
  // Current Business Balance = Original Opening Balance + Total Client Payments Received - Total Paid Event Expenses + Manual Money Added - Manual Money Withdrawn
  const currentBusinessBalance =
    openingBalance + totalReceived - totalPaidExpenses + manualMoneyAdded - manualMoneyWithdrawn;

  return {
    totalEvents: events.length,
    completedEvents,
    upcomingEvents,
    cancelledEvents,
    totalRevenue,
    totalMaterialExpenses,
    totalAdditionalExpenses,
    totalExpenses,
    overallProfit,
    totalReceived,
    pendingPayments,
    availableCash: currentBusinessBalance,
    currentBusinessBalance,
    openingCashBalance: openingBalance,
    totalClientPaymentsReceived: totalReceived,
    totalPaidExpenses,
    manualMoneyAdded,
    manualMoneyWithdrawn,
    unpaidExpenses,
  };
}
