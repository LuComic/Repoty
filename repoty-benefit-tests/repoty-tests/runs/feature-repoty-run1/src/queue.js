const PRIORITY_ORDER = {
  urgent: 4,
  high: 3,
  normal: 2,
  low: 1,
};

export class TicketQueue {
  constructor() {
    this.items = [];
  }

  add(ticket) {
    this.items.push(ticket);
  }

  next() {
    return this.items.reduce((nextTicket, ticket) => {
      if (ticket.closed) return nextTicket;
      if (!nextTicket) return ticket;

      return PRIORITY_ORDER[ticket.priority] > PRIORITY_ORDER[nextTicket.priority]
        ? ticket
        : nextTicket;
    }, null);
  }

  close(id) {
    const ticket = this.items.find((item) => item.id === id);
    if (ticket) ticket.closed = true;
    return ticket ?? null;
  }
}
