"use client";
import { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";

export default function Dashboard() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  // edit states
  const [editingTask, setEditingTask] = useState<any>(null);
  const [editTitle, setEditTitle] = useState("");

  const getToken = () => localStorage.getItem("token");

  const fetchTasks = async () => {
    try {
      const res = await fetch(
        `http://localhost:5000/tasks?search=${search}&status=${status}&page=${page}&limit=5`,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );

      if (!res.ok) return toast.error("Failed to fetch tasks");

      const data = await res.json();
      setTasks(data);
    } catch {
      toast.error("Server error ❌");
    }
  };

  const addTask = async () => {
    if (!title) return toast.error("Enter task");

    try {
      const res = await fetch("http://localhost:5000/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ title }),
      });

      if (!res.ok) return toast.error("Failed to add task");

      setTitle("");
      toast.success("Task added ✅");
      fetchTasks();
    } catch {
      toast.error("Error adding task ❌");
    }
  };

  const deleteTask = async (id: number) => {
    try {
      const res = await fetch(`http://localhost:5000/tasks/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!res.ok) return toast.error("Delete failed");

      toast.success("Task deleted 🗑️");
      fetchTasks();
    } catch {
      toast.error("Delete failed ❌");
    }
  };

  const toggleTask = async (id: number) => {
    try {
      const res = await fetch(`http://localhost:5000/tasks/${id}/toggle`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!res.ok) return toast.error("Update failed");

      toast.success("Status updated 🔄");
      fetchTasks();
    } catch {
      toast.error("Update failed ❌");
    }
  };

  const updateTask = async () => {
    if (!editTitle) return toast.error("Enter task");

    try {
      const res = await fetch(
        `http://localhost:5000/tasks/${editingTask.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify({ title: editTitle }),
        }
      );

      if (!res.ok) return toast.error("Update failed");

      toast.success("Task updated ✏️");
      setEditingTask(null);
      setEditTitle("");
      fetchTasks();
    } catch {
      toast.error("Error updating ❌");
    }
  };

  useEffect(() => {
    const token = getToken();
    if (!token) {
      toast.error("Please login first");
      window.location.href = "/login";
    } else {
      fetchTasks();
    }
  }, [search, status, page]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0f172a, #020617)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "sans-serif",
      }}
    >
      <Toaster />

      <div
        style={{
          width: "420px",
          padding: "25px",
          borderRadius: "20px",
          backdropFilter: "blur(20px)",
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        }}
      >
        <h2 style={{ textAlign: "center", marginBottom: "20px" }}>
          📋 Task Dashboard
        </h2>

        {/* Add Task */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Add new task..."
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: "10px",
              border: "none",
              background: "rgba(255,255,255,0.1)",
              color: "white",
            }}
          />
          <button
            onClick={addTask}
            style={{
              background: "#6366f1",
              color: "white",
              border: "none",
              padding: "10px",
              borderRadius: "10px",
              cursor: "pointer",
            }}
          >
            Add
          </button>
        </div>

        {/* Search + Filter */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
          <input
            placeholder="Search..."
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: "10px",
              background: "rgba(255,255,255,0.1)",
              color: "white",
              border: "none",
            }}
          />

          <select
            onChange={(e) => setStatus(e.target.value)}
            style={{
              padding: "10px",
              borderRadius: "10px",
              background: "rgba(255,255,255,0.1)",
              color: "white",
              border: "none",
            }}
          >
            <option value="">All</option>
            <option value="true">Completed</option>
            <option value="false">Pending</option>
          </select>
        </div>

        {/* Tasks */}
        <div style={{ maxHeight: "300px", overflowY: "auto" }}>
          {tasks.map((t) => (
            <div
              key={t.id}
              style={{
                padding: "12px",
                borderRadius: "12px",
                marginBottom: "10px",
                background: "rgba(255,255,255,0.08)",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span>
                {t.title} {t.completed ? "✅" : "❌"}
              </span>

              <div>
                <button onClick={() => toggleTask(t.id)}>✔</button>
                <button onClick={() => deleteTask(t.id)}>✖</button>
                <button
                  onClick={() => {
                    setEditingTask(t);
                    setEditTitle(t.title);
                  }}
                >
                  ✏️
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div style={{ textAlign: "center", marginTop: "10px" }}>
          <button onClick={() => setPage((p) => Math.max(p - 1, 1))}>
            ⬅
          </button>
          <span> Page {page} </span>
          <button onClick={() => setPage((p) => p + 1)}>➡</button>
        </div>
      </div>

      {/* EDIT MODAL */}
      {editingTask && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div
            style={{
              background: "#0f172a",
              padding: "20px",
              borderRadius: "15px",
              width: "300px",
            }}
          >
            <h3>Edit Task</h3>
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
            />
            <button onClick={updateTask}>Save</button>
            <button onClick={() => setEditingTask(null)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}