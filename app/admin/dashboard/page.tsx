export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="bg-grey-light px-4 pt-16 md:px-20 md:pt-20">
        <div className="mx-auto max-w-6xl flex flex-col items-center text-center justify-center min-h-[200px]">
          <h1 className="heading-1 mb-4">Dashboard</h1>
          <p className="text-white max-w-2xl mb-8">Welcome to your admin dashboard.</p>
        </div>
      </section>

      <section className="bg-white px-4 pt-8 pb-24 md:px-20">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card bg-grey-lightest border border-primary/20 p-6 rounded-base flex flex-col gap-4">
              <h2 className="text-xl font-bold text-primary">Quotes</h2>
              <p className="text-grey-dark">Manage incoming quote requests.</p>
              <a href="/admin/quotes" className="btn-primary text-center">View Quotes</a>
            </div>

            <div className="card bg-grey-lightest border border-primary/20 p-6 rounded-base flex flex-col gap-4">
              <h2 className="text-xl font-bold text-primary">Services</h2>
              <p className="text-grey-dark">Manage service listings and categories.</p>
              <a href="/admin/services" className="btn-primary text-center">View Services</a>
            </div>

            <div className="card bg-grey-lightest border border-primary/20 p-6 rounded-base flex flex-col gap-4">
              <h2 className="text-xl font-bold text-primary">Reviews</h2>
              <p className="text-grey-dark">Manage customer reviews and ratings.</p>
              <a href="/admin/reviews" className="btn-primary text-center">View Reviews</a>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
