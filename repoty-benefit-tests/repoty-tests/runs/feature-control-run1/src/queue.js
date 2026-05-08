const PRIORITY_RANK = {
  low: 0,
  normal: 1,
  high: 2,
  urgent: 3,
};

export class TicketQueue {
  constructor() {
    this.items = [];
  }

  add(ticket) {
    this.items.push(ticket);
  }

  next() {
    let nextTicket = null;
    let nextRank = -1;

    for (const ticket of this.items) {
      if (ticket.closed) continue;

      const rank = PRIORITY_RANK[ticket.priority] ?? PRIORITY_RANK.normal;
      if (rank > nextRank) {
        nextTicket = ticket;
        nextRank = rank;
      }
    }

    return nextTicket;
  }

  close(id) {
    const ticket = this.items.find((item) => item.id === id);
    if (ticket) ticket.closed = true;
    return ticket ?? null;
  }
}
