import React, { useState, useEffect, useMemo, useRef } from "react";
import "./App.css";
import "./index.css";
import {
  fetchPatients,
  fetchPatientHistory,
  createOrUpdatePatient,
  sendChatMessage,
} from "./services/api";

/**
 * App implements a modern chat interface with a sidebar (patient history),
 * main chat window for two AI agents, and bottom input bar.
 * Ocean Professional theme is applied via CSS variables set in App.css.
 */

// PUBLIC_INTERFACE
function App() {
  const [theme, setTheme] = useState("light");
  const [patients, setPatients] = useState([]);
  const [activePatient, setActivePatient] = useState(null);
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [savingPatient, setSavingPatient] = useState(false);
  const [error, setError] = useState("");

  // Theme handling
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Initial load of patients
  useEffect(() => {
    (async () => {
      try {
        const data = await fetchPatients();
        setPatients(data || []);
        if ((data || []).length > 0) {
          setActivePatient(data[0]);
        }
      } catch (e) {
        console.error(e);
        setError("Unable to load patients.");
      }
    })();
  }, []);

  // Load history whenever active patient changes
  useEffect(() => {
    (async () => {
      if (!activePatient || !activePatient.id) {
        setMessages([]);
        return;
      }
      try {
        const history = await fetchPatientHistory(activePatient.id);
        setMessages(history?.messages || []);
      } catch (e) {
        console.error(e);
        setError("Unable to load chat history.");
      }
    })();
  }, [activePatient]);

  const canSend = useMemo(
    () => userInput.trim().length > 0 && !!activePatient && !loading,
    [userInput, activePatient, loading]
  );

  // PUBLIC_INTERFACE
  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  // PUBLIC_INTERFACE
  const handleSelectPatient = (p) => {
    setActivePatient(p);
    setError("");
  };

  // PUBLIC_INTERFACE
  const handleCreatePatient = async () => {
    const name = prompt("Enter patient name:");
    if (!name) return;
    setSavingPatient(true);
    try {
      const saved = await createOrUpdatePatient({ name });
      setPatients((prev) => [saved, ...prev]);
      setActivePatient(saved);
    } catch (e) {
      console.error(e);
      setError("Unable to create patient.");
    } finally {
      setSavingPatient(false);
    }
  };

  // PUBLIC_INTERFACE
  const handleSend = async () => {
    if (!canSend) return;
    setLoading(true);
    setError("");

    const userMsg = {
      id: `user-${Date.now()}`,
      role: "user",
      agent: "user",
      content: userInput.trim(),
      ts: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setUserInput("");

    try {
      const resp = await sendChatMessage({
        patientId: activePatient.id,
        message: userMsg.content,
      });

      // Normalize responses for two agents
      const agent1Msg = resp?.agent1 || {
        id: `agent1-${Date.now()}`,
        role: "assistant",
        agent: "agent1",
        content:
          "I'm Agent 1. I will ask you health-related questions to record symptoms.",
        ts: new Date().toISOString(),
      };

      const agent2Msg = resp?.agent2 || {
        id: `agent2-${Date.now()}`,
        role: "assistant",
        agent: "agent2",
        content:
          "I'm Agent 2. Based on symptoms, I will recommend appropriate medicine.",
        ts: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, agent1Msg, agent2Msg]);
    } catch (e) {
      console.error(e);
      setError("Unable to send message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ocean-app">
      <Header theme={theme} onToggleTheme={toggleTheme} />
      <div className="ocean-layout">
        <Sidebar
          patients={patients}
          activePatient={activePatient}
          onSelectPatient={handleSelectPatient}
          onCreatePatient={handleCreatePatient}
          saving={savingPatient}
        />
        <MainChat
          patient={activePatient}
          messages={messages}
          userInput={userInput}
          setUserInput={setUserInput}
          onSend={handleSend}
          loading={loading}
          canSend={canSend}
          error={error}
        />
      </div>
    </div>
  );
}

function Header({ theme, onToggleTheme }) {
  return (
    <header className="ocean-header">
      <div className="brand">
        <div className="brand-icon">🌊</div>
        <div className="brand-text">
          <div className="brand-title">Healthcare AI Assistant</div>
          <div className="brand-subtitle">Ocean Professional</div>
        </div>
      </div>
      <div className="header-actions">
        <button
          className="btn secondary"
          onClick={onToggleTheme}
          aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        >
          {theme === "light" ? "🌙 Dark" : "☀️ Light"}
        </button>
      </div>
    </header>
  );
}

function Sidebar({ patients, activePatient, onSelectPatient, onCreatePatient, saving }) {
  return (
    <aside className="ocean-sidebar">
      <div className="sidebar-header">
        <div className="sidebar-title">Patients</div>
        <button className="btn primary" onClick={onCreatePatient} disabled={saving}>
          {saving ? "Saving..." : "New"}
        </button>
      </div>
      <div className="patient-list">
        {patients.length === 0 && (
          <div className="empty">No patients yet. Create one to start.</div>
        )}
        {patients.map((p) => (
          <button
            key={p.id || p.name}
            className={`patient-item ${activePatient?.id === p.id ? "active" : ""}`}
            onClick={() => onSelectPatient(p)}
            title={p.name}
          >
            <div className="avatar">{(p.name || "?").charAt(0).toUpperCase()}</div>
            <div className="meta">
              <div className="name">{p.name || "Unnamed"}</div>
              <div className="sub">View history</div>
            </div>
          </button>
        ))}
      </div>
    </aside>
  );
}

function MainChat({ patient, messages, userInput, setUserInput, onSend, loading, canSend, error }) {
  const listRef = useRef(null);

  useEffect(() => {
    // scroll to bottom on message change
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <main className="ocean-main">
      <div className="chat-header">
        <div>
          <div className="chat-title">{patient ? patient.name : "No patient selected"}</div>
          <div className="chat-subtitle">Two-agent conversation</div>
        </div>
        <div className="agent-legend">
          <span className="legend agent1">Agent 1: Intake</span>
          <span className="legend agent2">Agent 2: Recommendation</span>
        </div>
      </div>

      <div className="chat-list" ref={listRef}>
        {!patient && (
          <div className="empty big">
            Select or create a patient to start chatting.
          </div>
        )}
        {patient &&
          messages.map((m) => <MessageBubble key={m.id} message={m} />)}
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="chat-input">
        <textarea
          rows={2}
          placeholder="Type your message..."
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
        />
        <button className="btn primary" onClick={onSend} disabled={!canSend}>
          {loading ? "Sending..." : "Send"}
        </button>
      </div>
    </main>
  );
}

function MessageBubble({ message }) {
  const isUser = message.agent === "user";
  const isAgent1 = message.agent === "agent1";
  const isAgent2 = message.agent === "agent2";

  return (
    <div
      className={[
        "msg",
        isUser ? "user" : "",
        isAgent1 ? "agent1" : "",
        isAgent2 ? "agent2" : "",
      ].join(" ")}
    >
      <div className="msg-meta">
        <span className="badge">
          {isUser ? "You" : isAgent1 ? "AI Agent 1" : "AI Agent 2"}
        </span>
        <span className="ts">
          {new Date(message.ts || Date.now()).toLocaleTimeString()}
        </span>
      </div>
      <div className="msg-content">{message.content}</div>
    </div>
  );
}

export default App;
