import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';

export default function Home() {
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('paciente'); // 'paciente' o 'medico'
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Cargar el archivo JS 'inicio.js' desde public/
    const script = document.createElement('script');
    script.src = '/inicio.js';  // Ubicación de inicio.js en public/
    script.async = true;
    document.body.appendChild(script);

    // Limpiar el script cuando se desmonte el componente
    return () => {
      document.body.removeChild(script);
    };
  }, []); // Este useEffect solo se ejecuta una vez cuando se monta el componente

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Enviar los datos del formulario al API para obtener el token
      const response = await fetch('/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: username, role })
      });

      const data = await response.json();
      if (response.ok) {
        sessionStorage.setItem('token', data.token);
        alert('Sesión iniciada como ' + role.toUpperCase());
        router.push('/dashboard');  // Redirigir a la página de dashboard
      } else {
        alert('Error: ' + (data.error || 'desconocido'));
      }
    } catch (error) {
      console.error('Error en el login:', error);
    }

    setLoading(false);
  };

  return (
    <div className="container">
      <div className="form-box login">
        <form onSubmit={handleSubmit}>
          <h1>Inicio como {role === 'paciente' ? 'Paciente' : 'Médico'}</h1>
          <div className="input-box">
            <input
              type="text"
              placeholder="Usuario"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <i className="bx bxs-user"></i>
          </div>
          <button type="submit" className="btn" disabled={loading}>
            {loading ? 'Cargando...' : `Entrar como ${role}`}
          </button>
        </form>
      </div>

      <div className="toggle-box">
        <div className="toggle-panel toggle-left">
          <h1>¿Eres Médico?</h1>
          <p>Inicia sesión como Médico</p>
          <button className="btn register-btn" onClick={() => setRole('medico')}>
            Inicio Médico
          </button>
        </div>

        <div className="toggle-panel toggle-right">
          <h1>¿Eres Paciente?</h1>
          <p>Inicia sesión como Paciente</p>
          <button className="btn login-btn" onClick={() => setRole('paciente')}>
            Inicio Paciente
          </button>
        </div>
      </div>
    </div>
  );
}
