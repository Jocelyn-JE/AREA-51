import { useState, useEffect } from "react";

interface Service {
  name: string;
  actions: { name: string; description: string }[];
  reactions: { name: string; description: string }[];
}

interface BackendData {
  client: {
    host: string;
  };
  server: {
    current_time: number;
    services: Service[];
  };
}

function App() {
  const [data, setData] = useState<BackendData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("http://localhost:8080/about.json")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch backend");
        return res.json();
      })
      .then(setData)
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <p style={{ color: "red" }}>Error: {error}</p>;
  if (!data) return <p>Loading…</p>;

  return (
    <div style={{
      display: "grid",
      justifyContent: "center",
      alignItems: "center",
      minWidth: "100vw",
    }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#2563eb" }}>
        AREA React PoC
      </h1>
      <p>
        <strong>Client Host:</strong> {data.client.host}
      </p>
      <p>
        <strong>Server Time:</strong> {data.server.current_time}
      </p>

      <h2 style={{ marginTop: "1rem", fontWeight: "600" }}>Services</h2>
      <ul>
        {data.server.services.map((service) => (
          <li key={service.name}>
            <p style={{ fontWeight: "500" }}>{service.name}</p>
            <p>Actions:</p>
            <ul>
              {service.actions.map((a) => (
                <li key={a.name}>
                  {a.name} - {a.description}
                </li>
              ))}
            </ul>
            <p>Reactions:</p>
            <ul>
              {service.reactions.map((r) => (
                <li key={r.name}>
                  {r.name} - {r.description}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
