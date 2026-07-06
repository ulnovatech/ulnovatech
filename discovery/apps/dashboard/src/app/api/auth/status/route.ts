import { dynamic } from '@/lib/route-config';
export { dynamic };
import { getAuthMode, getOperatorId } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET() {
  const operatorId = await getOperatorId();
  return NextResponse.json({
    authenticated: !!operatorId,
    operatorId,
    mode: getAuthMode(),
    clerkReady: !!(process.env.CLERK_SECRET_KEY && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY),
  });
}
