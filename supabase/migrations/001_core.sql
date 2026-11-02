-- Fresh isolated landingpage Supabase project only. Never apply to mobile app DB.
create extension if not exists pgcrypto;
create table public.admin_roles(user_id uuid primary key references auth.users on delete cascade, role text not null check(role in ('administrator','editor','moderator')), created_at timestamptz not null default now());
alter table public.admin_roles enable row level security;
create function public.staff_role() returns text language sql stable security definer set search_path = '' as $$ select role from public.admin_roles where user_id=auth.uid() and auth.jwt()->>'aal'='aal2' $$;
revoke all on function public.staff_role() from public;
grant execute on function public.staff_role() to authenticated;
create policy own_role on public.admin_roles for select to authenticated using(user_id=auth.uid());
-- Roles are provisioned only through the project SQL console. No application role can grant roles.
create table public.audit_logs(id bigint generated always as identity primary key, actor_id uuid, action text not null, resource text not null, record_id text, created_at timestamptz not null default now());
alter table public.audit_logs enable row level security;
create policy audit_admin on public.audit_logs for select to authenticated using(public.staff_role()='administrator');
create function public.audit_change() returns trigger language plpgsql security definer set search_path='' as $$ begin
 insert into public.audit_logs(actor_id,action,resource,record_id) values(auth.uid(),TG_OP,TG_TABLE_NAME,coalesce(to_jsonb(NEW)->>'id',to_jsonb(OLD)->>'id',to_jsonb(NEW)->>'user_id',to_jsonb(OLD)->>'user_id'));
 if TG_OP='DELETE' then return OLD; end if; return NEW; end $$;
create trigger role_audit after insert or update or delete on public.admin_roles for each row execute function public.audit_change();
create function public.touch_updated() returns trigger language plpgsql set search_path='' as $$ begin NEW.updated_at=now(); return NEW; end $$;
-- Controlled CMS records share lifecycle fields; each resource has a separate RLS boundary.
do $$ declare t text; begin foreach t in array array['page_sections','feature_cards','faqs','testimonials','developer_news','releases','roadmap_items'] loop
 execute format('create table public.%I(id uuid primary key default gen_random_uuid(), title text not null check(char_length(title) between 1 and 150), description text not null default '''' check(char_length(description)<=2000), slug text, category text not null default '''', status text not null default ''draft'' check(status in (''draft'',''published'',''archived'',''In Prüfung'',''Geplant'',''In Entwicklung'',''Testphase'',''Veröffentlicht'')), position integer not null default 0 check(position>=0), visible boolean not null default true, locale text not null default ''de'' check(locale in (''de'',''en'')), data jsonb not null default ''{}''::jsonb check(jsonb_typeof(data)=''object''), published_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(locale,slug))',t);
 execute format('alter table public.%I enable row level security',t);
 execute format('create index on public.%I(status,visible,locale,position)',t);
 if t='roadmap_items' then
 execute format('create policy public_read on public.%I for select to anon,authenticated using(visible and status not in (''draft'',''archived''))',t);
 elsif t='testimonials' then
 execute format('create policy public_read on public.%I for select to anon,authenticated using(visible and status=''published'' and data->>''approved''=''true'' and published_at<=now())',t);
 else
 execute format('create policy public_read on public.%I for select to anon,authenticated using(visible and status=''published'' and published_at<=now())',t);
 end if;
 execute format('create policy staff_manage on public.%I for all to authenticated using(public.staff_role() in (''administrator'',''editor'')) with check(public.staff_role() in (''administrator'',''editor''))',t);
 execute format('create trigger audit after insert or update or delete on public.%I for each row execute function public.audit_change()',t);
 execute format('create trigger updated before update on public.%I for each row execute function public.touch_updated()',t);
 end loop; end $$;
create table public.site_settings(id text primary key check(id='site'), value jsonb not null, updated_at timestamptz not null default now());
alter table public.site_settings enable row level security;
-- Only public configuration belongs here. Secrets must never be inserted.
create policy settings_read on public.site_settings for select to anon,authenticated using(true);
create policy settings_write on public.site_settings for all to authenticated using(public.staff_role()='administrator') with check(public.staff_role()='administrator');
create trigger settings_audit after insert or update or delete on public.site_settings for each row execute function public.audit_change();
create trigger settings_updated before update on public.site_settings for each row execute function public.touch_updated();
create table public.feedback_submissions(id uuid primary key default gen_random_uuid(), title text not null check(char_length(title) between 3 and 80), description text not null check(char_length(description) between 10 and 500), category text not null check(category in ('Neue Funktion','Verbesserung','Fehlermeldung','Allgemeine Frage','Sonstiges Feedback')), status text not null default 'Eingegangen' check(status in ('Eingegangen','In Prüfung','Freigegeben','Abgelehnt','Erledigt','Spam','Archiviert')), internal_note text not null default '' check(char_length(internal_note)<=2000), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.feedback_contacts(feedback_id uuid primary key references public.feedback_submissions on delete cascade, email text not null check(char_length(email)<=254), created_at timestamptz not null default now());
create table public.feedback_votes(feedback_id uuid references public.feedback_submissions on delete cascade, voter_hash text not null, created_at timestamptz not null default now(), primary key(feedback_id,voter_hash));
create table public.feedback_responses(id uuid primary key default gen_random_uuid(),feedback_id uuid not null references public.feedback_submissions on delete cascade, administrator_id uuid not null references auth.users, response text not null check(char_length(response) between 1 and 2000), published_at timestamptz not null default now());
create index on public.feedback_submissions(status,created_at desc);
alter table public.feedback_submissions enable row level security;
alter table public.feedback_contacts enable row level security;
alter table public.feedback_votes enable row level security;
alter table public.feedback_responses enable row level security;
create policy moderation on public.feedback_submissions for all to authenticated using(public.staff_role() in ('administrator','moderator')) with check(public.staff_role() in ('administrator','moderator'));
create policy contacts_admin on public.feedback_contacts for all to authenticated using(public.staff_role()='administrator') with check(public.staff_role()='administrator');
create policy response_staff on public.feedback_responses for all to authenticated using(public.staff_role() in ('administrator','moderator')) with check(public.staff_role() in ('administrator','moderator') and administrator_id=auth.uid());
create policy response_public on public.feedback_responses for select to anon,authenticated using(exists(select 1 from public.feedback_submissions f where f.id=feedback_id and f.status='Freigegeben'));
create trigger feedback_updated before update on public.feedback_submissions for each row execute function public.touch_updated();
create trigger feedback_audit after update or delete on public.feedback_submissions for each row execute function public.audit_change();
create trigger response_audit after insert or update or delete on public.feedback_responses for each row execute function public.audit_change();
-- Definer function deliberately projects only public columns; no private notes or emails.
create function public.public_feedback() returns table(id uuid,title text,description text,category text,created_at timestamptz,votes bigint,responses jsonb) language sql stable security definer set search_path='' as $$
 select f.id,f.title,f.description,f.category,f.created_at,(select count(*) from public.feedback_votes v where v.feedback_id=f.id),coalesce((select jsonb_agg(jsonb_build_object('response',r.response,'published_at',r.published_at) order by r.published_at) from public.feedback_responses r where r.feedback_id=f.id),'[]'::jsonb) from public.feedback_submissions f where f.status='Freigegeben' order by f.created_at desc limit 200 $$;
revoke all on function public.public_feedback() from public; grant execute on function public.public_feedback() to anon,authenticated;
create function public.submit_feedback(p_title text,p_description text,p_category text,p_email text) returns uuid language plpgsql security definer set search_path='' as $$ declare fid uuid; begin
 insert into public.feedback_submissions(title,description,category) values(p_title,p_description,p_category) returning id into fid;
 if nullif(p_email,'') is not null then insert into public.feedback_contacts(feedback_id,email) values(fid,p_email); end if; return fid; end $$;
revoke all on function public.submit_feedback(text,text,text,text) from public,anon,authenticated; grant execute on function public.submit_feedback(text,text,text,text) to service_role;
create function public.vote_feedback(p_id uuid,p_hash text) returns boolean language plpgsql security definer set search_path='' as $$ begin
 if not exists(select 1 from public.feedback_submissions where id=p_id and status='Freigegeben') then return false; end if;
 insert into public.feedback_votes(feedback_id,voter_hash) values(p_id,p_hash) on conflict do nothing; return FOUND; end $$;
revoke all on function public.vote_feedback(uuid,text) from public,anon,authenticated; grant execute on function public.vote_feedback(uuid,text) to service_role;
create table public.rate_limits(key text primary key, hits integer not null, expires_at timestamptz not null);
alter table public.rate_limits enable row level security;
create function public.consume_limit(p_key text,p_limit integer,p_seconds integer) returns boolean language plpgsql security definer set search_path='' as $$ declare n integer; begin
 insert into public.rate_limits(key,hits,expires_at) values(p_key,1,now()+make_interval(secs=>p_seconds)) on conflict(key) do update set hits=case when public.rate_limits.expires_at<now() then 1 else public.rate_limits.hits+1 end, expires_at=case when public.rate_limits.expires_at<now() then now()+make_interval(secs=>p_seconds) else public.rate_limits.expires_at end returning hits into n; return n<=p_limit; end $$;
revoke all on function public.consume_limit(text,integer,integer) from public,anon,authenticated; grant execute on function public.consume_limit(text,integer,integer) to service_role;
create table public.analytics_daily(day date not null default (now() at time zone 'Europe/Zurich')::date,event text not null check(event in ('pageview','apple','google','qr','video','social','feedback','faq')),path text not null check(char_length(path)<=200),count bigint not null default 1,primary key(day,event,path));
alter table public.analytics_daily enable row level security;
create policy analytics_admin on public.analytics_daily for select to authenticated using(public.staff_role()='administrator');
create function public.record_event(p_event text,p_path text) returns void language sql security definer set search_path='' as $$ insert into public.analytics_daily(event,path) values(p_event,p_path) on conflict(day,event,path) do update set count=public.analytics_daily.count+1 $$;
revoke all on function public.record_event(text,text) from public,anon,authenticated; grant execute on function public.record_event(text,text) to service_role;
create table public.media_assets(id uuid primary key default gen_random_uuid(),path text unique not null,mime text not null,alt text not null check(char_length(alt) between 1 and 300),size bigint not null check(size between 1 and 52428800),created_at timestamptz not null default now());
alter table public.media_assets enable row level security;
create policy media_staff on public.media_assets for all to authenticated using(public.staff_role() in ('administrator','editor')) with check(public.staff_role() in ('administrator','editor'));
create trigger media_audit after insert or update or delete on public.media_assets for each row execute function public.audit_change();
create table public.slug_redirects(old_slug text not null,locale text not null,new_slug text not null,primary key(locale,old_slug));
alter table public.slug_redirects enable row level security;
create policy redirects_read on public.slug_redirects for select to anon,authenticated using(true);
create function public.preserve_slug() returns trigger language plpgsql security definer set search_path='' as $$ begin
 if OLD.slug is not null and NEW.slug is not null and OLD.slug<>NEW.slug then
 update public.slug_redirects set new_slug=NEW.slug where locale=OLD.locale and new_slug=OLD.slug;
 insert into public.slug_redirects values(OLD.slug,OLD.locale,NEW.slug) on conflict(locale,old_slug) do update set new_slug=excluded.new_slug;
 delete from public.slug_redirects where old_slug=NEW.slug and locale=NEW.locale;
 end if; return NEW; end $$;
create trigger news_slug after update on public.developer_news for each row execute function public.preserve_slug();
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('site-media','site-media',true,52428800,array['image/jpeg','image/png','image/webp','video/mp4']) on conflict do nothing;
create policy media_upload on storage.objects for insert to authenticated with check(bucket_id='site-media' and public.staff_role() in ('administrator','editor'));
create policy media_delete on storage.objects for delete to authenticated using(bucket_id='site-media' and public.staff_role() in ('administrator','editor'));
create policy media_read_staff on storage.objects for select to authenticated using(bucket_id='site-media' and public.staff_role() in ('administrator','editor'));
create function public.cleanup_retention() returns void language plpgsql security definer set search_path='' as $$ declare cfg jsonb; begin
 select value into cfg from public.site_settings where id='site';
 delete from public.feedback_contacts where created_at<now()-make_interval(days=>greatest(1,least(365,coalesce((cfg->>'contactRetentionDays')::int,90))));
 delete from public.feedback_submissions where status in ('Abgelehnt','Spam','Archiviert','Erledigt') and updated_at<now()-make_interval(days=>greatest(7,least(3650,coalesce((cfg->>'feedbackRetentionDays')::int,180))));
 delete from public.audit_logs where created_at<now()-make_interval(days=>greatest(7,least(365,coalesce((cfg->>'logRetentionDays')::int,90))));
 delete from public.rate_limits where expires_at<now()-interval '1 day';
 end $$;
revoke all on function public.cleanup_retention() from public,anon,authenticated; grant execute on function public.cleanup_retention() to service_role;

-- Explicit grants: RLS remains the authority; private tables have no anon grants.
grant select on public.site_settings,public.page_sections,public.feature_cards,public.faqs,public.testimonials,public.developer_news,public.releases,public.roadmap_items,public.slug_redirects to anon,authenticated;
grant select,insert,update,delete on public.site_settings,public.page_sections,public.feature_cards,public.faqs,public.testimonials,public.developer_news,public.releases,public.roadmap_items,public.feedback_submissions,public.feedback_contacts,public.feedback_responses,public.media_assets to authenticated;
grant select on public.admin_roles,public.audit_logs,public.analytics_daily to authenticated;
grant all on all tables in schema public to service_role;
grant usage,select on all sequences in schema public to service_role;
