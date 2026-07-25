export default function SuspendedPage() {
  return (
    <div className="min-h-screen bg-grey-lightest flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-base border border-grey-medium/10 shadow-sm p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-6">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-grey-dark mb-2">
          This website is temporarily unavailable
        </h1>
        <p className="text-sm text-grey leading-relaxed">
          The workshop you are looking for is currently not accepting new
          requests. If you are the workshop owner and believe this is a
          mistake, please contact support.
        </p>
      </div>
    </div>
  )
}
