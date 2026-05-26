/**
 * Standalone Gemma/Gemini 4 API Test Script
 * Powered by Google GenAI Node.js SDK
 *
 * Requirements:
 * 1. Install dependencies:
 *    npm install @google/genai mime
 *    npm install -D typescript @types/node ts-node
 *
 * 2. Set your environment variable:
 *    Windows (PowerShell): $env:GEMINI_API_KEY="your_api_key_here"
 *    Windows (CMD): set GEMINI_API_KEY=your_api_key_here
 *
 * 3. Execute:
 *    npx ts-node test-gemma.ts
 */
import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';


async function main() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error('\x1b[31mError: GEMINI_API_KEY environment variable is not set.\x1b[0m');
    console.log('Please set it using:');
    console.log('  PowerShell: $env:GEMINI_API_KEY="your_key"');
    console.log('  CMD:        set GEMINI_API_KEY=your_key\n');
    return;
  }

  console.log('\x1b[36mInitializing Google GenAI Client...\x1b[0m');
  const ai = new GoogleGenAI({ apiKey });

  const tools = [
    {
      googleSearch: {}
    }
  ];

  // Using the new thinking configuration & search grounding
  const config: any = {
    thinkingConfig: {
      // Using string literal 'HIGH' with any casting to ensure absolute cross-version compatibility
      thinkingLevel: 'HIGH',
    },
    tools,
  };


  const model = 'gemma-4-31b-it';
  const query = 'What are the top 3 critically acclaimed sci-fi movies of the last 2 years?';

  console.log(`\n\x1b[33mSending Query to ${model}:\x1b[0m "${query}"`);
  console.log('\x1b[32mStreaming response...\x1b[0m\n');

  try {
    const responseStream = await ai.models.generateContentStream({
      model,
      config,
      contents: [
        {
          role: 'user',
          parts: [{ text: query }]
        }
      ]
    });

    for await (const chunk of responseStream) {
      if (chunk.text) {
        process.stdout.write(chunk.text);
      }
    }
    console.log('\n\n\x1b[32mStream completed successfully!\x1b[0m');
  } catch (error: any) {
    console.error('\n\x1b[31mExecution failed:\x1b[0m', error?.message || error);
  }
}

main();
