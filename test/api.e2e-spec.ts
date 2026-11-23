/**
 * E2E tests. Require a migrated + seeded database (`npm run migrate:deploy && npm run seed`)
 * and ADMIN_API_KEY in the environment (defaults to "test-key" below).
 */
process.env.ADMIN_API_KEY = process.env.ADMIN_API_KEY ?? 'test-key';

import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from "supertest";
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';

describe('OneAtlas API (e2e)', () => {
  let app: INestApplication;
  const http = () => request(app.getHttpServer());

  beforeAll(async () => {
    const mod = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = mod.createNestApplication();
    configureApp(app);
    await app.init();
  });
  afterAll(() => app.close());

  it('GET /health', async () => {
    const r = await http().get('/health').expect(200);
    expect(r.body.status).toBe('ok');
  });

  describe('models list', () => {
    it('paginates and returns meta', async () => {
      const r = await http().get('/api/v1/models?limit=5&page=2').expect(200);
      expect(r.body.data).toHaveLength(5);
      expect(r.body.meta).toMatchObject({ page: 2, limit: 5 });
      expect(r.body.meta.total).toBeGreaterThan(5);
    });

    it('sorts by price ascending (nulls last)', async () => {
      const r = await http().get('/api/v1/models?sort=price_asc&limit=50').expect(200);
      const prices = r.body.data.map((m: any) => m.pricing.minInputPricePerMTok).filter((p: number | null) => p !== null);
      expect([...prices].sort((a: number, b: number) => a - b)).toEqual(prices);
    });

    it('filters by lab + capability (AND) + open source', async () => {
      const r = await http().get('/api/v1/models?lab=meta&capability=tool-calling&openSource=true').expect(200);
      expect(r.body.data.length).toBeGreaterThan(0);
      for (const m of r.body.data) {
        expect(m.lab.slug).toBe('meta');
        expect(m.capabilities).toContain('tool-calling');
        expect(m.isOpenSource).toBe(true);
      }
    });

    it('filters by provider and minContext', async () => {
      const r = await http().get('/api/v1/models?provider=groq&minContext=100000').expect(200);
      for (const m of r.body.data) expect(m.contextWindow).toBeGreaterThanOrEqual(100000);
    });

    it('searches by text', async () => {
      const r = await http().get('/api/v1/models?q=claude').expect(200);
      expect(r.body.data.length).toBeGreaterThan(0);
    });

    it('rejects invalid params with a consistent 400 envelope', async () => {
      const r = await http().get('/api/v1/models?sort=bogus&limit=1000&nope=1').expect(400);
      expect(r.body).toMatchObject({ statusCode: 400, message: 'Validation failed' });
      expect(Array.isArray(r.body.details)).toBe(true);
    });
  });

  describe('model detail', () => {
    it('returns providers, pricing and benchmarks', async () => {
      const r = await http().get('/api/v1/models/gpt-4o').expect(200);
      expect(r.body.providers.length).toBeGreaterThan(0);
      expect(r.body.benchmarks.length).toBeGreaterThan(0);
    });
    it('404s on unknown slug', async () => {
      await http().get('/api/v1/models/does-not-exist').expect(404);
    });
  });

  describe('compare', () => {
    it('compares models in requested order', async () => {
      const r = await http().get('/api/v1/models/compare?slugs=gpt-4o,claude-3-5-sonnet').expect(200);
      expect(r.body.models.map((m: any) => m.slug)).toEqual(['gpt-4o', 'claude-3-5-sonnet']);
      expect(r.body.benchmarks.length).toBeGreaterThan(0);
      expect(r.body.highlights.largestContext).toBe('claude-3-5-sonnet');
    });
    it('400 with fewer than 2 slugs, 404 with unknown slug', async () => {
      await http().get('/api/v1/models/compare?slugs=gpt-4o').expect(400);
      await http().get('/api/v1/models/compare?slugs=gpt-4o,nope').expect(404);
    });
  });

  describe('rankings', () => {
    it('ranks a benchmark descending with ranks starting at 1', async () => {
      const r = await http().get('/api/v1/rankings?benchmark=gpqa-diamond&limit=10').expect(200);
      expect(r.body.data[0].rank).toBe(1);
      const scores = r.body.data.map((x: any) => x.score);
      expect([...scores].sort((a: number, b: number) => b - a)).toEqual(scores);
    });
    it('supports category and overall aggregation', async () => {
      await http().get('/api/v1/rankings?category=coding').expect(200);
      await http().get('/api/v1/rankings?minBenchmarks=3').expect(200);
    });
    it('rejects benchmark+category and unknown benchmark', async () => {
      await http().get('/api/v1/rankings?benchmark=mmlu&category=coding').expect(400);
      await http().get('/api/v1/rankings?benchmark=nope').expect(404);
    });
  });

  it('labs, providers and global search', async () => {
    const lab = await http().get('/api/v1/labs/anthropic').expect(200);
    expect(lab.body.models.length).toBeGreaterThan(0);
    const prov = await http().get('/api/v1/providers/together').expect(200);
    expect(prov.body.models.length).toBeGreaterThan(0);
    const s = await http().get('/api/v1/search?q=llama').expect(200);
    expect(s.body.models.length).toBeGreaterThan(0);
    await http().get('/api/v1/search').expect(400);
  });

  describe('admin writes', () => {
    const body = {
      slug: 'e2e-test-model', name: 'E2E Test Model', labSlug: 'openai', type: 'LLM', contextWindow: 8000,
      inputModalities: ['TEXT'], outputModalities: ['TEXT'], capabilities: ['tool-calling'],
    };
    afterAll(async () => {
      await http().delete('/api/v1/models/e2e-test-model').set('x-api-key', 'test-key');
    });

    it('401 without API key', async () => {
      await http().post('/api/v1/models').send(body).expect(401);
    });
    it('creates a model, prices it, updates min price + history; duplicate -> 409', async () => {
      await http().post('/api/v1/models').set('x-api-key', 'test-key').send(body).expect(201);
      await http().post('/api/v1/models').set('x-api-key', 'test-key').send(body).expect(409);

      await http().put('/api/v1/models/e2e-test-model/providers/together').set('x-api-key', 'test-key')
        .send({ inputPricePerMTok: 1, outputPricePerMTok: 2 }).expect(200);
      await http().put('/api/v1/models/e2e-test-model/providers/groq').set('x-api-key', 'test-key')
        .send({ inputPricePerMTok: 0.5, outputPricePerMTok: 3 }).expect(200);
      await http().put('/api/v1/models/e2e-test-model/providers/groq').set('x-api-key', 'test-key')
        .send({ inputPricePerMTok: 0.4, outputPricePerMTok: 3 }).expect(200);

      const d = await http().get('/api/v1/models/e2e-test-model').expect(200);
      expect(d.body.pricing.minInputPricePerMTok).toBe(0.4);
      expect(d.body.pricing.minOutputPricePerMTok).toBe(2);
      const h = await http().get('/api/v1/models/e2e-test-model/price-history').expect(200);
      expect(h.body.data.length).toBe(3);
    });
    it('validates payloads', async () => {
      await http().post('/api/v1/models').set('x-api-key', 'test-key').send({ ...body, slug: 'Bad Slug!' }).expect(400);
      await http().put('/api/v1/models/gpt-4o/providers/groq').set('x-api-key', 'test-key')
        .send({ inputPricePerMTok: -1, outputPricePerMTok: 1 }).expect(400);
      await http().put('/api/v1/models/gpt-4o/benchmarks/mmlu').set('x-api-key', 'test-key').send({ score: 150 }).expect(400);
    });
  });
});
