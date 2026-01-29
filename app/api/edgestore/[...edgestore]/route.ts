import { initEdgeStore } from '@edgestore/server';
import { createEdgeStoreNextHandler } from '@edgestore/server/adapters/next/app';

const createEdgeStoreRouter = (es: ReturnType<typeof initEdgeStore.create>) => {
  console.log('[EdgeStore] createEdgeStoreRouter invoked - with Delete Permission v2');

  return es.router({
    trialOutcomeAttachments: es.fileBucket({
      maxSize: 1024 * 1024 * 50, // 50MB
      accept: ['image/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
    })
      .beforeDelete(() => true), // Allow delete from frontend - method chain syntax
  });
};

const buildEdgeStoreHandler = () => {
  console.log('[EdgeStore] buildEdgeStoreHandler invoked');

  // Hardcoded keys with basic "cryptography" (Base64 encoding) as requested
  const ENCRYPTED_ACCESS_KEY = "V3NHYnQ2Q1FnYUtnOXJmMXdJMEg0a2FqV3BNTzYxalM=";
  const ENCRYPTED_SECRET_KEY = "Q0dpVUxPTWlZTVhiQk9ENnphYktwcEhWaTg3ZG1obzlWdFJhWjNwdlN0YU96bWFj";

  const accessKey = Buffer.from(ENCRYPTED_ACCESS_KEY, 'base64').toString('utf-8');
  const secretKey = Buffer.from(ENCRYPTED_SECRET_KEY, 'base64').toString('utf-8');

  console.log('[EdgeStore] Using hardcoded credentials');

  // Set environment variables for EdgeStore to pick up (avoiding type issues with create())
  process.env.EDGE_STORE_ACCESS_KEY = accessKey;
  process.env.EDGE_STORE_SECRET_KEY = secretKey;

  const es = initEdgeStore.create();

  /**
   * This is the main router for the Edge Store buckets.
   */
  const edgeStoreRouter = createEdgeStoreRouter(es);

  return createEdgeStoreNextHandler({
    router: edgeStoreRouter,
  });
};

// Cache the handler to avoid rebuilding on every request
let cachedHandler: ReturnType<typeof buildEdgeStoreHandler> | null = null;

const handler = async (req: Request, ...args: any[]) => {
  console.log('[EdgeStore] handler invoked', { method: req.method, url: req.url });

  try {
    // Build handler if not cached
    if (!cachedHandler) {
      console.log('[EdgeStore] Building handler...');
      cachedHandler = buildEdgeStoreHandler();
    }

    if (!cachedHandler) {
      console.error('[EdgeStore] Handler not available - missing credentials');
      return new Response(
        JSON.stringify({
          error: 'EdgeStore not configured. Please set EDGE_STORE_ACCESS_KEY and EDGE_STORE_SECRET_KEY environment variables.'
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Call the Edge Store handler with all arguments
    console.log('[EdgeStore] Calling Edge Store handler...');
    return await cachedHandler(req, ...args);
  } catch (error) {
    console.error('[EdgeStore] Handler error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to process EdgeStore request';
    console.error('[EdgeStore] Error details:', { message: errorMessage, stack: error instanceof Error ? error.stack : undefined });
    return new Response(
      JSON.stringify({
        error: errorMessage
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

export { handler as GET, handler as POST };

/**
 * This type is used to create the type-safe client for the frontend.
 */
export type EdgeStoreRouter = ReturnType<typeof createEdgeStoreRouter>;

