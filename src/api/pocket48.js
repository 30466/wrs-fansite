const TOOLS_HOST = '/tools-api'

function deviceId() {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2, 18)
}

function pocketHeaders() {
  return {
    'Content-Type': 'application/json;charset=utf-8',
    'User-Agent': 'PocketFans201807/6.0.16 (iPhone; iOS 13.5.1; Scale/2.00)',
    'Accept-Language': 'zh-Hans-CN;q=1',
    'appInfo': JSON.stringify({
      vendor: 'apple',
      deviceId: deviceId(),
      appVersion: '7.0.4',
      appBuild: '23011601',
      osVersion: '16.3.1',
      osType: 'ios',
      deviceName: 'iPhone XR',
      os: 'ios'
    })
  }
}

export async function getMapping() {
  const res = await fetch(`${TOOLS_HOST}/api/public/snh48/mapping`)
  if (!res.ok) throw new Error(`获取成员映射失败 (HTTP ${res.status})`)
  return res.json()
}

export async function getRoomMap() {
  const res = await fetch(`${TOOLS_HOST}/api/public/snh48/room-map`)
  if (!res.ok) throw new Error(`获取房间映射失败 (HTTP ${res.status})`)
  return res.json()
}

export async function getLiveList(userId, next = '0') {
  const res = await fetch(`${TOOLS_HOST}/pocketapi/getLiveList`, {
    method: 'POST',
    headers: pocketHeaders(),
    body: JSON.stringify({ userId, next, debug: true, record: true })
  })
  if (!res.ok) throw new Error(`获取录播列表失败 (HTTP ${res.status})`)
  return res.json()
}

export async function getLiveOne(liveId) {
  const res = await fetch(`${TOOLS_HOST}/pocketapi/getLiveOne`, {
    method: 'POST',
    headers: pocketHeaders(),
    body: JSON.stringify({ liveId: String(liveId) })
  })
  if (!res.ok) throw new Error(`获取录播详情失败 (HTTP ${res.status})`)
  return res.json()
}

export async function fetchM3U8(url) {
  const proxyUrl = `${TOOLS_HOST}/proxy/segment?url=${encodeURIComponent(url)}`
  const res = await fetch(proxyUrl)
  return res.text()
}

export function parseM3U8(text, baseUrl) {
  const lines = text.trim().split('\n')
  const segments = []
  let duration = 0
  for (const line of lines) {
    if (line.startsWith('#EXTINF:')) {
      const dur = parseFloat(line.replace('#EXTINF:', '').split(',')[0])
      duration += dur
    } else if (!line.startsWith('#') && line.length > 0) {
      let url
      if (line.startsWith('http')) {
        url = line
      } else if (line.startsWith('/')) {
        const idx = baseUrl.indexOf('/', baseUrl.indexOf('//') + 2)
        url = baseUrl.substring(0, idx) + line
      } else {
        url = baseUrl + line
      }
      segments.push({ url, duration })
      duration = 0
    }
  }
  return segments
}

export function buildBaseUrl(m3u8Url) {
  const lastSlash = m3u8Url.lastIndexOf('/')
  return m3u8Url.substring(0, lastSlash + 1)
}

export function timeToSeconds(t) {
  const parts = t.split(':').map(Number)
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  return 0
}

export function proxyCDN(url) {
  const idx = url.indexOf('/', url.indexOf('//') + 2)
  return '/cdn' + url.substring(idx)
}

export function proxySegment(url) {
  return `${TOOLS_HOST}/proxy/segment?url=${encodeURIComponent(url)}`
}

export async function fetchSegment(url, signal) {
  const sources = [
    { url: `${TOOLS_HOST}/proxy/segment?url=${encodeURIComponent(url)}`, label: '后端' },
    { url, label: '直连' }
  ]

  const doFetch = async ({ url: fetchUrl, label }) => {
    const resp = await fetch(fetchUrl, { signal })
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
    const data = await resp.arrayBuffer()
    return { label, data }
  }

  try {
    return await Promise.any(sources.map(s => doFetch(s)))
  } catch (e) {
    const msgs = e instanceof AggregateError
      ? e.errors.map(err => err.message).join('; ')
      : e.message
    throw new Error(msgs)
  }
}
