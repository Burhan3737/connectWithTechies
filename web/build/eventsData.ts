import { readFileSync } from 'node:fs';
import type { Plugin } from 'vite';

/**
 * Serves data/events.json to the app — in dev from the pipeline's file, in a
 * build as an emitted asset — trimmed to the fields the app reads.
 *
 * The pipeline (scripts/, agent/) owns data/events.json and keeps writing it
 * there; the app never imports it, so a data refresh needs no code change and
 * the bundle stays small. Fields like source, feed_id and feed_relevance are
 * the pipeline's bookkeeping and are dropped here.
 */
const KEEP = ['name', 'type', 'topics', 'city', 'region', 'country', 'venue', 'cadence', 'month',
  'next_date', 'next_date_end', 'last_date', 'status', 'attendance', 'cost', 'audience', 'url',
  'description', 'feed_dates'] as const;

export function slimDataset(raw: string): string {
  const data = JSON.parse(raw);
  const events = (data.events as Record<string, unknown>[]).map((e) => {
    const out: Record<string, unknown> = {};
    for (const k of KEEP) {
      const v = e[k];
      if (v === '' || v == null || (Array.isArray(v) && !v.length)) continue;   // absent reads the same as empty
      out[k] = v;
    }
    return out;
  });
  return JSON.stringify({ generated_on: data.generated_on, event_count: events.length, city_count: data.city_count, events });
}

export function eventsData(sourcePath: string): Plugin {
  const read = () => slimDataset(readFileSync(sourcePath, 'utf8'));
  let base = '/';
  return {
    name: 'connectwithtechies:events-data',
    configResolved(config) { base = config.base; },
    configureServer(server) {
      server.middlewares.use((req: { url?: string }, res, next) => {
        const path = (req.url || '').split('?')[0];
        if (path !== `${base}data/events.json` && path !== '/data/events.json') return next();
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache');
        res.end(read());      // read per request: a fresh pipeline run shows on reload
      });
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'data/events.json', source: read() });
    },
  };
}
