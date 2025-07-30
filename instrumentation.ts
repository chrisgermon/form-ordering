import type { Instrumentation } from "next"

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // You can import and initialize any server-side observability
    // tools like Sentry, OpenTelemetry, etc. here.
  }
}

/**
 * This function is called when an error occurs on the server.
 * It's a great place to send errors to your observability platform.
 */
export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  console.error("Caught server-side error:", {
    message: err.message,
    digest: err.digest,
    request: {
      path: request.path,
      method: request.method,
    },
    context: {
      routePath: context.routePath,
      routeType: context.routeType,
    },
  })

  // Example of sending to a hypothetical error reporting service:
  /*
  await fetch('https://your-error-reporter.com/api/report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: err.message,
      digest: err.digest,
      stack: err.stack,
      request,
      context,
    }),
  });
  */
}
