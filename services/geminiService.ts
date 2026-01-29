
import { GoogleGenAI, Type } from "@google/genai";
import { MarketInsight, NewsArticle } from "../types";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async getTokenInsights(symbol: string, name: string): Promise<MarketInsight> {
    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analyze the current market sentiment and recent developments for the token ${name} (${symbol}). 
        Provide the following sections:
        1. SUMMARY: A concise analysis.
        2. SENTIMENT: Bullish, Bearish, or Neutral.
        3. SCORE: A number from 0-100.
        4. STRATEGIES: Provide exactly 3 short, actionable trading strategies.
        Focus on real-time news and technical outlook.`,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const text = response.text || "Unable to generate insights.";
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const sources = chunks.map((chunk: any) => ({
        title: chunk.web?.title || "Search Result",
        uri: chunk.web?.uri || "#"
      })).filter((s: any) => s.uri !== "#");

      let sentiment: 'Bullish' | 'Bearish' | 'Neutral' = 'Neutral';
      if (text.toLowerCase().includes('bullish')) sentiment = 'Bullish';
      else if (text.toLowerCase().includes('bearish')) sentiment = 'Bearish';

      const scoreMatch = text.match(/score:\s*(\d+)/i);
      const score = scoreMatch ? parseInt(scoreMatch[1]) : 50;

      const strategySection = text.split(/strategies:/i)[1] || "";
      const strategies = strategySection
        .split('\n')
        .map(s => s.trim().replace(/^[\d\.\-\*]\s*/, ''))
        .filter(s => s.length > 10)
        .slice(0, 3);

      return {
        summary: text.split(/sentiment:|score:|strategies:/i)[0].trim(),
        sentiment,
        score,
        sources: sources.slice(0, 5),
        strategies: strategies.length > 0 ? strategies : ["Watch key levels", "Manage risk", "Monitor volume"]
      };
    } catch (error) {
      console.error("Gemini Insight Error:", error);
      throw error;
    }
  }

  async getMarketNews(category: string = 'crypto'): Promise<NewsArticle[]> {
    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Find the 7 most recent and relevant financial news headlines for the ${category} market. 
        For each news item, provide:
        - Title
        - Source
        - A relative time (e.g., "2 hours ago")
        Format the response as a JSON list of objects with keys: title, source, time.`,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                source: { type: Type.STRING },
                time: { type: Type.STRING }
              },
              required: ["title", "source", "time"]
            }
          }
        },
      });

      const jsonStr = response.text.trim();
      const articles = JSON.parse(jsonStr);
      
      // Map grounding chunks to URLs for the headlines
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      return articles.map((art: any, index: number) => ({
        ...art,
        url: chunks[index]?.web?.uri || "https://finance.google.com"
      }));
    } catch (error) {
      console.error("Gemini News Error:", error);
      return [];
    }
  }
}

export const gemini = new GeminiService();
