import { useEffect, useState } from 'react'
import './App.css'

type Task = {
  id: string
  title: string
  description: string
  priority: "low" | "medium" | "high"
  completed: boolean
}

const API_URL = "http://127.0.0.1:4000"
function App() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "low",
  })
  const [loading, setLoading] = useState(false)

  const loadTasks = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/tasks`)
      console.log(res)
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }
      const data = await res.json()
      setTasks(data.tasks)
    } catch (error) {
      console.error('Error cargando tareas:', error)
      setTasks([])
    } finally {
      setLoading(false)
    }
  }

  const createTask = async () => {
    const res = await fetch(`${API_URL}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`)
    }
    setForm({ title: "", description: "", priority: "low" })
    loadTasks()
  }
  const completeTask = async (id: string, completed: boolean) => {
    const res = await fetch(`${API_URL}/tasks/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed }),
    })
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`)
    }
    loadTasks()
    }

  const deleteTask = async (id: string) => {
    const res = await fetch(`${API_URL}/tasks/${id}`, {
      method: "DELETE",
    })
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`)
    }
    loadTasks()
  }

  useEffect(() => {
    loadTasks()
  }, [])

  return (
    <>
      {loading ? <div>Loading...</div> :
        <div style={{ padding: 20 }}>
          <h1>MiniTasks</h1>

          <div style={{ display: "flex", flexDirection: "row", gap: 10 }}>

            <input
              placeholder="Título"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <input
              placeholder="Descripción"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
            >
              <option value="low">Baja</option>
              <option value="medium">Media</option>
              <option value="high">Alta</option>
            </select>
            <button onClick={createTask}>Crear tarea</button>
          </div>

          <ul style={{ listStyleType: "none", padding: 0, display:"flex", flexDirection:"column", gap: 10 }}>
            {tasks.map((t) => (
              <li key={t.id} style={{   textAlign: "left", justifyContent:"space-between" , display:"flex", flexDirection:"row", alignItems:"center", gap: 10 }}>
                <div style={{opacity: t.completed ? 0.5 : 1, textDecoration: t.completed ? "line-through" : "none", display:"flex", flexDirection:"row", gap: 4}}>

                <strong style={{color: t.priority === "low" ? "green" : t.priority === "medium" ? "yellow" : "red", }}>
                  {t.title}
                  </strong>
                    ({t.priority}) {t.description? `- ${t.description}` : ""}
                </div>
                 <div style={{display:"flex", flexDirection:"row", gap: 10}}>
                  <button onClick={() => completeTask(t.id, !t.completed)} style={{opacity: t.completed ? 0.5 : 1}}>{t.completed ? "✅" : "⬜️"}</button>
                  <button onClick={() => deleteTask(t.id)}>❌</button>
                 </div>
              </li>
            ))}
          </ul>
        </div>
      }
    </>
  )
}

export default App
