import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { test } from 'node:test'
import { marketHandler } from '../api/land-market.ts'

test('시세 API는 허용된 조회만 전달하고 인증키와 공급기관 오류 원문을 숨긴다', async (t) => {
  const client = globalThis.fetch
  const providerUrls: URL[] = []
  const key = 'test-key+only'
  const server = createServer(
    marketHandler({ LAND_TRADE_KEY: encodeURIComponent(key), VWORLD_KEY: key }),
  )
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  t.after(() => server.close())
  const address = server.address()
  assert.ok(address && typeof address !== 'string')
  const call = (query: string) => client('http://127.0.0.1:' + address.port + '/?' + query)
  const upstream = t.mock.method(globalThis, 'fetch', async (url: URL) => {
    providerUrls.push(url)
    if (url.hostname === 'apis.data.go.kr')
      return new Response('<response><resultCode>000</resultCode></response>')
    return Response.json({ response: { status: 'OK', input: { key }, result: { code: 'sample' } } })
  })
  for (const query of [
    'action=address&type=ROAD&address=test',
    'action=boundary&lat=37&lng=127&radius=3',
    'action=trades&region=41150&month=202611&page=1',
  ]) {
    const response = await call(query)
    assert.equal(response.status, 200)
    assert.ok(!(await response.text()).includes(key))
  }
  assert.equal(providerUrls[0].searchParams.get('key'), key)
  assert.equal(providerUrls[1].searchParams.get('data'), 'LT_C_ADEMD_INFO')
  assert.equal(providerUrls[2].searchParams.get('serviceKey'), key)
  assert.equal((await call('action=boundary&lat=37&lng=127&radius=100')).status, 400)
  assert.equal((await call('action=boundary&lat=37&lng=127&radius=3')).status, 200)
  assert.equal(providerUrls.length, 3)
  upstream.mock.mockImplementation(async () => new Response(key, { status: 403 }))
  const failure = await call('action=address&type=ROAD&address=another')
  assert.equal(failure.status, 502)
  assert.ok(!(await failure.text()).includes(key))
})
