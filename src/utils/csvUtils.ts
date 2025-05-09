// Define the Ticket interface here since we can't import it in CommonJS
interface Ticket {
  year: number;
  date: string;
  venue: string;
  city_state: string;
  imageUrl: string;
  net_link: string;
}

export const exportToCsv = (tickets: Ticket[]): string => {
  const headers = ['year', 'date', 'venue', 'city_state', 'imageUrl', 'net_link'];
  const csvContent = [
    headers.join(','),
    ...tickets.map((ticket: Ticket) => [
      ticket.year,
      `"${ticket.date.replace(/"/g, '""')}"`,
      `"${ticket.venue.replace(/"/g, '""')}"`,
      `"${ticket.city_state.replace(/"/g, '""')}"`,
      `"${ticket.imageUrl.replace(/"/g, '""')}"`,
      `"${ticket.net_link.replace(/"/g, '""')}"`
    ].join(','))
  ].join('\n');
  
  return csvContent;
};

export const importFromCsv = (csvContent: string): Ticket[] => {
  const lines = csvContent.split('\n');
  const tickets: Ticket[] = [];
  
  // Skip empty lines and header
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Split the line while respecting quoted values
    const values = [];
    let currentValue = '';
    let inQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      
      if (char === '"') {
        if (inQuotes && line[j + 1] === '"') {
          // Escaped quote
          currentValue += '"';
          j++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        values.push(currentValue);
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    values.push(currentValue);
    
    if (values.length >= 6) {
      const ticket: Ticket = {
        year: parseInt(values[0]),
        date: values[1].replace(/^"|"$/g, '').replace(/""/g, '"'),
        venue: values[2].replace(/^"|"$/g, '').replace(/""/g, '"'),
        city_state: values[3].replace(/^"|"$/g, '').replace(/""/g, '"'),
        imageUrl: values[4].replace(/^"|"$/g, '').replace(/""/g, '"'),
        net_link: values[5].replace(/^"|"$/g, '').replace(/""/g, '"')
      };
      tickets.push(ticket);
    }
  }
  
  return tickets;
}; 