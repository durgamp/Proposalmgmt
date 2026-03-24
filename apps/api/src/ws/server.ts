import { WebSocketServer } from 'ws';
import { logger } from '../config/logger';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const wsUtils = require('y-websocket/bin/utils') as {
  setupWSConnection: (conn: unknown, req: unknown, opts?: { docName?: string; gc?: boolean }) => void;
  setPersistence: (p: { bindState: (name: string, doc: unknown) => Promise<void>; writeState: (name: string, doc: unknown) => Promise<void> }) => void;
};

// Without a persistence provider, y-websocket never removes docs from its in-memory map
// (see closeConn: only deletes when `persistence !== null`).  A stale Yjs doc left in memory
// conflicts with a fresh Y.Doc created by the next client, producing a CRDT merge that
// can clear the editor.  A no-op persistence forces the cleanup path so every new session
// always starts from an empty server doc — the client then seeds reliably from the DB.
wsUtils.setPersistence({
  bindState: async (_docName: string, _ydoc: unknown) => { /* no-op: client seeds from DB */ },
  writeState: async (_docName: string, _ydoc: unknown) => { /* no-op: content persisted via REST API */ },
});

export function startWsServer(port: number): WebSocketServer {
  const wss = new WebSocketServer({ port });

  wss.on('connection', (ws, req) => {
    // URL pattern: ws://host:port/<docName>
    // docName is typically: <proposalId>-<sectionKey>
    const rawPath = req.url ?? '/unknown';
    const docName = rawPath.replace(/^\//, '') || 'default';

    logger.info(`[WS] Client connected to doc "${docName}"`);

    wsUtils.setupWSConnection(ws, req, { docName, gc: true });
  });

  wss.on('error', (err) => {
    logger.error({ err }, '[WS] WebSocket server error');
  });

  return wss;
}
