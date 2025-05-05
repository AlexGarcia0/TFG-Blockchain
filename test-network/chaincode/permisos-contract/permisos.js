'use strict';

const { Contract } = require('fabric-contract-api');

class PermisosContract extends Contract {

    async requestAccess(ctx, medicoId, pacienteId, cid, nombreArchivo, medicoName) {
        const requestKey = `request_${medicoId}_${cid}`;
        const existingBytes = await ctx.stub.getState(requestKey);
    
        if (existingBytes && existingBytes.length > 0) {
            const existing = JSON.parse(existingBytes.toString());
    
            if (existing.status === 'pendiente' || existing.status === 'aprobado') {
                throw new Error(`El médico ${medicoId} ya ha solicitado acceso al historial ${cid}.`);
            }
    
            // Si fue denegado, permitimos sobrescribir con una nueva solicitud
        }
    
        const request = { 
            medicoId,
            pacienteId,
            cid,
            nombreArchivo,
            medicoName,
            status: 'pendiente'
        };
    
        await ctx.stub.putState(requestKey, Buffer.from(JSON.stringify(request)));
    
        return `Solicitud registrada correctamente para el médico ${medicoId}.`;
    }

    async listRequestsByMedico(ctx, medicoId) {
        const iterator = await ctx.stub.getStateByRange('', '');
        const results = [];
      
        while (true) {
          const res = await iterator.next();
          if (res.value && res.value.value.toString()) {
            try {
              const value = JSON.parse(res.value.value.toString());
      
              // Solo solicitudes pendientes hechas por este médico
              if (value.status === 'pendiente' && value.medicoId === medicoId) {
                results.push(value);
              }
            } catch (error) {
              console.error("Error al parsear JSON en listRequestsByMedico:", error);
            }
          }
          if (res.done) {
            await iterator.close();
            break;
          }
        }
      
        return JSON.stringify(results);
      }
      
    

      

      async approveAccess(ctx, medicoId, cid, clave, nombreArchivo) {
        const requestKey = `request_${medicoId}_${cid}`;
        const requestBytes = await ctx.stub.getState(requestKey);
    
        if (!requestBytes || requestBytes.length === 0) {
            throw new Error(`No existe una solicitud de acceso para el médico ${medicoId} al historial ${cid}.`);
        }
    
        const request = JSON.parse(requestBytes.toString());
        request.status = 'aprobado';
        await ctx.stub.putState(requestKey, Buffer.from(JSON.stringify(request)));
    
        const accessKey = `access_${medicoId}_${cid}`;
        const accessRecord = {
            medicoId,
            cid,
            clave,
            nombreArchivo, 
            granted: true
        };
        await ctx.stub.putState(accessKey, Buffer.from(JSON.stringify(accessRecord)));
    
        return `Acceso concedido al médico ${medicoId} al historial ${cid}.`;
    }
    
    async denyAccess(ctx, medicoId, cid) {
        const requestKey = `request_${medicoId}_${cid}`;
        const requestBytes = await ctx.stub.getState(requestKey);

        if (!requestBytes || requestBytes.length === 0) {
            throw new Error(`No existe una solicitud de acceso para el médico ${medicoId} al historial ${cid}.`);
        }

        const request = JSON.parse(requestBytes.toString());
        request.status = 'denegado';

        await ctx.stub.putState(requestKey, Buffer.from(JSON.stringify(request)));

        return `Acceso denegado al médico ${medicoId} al historial ${cid}.`;
    }

    async revokeAccess(ctx, medicoId, cid) {
        const requestKey = `request_${medicoId}_${cid}`;
        const accessKey = `access_${medicoId}_${cid}`;
    
        await ctx.stub.deleteState(requestKey);
        await ctx.stub.deleteState(accessKey);
    
        return `Acceso revocado completamente al médico ${medicoId} para el historial ${cid}.`;
    }
    

    async checkAccess(ctx, medicoId, cid) {
        const accessKey = `access_${medicoId}_${cid}`;
        const accessBytes = await ctx.stub.getState(accessKey);
    
        if (!accessBytes || accessBytes.length === 0) {
            return 'false';
        }
    
        const access = JSON.parse(accessBytes.toString());
        return access.granted ? 'true' : 'false';
    }
    

    async listRequests(ctx, pacienteId) {
        const iterator = await ctx.stub.getStateByRange('', '');
        const results = [];
    
        while (true) {
            const res = await iterator.next();
            if (res.value && res.value.value.toString()) {
                try {
                    const value = JSON.parse(res.value.value.toString());
                    if (value.status === 'pendiente' && value.pacienteId === pacienteId) { 
                        results.push(value);
                    }
                } catch (error) {
                    console.error("Error al parsear JSON:", error);
                }
            }
            if (res.done) {
                await iterator.close();
                break;
            }
        }
    
        return JSON.stringify(results);
    }

    async guardarHistorial(ctx, pacienteId, cid, timestamp, nombreArchivo, clave, given_name) {
        const key = `historial_${pacienteId}_${timestamp}`;
        
        const historial = {
            pacienteId,
            cid,
            timestamp,
            nombreArchivo,
            clave,
            given_name 
        };
    
        await ctx.stub.putState(key, Buffer.from(JSON.stringify(historial)));
        return `Historial guardado con CID: ${cid}`;
    }
    

    async getAllHistoriales(ctx) {
        const iterator = await ctx.stub.getStateByRange('', '');
        const results = [];
    
        while (true) {
            const res = await iterator.next();
            if (res.value && res.value.value.toString()) {
                try {
                    const key = res.value.key;
                    const value = JSON.parse(res.value.value.toString());
                    
                    if (key.startsWith('historial_') && value.cid) { 
                        results.push(value);
                    }
                } catch (error) {
                    console.error("Error al parsear historial:", error);
                }
            }
            if (res.done) {
                await iterator.close();
                break;
            }
        }
    
        return JSON.stringify(results);
    }
    

    async listApprovedAccesses(ctx, pacienteId) {
        const iterator = await ctx.stub.getStateByRange('', '');
        const results = [];
    
        while (true) {
            const res = await iterator.next();
            if (res.value && res.value.value.toString()) {
                try {
                    const value = JSON.parse(res.value.value.toString());
                    if (value.status === 'aprobado' && value.pacienteId === pacienteId) {
                        results.push(value);
                    }
                } catch (error) {
                    console.error("Error al parsear JSON en listApprovedAccesses:", error);
                }
            }
            if (res.done) {
                await iterator.close();
                break;
            }
        }
    
        return JSON.stringify(results);
    }
    async listAuthorizedHistoriales(ctx, medicoId) {
        const iterator = await ctx.stub.getStateByRange('', '');
        const results = [];
    
        while (true) {
            const res = await iterator.next();
            if (res.value && res.value.value.toString()) {
                try {
                    const value = JSON.parse(res.value.value.toString());
                    const key = res.value.key;
    
                    // 🔍 Solo los accesos realmente concedidos
                    if (key.startsWith('access_') && value.medicoId === medicoId && value.granted) {
                        results.push(value);
                    }
                } catch (error) {
                    console.error("Error al parsear acceso autorizado:", error);
                }
            }
    
            if (res.done) {
                await iterator.close();
                break;
            }
        }
    
        return JSON.stringify(results);
    }
    

    async listHistoriales(ctx, pacienteId) {
        const iterator = await ctx.stub.getStateByRange('', '');
        const results = [];
    
        console.log("Buscando historiales para paciente:", pacienteId);
    
        while (true) {
            const res = await iterator.next();
            if (res.value && res.value.value.toString()) {
                try {
                    const key = res.value.key;
                    const value = JSON.parse(res.value.value.toString());
    
                    console.log("Encontrado en ledger:", key, value);
    
                    if (key.startsWith('historial_') && value.pacienteId === pacienteId && value.cid) {
                        console.log("Añadiendo historial:", key);
                        results.push(value);
                    }
                } catch (error) {
                    console.error("Error al parsear historial:", error);
                }
            }
            if (res.done) {
                await iterator.close();
                break;
            }
        }
    
        console.log("Resultados encontrados:", results.length);
        return JSON.stringify(results);
    }
    async GetState(ctx, key) {
        const data = await ctx.stub.getState(key);
        if (!data || data.length === 0) {
            throw new Error(`No se encontró ningún dato con la clave: ${key}`);
        }
        return data.toString(); // JSON serializado
    }
    
}

module.exports = PermisosContract;
