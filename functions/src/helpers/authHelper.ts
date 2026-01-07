import {getGCPSecretValue} from '../services/gcpSecretManagerClient';
import {jwtVerify} from 'jose';
import {LogType} from './enum';
import {Logger} from './logger';
import {Request, Response} from 'express';

const logger = new Logger();

export async function validateBearerToken(request: Request, response: Response): Promise<boolean> {
  logger.logInfo(`admin route: ${request.originalUrl.includes('admin')}`);
  const bearerToken = request.headers['x-forwarded-authorization'];
  logger.logInfo(JSON.stringify(request.headers));
  if (!bearerToken || !(bearerToken as string).startsWith('Bearer ')) {
    logger.logError('missing token in the request header');
    response.status(400).json({
      messageType: LogType.ERROR,
      message: 'missing token in the request header',
    });
    return false; // Indicate that validation failed
  }

  const token = (bearerToken as string).split(' ')[1];
  const rawJwtSecret = await getGCPSecretValue('jwt_secret_key');
  const jwtSecret = new TextEncoder().encode(`${rawJwtSecret}`);

  let authSuccess = true;

  try {
    await jwtVerify(token, jwtSecret, {
      // algorithms: ["HS256"],
    });
  } catch (error: any) {
    logger.logError(`invalid token in the request header : ${error}`);
    response.status(401).json({
      messageType: LogType.ERROR,
      message: 'Invalid token in the request header',
    });
    authSuccess = false; // Indicate that validation failed
  }
  return authSuccess;
}


export async function getIdFromBearerToken(request: Request, response: Response): Promise<string> {
  const bearerToken =
    request.headers['x-forwarded-authorization'];
  const token = (bearerToken as string).split(' ')[1];
  const rawJwtSecret = await getGCPSecretValue('jwt_secret_key');
  const jwtSecret = new TextEncoder().encode(`${rawJwtSecret}`);
  try {
    const {payload} = await jwtVerify(token, jwtSecret, {
    });
    return payload?.user_id as string;
  } catch (error: any) {
    logger.logError(`invalid token in the request header : ${error}`);
    response.status(401).json({
      messageType: LogType.ERROR,
      message: 'Invalid token in the request header',
    });
  }
  return '';
}
