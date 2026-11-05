/**
 * Browser-only AI service connector.
 * Endpoint and access token are entered by the user, never committed to Git.
 * Token is held in this tab's sessionStorage; API key stays on the Worker.
 */
export async function requestAi(path: '/api/interpret' | '/api/heming', payload: unknown): Promise<Response> {
  if (typeof window === 'undefined') throw new Error('Browser required');
  let endpoint = sessionStorage.getItem('ziwei_ai_endpoint') || '';
  let accessToken = sessionStorage.getItem('ziwei_ai_token') || '';
  if (!endpoint) {
    endpoint = window.prompt('请填写已部署的 Cloudflare Worker 地址，例如 https://ziwei-deepseek.xxx.workers.dev（不含 /api）')?.trim() || '';
    if (!endpoint) throw new Error('ai-not-configured');
    try {
      const parsed = new URL(endpoint);
      if (parsed.protocol !== 'https:') throw new Error();
      endpoint = parsed.origin;
    } catch { throw new Error('ai-invalid-url'); }
    sessionStorage.setItem('ziwei_ai_endpoint', endpoint);
  }
  if (!accessToken) {
    accessToken = window.prompt('输入 Worker ACCESS_TOKEN 访问口令（不是 DeepSeek API Key）')?.trim() || '';
    if (!accessToken) throw new Error('ai-not-configured');
    sessionStorage.setItem('ziwei_ai_token', accessToken);
  }
  let res: Response;
  try {
    res = await fetch(endpoint + path, {
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'Bearer ' + accessToken},
      body:JSON.stringify(payload)
    });
  } catch { throw new Error('ai-unreachable'); }
  if (res.status === 401) {
    sessionStorage.removeItem('ziwei_ai_token');
    throw new Error('ai-unauthorized');
  }
  if (!res.ok) throw new Error('ai-http-' + res.status);
  return res;
}
