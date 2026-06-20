-- ============================================================================
-- High-Fashion Global Launch & Price Disparity Tracker
-- Supabase / Postgres schema — v2.1
-- ============================================================================
-- This file is auto-generated from prisma/schema.prisma. You can EITHER:
--   1. Run `prisma db push` (recommended) — Prisma will sync the schema for you.
--   2. Paste this whole file into the Supabase SQL Editor and click RUN.
--      (Useful if you want a one-shot bootstrap without installing Prisma.)
-- ============================================================================

create extension if not exists "pgcrypto";

-- ─── Brands ─────────────────────────────────────────────────────────────────
create table if not exists "Brand" (
  "id"           text primary key default gen_random_uuid()::text,
  "name"         text not null unique,
  "logo"         text,
  "country"      text not null,
  "currency"     text not null,
  "tierScore"    double precision not null default 75,
  "createdAt"    timestamptz not null default now(),
  "updatedAt"    timestamptz not null default now()
);
create index if not exists "Brand_country_idx"        on "Brand"("country");
create index if not exists "Brand_tierScore_idx"      on "Brand"("tierScore");

-- ─── Products ───────────────────────────────────────────────────────────────
create table if not exists "Product" (
  "id"             text primary key default gen_random_uuid()::text,
  "name"           text not null,
  "sku"            text not null unique,
  "category"       text not null,
  "subCategory"    text,
  "season"         text not null,
  "year"           integer not null,
  "imageUrl"       text,
  "editionType"    text not null default 'standard',
  "resaleValueIdx" double precision not null default 1.0,
  "brandId"        text not null references "Brand"("id") on delete restrict,
  "createdAt"      timestamptz not null default now(),
  "updatedAt"      timestamptz not null default now()
);
create index if not exists "Product_brandId_idx"          on "Product"("brandId");
create index if not exists "Product_category_idx"         on "Product"("category");
create index if not exists "Product_season_year_idx"      on "Product"("season", "year");

-- ─── Regional Prices ────────────────────────────────────────────────────────
create table if not exists "RegionalPrice" (
  "id"           text primary key default gen_random_uuid()::text,
  "productId"    text not null references "Product"("id") on delete cascade,
  "region"       text not null,
  "currency"     text not null,
  "price"        double precision not null,
  "importDuty"   double precision not null default 0,
  "taxRate"      double precision not null default 0,
  "shippingCost" double precision not null default 0,
  "stockStatus"  text not null default 'available',
  "stockLevel"   integer not null default 50,
  "lastUpdated"  timestamptz not null default now(),
  "createdAt"    timestamptz not null default now(),
  "updatedAt"    timestamptz not null default now()
);
create index if not exists "RegionalPrice_productId_idx"  on "RegionalPrice"("productId");
create index if not exists "RegionalPrice_region_idx"     on "RegionalPrice"("region");
create index if not exists "RegionalPrice_currency_idx"   on "RegionalPrice"("currency");

-- ─── Launches ───────────────────────────────────────────────────────────────
create table if not exists "Launch" (
  "id"            text primary key default gen_random_uuid()::text,
  "productId"     text not null references "Product"("id") on delete cascade,
  "brandId"       text not null references "Brand"("id")   on delete restrict,
  "region"        text not null,
  "launchDate"    timestamptz not null,
  "launchType"    text not null,
  "status"        text not null default 'upcoming',
  "expectedUnits" integer not null default 500,
  "notes"         text,
  "createdAt"     timestamptz not null default now(),
  "updatedAt"     timestamptz not null default now()
);
create index if not exists "Launch_productId_idx"   on "Launch"("productId");
create index if not exists "Launch_brandId_idx"     on "Launch"("brandId");
create index if not exists "Launch_launchDate_idx"  on "Launch"("launchDate");
create index if not exists "Launch_status_idx"      on "Launch"("status");

-- ─── Currency Rates ─────────────────────────────────────────────────────────
create table if not exists "CurrencyRate" (
  "id"             text primary key default gen_random_uuid()::text,
  "baseCurrency"   text not null default 'EUR',
  "targetCurrency" text not null,
  "rate"           double precision not null,
  "lastUpdated"    timestamptz not null default now(),
  "createdAt"      timestamptz not null default now(),
  "updatedAt"      timestamptz not null default now(),
  unique ("baseCurrency", "targetCurrency")
);

-- ─── Currency History ───────────────────────────────────────────────────────
create table if not exists "CurrencyHistory" (
  "id"             text primary key default gen_random_uuid()::text,
  "currencyRateId" text not null references "CurrencyRate"("id") on delete cascade,
  "date"           timestamptz not null,
  "rate"           double precision not null,
  "createdAt"      timestamptz not null default now()
);
create index if not exists "CurrencyHistory_currencyRateId_date_idx"
  on "CurrencyHistory"("currencyRateId", "date");

-- ─── Lookbook Entries ───────────────────────────────────────────────────────
create table if not exists "LookbookEntry" (
  "id"          text primary key default gen_random_uuid()::text,
  "brandId"     text not null references "Brand"("id") on delete restrict,
  "season"      text not null,
  "year"        integer not null,
  "title"       text not null,
  "description" text,
  "imageUrl"    text,
  "theme"       text,
  "createdAt"   timestamptz not null default now(),
  "updatedAt"   timestamptz not null default now()
);
create index if not exists "LookbookEntry_brandId_season_year_idx"
  on "LookbookEntry"("brandId", "season", "year");

-- ─── Price History (advanced feature v2.0) ──────────────────────────────────
create table if not exists "PriceHistory" (
  "id"          text primary key default gen_random_uuid()::text,
  "productId"   text not null references "Product"("id") on delete cascade,
  "brandId"     text not null references "Brand"("id")   on delete restrict,
  "region"      text not null,
  "currency"    text not null,
  "price"       double precision not null,
  "date"        timestamptz not null,
  "changePct"   double precision not null default 0,
  "anomalyFlag" boolean not null default false,
  "createdAt"   timestamptz not null default now()
);
create index if not exists "PriceHistory_productId_region_date_idx"
  on "PriceHistory"("productId", "region", "date");
create index if not exists "PriceHistory_brandId_date_idx"
  on "PriceHistory"("brandId", "date");
create index if not exists "PriceHistory_anomalyFlag_date_idx"
  on "PriceHistory"("anomalyFlag", "date");

-- ─── Hype Factor (advanced feature v2.0) ────────────────────────────────────
create table if not exists "HypeFactor" (
  "id"                  text primary key default gen_random_uuid()::text,
  "productId"           text not null references "Product"("id") on delete cascade,
  "brandId"             text not null references "Brand"("id")   on delete restrict,
  "hypeScore"           double precision not null,
  "brandTierWeight"     double precision not null,
  "categoryWeight"      double precision not null,
  "seasonWeight"        double precision not null,
  "exclusivityWeight"   double precision not null,
  "decayWeight"         double precision not null,
  "createdAt"           timestamptz not null default now(),
  "updatedAt"           timestamptz not null default now()
);
create index if not exists "HypeFactor_brandId_idx"    on "HypeFactor"("brandId");
create index if not exists "HypeFactor_hypeScore_idx"  on "HypeFactor"("hypeScore");

-- ─── Watchlist Item (advanced feature v2.0) ─────────────────────────────────
create table if not exists "WatchlistItem" (
  "id"          text primary key default gen_random_uuid()::text,
  "userId"      text not null default 'default',
  "productId"   text not null references "Product"("id") on delete cascade,
  "brandId"     text references "Brand"("id") on delete set null,
  "watchType"   text not null default 'product',
  "region"      text,
  "targetPrice" double precision,
  "createdAt"   timestamptz not null default now(),
  "updatedAt"   timestamptz not null default now()
);
create index if not exists "WatchlistItem_userId_idx"     on "WatchlistItem"("userId");
create index if not exists "WatchlistItem_productId_idx"  on "WatchlistItem"("productId");

-- ─── Alert (advanced feature v2.0) ──────────────────────────────────────────
create table if not exists "Alert" (
  "id"          text primary key default gen_random_uuid()::text,
  "userId"      text not null default 'default',
  "watchlistId" text,
  "alertType"   text not null,
  "productId"   text references "Product"("id") on delete cascade,
  "brandId"     text references "Brand"("id")   on delete set null,
  "region"      text,
  "message"     text not null,
  "severity"    text not null default 'info',
  "read"        boolean not null default false,
  "createdAt"   timestamptz not null default now()
);
create index if not exists "Alert_userId_read_idx"           on "Alert"("userId", "read");
create index if not exists "Alert_alertType_createdAt_idx"   on "Alert"("alertType", "createdAt");

-- ─── updated_at trigger ─────────────────────────────────────────────────────
create or replace function "set_updated_at"() returns trigger as $$
begin
  new."updatedAt" = now();
  return new;
end;
$$ language plpgsql;

do $$
declare t text;
begin
  for t in select unnest(array[
    'Brand','Product','RegionalPrice','Launch','CurrencyRate',
    'LookbookEntry','HypeFactor','WatchlistItem'
  ])
  loop
    execute format('drop trigger if exists "%I_updated_at" on "%I"; create trigger "%I_updated_at" before update on "%I" for each row execute function "set_updatedAt"();', t, t, t, t);
  end loop;
end$$;
