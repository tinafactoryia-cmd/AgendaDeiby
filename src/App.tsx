import { useMemo, useState } from 'react'
import './App.css'

type View = 'today' | 'agenda' | 'hours' | 'settings'
type EntryKind = 'task' | 'appointment' | 'work'

type Task = {
  id: number
  title: string
  time: string
  priority: 'Alta' | 'Normal' | 'Baja'
  completed: boolean
}

type Appointment = {
  id: number
  title: string
  time: string
  endTime: string
  place: string
}

const initialTasks: Task[] = [
  { id: 1, title: 'Enviar presupuesto', time: '10:00', priority: 'Alta', completed: false },
  { id: 2, title: 'Llamar al proveedor', time: '12:30', priority: 'Normal', completed: false },
  { id: 3, title: 'Revisar facturas', time: '16:00', priority: 'Baja', completed: true },
]

const initialAppointments: Appointment[] = [
  { id: 1, title: 'Reunión con cliente', time: '09:00', endTime: '09:45', place: 'Oficina' },
  { id: 2, title: 'Visita médica', time: '17:00', endTime: '17:45', place: 'Centro de salud' },
]

const days = [
  { day: 'L', date: 13 }, { day: 'M', date: 14 }, { day: 'X', date: 15 },
  { day: 'J', date: 16 }, { day: 'V', date: 17 }, { day: 'S', date: 18 },
  { day: 'D', date: 19 }, { day: 'L', date: 20 }, { day: 'M', date: 21 },
  { day: 'X', date: 22 }, { day: 'J', date: 23 }, { day: 'V', date: 24 },
  { day: 'S', date: 25 }, { day: 'D', date: 26 },
]

function App() {
  const [view, setView] = useState<View>('today')
  const [tasks, setTasks] = useState(initialTasks)
  const [appointments, setAppointments] = useState(initialAppointments)
  const [selectedDay, setSelectedDay] = useState(18)
  const [todayLogged, setTodayLogged] = useState(false)
  const [modal, setModal] = useState<EntryKind | null>(null)

  const pendingTasks = useMemo(() => tasks.filter((task) => !task.completed), [tasks])

  function toggleTask(id: number) {
    setTasks((current) => current.map((task) =>
      task.id === id ? { ...task, completed: !task.completed } : task,
    ))
  }

  function addEntry(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const title = String(form.get('title') ?? '').trim()
    if (!modal || (modal !== 'work' && !title)) return

    if (modal === 'work') {
      setTodayLogged(true)
    } else if (modal === 'task') {
      setTasks((current) => [...current, {
        id: Date.now(),
        title,
        time: String(form.get('time') || 'Sin hora'),
        priority: String(form.get('priority') || 'Normal') as Task['priority'],
        completed: false,
      }])
    } else {
      setAppointments((current) => [...current, {
        id: Date.now(),
        title,
        time: String(form.get('time') || '09:00'),
        endTime: String(form.get('endTime') || '10:00'),
        place: String(form.get('place') || 'Sin ubicación'),
      }])
    }

    setModal(null)
  }

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <p className="eyebrow">Sábado, 18 de julio</p>
          <h1>{view === 'today' ? 'Buenos días, Deiby' : viewLabels[view]}</h1>
        </div>
        <button className="avatar" type="button" aria-label="Abrir ajustes" onClick={() => setView('settings')}>D</button>
      </header>

      <main>
        {view === 'today' && (
          <TodayView
            tasks={tasks}
            appointments={appointments}
            todayLogged={todayLogged}
            toggleTask={toggleTask}
            openModal={setModal}
          />
        )}
        {view === 'agenda' && (
          <AgendaView
            tasks={tasks}
            appointments={appointments}
            selectedDay={selectedDay}
            setSelectedDay={setSelectedDay}
            toggleTask={toggleTask}
            openModal={setModal}
          />
        )}
        {view === 'hours' && <HoursView todayLogged={todayLogged} openModal={setModal} />}
        {view === 'settings' && <SettingsView />}
      </main>

      <nav className="bottom-nav" aria-label="Navegación principal">
        <NavButton label="Hoy" icon="⌂" active={view === 'today'} onClick={() => setView('today')} />
        <NavButton label="Agenda" icon="▦" active={view === 'agenda'} onClick={() => setView('agenda')} />
        <button className="add-button" type="button" aria-label="Añadir" onClick={() => setModal('task')}>+</button>
        <NavButton label="Horas" icon="◷" active={view === 'hours'} onClick={() => setView('hours')} />
        <NavButton label="Ajustes" icon="⚙" active={view === 'settings'} onClick={() => setView('settings')} />
      </nav>

      {modal && <EntryModal kind={modal} onClose={() => setModal(null)} onSubmit={addEntry} />}
      <span className="sr-only" aria-live="polite">{pendingTasks.length} tareas pendientes</span>
    </div>
  )
}

const viewLabels: Record<View, string> = {
  today: 'Hoy',
  agenda: 'Mi agenda',
  hours: 'Horas trabajadas',
  settings: 'Ajustes',
}

function TodayView({ tasks, appointments, todayLogged, toggleTask, openModal }: {
  tasks: Task[]
  appointments: Appointment[]
  todayLogged: boolean
  toggleTask: (id: number) => void
  openModal: (kind: EntryKind) => void
}) {
  return (
    <div className="page-stack">
      <section className="work-card">
        <div>
          <p className="eyebrow light">Horas de hoy</p>
          <strong>{todayLogged ? '8 h registradas' : 'Sin registrar'}</strong>
          <p>{todayLogged ? '08:00 – 17:00 · 1 hora de pausa' : 'Añade tu jornada cuando termines de trabajar'}</p>
        </div>
        <button type="button" className="work-button" onClick={() => openModal('work')}>
          {todayLogged ? 'Editar jornada' : 'Registrar jornada'}
        </button>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div><p className="eyebrow">A continuación</p><h2>Próxima cita</h2></div>
          <button className="text-button" type="button" onClick={() => openModal('appointment')}>Añadir</button>
        </div>
        <AppointmentCard appointment={appointments[1] ?? appointments[0]} featured />
      </section>

      <section className="panel">
        <div className="section-heading">
          <div><p className="eyebrow">Para hoy</p><h2>Tareas pendientes</h2></div>
          <button className="text-button" type="button" onClick={() => openModal('task')}>Añadir</button>
        </div>
        <div className="list">
          {tasks.map((task) => <TaskRow key={task.id} task={task} toggleTask={toggleTask} />)}
        </div>
      </section>
    </div>
  )
}

function AgendaView({ tasks, appointments, selectedDay, setSelectedDay, toggleTask, openModal }: {
  tasks: Task[]
  appointments: Appointment[]
  selectedDay: number
  setSelectedDay: (day: number) => void
  toggleTask: (id: number) => void
  openModal: (kind: EntryKind) => void
}) {
  return (
    <div className="page-stack">
      <section className="panel calendar-panel">
        <div className="month-heading"><button type="button" aria-label="Mes anterior">‹</button><h2>Julio 2026</h2><button type="button" aria-label="Mes siguiente">›</button></div>
        <div className="calendar-grid">
          {days.map(({ day, date }) => (
            <button key={date} type="button" className={selectedDay === date ? 'calendar-day selected' : 'calendar-day'} onClick={() => setSelectedDay(date)}>
              <span>{day}</span><strong>{date}</strong>{[18, 20, 22, 24].includes(date) && <i />}
            </button>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div><p className="eyebrow">Sábado {selectedDay}</p><h2>Tu día</h2></div>
          <div className="split-actions">
            <button type="button" onClick={() => openModal('task')}>+ Tarea</button>
            <button type="button" onClick={() => openModal('appointment')}>+ Cita</button>
          </div>
        </div>
        <div className="timeline">
          {appointments.map((appointment) => <AppointmentCard key={appointment.id} appointment={appointment} />)}
          {tasks.slice(0, 2).map((task) => <TaskRow key={task.id} task={task} toggleTask={toggleTask} />)}
        </div>
      </section>
    </div>
  )
}

function HoursView({ todayLogged, openModal }: { todayLogged: boolean, openModal: (kind: EntryKind) => void }) {
  return (
    <div className="page-stack">
      <section className="timer-card">
        <p className="eyebrow light">Jornada de hoy</p>
        <strong>{todayLogged ? '8 h' : 'Pendiente'}</strong>
        <p>{todayLogged ? '08:00 – 17:00 · 1 hora de pausa' : 'Registra tus horas al terminar el día'}</p>
        <button type="button" onClick={() => openModal('work')}>{todayLogged ? 'Editar jornada' : '+ Registrar jornada'}</button>
      </section>
      <div className="stats-grid">
        <Stat value="7 h 58 min" label="Hoy" />
        <Stat value="36 h 24 min" label="Esta semana" />
        <Stat value="118 h 10 min" label="Este mes" />
      </div>
      <section className="panel">
        <div className="section-heading"><div><p className="eyebrow">Últimos días</p><h2>Historial</h2></div><button className="text-button" type="button" onClick={() => openModal('work')}>Añadir</button></div>
        <div className="history">
          <HistoryRow day="Viernes, 17 julio" time="08:01 – 16:29" total="7 h 58 min" />
          <HistoryRow day="Jueves, 16 julio" time="08:12 – 17:03" total="8 h 21 min" />
          <HistoryRow day="Miércoles, 15 julio" time="07:58 – 16:32" total="8 h 04 min" />
        </div>
      </section>
    </div>
  )
}

function SettingsView() {
  return (
    <section className="panel settings-list">
      <div className="profile"><div className="avatar large">D</div><div><h2>Deiby</h2><p>Cuenta de prueba</p></div></div>
      <label>Nombre visible<input defaultValue="Deiby" /></label>
      <label>Zona horaria<select defaultValue="Europe/Madrid"><option>Europe/Madrid</option></select></label>
      <label>Objetivo diario<div className="input-suffix"><input type="number" defaultValue="8" /><span>horas</span></div></label>
      <button className="primary-button" type="button">Guardar ajustes</button>
      <button className="danger-button" type="button">Cerrar sesión</button>
    </section>
  )
}

function NavButton({ label, icon, active, onClick }: { label: string, icon: string, active: boolean, onClick: () => void }) {
  return <button className={active ? 'nav-item active' : 'nav-item'} type="button" onClick={onClick}><span>{icon}</span>{label}</button>
}

function TaskRow({ task, toggleTask }: { task: Task, toggleTask: (id: number) => void }) {
  return (
    <label className={task.completed ? 'task-row completed' : 'task-row'}>
      <input type="checkbox" checked={task.completed} onChange={() => toggleTask(task.id)} />
      <span className="checkmark">✓</span>
      <span className="task-copy"><strong>{task.title}</strong><small>{task.time} · Prioridad {task.priority.toLowerCase()}</small></span>
      <span className={`priority ${task.priority.toLowerCase()}`} />
    </label>
  )
}

function AppointmentCard({ appointment, featured = false }: { appointment?: Appointment, featured?: boolean }) {
  if (!appointment) return <p className="empty-state">No hay citas para hoy.</p>
  return (
    <article className={featured ? 'appointment featured' : 'appointment'}>
      <div className="date-tile"><strong>{appointment.time}</strong><span>{appointment.endTime}</span></div>
      <div><h3>{appointment.title}</h3><p>⌖ {appointment.place}</p></div>
      <span className="chevron">›</span>
    </article>
  )
}

function Stat({ value, label }: { value: string, label: string }) {
  return <article className="stat"><strong>{value}</strong><span>{label}</span></article>
}

function HistoryRow({ day, time, total }: { day: string, time: string, total: string }) {
  return <div className="history-row"><div><strong>{day}</strong><small>{time} · 30 min de pausa</small></div><b>{total}</b></div>
}

function EntryModal({ kind, onClose, onSubmit }: { kind: EntryKind, onClose: () => void, onSubmit: (event: React.FormEvent<HTMLFormElement>) => void }) {
  const title = kind === 'task' ? 'Nueva tarea' : kind === 'appointment' ? 'Nueva cita' : 'Registrar jornada'
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="section-heading"><h2 id="modal-title">{title}</h2><button className="close-button" type="button" aria-label="Cerrar" onClick={onClose}>×</button></div>
        <form onSubmit={onSubmit}>
          {kind !== 'work' && <label>Título<input name="title" required autoFocus placeholder={kind === 'task' ? '¿Qué tienes que hacer?' : '¿Con quién o dónde?'} /></label>}
          {kind === 'work' ? (
            <>
              <label>Fecha<input name="date" type="date" defaultValue="2026-07-18" autoFocus /></label>
              <div className="form-grid"><label>Hora de inicio<input name="startTime" type="time" defaultValue="08:00" /></label><label>Hora de salida<input name="endTime" type="time" defaultValue="17:00" /></label></div>
              <label>Pausa total<select name="breakMinutes" defaultValue="60"><option value="0">Sin pausa</option><option value="30">30 minutos</option><option value="60">1 hora</option><option value="90">1 hora y 30 minutos</option></select></label>
              <div className="calculation"><span>Total calculado</span><strong>8 h</strong><small>17:00 − 08:00 − 1 h de pausa</small></div>
            </>
          ) : (
            <div className="form-grid"><label>Fecha<input name="date" type="date" defaultValue="2026-07-18" /></label><label>Hora<input name="time" type="time" defaultValue="10:00" /></label></div>
          )}
          {kind === 'task' ? (
            <label>Prioridad<select name="priority" defaultValue="Normal"><option>Alta</option><option>Normal</option><option>Baja</option></select></label>
          ) : kind === 'appointment' ? (
            <><label>Hora de finalización<input name="endTime" type="time" defaultValue="11:00" /></label><label>Lugar<input name="place" placeholder="Ubicación opcional" /></label></>
          ) : null}
          <div className="modal-actions"><button className="secondary-button" type="button" onClick={onClose}>Cancelar</button><button className="primary-button" type="submit">Guardar</button></div>
        </form>
      </section>
    </div>
  )
}

export default App
