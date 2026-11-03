/**
 * Base AI Provider Interface
 * All AI providers (Gemini, OpenRouter, Local Fallback) must implement this interface.
 */
export class BaseAIProvider {
  constructor(name = 'base') {
    this.name = name;
  }

  /**
   * Generates a conversational response from a message history and system context
   * @param {Array<{role: string, content: string}>} messages
   * @param {Object} options
   * @returns {Promise<{text: string, usage?: Object}>}
   */
  async generateResponse(messages, options = {}) {
    throw new Error('generateResponse must be implemented by provider');
  }

  /**
   * Real-time streaming response
   * @param {Array<{role: string, content: string}>} messages
   * @param {Object} options
   * @param {Function} onChunk
   */
  async generateStreamResponse(messages, options = {}, onChunk = () => {}) {
    throw new Error('generateStreamResponse must be implemented by provider');
  }

  /**
   * Generates a validated structured JSON response according to a schema
   * @param {string} prompt
   * @param {Object} schema
   * @param {Object} options
   * @returns {Promise<Object>}
   */
  async generateStructuredResponse(prompt, schema, options = {}) {
    throw new Error('generateStructuredResponse must be implemented by provider');
  }

  /**
   * Analyzes productivity data (tasks, overdue, completion rates, focus)
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  async analyzeProductivity(data) {
    throw new Error('analyzeProductivity must be implemented by provider');
  }

  /**
   * Analyzes habit consistency, streaks, and patterns
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  async analyzeHabits(data) {
    throw new Error('analyzeHabits must be implemented by provider');
  }

  /**
   * Analyzes workout history, volume progression, and rest intervals
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  async analyzeWorkouts(data) {
    throw new Error('analyzeWorkouts must be implemented by provider');
  }

  /**
   * Analyzes dietary intake, macro balance, and hydration
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  async analyzeNutrition(data) {
    throw new Error('analyzeNutrition must be implemented by provider');
  }

  /**
   * Generates comprehensive weekly progress dossier
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  async generateWeeklyReport(data) {
    throw new Error('generateWeeklyReport must be implemented by provider');
  }

  /**
   * Generates proactive, personalized suggestions
   * @param {Object} data
   * @returns {Promise<Array<Object>>}
   */
  async generateSuggestions(data) {
    throw new Error('generateSuggestions must be implemented by provider');
  }

  /**
   * Connection diagnostic test
   */
  async testConnection() {
    return { success: true, connected: true, provider: this.name };
  }
}
