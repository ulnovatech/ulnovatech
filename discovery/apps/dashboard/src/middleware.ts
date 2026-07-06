import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

import { isCronAuthorized } from '@/lib/cron-auth';

import { NextResponse } from 'next/server';



const isPublicApi = createRouteMatcher(['/api/health', '/api/auth/status']);

const isCronApi = createRouteMatcher([

  '/api/intent/rss/poll',

  '/api/intent/custom-scrape/poll',

]);

const isPublicPage = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)']);



function devAuthAllowed() {

  return process.env.ALLOW_DEV_AUTH === 'true' && process.env.NODE_ENV !== 'production';

}



function clerkConfigured() {

  return !!(process.env.CLERK_SECRET_KEY && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

}



export default clerkMiddleware(async (auth, request) => {

  const { pathname } = request.nextUrl;



  if (isCronApi(request) && request.method === 'POST' && isCronAuthorized(request)) {

    return NextResponse.next();

  }



  if (pathname.startsWith('/api')) {

    if (isPublicApi(request)) {

      return NextResponse.next();

    }



    if (devAuthAllowed()) {

      if (request.method !== 'GET') {

        const devUser = request.headers.get('x-dev-user');

        if (!devUser) {

          return NextResponse.json(

            { error: 'Dev auth required: set X-Dev-User header' },

            { status: 401 },

          );

        }

      }

      return NextResponse.next();

    }



    if (clerkConfigured()) {

      await auth.protect();

      return NextResponse.next();

    }



    if (process.env.NODE_ENV === 'production') {

      return NextResponse.json({ error: 'Authentication not configured' }, { status: 401 });

    }



    return NextResponse.next();

  }



  if (devAuthAllowed()) {

    return NextResponse.next();

  }



  if (isPublicPage(request)) {

    return NextResponse.next();

  }



  if (clerkConfigured()) {

    await auth.protect();

    return NextResponse.next();

  }



  if (process.env.NODE_ENV === 'production') {

    return new NextResponse('Authentication not configured', { status: 401 });

  }



  return NextResponse.next();

});



export const config = {

  matcher: [

    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',

    '/(api|trpc)(.*)',

  ],

};

