import process from 'node:process'
import { config as dotenvConfig } from 'dotenv'

dotenvConfig()

interface Config {
  port: number
  deepseekApiKey: string
  deepseekModel: string
}

function loadConfig(): Config {
  const deepseekApiKey = process.env['DEEPSEEK_API_KEY']

  if (!deepseekApiKey) {
    throw new Error(
      'Missing DEEPSEEK_API_KEY. Check your .env file before starting.'
    )
  }

  return {
    port: parseInt(process.env['PORT'] ?? '3000', 10),
    deepseekApiKey,
    deepseekModel: process.env['DEEPSEEK_MODEL'] ?? 'deepseek-chat',
  }
}

export const config = loadConfig()