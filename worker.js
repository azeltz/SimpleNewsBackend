/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run "npm run dev" in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run "npm run deploy" to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

// ---- FEED CONFIG ----

const NITTER_BASE = "https://nitter.net";

const FEEDS = [
  // ESPN (top sports)
  { id: "espn_top",   url: "https://www.espn.com/espn/rss/news",         source: "espn.com",              kind: "top" },
  { id: "espn_nba",   url: "https://www.espn.com/espn/rss/nba/news",     source: "espn.com",              kind: "top" },
  { id: "espn_nfl",   url: "https://www.espn.com/espn/rss/nfl/news",     source: "espn.com",              kind: "top" },
  { id: "espn_cfb",   url: "https://www.espn.com/espn/rss/ncf/news",     source: "espn.com",              kind: "important" },
  { id: "espn_cbk",   url: "https://www.espn.com/espn/rss/ncb/news",     source: "espn.com",              kind: "consistent" },
  { id: "espn_soccer",url: "https://www.espn.com/espn/rss/soccer/news",  source: "espn.com",              kind: "consistent" },
  { id: "espn_tennis",url: "https://www.espn.com/espn/rss/tennis/news",  source: "espn.com",              kind: "periodic" },

  // CBS Sports (top sports)
  { id: "cbs_top",    url: "https://www.cbssports.com/rss/headlines/",   source: "cbssports.com",         kind: "top" },

  // NYT / The Athletic (longform / general)
  { id: "nyt_home",   url: "https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml",               source: "nytimes.com",        kind: "top" },
  { id: "nyt_pro_basketball", url: "https://rss.nytimes.com/services/xml/rss/nyt/ProBasketball.xml", source: "nytimes.com",        kind: "important" },

  // WSJ (longform / business / news)
  { id: "wsj_world",  url: "https://feeds.content.dowjones.io/public/rss/RSSWorldNews",               source: "wsj.com",            kind: "top" },
  { id: "wsj_us_business", url: "https://feeds.content.dowjones.io/public/rss/WSJcomUSBusiness",      source: "wsj.com",            kind: "important" },
  { id: "wsj_markets",url: "https://feeds.content.dowjones.io/public/rss/RSSMarketsMain",             source: "wsj.com",            kind: "consistnet" },
  { id: "wsj_tech",   url: "https://feeds.content.dowjones.io/public/rss/RSSWSJD",                    source: "wsj.com",            kind: "consistent" },
  { id: "wsj_politics", url: "https://feeds.content.dowjones.io/public/rss/socialpoliticsfeed",       source: "wsj.com",            kind: "consistent" },
  { id: "wsj_economy", url: "https://feeds.content.dowjones.io/public/rss/socialeconomyfeed",         source: "wsj.com",            kind: "consistent" },
  { id: "wsj_sports", url: "https://feeds.content.dowjones.io/public/rss/rsssportsfeed",              source: "wsj.com",            kind: "important" },

  { id: "morning_brew", url: "https://www.morningbrew.com/feed.xml",              source: "morningbrew.com",            kind: "important" },
  
  // Israel / Euro sports sites
  { id: "one_main",   url: "https://www.one.co.il/rss/",                     source: "one.co.il",           kind: "top" },
  { id: "yahoo_sports", url: "https://sports.yahoo.com/general/news/rss/",   source: "sports.yahoo.com",    kind: "top" },
  { id: "front_office_sports", url: "https://frontofficesports.com/feed/",   source: "frontofficesports.com", kind: "periodic" },
  { id: "eurohoops",  url: "https://www.eurohoops.net/en/feed/",             source: "eurohoops.net",       kind: "consistent" },

  // Nitter personalities (social, very time‑sensitive)
  //{ id: "x_shams",    url: "${NITTER_BASE}/ShamsCharania/rss",          source: "x.com",               kind: "social" },
  //{ id: "x_fabrizio", url: "${NITTER_BASE}/fabrizioromano/rss",         source: "x.com",               kind: "social" },
  //{ id: "x_schefter", url: "${NITTER_BASE}/adamschefter/rss",           source: "x.com",               kind: "social" },
  //{ id: "x_modai",    url: "${NITTER_BASE}/Yoav_Modai/rss",             source: "x.com",               kind: "social" },
  //{ id: "x_raz_amir", url: "${NITTER_BASE}/razamir29/rss",              source: "x.com",               kind: "social" },

  // Nitter orgs
  //{ id: "x_standwithus", url: "${NITTER_BASE}/standwithus/rss",         source: "x.com",               kind: "social" },

  // Nitter sports teams / fan accounts
  //{ id: "x_mavs",     url: "${NITTER_BASE}/dallasmavs/rss",             source: "x.com",               kind: "social" },
  //{ id: "x_aggie_fb", url: "${NITTER_BASE}/aggiefootball/rss",          source: "x.com",               kind: "social" },
  //{ id: "x_aggie_mb", url: "${NITTER_BASE}/aggiembk/rss",               source: "x.com",               kind: "social" },
  //{ id: "x_maccabi_fc", url: "${NITTER_BASE}/maccabitlvfc/rss",         source: "x.com",               kind: "social" },
  //{ id: "x_maccabi_bc", url: "${NITTER_BASE}/maccabitlvbc/rss",         source: "x.com",               kind: "social" },
  //{ id: "x_12thman",  url: "${NITTER_BASE}/12thman/rss",                source: "x.com",               kind: "social" },
  //{ id: "x_tamu",     url: "${NITTER_BASE}/tamu/rss",                   source: "x.com",               kind: "social" },
  //{ id: "x_manutd",   url: "${NITTER_BASE}/manutd/rss",                 source: "x.com",               kind: "social" },
  //{ id: "x_barca",    url: "${NITTER_BASE}/fcbarcelona/rss",            source: "x.com",               kind: "social" },
  //{ id: "x_fcdallas", url: "${NITTER_BASE}/fcdallas/rss",               source: "x.com",               kind: "social" },
  //{ id: "x_usmntonly",url: "${NITTER_BASE}/usmntonly/rss",              source: "x.com",               kind: "social" },
  //{ id: "x_wtfstats", url: "${NITTER_BASE}/wtfstats/rss",               source: "x.com",               kind: "social" },
];

// Interval (in minutes) per feed kind
const INTERVALS = {
  breaking: 1,
  critical: 5,
  top: 10,
  important: 20,
  consistent: 30,
  periodic: 60,
  social: 10000000,
};

function getIntervalMinutes(feed) {
  return INTERVALS[feed.kind] ?? INTERVALS.default;
}

// Test a single Nitter RSS URL from the Worker
async function testNitterFeed(url) {
  try {
    const resp = await fetch(url);
    console.log("Nitter test status:", resp.status);

    if (!resp.ok) {
      const text = await resp.text();
      console.log("Nitter error body (first 500 chars):", text.slice(0, 500));
      return { ok: false, status: resp.status };
    }

    const xml = await resp.text();
    console.log("Nitter RSS OK, sample:", xml.slice(0, 500));
    return { ok: true, status: resp.status };
  } catch (err) {
    console.log("Nitter test threw error:", err);
    return { ok: false, error: String(err) };
  }
}

// ---- SIMPLE RSS PARSING ----

function decodeHtmlEntities(text) {
  if (!text) return text;

  let out = text.replace(/&#(\d+);/g, (_, num) =>
    String.fromCharCode(parseInt(num, 10))
  );

  out = out.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) =>
    String.fromCharCode(parseInt(hex, 16))
  );

  return out;
}

function cleanCData(text) {
  if (!text) return null;

  let cleaned = text
    .replace(/^<!\[CDATA\[/i, "")   // leading CDATA
    .replace(/\]\]>$/i, "")        // trailing CDATA
    .replace(/\\u003C/gi, "<") // remove <![CDATA[ ... ]]>
    .replace(/\\u003E/gi, ">"); // leading CDATA

  cleaned = cleaned.replace(/^<!\[CDATA\[/i, "").replace(/\]\]>$/i, "");
  cleaned = cleaned.replace(/<\/?[^>]+>/g, ""); // strip tags
  return cleaned.trim();
}


function extractTag(text, tag) {
  const regex = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "i");
  const match = text.match(regex);
  return match ? match[1].trim() : null;
}

function extractFirstImageSrc(htmlLike) {
  if (!htmlLike) return null;
  // handle CDATA + <img ... src="...">
  const imgMatch = htmlLike.match(/<img[^>]+src="([^"]+)"/i);
  return imgMatch ? imgMatch[1] : null;
}

function parseItems(xml, feed) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const link = cleanCData(extractTag(block, "link"));
    const rawTitle = extractTag(block, "title");
    const rawDescription = extractTag(block, "description");

    let title = decodeHtmlEntities(cleanCData(rawTitle));
    let description = decodeHtmlEntities(cleanCData(rawDescription));
    let imageURL = null;

    if (feed.source === "one.co.il") {
      imageURL = extractFirstImageSrc(rawDescription);
      if (rawDescription) {
        let withoutImg = rawDescription.replace(/<img[^>]*>/i, "").trim();
        description = decodeHtmlEntities(cleanCData(withoutImg));
      }
    }

    items.push({
      id: link ?? `${feed.id}-${items.length}`,
      title,
      url: link,
      description,
      publishedAt: extractTag(block, "pubDate"),
      source: feed.source,
      category: null,
      imageURL,
      feedId: feed.id,
    });
  }

  return items;
}

// ---- FETCHING WITH PER-FEED INTERVALS ----

async function fetchFeedIfDue(env, feed) {
  const now = Date.now();
  const lastKey = `last:${feed.id}`;
  const lastStr = await env.SIMPLE_RSS_BINDING.get(lastKey);
  const last = lastStr ? parseInt(lastStr, 10) : 0;

  const intervalMs = getIntervalMinutes(feed) * 60 * 1000;

  if (last && now - last < intervalMs) {
    return;
  }

  const resp = await fetch(feed.url);
  if (!resp.ok) {
    console.log("RSS fetch failed", feed.id, feed.url, resp.status);
    return;
  }

  const xml = await resp.text();
  console.log("RSS fetched OK", feed.id, xml.slice(0, 200));

  await env.SIMPLE_RSS_BINDING.put(`rss:${feed.id}`, xml, {
    expirationTtl: 60 * 60 * 12,
  });
  await env.SIMPLE_RSS_BINDING.put(lastKey, now.toString());
}

async function aggregateAllFromKV(env) {
  let all = [];

  for (const feed of FEEDS) {
    const xml = await env.SIMPLE_RSS_BINDING.get(`rss:${feed.id}`);
    if (!xml) continue;

    const items = parseItems(xml, feed);
    all = all.concat(items);
  }

  // Sort by publishedAt desc
  all.sort((a, b) => {
    const ta = a.publishedAt ? Date.parse(a.publishedAt) : 0;
    const tb = b.publishedAt ? Date.parse(b.publishedAt) : 0;
    return tb - ta;
  });

  return all;
}

// ---- WORKER HANDLERS ----

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Manual refresh: only fetch feeds that are due
    if (url.pathname === "/fetch-all") {
      await Promise.all(FEEDS.map(feed => fetchFeedIfDue(env, feed)));
      return new Response("Fetched due feeds");
    }

    if (url.pathname === "/test-nitter") {
      const testUrl = "https://nitter.privacydev.net/ShamsCharania/rss"; // put the instance/account you want
      const result = await testNitterFeed(testUrl);
      return new Response(JSON.stringify(result), {
        headers: { "Content-Type": "application/json" },
      });
    }
    
    // Aggregated JSON for your app
    if (url.pathname === "/api/news") {
      const articles = await aggregateAllFromKV(env);
      return new Response(JSON.stringify({ articles }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response("OK from rss-aggregator");
  },

  // Optional: when you add a cron trigger in wrangler.toml / dashboard,
  // point it at this scheduled handler, which reuses the same logic.
  async scheduled(event, env, ctx) {
    await Promise.all(FEEDS.map(feed => fetchFeedIfDue(env, feed)));
  },
};
