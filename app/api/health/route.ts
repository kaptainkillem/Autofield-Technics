import { NextResponse } from 'next/server';

export async function GET() {
  try {
    return NextResponse.json(
      { status: 'ok', timestamp: new Date().toISOString() },
      { status: 200 }
    );
  } catch (error) {
    console.error('[health]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
