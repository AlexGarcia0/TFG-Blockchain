// inicio.js

const container = document.querySelector('.container');
const registerBtn = document.querySelector('.register-btn');
const loginBtn = document.querySelector('.login-btn');

registerBtn?.addEventListener('click', () => container.classList.add('active'));
loginBtn?.addEventListener('click', () => container.classList.remove('active'));

// VC Login Paciente
document.getElementById('vc-login-form')?.addEventListener('submit', e => {
  handleVCLogin(e, 'vc-file', 'paciente');
});
// VC Login Médico
document.getElementById('vc-login-form-medico')?.addEventListener('submit', e => {
  handleVCLogin(e, 'vc-file-medico', 'medico');
});

async function handleVCLogin(e, fileInputId, role) {
  e.preventDefault();
  const fileInput = document.getElementById(fileInputId);
  if (!fileInput.files.length) {
    alert("Selecciona una credencial (.json)");
    return;
  }

  // 1) parsear el VC sin tocarlo
  let vc;
  try {
    vc = JSON.parse(await fileInput.files[0].text());
  } catch {
    alert("El archivo no es un JSON válido.");
    return;
  }

  // 2) enviamos { verifiableCredential, role }
  try {
    const resp = await fetch('/api/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verifiableCredential: vc, role })
    });
    const result = await resp.json();

    if (resp.ok && result.valid && result.token) {
      sessionStorage.setItem('token', result.token);
      alert(`Sesión iniciada como ${role.toUpperCase()}`);
      window.location.href = 'dashboard.html';
    } else {
      console.error('Falló verify:', result.error || result.errors, result);
      alert('Credencial no válida o error en verificación.');
    }
  } catch (err) {
    console.error('Error de red/verificación:', err);
    alert('No se pudo conectar al servidor.');
  }
}
