export class TicketQueue {
  constructor() {
    this.items = [];
  }

  add(ticket) {
    this.items.push(ticket);
  }

  next() {
    const priorityRank = { urgent: 4, high: 3, normal: 2, low: 1 };
    let nextTicket = null;

    for (const ticket of this.items) {
      if (ticket.closed) continue;
      if (!nextTicket || priorityRank[ticket.priority] > priorityRank[nextTicket.priority]) {
        nextTicket = ticket;
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
