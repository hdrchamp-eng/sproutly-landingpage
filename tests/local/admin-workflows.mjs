import { readFileSync } from 'node:fs';
import { randomBytes, createHmac } from 'node:crypto';
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';
import { request, chromium } from '@playwright/test';
process.loadEnvFile('.env.local');
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
assert.equal(new URL(url).hostname, '127.0.0.1');
const db = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const anon = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false } });
const baseURL = 'http://127.0.0.1:3000';
const ids = [], contexts = [];
// This command is explicitly local-only; clear only the loopback test auth counter before reruns.
const authKey = createHmac('sha256', process.env.RATE_LIMIT_SECRET).update(`auth:${new Date().toISOString().slice(0,10)}:local`).digest('hex');
await db.from('rate_limits').delete().eq('key', authKey);
const tag = `local-test-${Date.now()}`;
function totp(secret) {
  let bits = ''; for (const c of secret.toUpperCase().replace(/=+$/, '')) bits += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'.indexOf(c).toString(2).padStart(5, '0');
  const key = Buffer.from(bits.match(/.{8}/g).map(x => parseInt(x, 2)));
  const counter = Buffer.alloc(8); counter.writeBigUInt64BE(BigInt(Math.floor(Date.now()/30000)));
  const hash = createHmac('sha1', key).update(counter).digest(); const offset = hash[19] & 15;
  return ((hash.readUInt32BE(offset)&0x7fffffff)%1000000).toString().padStart(6,'0');
}
async function checked(response, status = 200) {
  assert.equal(response.status(), status, `HTTP ${response.status()}: ${await response.text()}`);
  return response.json();
}
async function login(role) {
  const email = `${tag}-${role}@sproutly.local`, password = randomBytes(24).toString('base64url');
  const { data, error } = await db.auth.admin.createUser({ email, password, email_confirm: true });
  assert.equal(error, null); ids.push(data.user.id);
  assert.equal((await db.from('admin_roles').insert({ user_id:data.user.id, role })).error, null);
  const client = await request.newContext({ baseURL, extraHTTPHeaders: { origin: baseURL } }); contexts.push(client);
  await checked(await client.post('/api/auth/login', { data:{email,password} }));
  assert.equal((await client.post('/api/admin/developer_news',{data:{}})).status(),403, 'MFA must precede writes');
  const factor = await checked(await client.post('/api/auth/enroll', { data:{} }));
  await checked(await client.post('/api/auth/verify',{ data:{factorId:factor.factorId,code:totp(factor.secret)} }));
  return client;
}
let newsId, feedbackId, media;
try {
  const admin = await login('administrator');
  console.log('PASS real password login, MFA enrollment, verification and pre-MFA write denial');
  const entry = {title:tag,description:'Local integration test only',status:'draft',slug:tag,category:'Test',position:0,visible:true,locale:'de',data:{blocks:[{type:'paragraph',text:'Saved local draft'}]},published_at:null};
  await checked(await admin.post('/api/admin/developer_news',{data:{operation:'save',value:entry}}));
  newsId = (await db.from('developer_news').select('id').eq('slug',tag).single()).data.id;
  assert.equal((await anon.from('developer_news').select('id').eq('id',newsId)).data.length,0);
  assert.ok((await (await admin.get(`/admin/preview/${newsId}`)).text()).includes(tag));
  await checked(await admin.post('/api/admin/developer_news',{data:{operation:'save',id:newsId,value:{...entry,status:'published'}}}));
  assert.equal((await anon.from('developer_news').select('id').eq('id',newsId)).data.length,1);
  console.log('PASS draft privacy, protected preview, publication and RLS');
  const publicClient = await request.newContext({baseURL,extraHTTPHeaders:{origin:baseURL}});contexts.push(publicClient);
  await checked(await publicClient.post('/api/feedback',{data:{title:tag,description:'A local feedback workflow verification.',category:'Verbesserung',email:'test@sproutly.local',website:'',startedAt:Date.now()-6000}}),201);
  feedbackId = (await db.from('feedback_submissions').select('id').eq('title',tag).single()).data.id;
  assert.equal((await anon.from('feedback_submissions').select('id').eq('id',feedbackId)).data?.length || 0,0);
  await checked(await admin.post('/api/admin/feedback_submissions',{data:{operation:'save',id:feedbackId,value:{status:'Freigegeben',category:'Verbesserung',internal_note:'Local test'}}}));
  await checked(await admin.post('/api/admin/feedback_submissions',{data:{operation:'reply',id:feedbackId,value:{response:'Local test response'}}}));
  assert.equal((await checked(await publicClient.post('/api/feedback/vote',{data:{id:feedbackId}}))).added,true);
  assert.equal((await checked(await publicClient.post('/api/feedback/vote',{data:{id:feedbackId}}))).added,false);
  console.log('PASS feedback submission, moderation, reply and duplicate vote prevention');
  await checked(await admin.post('/api/admin/media',{multipart:{alt:tag,file:{name:'test.png',mimeType:'image/png',buffer:readFileSync('public/favicon.png')}}}));
  media = (await db.from('media_assets').select('*').eq('alt',tag).single()).data;
  assert.equal(media.mime,'image/webp');
  assert.equal((await fetch(`${url}/storage/v1/object/public/site-media/${media.path}`)).status,200);
  const mediaUrl = `${url}/storage/v1/object/public/site-media/${media.path}`;
  await checked(await admin.post('/api/admin/developer_news',{data:{operation:'save',id:newsId,value:{...entry,status:'published',data:{blocks:[{type:'image',text:'Local image',url:mediaUrl}]}}}}));
  assert.equal((await admin.get(`/_next/image?url=${encodeURIComponent(mediaUrl)}&w=1080&q=75`)).status(),200);
  assert.equal((await admin.delete('/api/admin/media',{data:{id:media.id}})).status(),409);
  await checked(await admin.post('/api/admin/developer_news',{data:{operation:'save',id:newsId,value:{...entry,status:'published'}}}));
  await checked(await admin.delete('/api/admin/media',{data:{id:media.id}})); media=null;
  console.log('PASS real Storage upload, image processing, public retrieval and deletion');
  const browser = await chromium.launch(process.platform === 'darwin' ? {executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'} : {});
  try {
    const context = await browser.newContext({storageState:await admin.storageState()});
    const page = await context.newPage();
    for (const route of ['dashboard','news','media','settings','analytics','feedback']) {
      const response = await page.goto(`${baseURL}/admin/${route}`);
      assert.equal(response.status(),200);
      assert.ok(await page.getByRole('button',{name:'Abmelden',exact:true}).isVisible());
      assert.ok(!(await page.locator('body').innerText()).includes('Application error'));
    }
    await page.goto(`${baseURL}/admin/dashboard`);
    await page.screenshot({path:'.local/admin-dashboard.png',fullPage:true});
    console.log('PASS six authenticated admin pages in Chromium');
  } finally { await browser.close(); }
  for (const role of ['editor','moderator']) {
    const client = await login(role);
    assert.equal((await client.post('/api/admin/site_settings',{data:{operation:'save',value:{}}})).status(),403);
    const resource = role==='editor' ? 'feedback_submissions' : 'developer_news';
    assert.equal((await client.post(`/api/admin/${resource}`,{data:{operation:'save',value:{}}})).status(),403);
    console.log(`PASS ${role} MFA and forbidden-resource boundaries`);
  }
  await checked(await admin.post('/api/auth/logout',{data:{}}));
  assert.equal((await admin.post('/api/admin/developer_news',{data:{}})).status(),401);
  console.log('PASS logout invalidates administrative access');
} finally {
  if (media) { await db.storage.from('site-media').remove([media.path]); await db.from('media_assets').delete().eq('id',media.id); }
  if (newsId) await db.from('developer_news').delete().eq('id',newsId);
  if (feedbackId) await db.from('feedback_submissions').delete().eq('id',feedbackId);
  for (const id of ids) await db.auth.admin.deleteUser(id);
  for (const client of contexts) await client.dispose();
  await db.from('rate_limits').delete().eq('key', authKey);
}
