import type { Instrumentation } from "next"

export async function register() {
  // This function is called once when the server starts.
  // You can use it to initialize monitoring services.
  if (process.env.NEXT_RUNTIME === "nodejs") {
    console.log("Server instrumentation registered.")
  }
}

export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  console.error("--- Server Error Captured by Instrumentation ---")
  console.error("Error Message:", err.message)
  if (err.digest) {
    console.error("Error Digest:", err.digest)
  }
  console.error("Request Path:", request.path)
  console.error("Request Method:", request.method)
  console.error("Context:", JSON.stringify(context, null, 2))
  console.error("Error Stack:", err.stack)
  console.error("----------------------------------------------")
}
