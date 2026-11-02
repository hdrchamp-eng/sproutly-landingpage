import assert from 'node:assert/strict';
import { chromium, request } from '@playwright/test';
const baseURL='http://127.0.0.1:3000';
const client=await request.newContext({baseURL,extraHTTPHeaders:{origin:baseURL}});
try {
  for(const path of ['/','/downloads','/developers','/developers/feedback']) assert.equal((await client.get(path)).status(),200);
  for(const path of ['/admin','/admin/login','/admin/dashboard']) {
    const response=await client.get(path,{maxRedirects:0});
    assert.equal(response.status(),307);
    assert.equal(new URL(response.headers().location,baseURL).pathname,'/');
  }
  for(const path of ['/api/auth/login','/api/auth/enroll','/api/admin/developer_news','/api/admin/media']) assert.equal((await client.post(path,{data:{}})).status(),404);
  const browser=await chromium.launch(process.platform==='darwin'?{executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}:{});
  try {
    const page=await browser.newPage();
    await page.goto(baseURL+'/admin/login');
    assert.equal(page.url(),baseURL+'/');
    assert.ok((await page.locator('h1').innerText()).includes('für dich bleibt.'));
    assert.equal(await page.locator('input[type=password]').count(),0);
    await page.screenshot({path:'.local/public-landing.png',fullPage:false});
  } finally {await browser.close();}
  console.log('PASS public pages, admin redirects, disabled auth/admin APIs and browser landing without login');
} finally {await client.dispose();}
