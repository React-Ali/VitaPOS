import { configService } from '../config'

export async function callMasterServer(channel: string, args: any[]) {
  const config = configService.get()
  const url = `http://${config.masterIp}:3001/rpc`
  
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 seconds max wait

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channel, args }),
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)

    if (!response.ok) {
      const errData = await response.json()
      throw new Error(errData.error || `Connection refused by Master PC at ${config.masterIp}`)
    }

    const json = await response.json()
    if (!json.success) throw new Error(json.error)
    
    return json.data
  } catch (error: any) {
    clearTimeout(timeoutId)
    if (error.name === 'AbortError') {
      throw new Error('Connection timed out. Master PC is off, or blocked by Firewall.')
    }
    throw error
  }
}