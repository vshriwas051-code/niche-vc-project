import React, { useState, useEffect } from 'react';
import './index.css';
import { io } from "socket.io-client";

function App() {
  const [agents, setAgents] = useState([
    { id: 'agent-alpha-99', tier: 'T1', status: 'Active' },
    { id: 'agent-core-01', tier: 'T3', status: 'Active' },
    { id: 'agent-rogue-44', tier: 'T0', status: 'Quarantined' }
  ]);
  const [activeAgent, setActiveAgent] = useState('agent-alpha-99');
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({ violations: 0, syscalls: 0, blocked: 0 });

  useEffect(() => {
    const socket = io("http://localhost:4000");
    
    socket.on("telemetry_event", (event) => {
      setEvents(prev => [event, ...prev].slice(0, 100));
      setStats(prev => ({
        ...prev,
        syscalls: prev.syscalls + 1,
        violations: event.decision === 'ALERT' || event.decision === 'BLOCK' ? prev.violations + 1 : prev.violations,
        blocked: event.decision === 'BLOCK' ? prev.blocked + 1 : prev.blocked
      }));
    });

    const mockInterval = setInterval(() => {
      const isBlocked = Math.random() > 0.8;
      const isAlert = Math.random() > 0.9;
      let decision = 'ALLOW';
      if (isBlocked) decision = 'BLOCK';
      else if (isAlert) decision = 'ALERT';

      const mockEvent = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        agent_id: agents[Math.floor(Math.random() * 3)].id,
        syscall: ['execve', 'openat', 'connect', 'clone'][Math.floor(Math.random() * 4)],
        args: ['/bin/bash -c "rm -rf /"', '/etc/shadow', '169.254.169.254:80', 'docker.sock'][Math.floor(Math.random() * 4)],
        decision: decision
      };
      
      setEvents(prev => [mockEvent, ...prev].slice(0, 100));
      setStats(prev => ({
        ...prev,
        syscalls: prev.syscalls + 1,
        violations: mockEvent.decision === 'ALERT' || mockEvent.decision === 'BLOCK' ? prev.violations + 1 : prev.violations,
        blocked: mockEvent.decision === 'BLOCK' ? prev.blocked + 1 : prev.blocked
      }));
    }, 1500);

    return () => {
      socket.disconnect();
      clearInterval(mockInterval);
    };
  }, [agents]);

  return (
    <div className="app-container">
      <header className="header">
        <div className="logo">
          <div className="pulse"></div>
          ARG Governance
        </div>
        <div className="glass-panel" style={{ padding: '0.5rem 1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span className="badge t3">System Healthy</span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Probe: eBPF Active</span>
        </div>
      </header>

      <aside className="sidebar">
        <div className="glass-panel">
          <h3>Monitored Agents</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Active workloads under ARG enforcement</p>
          <ul className="agent-list">
            {agents.map(a => (
              <li 
                key={a.id} 
                className={`agent-item ${activeAgent === a.id ? 'active' : ''}`}
                onClick={() => setActiveAgent(a.id)}
              >
                <div>
                  <div style={{ fontWeight: '500' }}>{a.id}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{a.status}</div>
                </div>
                <span className={`badge ${a.tier.toLowerCase()}`}>{a.tier}</span>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="glass-panel">
          <h3 style={{ marginBottom: '1rem' }}>Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button className="btn">Edit Rego Policy</button>
            <button className="btn danger">Quarantine (SIGSTOP)</button>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <div className="glass-panel stat-grid">
          <div className="stat-card">
            <div className="stat-label">Syscalls Intercepted</div>
            <div className="stat-value">{stats.syscalls}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Policy Violations</div>
            <div className="stat-value" style={{ color: 'var(--alert-orange)' }}>{stats.violations}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Blocked Executions</div>
            <div className="stat-value" style={{ color: 'var(--alert-red)' }}>{stats.blocked}</div>
          </div>
        </div>

        <div className="glass-panel" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
            <h3>Kernel Telemetry Stream</h3>
            <span className="badge" style={{ background: 'var(--glass-bg)', color: 'var(--text-main)', border: '1px solid var(--glass-border)' }}>Live eBPF Feed</span>
          </div>
          
          <div className="event-log">
            <div className="event-row" style={{ background: 'transparent', borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)', fontWeight: 600 }}>
              <div>TIME</div>
              <div>TIER</div>
              <div>ACTION</div>
              <div>SYSCALL & ARGS</div>
            </div>
            {events.map((ev, i) => {
              const agent = agents.find(a => a.id === ev.agent_id);
              const tierClass = agent ? agent.tier.toLowerCase() : 't0';
              const tierText = agent ? agent.tier : 'T0';
              
              return (
                <div key={ev.id || i} className={`event-row ${ev.decision}`}>
                  <div className="timestamp">{new Date(ev.timestamp).toLocaleTimeString([], {hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit', fractionalSecondDigits: 3})}</div>
                  <div><span className={`badge ${tierClass}`}>{tierText}</span></div>
                  <div><span className={`badge action-${ev.decision.toLowerCase()}`}>{ev.decision}</span></div>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <span className="syscall">{ev.syscall}</span>
                    <span className="args">{ev.args}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
