import { ticketData } from '@/data/tickets';

interface TicketSummary {
  year: number;
  count: number;
  title: string;
  description: string;
  imageUrl: string;
}

export class DataService {
  private static instance: DataService;

  private constructor() {}

  public static getInstance(): DataService {
    if (!DataService.instance) {
      DataService.instance = new DataService();
    }
    return DataService.instance;
  }

  async getYears(): Promise<number[]> {
    return ticketData.years;
  }

  async getTicketsByYear(year: number): Promise<TicketSummary[]> {
    return ticketData.tickets.filter((ticket: TicketSummary) => ticket.year === year);
  }
} 