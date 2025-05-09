declare module '../data/tickets.json' {
  interface Ticket {
    year: number;
    title: string;
    description: string;
    imageUrl: string;
    details: string;
  }

  const data: {
    years: number[];
    tickets: Ticket[];
  };

  export default data;
} 