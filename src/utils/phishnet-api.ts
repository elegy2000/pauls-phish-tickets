import axios from 'axios';

const PHISHNET_API_BASE = 'https://api.phish.net/v5';

export type PhishNetShow = {
  showid: string;
  showdate: string;
  venuename: string;
  city: string;
  state: string;
  country: string;
  tour: string;
};

export default class PhishNetAPI {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async makeRequest(method: string, params: Record<string, string> = {}) {
    try {
      const url = `${PHISHNET_API_BASE}/${method}.json`;
      console.log(`Making request to ${url}`);
      console.log('Request params:', { ...params, apikey: '***' });
      
      const response = await axios.get(url, {
        params: {
          apikey: this.apiKey,
          ...params,
        },
        headers: {
          'User-Agent': 'PaulsTicketSite/1.0',
          'Accept': 'application/json',
        }
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      console.log('Response data:', JSON.stringify(response.data, null, 2));
      
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('PhishNet API Error:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          headers: error.response?.headers,
          config: {
            url: error.config?.url,
            params: error.config?.params ? { ...error.config.params, apikey: '***' } : undefined,
            headers: error.config?.headers
          }
        });
      } else {
        console.error('PhishNet API Error:', error);
      }
      throw error;
    }
  }

  private getDaysInMonth(year: number, month: number): number {
    return new Date(year, month, 0).getDate();
  }

  async getAllShows(): Promise<PhishNetShow[]> {
    // Fetch shows in batches by year range
    const allShows: PhishNetShow[] = [];
    const startYear = 1983;
    const endYear = new Date().getFullYear();
    
    for (let year = startYear; year <= endYear; year++) {
      console.log(`Fetching shows for year ${year}...`);
      
      // Try each month
      for (let month = 1; month <= 12; month++) {
        const daysInMonth = this.getDaysInMonth(year, month);
        
        // Try each day
        for (let day = 1; day <= daysInMonth; day++) {
          const date = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
          try {
            const data = await this.makeRequest(`shows/showdate/${date}`);
            
            if (data.data && Array.isArray(data.data) && data.data.length > 0) {
              allShows.push(...data.data);
            }
            
            // Add a small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));
          } catch (error) {
            // Skip invalid dates
            if (axios.isAxiosError(error) && error.response?.status === 500) {
              continue;
            }
            throw error;
          }
        }
      }
    }
    
    return allShows;
  }

  async getShowsByYear(year: string): Promise<PhishNetShow[]> {
    const allShows: PhishNetShow[] = [];
    const yearNum = parseInt(year);
    
    // Try each month
    for (let month = 1; month <= 12; month++) {
      const daysInMonth = this.getDaysInMonth(yearNum, month);
      
      // Try each day
      for (let day = 1; day <= daysInMonth; day++) {
        const date = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        try {
          const data = await this.makeRequest(`shows/showdate/${date}`);
          
          if (data.data && Array.isArray(data.data) && data.data.length > 0) {
            allShows.push(...data.data);
          }
          
          // Add a small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          // Skip invalid dates
          if (axios.isAxiosError(error) && error.response?.status === 500) {
            continue;
          }
          throw error;
        }
      }
    }
    
    return allShows;
  }

  async getShowsByTour(tourId: string): Promise<PhishNetShow[]> {
    const data = await this.makeRequest('shows/showtourid', {
      tourid: tourId
    });
    return data.data || [];
  }
} 