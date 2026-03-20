"use client";
import { useState } from "react";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async () => {
    await fetch("http://localhost:5000/auth/register", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ email, password }),
    });

    alert("Registered successfully");
  };

  return (
    <div>
      <h1>Register</h1>
      <input placeholder="Email" onChange={e=>setEmail(e.target.value)} />
      <input placeholder="Password" onChange={e=>setPassword(e.target.value)} />
      <button onClick={handleRegister}>Register</button>
    </div>
  );
}