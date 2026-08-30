import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

const root = createRoot(document.getElementById('root')!)

/**
 * Shown when the app cannot start at all — in practice, a deployment whose
 * Firebase environment variables are missing. Without this the failure is a
 * blank page and a console error nobody thinks to open.
 */
function StartupError({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-zinc-900 border border-red-900/50 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-red-500 text-3xl">error</span>
          <h1 className="text-white font-black text-lg uppercase tracking-tight">
            App misconfigured
          </h1>
        </div>
        <pre className="text-zinc-400 text-xs whitespace-pre-wrap font-mono leading-relaxed">
          {message}
        </pre>
        <p className="text-zinc-600 text-xs">
          See docs/ENVIRONMENTS.md for which variables each environment needs.
        </p>
      </div>
    </div>
  )
}

// Loaded dynamically so a config error thrown while the module graph is
// evaluated is catchable here, rather than killing the page silently.
import('./App.tsx')
  .then(({ default: App }) => {
    root.render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
  })
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error)
    console.error(error)
    root.render(<StartupError message={message} />)
  })
