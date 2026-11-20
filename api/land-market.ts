import type { IncomingMessage, ServerResponse } from 'node:http'

const pageOrigin = 'https://junomin.github.io'
const tradeUrl = 'https://apis.data.go.kr/1613000/RTMSDataSvcLandTrade/getRTMSDataSvcLandTrade'

function providerRequest(params: URLSearchParams, env: NodeJS.ProcessEnv) {
  const value = (name: string) => params.get(name) ?? ''
  const action = value('action')
  if (action === 'trades') {
    const region = value('region'),
      month = value('month'),
      page = value('page')
    if (
      !/^\d{5}$/.test(region) ||
      !/^20\d{2}(0[1-9]|1[0-2])$/.test(month) ||
      !/^[1-9]\d{0,2}$/.test(page)
    )
      return
    const query = new URLSearchParams({
      LAWD_CD: region,
      DEAL_YMD: month,
      pageNo: page,
      numOfRows: '1000',
    })
    return { url: new URL(tradeUrl + '?' + query), key: env.LAND_TRADE_KEY, field: 'serviceKey' }
  }
  const query = new URLSearchParams({ version: '2.0', format: 'json', crs: 'EPSG:4326' })
  let endpoint
  if (action === 'address') {
    const address = value('address').trim(),
      type = value('type')
    if (!address || address.length > 200 || !['ROAD', 'PARCEL'].includes(type)) return
    endpoint = 'address'
    for (const [key, val] of Object.entries({
      service: 'address',
      request: 'getcoord',
      refine: 'true',
      simple: 'false',
      type,
      address,
    }))
      query.set(key, val)
  } else if (action === 'boundary') {
    const lat = Number(value('lat')),
      lng = Number(value('lng')),
      radius = Number(value('radius'))
    if (!(lat >= 32 && lat <= 40 && lng >= 124 && lng <= 133 && [1, 3, 5].includes(radius))) return
    const dy = radius / 110.57,
      dx = radius / (111.32 * Math.cos((lat * Math.PI) / 180))
    endpoint = 'data'
    for (const [key, val] of Object.entries({
      service: 'data',
      request: 'GetFeature',
      data: 'LT_C_ADEMD_INFO',
      size: '1000',
      page: '1',
      geometry: 'true',
      attribute: 'true',
      geomFilter: `BOX(${lng - dx},${lat - dy},${lng + dx},${lat + dy})`,
    }))
      query.set(key, val)
  } else return
  if (env.VWORLD_DOMAIN) query.set('domain', env.VWORLD_DOMAIN)
  return {
    url: new URL('https://api.vworld.kr/req/' + endpoint + '?' + query),
    key: env.VWORLD_KEY,
    field: 'key',
  }
}

export function marketHandler(env: NodeJS.ProcessEnv) {
  return async (req: IncomingMessage, res: ServerResponse) => {
    const fail = (status: number, message: string) => {
      res
        .writeHead(status, {
          'content-type': 'text/plain; charset=utf-8',
          'cache-control': 'no-store',
        })
        .end(message)
    }
    if (req.headers.origin === pageOrigin) res.setHeader('Access-Control-Allow-Origin', pageOrigin)
    res.setHeader('Vary', 'Origin')
    if (req.method !== 'GET') return fail(405, '지원하지 않는 요청입니다.')
    try {
      const target = providerRequest(new URL(req.url ?? '/', 'http://localhost').searchParams, env)
      if (!target) return fail(400, '조회 조건을 확인해 주세요.')
      if (!target.key) return fail(503, '시세 조회 서비스의 인증 설정이 필요합니다.')
      const key = decodeURIComponent(target.key.trim())
      target.url.searchParams.set(target.field, key)
      const upstream = await fetch(target.url, {
        signal: AbortSignal.timeout(20000),
        redirect: 'error',
      })
      if (!upstream.ok) throw new Error()
      let body: string
      const xml = target.field === 'serviceKey'
      if (xml) {
        body = await upstream.text()
        if (!/<resultCode>\s*(000|00)\s*<\/resultCode>/.test(body)) throw new Error()
      } else {
        const { response } = (await upstream.json()) as {
          response?: { status?: string; result?: unknown; refined?: unknown }
        }
        if (response?.status !== 'OK' && response?.status !== 'NOT_FOUND') throw new Error()
        body = JSON.stringify({
          response: { status: response.status, result: response.result, refined: response.refined },
        })
      }
      if (body.includes(key) || body.includes(encodeURIComponent(key))) throw new Error()
      res
        .writeHead(200, {
          'content-type': xml
            ? 'application/xml; charset=utf-8'
            : 'application/json; charset=utf-8',
          'cache-control': xml ? 'public, s-maxage=21600' : 'no-store',
        })
        .end(body)
    } catch {
      fail(502, '공급기관의 조회에 실패했습니다. 잠시 후 다시 시도해 주세요.')
    }
  }
}
export default marketHandler(process.env)
