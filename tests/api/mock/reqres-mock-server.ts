import { createServer, IncomingMessage, Server, ServerResponse } from 'http';

const VALID_LOGIN = {
  email: 'eve.holt@reqres.in',
  password: 'cityslicka',
};

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

function sendNoContent(res: ServerResponse) {
  res.writeHead(204);
  res.end();
}

async function handleRequest(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url ?? '/', 'http://127.0.0.1');
  const path = url.pathname.replace(/\/$/, '') || '/';
  const method = req.method ?? 'GET';

  if (method === 'TRACE' && path === '/api/users/2') {
    res.writeHead(405);
    res.end();
    return;
  }

  if (method === 'GET' && path === '/api/users') {
    sendJson(res, 200, {
      page: Number(url.searchParams.get('page') ?? 1),
      per_page: 6,
      total: 12,
      total_pages: 2,
      data: [
        {
          id: 1,
          email: 'george.bluth@reqres.in',
          first_name: 'George',
          last_name: 'Bluth',
        },
      ],
    });
    return;
  }

  if (method === 'GET' && path === '/api/users/2') {
    sendJson(res, 200, {
      data: {
        id: 2,
        email: 'janet.weaver@reqres.in',
        first_name: 'Janet',
        last_name: 'Weaver',
      },
    });
    return;
  }

  if (method === 'GET' && path === '/api/users/999') {
    sendJson(res, 404, {});
    return;
  }

  if (method === 'POST' && path === '/api/login') {
    const auth = req.headers.authorization ?? '';
    if (auth.includes('invalid-token')) {
      sendJson(res, 401, { error: 'Unauthorized' });
      return;
    }

    const raw = await readBody(req);
    try {
      JSON.parse(raw);
    } catch {
      sendJson(res, 400, { error: 'Malformed JSON' });
      return;
    }

    const body = JSON.parse(raw) as { email?: string; password?: string };
    if (!body.email || !body.password) {
      sendJson(res, 400, { error: 'Missing email or password' });
      return;
    }
    if (body.email !== VALID_LOGIN.email || body.password !== VALID_LOGIN.password) {
      sendJson(res, 400, { error: 'User not found' });
      return;
    }
    sendJson(res, 200, { token: 'mock-reqres-token' });
    return;
  }

  if (method === 'POST' && path === '/api/register') {
    const raw = await readBody(req);
    let body: { email?: string; password?: string };
    try {
      body = JSON.parse(raw);
    } catch {
      sendJson(res, 400, { error: 'Malformed JSON' });
      return;
    }
    if (!body.email) {
      sendJson(res, 400, { error: 'Missing email' });
      return;
    }
    if (!body.password) {
      sendJson(res, 400, { error: 'Password is required' });
      return;
    }
    sendJson(res, 200, { id: 4, token: 'mock-register-token' });
    return;
  }

  if (method === 'POST' && path === '/api/users') {
    const raw = await readBody(req);
    try {
      const body = JSON.parse(raw) as { name?: string; job?: string };
      sendJson(res, 201, {
        ...body,
        id: '927',
        createdAt: new Date().toISOString(),
      });
    } catch {
      sendJson(res, 400, { error: 'Malformed JSON' });
    }
    return;
  }

  if (method === 'PUT' && path === '/api/users/2') {
    const raw = await readBody(req);
    const body = JSON.parse(raw) as { name?: string; job?: string };
    sendJson(res, 200, {
      ...body,
      updatedAt: new Date().toISOString(),
    });
    return;
  }

  if (method === 'DELETE' && path === '/api/users/2') {
    sendNoContent(res);
    return;
  }

  sendJson(res, 404, { error: 'Not found' });
}

export function startReqresMockServer(port: number): Promise<Server> {
  return new Promise((resolve) => {
    const server = createServer((req, res) => {
      void handleRequest(req, res);
    });
    server.listen(port, '127.0.0.1', () => resolve(server));
  });
}
