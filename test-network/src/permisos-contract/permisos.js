'use strict';

const { Contract } = require('fabric-contract-api');

class PermisosContract extends Contract {

    async requestAccess(ctx, medicoId, pacienteId) {
        const requestKey = `request_${medicoId}_${pacienteId}`;
        const exists = await ctx.stub.getState(requestKey);
        if (exists.length > 0) {
            throw new Error(`El médico ya ha solicitado acceso a este paciente`);
        }

        const request = { medicoId, pacienteId, status: 'pendiente' };
        await ctx.stub.putState(requestKey, Buffer.from(JSON.stringify(request)));
        return `Solicitud de acceso registrada correctamente.`;
    }

    async approveAccess(ctx, medicoId, pacienteId) {
        const requestKey = `request_${medicoId}_${pacienteId}`;
        const requestBytes = await ctx.stub.getState(requestKey);
        if (!requestBytes || requestBytes.length === 0) {
            throw new Error(`No existe una solicitud de acceso para este médico.`);
        }

        const request = JSON.parse(requestBytes.toString());
        request.status = 'aprobado';
        await ctx.stub.putState(requestKey, Buffer.from(JSON.stringify(request)));
        return `Acceso concedido al médico ${medicoId}.`;
    }

    async denyAccess(ctx, medicoId, pacienteId) {
        const requestKey = `request_${medicoId}_${pacienteId}`;
        const requestBytes = await ctx.stub.getState(requestKey);
        if (!requestBytes || requestBytes.length === 0) {
            throw new Error(`No existe una solicitud de acceso para este médico.`);
        }

        const request = JSON.parse(requestBytes.toString());
        request.status = 'denegado';
        await ctx.stub.putState(requestKey, Buffer.from(JSON.stringify(request)));
        return `Acceso denegado al médico ${medicoId}.`;
    }

    async revokeAccess(ctx, medicoId, pacienteId) {
        const requestKey = `request_${medicoId}_${pacienteId}`;
        await ctx.stub.deleteState(requestKey);
        return `Acceso revocado para el médico ${medicoId}.`;
    }

    async checkAccess(ctx, medicoId, pacienteId) {
        const requestKey = `request_${medicoId}_${pacienteId}`;
        const requestBytes = await ctx.stub.getState(requestKey);
        if (!requestBytes || requestBytes.length === 0) {
            return false;
        }

        const request = JSON.parse(requestBytes.toString());
        return request.status === 'aprobado';
    }

    async listRequests(ctx, pacienteId) {
        const iterator = await ctx.stub.getStateByRange('', '');
        const results = [];

        for await (const res of iterator) {
            const request = JSON.parse(res.value.toString());
            if (request.pacienteId === pacienteId && request.status === 'pendiente') {
                results.push(request);
            }
        }

        return results;
    }
}

module.exports = PermisosContract;
