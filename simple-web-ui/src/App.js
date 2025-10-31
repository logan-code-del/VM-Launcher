import React from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
// Styles are loaded from public/styles/main.css

function App() {
    const [isos, setIsos] = React.useState([]);
    const [status, setStatus] = React.useState(null);

    const api = (path, opts) => fetch(`http://localhost:8000${path}`, opts).then(r => r.json()).catch(e => ({ error: e.message }));

    React.useEffect(() => {
        api('/api/isos').then(setIsos);
        api('/api/status').then(setStatus);
    }, []);

    const start = async (iso) => {
        const res = await api('/api/start', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ iso }) });
        setStatus(res);
    };

    const stop = async () => {
        const res = await api('/api/stop', { method: 'POST' });
        setStatus(res);
    };
    return (
        <div className="App">
            <Header />
            <main>
                <h1>Welcome to the Simple Web UI</h1>
                <p>This is a simple web application with a header and footer.</p>

                <section>
                    <h2>Available ISOs</h2>
                    {Array.isArray(isos) && isos.length > 0 ? (
                        <ul>
                            {isos.map(i => (
                                <li key={i.name}>
                                    {i.name} ({Math.round((i.size||0)/1024)} KB)
                                    <button style={{ marginLeft: 10 }} onClick={() => start(i.name)}>Start</button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>No ISOs found. Place ISOs in the repo `isos/` folder.</p>
                    )}
                </section>

                <section>
                    <h2>VM Control</h2>
                    <button onClick={stop}>Stop VM</button>
                    <pre>{JSON.stringify(status, null, 2)}</pre>
                    <p>Open VM display at <a href="http://localhost:6080" target="_blank" rel="noreferrer">http://localhost:6080</a></p>
                </section>
            </main>
            <Footer />
        </div>
    );
}

export default App;