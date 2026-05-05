import { ImageResponse } from '@vercel/og';
import statsData from '@/lib/stats.json';

export const runtime = 'edge';

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0d0d0d',
          padding: '40px',
        }}
      >
        <div style={{ fontSize: 120, marginBottom: 20 }}>🦞</div>
        <div
          style={{
            fontSize: 72,
            fontWeight: 'bold',
            color: '#ef4444',
            marginBottom: 20,
          }}
        >
          APIClaw
        </div>
        <div
          style={{
            fontSize: 36,
            color: '#ffffff',
            textAlign: 'center',
            maxWidth: 800,
          }}
        >
          The API Layer for AI Agents
        </div>
        <div
          style={{
            fontSize: 24,
            color: '#a3a3a3',
            marginTop: 16,
            textAlign: 'center',
          }}
        >
          Find, evaluate, and integrate APIs in milliseconds.
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 10,
            marginTop: 36,
            color: '#ef4444',
            fontSize: 26,
            lineHeight: 1.1,
          }}
        >
          <span>{statsData.apiCount.toLocaleString()}+ Indexed APIs</span>
          <span>{statsData.callableCount.toLocaleString()}+ Callable APIs</span>
          <span style={{ marginTop: 6, color: '#c7c7c7', fontSize: 22 }}>MCP, CLI, HTTP</span>
        </div>
        <div
          style={{
            fontSize: 20,
            color: '#737373',
            marginTop: 24,
            fontStyle: 'italic',
          }}
        >
          Built for the agentic era
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
