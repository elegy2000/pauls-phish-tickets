import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const API_KEY = process.env.PHISHNET_API_KEY;
console.log('API Key exists:', API_KEY ? 'Yes' : 'No');

async function testAPI() {
  try {
    // Test 1: Simple endpoint that doesn't require authentication
    console.log('\nTest 1: Basic API test (shows/recent)');
    const recentResponse = await axios.get('https://api.phish.net/v5/shows/recent.json');
    console.log('Recent shows response status:', recentResponse.status);
    console.log('Data received:', recentResponse.data?.response?.count || 0);
    
    // Test 2: Test with authentication
    console.log('\nTest 2: API test with authentication (shows/query)');
    const authResponse = await axios.get('https://api.phish.net/v5/shows/query.json', {
      params: { 
        apikey: API_KEY,
        year: '2023' 
      }
    });
    console.log('Shows query response status:', authResponse.status);
    console.log('Data sample:', JSON.stringify(authResponse.data).substring(0, 200) + '...');
    
    // Test 3: Get detailed API response structure
    console.log('\nTest 3: API response structure');
    const structureResponse = await axios.get('https://api.phish.net/v5/shows/tiph.json');
    console.log('Structure response:', JSON.stringify(structureResponse.data, null, 2));
    
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('API Error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers
      });
    } else {
      console.error('Error:', error);
    }
  }
}

// Run the test
testAPI(); 