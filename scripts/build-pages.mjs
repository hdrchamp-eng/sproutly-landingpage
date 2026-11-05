import {cpSync,mkdirSync,writeFileSync,readFileSync,rmSync,symlinkSync,readdirSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {execFileSync} from 'node:child_process';
const root=process.cwd(), target=resolve('.local/pages-build');
const base='/sproutly-landingpage';
mkdirSync(target,{recursive:true});
for(const name of ['src','public','package.json','tsconfig.json','postcss.config.mjs']) cpSync(name,join(target,name),{recursive:true});
for(const name of ['src/app/admin','src/app/api','src/proxy.ts']) rmSync(join(target,name),{recursive:true,force:true});
try{symlinkSync(resolve('node_modules'),join(target,'node_modules'),'dir');}catch{}
function edit(file,fn){const p=join(target,file);writeFileSync(p,fn(readFileSync(p,'utf8')));}
edit('src/lib/db.ts',s=>s.replace(/export const configured = \(\) =>[\s\S]*?;\n/, 'export const configured = () => false;\n'));
edit('src/app/developers/[[...path]]/page.tsx',s=>s.replace('const query = await searchParams;', 'void searchParams; const query: Record<string,string|undefined> = {};')+'\nexport function generateStaticParams(){return [[],["news"],["feedback"]].map(path=>({path}));}\n');
for (const file of ['src/app/opengraph-image.tsx','src/app/robots.ts','src/app/sitemap.ts']) edit(file,s=>s+'\nexport const dynamic = "force-static";\n');
function walk(dir){for(const d of readdirSync(dir,{withFileTypes:true})){const p=join(dir,d.name);if(d.isDirectory())walk(p);else if(/\.(tsx?|json)$/.test(p)){let s=readFileSync(p,'utf8');s=s.replace(/export const revalidate = 60;/g,'');s=s.replace(/(["'`])\/(images|brand)\//g,`$1${base}/$2/`);s=s.replace('icon: "/favicon.png"',`icon: "${base}/favicon.png"`);writeFileSync(p,s);}}}
walk(join(target,'src'));
edit('src/app/globals.css',s=>s.replace('@import "tailwindcss";', '@import "tailwindcss" source(none);\n@source "../";'));
writeFileSync(join(target,'next.config.ts'),`export default {output:"export",basePath:${JSON.stringify(base)},trailingSlash:true,images:{unoptimized:true},turbopack:{root:${JSON.stringify(root)}}};\n`);
const env={...process.env,NEXT_PUBLIC_SITE_URL:'https://hdrchamp-eng.github.io'+base,NEXT_PUBLIC_SUPABASE_URL:'',NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'',SUPABASE_SERVICE_ROLE_KEY:'',INSTAGRAM_ACCESS_TOKEN:''};
execFileSync(process.execPath,[resolve('node_modules/next/dist/bin/next'),'build','--webpack'],{cwd:target,env,stdio:'inherit'});
writeFileSync(join(target,'out/.nojekyll'),'');
console.log('Static preview: '+join(target,'out'));
