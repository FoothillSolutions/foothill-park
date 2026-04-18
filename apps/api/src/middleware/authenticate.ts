import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { config } from '../config';

// Placeholder for the Entra ID–validated user attached to req
export interface AuthUser {
  entraId: string;
  displayName: string;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

const client = jwksClient({
  jwksUri: `https://login.microsoftonline.com/${config.entra.tenantId}/discovery/v2.0/keys`,
  cache: true,
  cacheMaxEntries: 5,
  cacheMaxAge: 600_000,
});

function getSigningKey(header: jwt.JwtHeader, callback: jwt.SigningKeyCallback) {
  client.getSigningKey(header.kid, (err, key) => {
    callback(err, key?.getPublicKey());
  });
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing authorization header' });
    return;
  }

  const token = authHeader.slice(7);
  jwt.verify(
    token,
    getSigningKey,
    {
      audience: config.entra.clientId,
      issuer: `https://login.microsoftonline.com/${config.entra.tenantId}/v2.0`,
    },
    (err, decoded) => {
      if (err) {
        res.status(401).json({ error: 'Invalid token' });
        return;
      }
      const payload = decoded as jwt.JwtPayload;
      req.user = {
        entraId: payload.oid ?? payload.sub ?? '',
        displayName: payload.name ?? '',
        email: payload.preferred_username ?? payload.email ?? '',
      };
      next();
    }
  );
}
