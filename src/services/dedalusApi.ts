/**
 * Dedalus Case Generation Service
 * Generates realistic clinical cases from medical literature
 */

import apiClient from './api';

interface CaseGenerationRequest {
  medical_condition: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

interface CaseGenerationResponse {
  case: {
    id?: string;
    title: string;
    chief_complaint: string;
    clinical_scenario: string;
    differential_diagnoses: string[];
    red_flags: string[];
    learning_objectives: string[];
    literature_reference?: string;
  };
  source: string;
  literature_reference?: string;
}

interface LiteratureSearchResponse {
  query: string;
  results: Array<{
    id: string;
    title: string;
    abstract: string;
    pmid: string;
    url: string;
  }>;
  count: number;
  source: string;
}

const dedalusApi = {
  /**
   * Generate a realistic patient case from medical literature using Dedalus
   */
  async generateCaseFromLiterature(
    request: CaseGenerationRequest
  ): Promise<CaseGenerationResponse> {
    try {
      const response = await apiClient.post('/api/dedalus/generate-case', request);
      console.log('📚 Dedalus generated case:', response.data.case.title);
      return response.data;
    } catch (error) {
      console.error('Error generating case from literature:', error);
      throw error;
    }
  },

  /**
   * Search medical literature (PubMed) for a query
   */
  async searchMedicalLiterature(
    query: string,
    maxResults: number = 5
  ): Promise<LiteratureSearchResponse> {
    try {
      const response = await apiClient.post('/api/dedalus/search-literature', {
        query,
        max_results: maxResults,
      });
      console.log(`📖 Found ${response.data.count} literature results for: ${query}`);
      return response.data;
    } catch (error) {
      console.error('Error searching literature:', error);
      throw error;
    }
  },

  /**
   * Generate a case for a specific medical condition with difficulty level
   */
  async generateConditionCase(
    condition: string,
    difficulty: 'easy' | 'medium' | 'hard' = 'medium'
  ): Promise<CaseGenerationResponse> {
    return this.generateCaseFromLiterature({
      medical_condition: condition,
      difficulty,
    });
  },
};

export default dedalusApi;
