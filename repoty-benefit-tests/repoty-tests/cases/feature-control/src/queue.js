export class TicketQueue {
  constructor() {
    this.items = [];
  }

  add(ticket) {
    this.items.push(ticket);
  }

  next() {
    return this.items.find((ticket) => !ticket.closed) ?? null;
  }

  close(id) {
    const ticket = this.items.find((item) => item.id === id);
    if (ticket) ticket.closed = true;
    return ticket ?? null;
  }
}
