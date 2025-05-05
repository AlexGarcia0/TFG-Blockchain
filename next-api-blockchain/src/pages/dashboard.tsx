// src/pages/dashboard.tsx

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';


export default function Dashboard() {
  const [token, setToken] = useState<string | null>(null);
  const [userRole, setUserRole] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const router = useRouter();

  // Cargar el script dashboard.js desde public/
  useEffect(() => {
    const storedToken = sessionStorage.getItem('token');
    if (!storedToken) {
      router.push('/'); // Redirigir al login si no hay token
    } else {
      setToken(storedToken);
      const parsedToken = JSON.parse(atob(storedToken.split('.')[1])); // Decodifica el JWT
      setUserRole(parsedToken.role);
    }

    // Cargar el archivo JS dashboard.js
    const script = document.createElement('script');
    script.src = '/dashboard.js';  // Asumiendo que está en public/
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script); // Limpiar el script cuando se desmonte el componente
    };
  }, [router]);

  const handleLogout = () => {
    sessionStorage.removeItem('token');
    router.push('/'); // Redirige al login
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleFileUpload = () => {
    if (file) {
      // Lógica para cargar el archivo (puedes integrarlo con IPFS o almacenamiento en backend)
      setToastMessage('Archivo cargado correctamente');
      setTimeout(() => setToastMessage(''), 3000); // Eliminar el mensaje después de 3 segundos
    } else {
      setToastMessage('No se ha seleccionado ningún archivo');
      setTimeout(() => setToastMessage(''), 3000);
    }
  };

  return (
    <div>
      <header className="dashboard-header">
        <h1 id="dashboard-title">Bienvenido, {userRole === 'medico' ? 'Médico' : 'Paciente'}</h1>
        <button id="logout-btn" className="btn-logout" onClick={handleLogout}>
          Cerrar Sesión
        </button>
      </header>

      <section className="intro-section">
        <div className="intro-overlay">
          <h2>¿Quiénes Somos?</h2>
          <p>
            Somos una plataforma descentralizada de gestión de historiales médicos, construida sobre Blockchain e IPFS, garantizando máxima seguridad y privacidad de los datos.
          </p>
          <p>
            Creemos en devolver el control de la información médica a los propios pacientes, de forma moderna, transparente y segura.
          </p>
        </div>
      </section>

      <div id="toast" className="toast">{toastMessage}</div>

      <section className="dashboard-actions" id="actions">
        <button onClick={handleFileUpload} className="btn-upload">
          Subir Historial Médico
        </button>
        <input
          type="file"
          id="fileInput"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </section>

      <main className="dashboard-main">
        <div id="output" className="dashboard-output">
          {file && <p>Archivo seleccionado: {file.name}</p>}
        </div>
      </main>

      <footer className="dashboard-footer">
        <p>© 2025 Sistema Médico Descentralizado. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
