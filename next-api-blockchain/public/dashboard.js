// dashboard.js

// 1. Función para decodificar JWT
function parseJwt(token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error('Error decodificando token', e);
      return null;
    }
  }
  
  // 2. Leer y validar token
  const token = sessionStorage.getItem('token');
  if (!token) {
    window.location.href = 'inicio.html';
  }
  const userData = parseJwt(token);
  if (!userData) {
    alert('Token inválido. Vuelve a iniciar sesión.');
    sessionStorage.removeItem('token');
    window.location.href = 'inicio.html';
  }
  
  // 3. Definir variables de usuario
  const userId   = userData.id;
  const userName = userData.name || userId;
  const role     = (userData.role || '').toLowerCase();
  const clavesDeHistoriales = {};

  
  // 4. Funciones de utilidad y acciones (usan userId, token, etc.)
  function limpiarPantallas() {
    document.getElementById('output').innerHTML = '';
  }
  
  function filtrarDuplicados(lista) {
    const seen = new Set();
    return lista.filter(item => {
      if (seen.has(item.cid)) return false;
      seen.add(item.cid);
      return true;
    });
  }
  
  function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.style.display = 'block';
    setTimeout(() => { toast.style.display = 'none'; }, 3000);
  }
  
  function generarClaveSecreta() {
    return [...Array(16)]
      .map(() => Math.random().toString(36)[2])
      .join('');
  }
  
  async function cifrarArchivo(file, password) {
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
      reader.onload = event => {
        const wordArray = CryptoJS.lib.WordArray.create(event.target.result);
        const encrypted = CryptoJS.AES.encrypt(wordArray, password).toString(CryptoJS.format.Json);
        resolve(encrypted);
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }
  
  function descifrarContenido(encryptedText, password) {
    try {
      const decrypted = CryptoJS.AES.decrypt(encryptedText, password);
      const byteArray = [];
  
      for (let i = 0; i < decrypted.sigBytes; i++) {
        byteArray.push((decrypted.words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff);
      }
  
      return new Blob([new Uint8Array(byteArray)]);
    } catch (e) {
      console.error('❌ Error al descifrar el historial:', e);
      showToast('❌ Clave incorrecta o archivo corrupto.', 'error');
      return null;
    }
  }
  
  
  
  async function verificarAccesoMedico(cid) {
    const resp = await fetch(`/api/historiales/cid/${cid}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
  
    return resp.ok;
  }
  
  
  
  // 5. Acciones principales
async function subirHistorial() {
  limpiarPantallas();
  const fileInput = document.getElementById('fileInput');
  fileInput.click();
  fileInput.onchange = async () => {
    const file = fileInput.files[0];
    if (!file) return;

    const clave = generarClaveSecreta();
    const encrypted = await cifrarArchivo(file, clave);

    // Suponemos que el nombre está en userData.name = "Alex Garcia"
    const givenName = userData.name?.split(' ')[0] || 'Desconocido';

    const formData = new FormData();
    formData.append('file', new Blob([encrypted]));
    formData.append('pacienteId', userId);
    formData.append('clave', clave);
    formData.append('nombreArchivo', file.name || 'archivo.pdf');
    formData.append('given_name', givenName); // 👈 Añadir el nombre

    const resp = await fetch('/api/ipfs/upload', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });

    const data = await resp.json();
  if (resp.ok && data.cid) {
  clavesDeHistoriales[data.cid] = clave;
  sessionStorage.setItem(`clave_${data.cid}`, clave); // 👈 AÑADIDO
  showToast('Historial subido correctamente.', 'success');
  document.getElementById('output').textContent =
    `Historial subido.\nGUARDA ESTA CLAVE: ${clave}`;
  }else {
      showToast('❌ Error al subir historial.', 'error');
    }
  };
}

  
  
  async function verHistoriales() {
    limpiarPantallas();
    const resp = await fetch(`/api/historiales/${userId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const { historiales } = await resp.json();
    if (!historiales?.length) {
      document.getElementById('output').textContent = 'No tienes historiales.';
      return;
    }
    renderCards(filtrarDuplicados(historiales), 'descargar');
  }
  
  async function verSolicitudes() {
    limpiarPantallas();
    const resp = await fetch(`/api/permisos/requests/${userId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const { solicitudes } = await resp.json();
    if (!solicitudes?.length) {
      document.getElementById('output').textContent = 'No tienes solicitudes pendientes.';
      return;
    }
    renderSolicitudes(solicitudes);
  }
  
  async function verAccesosOtorgados() {
    limpiarPantallas();
    const resp = await fetch(`/api/permisos/approved/${userId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const { accesos } = await resp.json();
    if (!accesos?.length) {
      document.getElementById('output').textContent = 'No tienes accesos otorgados.';
      return;
    }
    renderAccesosCards(accesos);
  }
  
  async function buscarPaciente() {
    limpiarPantallas();
    const nombre = document.getElementById('buscarPacienteInput').value.trim();
    if (!nombre) {
      showToast('Introduce un nombre válido.', 'error');
      return;
    }
  
    // 1. Buscar historiales por nombre
    const resp = await fetch(`/api/historiales/buscar?nombre=${encodeURIComponent(nombre)}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const { historiales } = await resp.json();
  
    if (!historiales?.length) {
      document.getElementById('output').textContent = 'No se encontraron historiales.';
      return;
    }
  
    // 2. Obtener accesos ya aprobados
    const aprobadosResp = await fetch(`/api/historiales/autorizados`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const { accesos } = await aprobadosResp.json();
    const cidsAprobados = new Set((accesos || []).map(a => a.cid));
  
    // 3. Obtener solicitudes pendientes del médico actual
    const solicitudesResp = await fetch(`/api/permisos/requests/medico/${userId}`, {

      headers: { 'Authorization': `Bearer ${token}` }
    });
    const { solicitudes } = await solicitudesResp.json();
  
    console.log('🧪 Médico conectado (userId):', userId);
    (solicitudes || []).forEach(s => {
      console.log(`🧾 Solicitud detectada → medicoId: ${s.medicoId}, estado: ${s.status}, cid: ${s.cid}`);
    });
  
    // Filtrar solo solicitudes hechas por este médico
    const cidsPendientes = new Set(
      (solicitudes || [])
        .filter(s => s.status === 'pendiente' && s.medicoId?.toLowerCase() === userId.toLowerCase())
        .map(s => s.cid)
    );
  
    // 4. Marcar cada historial con su estado
    historiales.forEach(h => {
      if (cidsAprobados.has(h.cid)) {
        h.estadoAcceso = 'aprobado';
      } else if (cidsPendientes.has(h.cid)) {
        h.estadoAcceso = 'pendiente';
      } else {
        h.estadoAcceso = 'ninguno';
      }
    });
  
    renderCards(filtrarDuplicados(historiales), 'solicitar', historiales[0].pacienteId);
  }
  
  
  
  
  async function descargarHistorial(cid, nombreArchivo) {
    if (!(await verificarAccesoMedico(cid))) {
      showToast('Acceso no autorizado.', 'error');
      return;
    }
  
    let clave = clavesDeHistoriales[cid];
  
    const resp = await fetch(`/api/historiales/cid/${cid}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
  
    if (!resp.ok) {
      showToast('❌ Error al obtener el historial.', 'error');
      return;
    }
  
    const data = await resp.json();
    const encrypted = data.contenido;
  
    if (!clave && role === 'medico' && data.clave) {
      clave = data.clave;
      clavesDeHistoriales[cid] = clave;
    }
  
    if (!clave) {
      showToast('Clave de descifrado no encontrada.', 'error');
      return;
    }
  
    const blob = descifrarContenido(encrypted, clave);
    if (!blob) return;
  
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombreArchivo;
    a.click();
  }
  
  
  function renderCards(historiales, accion, pacienteId) {
    const out = document.getElementById('output');
    out.innerHTML = '';
    historiales.forEach(h => {
      const card = document.createElement('div');
      card.className = 'card';
  
      const title = document.createElement('div');
      title.className = 'card-title';
      title.textContent = h.nombreArchivo || `historial_${h.cid}.pdf`;
  
      const actions = document.createElement('div');
      actions.className = 'card-actions';
  
      if (accion === 'descargar') {
        const btn = document.createElement('button');
        btn.className = 'btn';
        btn.textContent = 'Descargar';
        btn.onclick = () => descargarHistorial(h.cid, h.nombreArchivo || `historial_${h.cid}.pdf`);
        actions.append(btn);
      } else if (accion === 'solicitar') {
        const estado = h.estadoAcceso;
  
        if (estado === 'aprobado') {
          const badge = document.createElement('span');
          badge.className = 'badge';
          badge.textContent = '✅ Ya autorizado';
          actions.append(badge);
        } else if (estado === 'pendiente') {
          const badge = document.createElement('span');
          badge.className = 'badge';
          badge.textContent = '⏳ Solicitud pendiente';
          actions.append(badge);
        } else {
          // estado === 'denegado' o sin estado: puede volver a solicitar
          const btn = document.createElement('button');
          btn.className = 'btn';
          btn.textContent = 'Solicitar Acceso';
          btn.onclick = () => solicitarAccesoDirecto(pacienteId, h.cid, h.nombreArchivo);
          actions.append(btn);
        }
      }
  
      card.append(title, actions);
      out.append(card);
    });
  }
  
  
  
  async function verHistorialesAutorizados() {
    limpiarPantallas();
    const resp = await fetch(`/api/historiales/autorizados`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
  
    const { accesos } = await resp.json(); // Asegúrate de que tu endpoint devuelve { accesos: [...] }
  
    if (!accesos?.length) {
      document.getElementById('output').textContent = 'No tienes historiales autorizados.';
      return;
    }
  
    renderCards(filtrarDuplicados(accesos), 'descargar');
  }
  

  async function solicitarAccesoDirecto(pacienteDid, cid, nombreArchivo) {
    const res = await fetch('/api/permisos/request', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        pacienteId: pacienteDid,
        cid,
        nombreArchivo,
        medicoName: userName  
      })
    });
  
    const data = await res.json();
    if (res.ok) {
      showToast('Solicitud enviada');
    } else {
      showToast(`Error: ${data.error}`, 'error');
    }
  }

  async function aprobarAccesoDirecto(medicoDid, cid, nombreArchivo) {
    try {
      console.log(`🟡 Intentando aprobar acceso para CID: ${cid} y médico: ${medicoDid}`);
      
      let clave = clavesDeHistoriales[cid];
      console.log(`📦 Clave en memoria (clavesDeHistoriales):`, clave);
  
      if (!clave) {
        clave = sessionStorage.getItem(`clave_${cid}`);
        console.log(`📂 Clave recuperada desde sessionStorage:`, clave);
      }
  
      if (!clave) {
        console.warn("❌ Clave de descifrado no encontrada ni en memoria ni en sessionStorage.");
        showToast("❌ Clave de descifrado no encontrada en memoria", 'error');
        return;
      }
  
      const payload = { medicoDid, cid, clave, nombreArchivo };
      console.log(`🚀 Enviando solicitud de aprobación con payload:`, payload);
  
      const resp = await fetch('/api/permisos/approve', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
  
      const data = await resp.json();
      console.log('📥 Respuesta del servidor:', data);
  
      if (!resp.ok) throw new Error(data.error || 'Error aprobando acceso');
  
      showToast('✅ Acceso concedido.');
      verSolicitudes();
    } catch (err) {
      console.error('❌ Error al aprobar acceso:', err);
      showToast(`❌ ${err.message}`, 'error');
    }
  }
  
  async function revocarAcceso(medicoDid, cid) {
    try {
      const resp = await fetch('/api/permisos/revoke', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          medicoDid,
          cid
        })
      });
  
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Error revocando acceso');
      showToast('🔒 Acceso revocado.');
      verAccesosOtorgados(); // refresca lista
    } catch (err) {
      console.error('❌ Error al revocar acceso:', err);
      showToast(`❌ ${err.message}`, 'error');
    }
  }
  

  async function denegarAccesoDirecto(medicoDid, cid) {
    try {
      const resp = await fetch('/api/permisos/deny', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          medicoDid,
          cid,
          pacienteId: userId // ✅ Añadido
        })
      });
  
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Error denegando acceso');
      showToast('⛔ Solicitud denegada.');
      verSolicitudes();
    } catch (err) {
      console.error('❌ Error al denegar acceso:', err);
      showToast(`❌ ${err.message}`, 'error');
    }
  }
  
  
  
  
  function renderSolicitudes(solicitudes) {
    const out = document.getElementById('output'); out.innerHTML = '';
    solicitudes.forEach(s => {
      const card = document.createElement('div'); card.className = 'card';
      card.innerHTML = `
        <div class="card-title">Solicitud de Médico: ${s.medicoName || s.medicoId}</div>
        <div>Archivo: ${s.nombreArchivo}</div>
        <div class="card-actions">
          <button class="btn" onclick="aprobarAccesoDirecto('${s.medicoId}','${s.cid}', \`${s.nombreArchivo || ''}\`)">Aceptar</button>


          <button class="btn" onclick="denegarAccesoDirecto('${s.medicoId}','${s.cid}')">Rechazar</button>
        </div>
      `;
      out.append(card);
    });
  }
  
  
  
  
  
  function renderAccesosCards(accesos) {
    const out = document.getElementById('output'); out.innerHTML = '';
    accesos.forEach(a => {
      const card = document.createElement('div'); card.className='card';
      card.innerHTML = `
        <div class="card-title">Médico: ${a.medicoName||a.medicoId}</div>
        <div>Archivo: ${a.nombreArchivo}</div>
        <div class="card-actions">
          <button class="btn" onclick="revocarAcceso('${a.medicoId}','${a.cid}')">Revocar Acceso</button>
        </div>
      `;
      out.append(card);
    });
  }
  
  // 6. Setup UI al cargar DOM
  document.addEventListener('DOMContentLoaded', () => {
    // Cargar CryptoJS
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js';
    document.head.appendChild(script);
  
    // Saludo
    document.getElementById('dashboard-title').textContent = `Bienvenido ${userName} (${role})`;
  
    // Botones
    const actions = document.getElementById('actions');
    if (role === 'paciente') {
      actions.innerHTML = `
        <button id="subirHistorialBtn" class="btn">Subir Historial</button>
        <button id="verHistorialesBtn" class="btn">Ver Mis Historiales</button>
        <button id="verSolicitudesBtn" class="btn">Ver Solicitudes de Acceso</button>
        <button id="verAccesosOtorgadosBtn" class="btn">Ver Accesos Otorgados</button>
      `;
    } else {
      actions.innerHTML = `
        <input type="text" id="buscarPacienteInput" placeholder="ID paciente..." class="input">
        <button id="buscarPacienteBtn" class="btn">Buscar Paciente</button>
        <button id="verHistorialesAutorizadosBtn" class="btn">Ver Historiales Autorizados</button>
      `;
    }
  
    // Listeners
    document.getElementById('subirHistorialBtn')?.addEventListener('click', subirHistorial);
    document.getElementById('verHistorialesBtn')?.addEventListener('click', verHistoriales);
    document.getElementById('verSolicitudesBtn')?.addEventListener('click', verSolicitudes);
    document.getElementById('verAccesosOtorgadosBtn')?.addEventListener('click', verAccesosOtorgados);
    document.getElementById('buscarPacienteBtn')?.addEventListener('click', buscarPaciente);
    document.getElementById('verHistorialesAutorizadosBtn')?.addEventListener('click', verHistorialesAutorizados);
    document.getElementById('logout-btn')?.addEventListener('click', () => {
      sessionStorage.removeItem('token');
      window.location.href = 'inicio.html';
    });
  });
  