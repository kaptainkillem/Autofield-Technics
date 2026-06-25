const APPOINTMENTS = [
  { id: 'A-01', customer: 'Lisa van Dyk',   service: 'Engine diagnostics', date: 'Today',    time: '09:00',  status: 'Confirmed' },
  { id: 'A-02', customer: 'Sipho Mokoena',  service: 'Brake service',      date: 'Today',    time: '11:30',  status: 'Confirmed' },
  { id: 'A-03', customer: 'Ruan Venter',    service: 'Electrical',         date: 'Tomorrow', time: '08:00',  status: 'Pending'   },
  { id: 'A-04', customer: 'Ayanda Mthembu', service: 'Oil service',        date: 'Tomorrow', time: '14:00',  status: 'Confirmed' },
  { id: 'A-05', customer: 'Priya Naidoo',   service: 'Suspension repair',  date: 'Thu 5 Jun', time: '10:00', status: 'Pending'   },
]

export function AdminAppointments() {
  return (
    <div className="bg-white border border-grey-medium/10 rounded-base shadow-sm overflow-hidden">
      <div className="p-4 border-b border-grey-medium/10 flex items-center justify-between">
        <span className="text-sm font-semibold text-grey-dark">Upcoming</span>
        <span className="text-xs bg-primary/10 text-primary font-semibold px-2 py-0.5 rounded-full">
          {APPOINTMENTS.length} booked
        </span>
      </div>
      <ul className="divide-y divide-grey-medium/20">
        {APPOINTMENTS.map((apt) => (
          <li key={apt.id} className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-primary/5 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-base bg-primary/10 flex flex-col items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-primary leading-none">{apt.time}</span>
                <span className="text-[10px] text-grey-medium leading-none mt-0.5">{apt.date}</span>
              </div>
              <div>
                <p className="text-sm font-medium text-grey-dark">{apt.customer}</p>
                <p className="text-xs text-grey">{apt.service}</p>
              </div>
            </div>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
              apt.status === 'Confirmed'
                ? 'bg-green-100 text-green-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {apt.status}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}