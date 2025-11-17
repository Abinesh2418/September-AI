const { GoogleGenerativeAI } = require('@google/generative-ai');
const OpenAI = require('openai');

class AIService {
  constructor() {
    this.provider = process.env.AI_PROVIDER || 'openai';
    this.setupClients();
  }

  setupClients() {
    // OpenAI setup
    const hasOpenAI = !!(process.env.OPENAI_API_KEY && String(process.env.OPENAI_API_KEY).trim());
    if (hasOpenAI) {
      this.openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }

    // Gemini setup
    const hasGemini = !!(process.env.GEMINI_API_KEY && String(process.env.GEMINI_API_KEY).trim());
    if (hasGemini) {
      this.geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      // Use the most stable and available model
      this.geminiModel = this.geminiClient.getGenerativeModel({ 
        model: 'gemini-1.5-flash' 
      });
      console.log('✅ Gemini client initialized with model: gemini-1.5-flash');
    }

    // Check if we have any working provider
    if (this.provider === 'gemini' && hasGemini) {
      this.hasAI = true;
      console.log('✅ AI Service enabled with Gemini provider');
    } else if (this.provider === 'openai' && hasOpenAI) {
      this.hasAI = true;
      console.log('✅ AI Service enabled with OpenAI provider');
    } else {
      this.hasAI = false;
      console.warn(`❌ AI Service disabled - Provider: ${this.provider}, Has API key: ${this.provider === 'gemini' ? hasGemini : hasOpenAI}`);
    }
  }

  async generateResponse(prompt, options = {}) {
    const MAX_CHARS = 8000;
    if (prompt.length > MAX_CHARS) {
      prompt = prompt.slice(prompt.length - MAX_CHARS);
    }

    if (!this.hasAI) {
      return this.getFallbackResponse(prompt, options);
    }

    try {
      if (this.provider === 'gemini') {
        return await this.callGemini(prompt, options);
      } else {
        return await this.callOpenAI(prompt, options);
      }
    } catch (error) {
      console.error(`AI service error (${this.provider}):`, error);
      return this.getFallbackResponse(prompt, options);
    }
  }

  async callOpenAI(prompt, options) {
    const model = options.model || 'gpt-4o-mini';
    const temperature = typeof options.temperature === 'number' ? options.temperature : 0.2;

    const response = await this.openaiClient.chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature,
      max_tokens: 1500
    });

    return {
      text: response.choices[0].message.content,
      usage: {
        tokens: response.usage.total_tokens,
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens
      }
    };
  }

  async callGemini(prompt, options) {
    const fallbackModels = [
      'gemini-1.5-flash',
      'gemini-1.5-flash-latest',
      'gemini-1.0-pro',
      'gemini-1.0-pro-latest',
      'gemini-pro'
    ];

    let lastError = null;
    
    for (const modelName of fallbackModels) {
      try {
        // Try this model
        const model = this.geminiClient.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // If successful, update our default model
        this.geminiModel = model;
        console.log(`✅ Successfully used Gemini model: ${modelName}`);

        return {
          text,
          usage: {
            // Gemini doesn't provide detailed token usage in the same format
            // You can implement token counting if needed
            tokens: Math.ceil(text.length / 4), // Rough estimation
            promptTokens: Math.ceil(prompt.length / 4),
            completionTokens: Math.ceil(text.length / 4)
          }
        };
      } catch (error) {
        lastError = error;
        console.log(`❌ Model ${modelName} failed:`, error.message.split('\n')[0]);
        continue;
      }
    }
    
    // If all models failed, throw the last error
    throw lastError || new Error('All Gemini models failed');
  }

  getFallbackResponse(prompt, options) {
    let fallback = options.fallback;
    if (!fallback) {
      // Try to extract last user message for a friendly echo
      const m = /User:\s*([\s\S]*?)$/i.exec(prompt);
      const lastUser = m ? m[1].trim() : null;
      fallback = lastUser
        ? `AI is not configured. Echoing your request: "${lastUser}". The app will still perform local actions (like creating tickets or access requests). To enable full AI responses, set ${this.provider.toUpperCase()}_API_KEY in .env.`
        : `AI is not configured. Local actions will still work. Set ${this.provider.toUpperCase()}_API_KEY in .env to enable full responses.`;
    }
    
    return {
      text: fallback,
      usage: null
    };
  }

  // Switch provider at runtime
  switchProvider(provider) {
    if (provider === 'openai' || provider === 'gemini') {
      this.provider = provider;
      this.setupClients();
      return true;
    }
    return false;
  }

  // Get current provider info
  getProviderInfo() {
    return {
      provider: this.provider,
      hasAI: this.hasAI,
      hasOpenAI: !!this.openaiClient,
      hasGemini: !!this.geminiClient
    };
  }
}

module.exports = new AIService();