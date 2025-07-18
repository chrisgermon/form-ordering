"use client"

export function ErrorDisplay({ error }: { error: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md text-center w-full max-w-2xl">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Server Error</h1>
        <p className="text-gray-700 mb-4">An error occurred while trying to load the form data.</p>
        <pre className="mt-4 p-4 bg-gray-50 text-left text-sm text-red-700 rounded-md overflow-auto whitespace-pre-wrap break-words">
          <code>{error}</code>
        </pre>
      </div>
    </div>
  )
}
