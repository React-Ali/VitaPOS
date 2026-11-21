import { app } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync, existsSync } from 'fs'

const configPath = join(app.getPath('userData'), 'network-config.json')

interface NetworkConfig {
  mode: 'master' | 'client'
  masterIp: string
}

const defaultConfig: NetworkConfig = { mode: 'master', masterIp: '192.168.1.100' }

export const configService = {
  get(): NetworkConfig {
    if (!existsSync(configPath)) return defaultConfig
    try { return JSON.parse(readFileSync(configPath, 'utf8')) } catch { return defaultConfig }
  },
  set(config: NetworkConfig) {
    writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8')
  }
}