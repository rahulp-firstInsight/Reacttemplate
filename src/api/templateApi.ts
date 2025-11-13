// Remove this line
// import { access } from "fs";
import axios from 'axios';
// API Configuration
export const API_CONFIG = {
  BASE_URL: 'http://localhost:8080', // Live backend API server (updated to port 8080)
  AI_SCRIBE_URL: 'https://aiscribeqa.maximeyes.com:5005', // AI Scribe processing server
  ENDPOINTS: {
    TEMPLATES: '/api/templates',
    DOMAINS: '/api/domains',
    CREATE_TEMPLATE: '/api/templates',
    UPDATE_TEMPLATE: (id: string) => `/api/templates/${id}`,
    DELETE_TEMPLATE: (id: string) => `/api/templates/${id}`,
    AI_PROCESS: '/process',
    AI_TEMPLATES: '/templates' // New endpoint for templates in AI Scribe
  },
  // Add your authentication headers here
  HEADERS: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer dev-token' // Development token
  }
};

// Template API interface for type safety
export interface ApiTemplate {
  id?: string;
  name?: string;
  templateName?: string;
  description?: string;
  domain?: string;
  category?: string;
  created?: string;
  createdAt?: string;
  sections?: any[];
}

// API Response types
export interface TemplateApiResponse {
  data: ApiTemplate[];
  message?: string;
  status: 'success' | 'error';
  total?: number;
}

// AI Scribe processing interface
export interface AIProcessRequest {
  templateId?: string;
  templateData?: any;
  configuration?: any;
  inputData?: any;
  processingOptions?: {
    mode?: 'draft' | 'final';
    format?: 'text' | 'structured';
    includeMetadata?: boolean;
  };
}

export interface AIProcessResponse {
  success: boolean;
  data?: any;
  processedContent?: string;
  metadata?: any;
  error?: string;
  timestamp?: string;
}

// Example API call functions (you can import and use these in your components)
export const templateApi = {
  // Fetch all templates
  getTemplates: async (): Promise<ApiTemplate[]> => {
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.TEMPLATES}`, {
      method: 'GET',
      headers: API_CONFIG.HEADERS,
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data || data; // Handle different response formats
  },

  // NEW METHOD: Fetch all templates from AI Scribe
  getTemplatesFromAIScribe: async (): Promise<ApiTemplate[]> => {
    try {
      console.log('🔍 Fetching templates from AI Scribe...');
      
      const response = await axios.get(`${API_CONFIG.AI_SCRIBE_URL}${API_CONFIG.ENDPOINTS.AI_TEMPLATES}`, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          // Add any authentication headers required by AI Scribe API
        },
      });

      console.log('📡 AI Scribe templates response status:', response.status);

      if (response.status !== 200) {
        console.error('❌ AI Scribe API error:', response.data);
        throw new Error(`AI Scribe API error! status: ${response.status}, message: ${response.data}`);
      }

      console.log('📡 AI Scribe templates response status:', response.status);

      if (response.status !== 200) {
        console.error('❌ AI Scribe API error:', response.data);
        throw new Error(`AI Scribe API error! status: ${response.status}, message: ${response.data}`);
      }

      const result = response.data;
      console.log('✅ AI Scribe templates retrieved:', result);

      return result.data || result;
    } catch (error) {
      console.error('💥 Error fetching templates from AI Scribe:', error);
      throw error;
    }
  },

  // Create new template in AI Scribe
  // Implementation consolidated below to avoid duplicate property names.

  // Create new template
  createTemplate: async (template: Partial<ApiTemplate>): Promise<ApiTemplate> => {
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CREATE_TEMPLATE}`, {
      method: 'POST',
      headers: API_CONFIG.HEADERS,
      body: JSON.stringify(template),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  },

  // NEW METHOD: Create new template in AI Scribe
  createTemplateInAIScribe: async (template: Partial<ApiTemplate>): Promise<ApiTemplate> => {
    try {
      console.log('📝 Creating template in AI Scribe:', template);
      
      const response = await fetch(`${API_CONFIG.AI_SCRIBE_URL}${API_CONFIG.ENDPOINTS.AI_TEMPLATES}`, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          // Add any authentication headers required by AI Scribe API
        },
        body: JSON.stringify(template),
      });
      
      console.log('📡 AI Scribe create template response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ AI Scribe API error:', errorText);
        throw new Error(`AI Scribe API error! status: ${response.status}, message: ${errorText}`);
      }
      
      const result = await response.json();
      console.log('✅ AI Scribe template created:', result);
      
      return result;
    } catch (error) {
      console.error('💥 Error creating template in AI Scribe:', error);
      throw error;
    }
  },

  // Update template
  updateTemplate: async (id: string, template: Partial<ApiTemplate>): Promise<ApiTemplate> => {
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.UPDATE_TEMPLATE(id)}`, {
      method: 'PUT',
      headers: API_CONFIG.HEADERS,
      body: JSON.stringify(template),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  },

  // NEW METHOD: Update template in AI Scribe
  updateTemplateInAIScribe: async (id: string, template: Partial<ApiTemplate>): Promise<ApiTemplate> => {
    try {
      console.log('🔄 Updating template in AI Scribe:', { id, template });
      
      const response = await fetch(`${API_CONFIG.AI_SCRIBE_URL}${API_CONFIG.ENDPOINTS.AI_TEMPLATES}/${id}`, {
        method: 'PUT',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          // Add any authentication headers required by AI Scribe API
        },
        body: JSON.stringify(template),
      });
      
      console.log('📡 AI Scribe update template response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ AI Scribe API error:', errorText);
        throw new Error(`AI Scribe API error! status: ${response.status}, message: ${errorText}`);
      }
      
      const result = await response.json();
      console.log('✅ AI Scribe template updated:', result);
      
      return result;
    } catch (error) {
      console.error('💥 Error updating template in AI Scribe:', error);
      throw error;
    }
  },

  // Delete template
  deleteTemplate: async (id: string): Promise<void> => {
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.DELETE_TEMPLATE(id)}`, {
      method: 'DELETE',
      headers: API_CONFIG.HEADERS,
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  },

  // NEW METHOD: Delete template in AI Scribe
  deleteTemplateInAIScribe: async (id: string): Promise<void> => {
    try {
      console.log('🗑️ Deleting template in AI Scribe:', id);
      
      const response = await fetch(`${API_CONFIG.AI_SCRIBE_URL}${API_CONFIG.ENDPOINTS.AI_TEMPLATES}/${id}`, {
        method: 'DELETE',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          // Add any authentication headers required by AI Scribe API
        },
      });
      
      console.log('📡 AI Scribe delete template response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ AI Scribe API error:', errorText);
        throw new Error(`AI Scribe API error! status: ${response.status}, message: ${errorText}`);
      }
      
      console.log('✅ AI Scribe template deleted');
    } catch (error) {
      console.error('💥 Error deleting template in AI Scribe:', error);
      throw error;
    }
  },

  // Process data with AI Scribe
  processWithAIScribe: async (data: AIProcessRequest): Promise<AIProcessResponse> => {
    try {
      console.log('🚀 Sending AI Scribe request:', {
        url: `${API_CONFIG.AI_SCRIBE_URL}${API_CONFIG.ENDPOINTS.AI_PROCESS}`,
        data: data
      });

      const response = await fetch(`${API_CONFIG.AI_SCRIBE_URL}${API_CONFIG.ENDPOINTS.AI_PROCESS}`, {
        method: 'POST',
        mode: 'cors', // Handle CORS
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          // Add any authentication headers required by AI Scribe API
          // 'Authorization': 'Bearer your-token-here',
        },
        body: JSON.stringify(data),
      });
      
      console.log('📡 AI Scribe response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ AI Scribe API error:', errorText);
        throw new Error(`AI Scribe API error! status: ${response.status}, message: ${errorText}`);
      }
      
      const result = await response.json();
      console.log('✅ AI Scribe success response:', result);
      
      return {
        success: true,
        ...result,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('💥 AI Scribe processing error:', error);
      
      // Handle different types of errors
      let errorMessage = 'Unknown error occurred';
      
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        errorMessage = 'Network error: Cannot connect to AI Scribe server. Please check your internet connection and server availability.';
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      return {
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString()
      };
    }
  }
};