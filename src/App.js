import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

const Home = () => (
  <div>
    <h1>Interaktive Arbeitsanweisungs-App</h1>
    <p>Willkommen bei der Interaktiven Arbeitsanweisungs-App!</p>
    <h2>Kategorien</h2>
    <ul>
      <li><Link to="/engel-400">Engel 400</Link></li>
      <li><Link to="/engel-900">Engel 900</Link></li>
      <li><Link to="/engel-1500">Engel 1500</Link></li>
    </ul>
  </div>
);

const Engel400 = () => <div><h2>Engel 400</h2><p>Details für Engel 400...</p></div>;
const Engel900 = () => <div><h2>Engel 900</h2><p>Details für Engel 900...</p></div>;
const Engel1500 = () => <div><h2>Engel 1500</h2><p>Details für Engel 1500...</p></div>;

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/engel-400" element={<Engel400 />} />
        <Route path="/engel-900" element={<Engel900 />} />
        <Route path="/engel-1500" element={<Engel1500 />} />
      </Routes>
    </Router>
  );
};

export default App;
