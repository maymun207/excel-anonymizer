import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/ai-scan/route';
import { NextRequest } from 'next/server';

// Mock the Anthropic SDK
vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      messages: {
        create: vi.fn().mockResolvedValue({
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                columns: [
                  { index: 0, type: 'PERSON', confidence: 'high' }
                ]
              })
            }
          ]
        })
      }
    }))
  };
});

describe('AI Scan API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ANTHROPIC_API_KEY = 'fake-key';
  });

  it('should return 500 if API key is missing', async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const req = new NextRequest('http://localhost/api/ai-scan', {
      method: 'POST',
      body: JSON.stringify({ columns: [] })
    });

    const res = await POST(req);
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toContain('ANTHROPIC_API_KEY');
  });

  it('should return 400 if columns are missing in body', async () => {
    const req = new NextRequest('http://localhost/api/ai-scan', {
      method: 'POST',
      body: JSON.stringify({})
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('should successfully parse model response', async () => {
    const req = new NextRequest('http://localhost/api/ai-scan', {
      method: 'POST',
      body: JSON.stringify({
        sheetName: 'Sheet1',
        columns: [{ index: 0, header: 'Name', samples: ['Ahmet'] }]
      })
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.columns[0].type).toBe('PERSON');
  });
});
