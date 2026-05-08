export const plans = {
  starter: { id: 'starter', monthlyCents: 1200, seatsIncluded: 2 },
  growth: { id: 'growth', monthlyCents: 4900, seatsIncluded: 10 },
  scale: { id: 'scale', monthlyCents: 14900, seatsIncluded: 40 }
};
export function getPlan(id) { const p = plans[id]; if (!p) throw new Error(`Unknown plan ${id}`); return p; }
