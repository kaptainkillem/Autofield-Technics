const APPOINTMENTS = [
  {
    id: 'A-02',
    service: 'Brake service',
    date: 'Today',
    time: '11:30',
    address: '14 Main Reef Rd, Johannesburg',
    status: 'Confirmed',
  },
]

export function UserAppointments() {
  if (APPOINTMENTS.length === 0) {
    return (
      <div className="card text-center py-10">
        <p className="text-3xl mb-3">📅</p>
        <p className="text-sm text-grey">No upcoming appointments.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {APPOINTMENTS.map((apt) => (
        <div key={apt.id} className="card flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-black">{apt.service}</p>
              <p className="text-sm text-grey">{apt.address}</p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 flex-shrink-0">
              {apt.status}
            </span>
          </div>

          <div className="flex items-center gap-3 bg-grey-lightest rounded-base px-3 py-2">
            <span className="text-2xl">🕐</span>
            <div>
              <p className="text-sm font-bold text-black">{apt.date} at {apt.time}</p>
              <p className="text-xs text-grey">Add to calendar</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}