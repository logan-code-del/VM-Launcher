import React from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import './styles/main.css';

function App() {
    return (
        <div className="App">
            <Header />
            <main>
                <h1>Welcome to the Simple Web UI</h1>
                <p>This is a simple web application with a header and footer.</p>
            </main>
            <Footer />
        </div>
    );
}

export default App;