/*
  File: index.ts
  Description: Main file implementing an Express app to handle HTTP requests for Student Calling and Incentives.
*/
import * as functions from 'firebase-functions';
import express, { NextFunction, Request, Response } from 'express';
import * as admin from 'firebase-admin';
import { Logger } from './helpers/logger';
import { LogType } from './helpers/enum';
import { createStudentCalling } from './http_requests/studentCalling/create';
import { getStudentCallings, getStudentCallingById } from './http_requests/studentCalling/get';
import { updateStudentCalling } from './http_requests/studentCalling/update';
import { deleteStudentCalling } from './http_requests/studentCalling/delete';
import { createStudentIncentive } from './http_requests/studentIncentives/create';
import { getStudentIncentives, getStudentIncentiveById } from './http_requests/studentIncentives/get';
import { updateStudentIncentive } from './http_requests/studentIncentives/update';
import { deleteStudentIncentive } from './http_requests/studentIncentives/delete';
import { updatedDBCredentials } from './services/postgresClient';
import { validateBearerToken } from './helpers/authHelper';
import { config } from './helpers/config';
import { getStudentsDetailsWithCallingAndIncentives } from './http_requests/getStudentsDetailsWithCallingAndIncentives';

// Initialize Express app and Firebase admin
const app = express();
const logger = new Logger();
admin.initializeApp();

const CALLING_ROUTE_PATH = '/rest/v1/in/student_calling';
const INCENTIVE_ROUTE_PATH = '/rest/v1/in/student_incentive';
const STUDENT_CALLING_INCENTIVE_ROUTE_PATH = '/rest/v1/in/students_with_calling_incentives';

// Middleware to validate API access key and tenant ID
const HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, api-key,tenant-id',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
};

// Middleware to validate API access key
app.use(async (request: Request, response: Response, next: NextFunction) => {
  response.set(HEADERS);
  if (request.method === 'OPTIONS') return response.sendStatus(204);

  try {
    const tenantId = request.headers['tenant-id'] as string | undefined;

    // Use Bearer token validation for all other requests
    const bearerTokenValid = await validateBearerToken(request, response);
    if (!bearerTokenValid) {
      return; // Exit if Bearer token validation fails
    }

    if (!tenantId) {
      logger.logError('missing tenant id in the request header.');
      return response.status(400).json({
        messageType: LogType.ERROR,
        message: 'Tenant ID is required in the request header.',
      });
    }

    await updatedDBCredentials(tenantId);
    return next();
  } catch (error: any) {
    logger.logError(`error in middleware: ${error.message}`);
    return response.status(500).json({
      messageType: LogType.ERROR,
      message: 'Internal server error.',
    });
  }
});

// Student Calling Route handlers
app.post(CALLING_ROUTE_PATH, async (request, response) => {
  logger.logInfo('client triggered post request for student calling');
  return createStudentCalling(request, response);
});

app.get(CALLING_ROUTE_PATH, async (request, response) => {
  logger.logInfo('client triggered get request for student calling');
  return getStudentCallings(request, response);
});

app.get(`${CALLING_ROUTE_PATH}/:id`, async (request, response) => {
  logger.logInfo('client triggered get by id request for student calling');
  return getStudentCallingById(request, response);
});

app.put(`${CALLING_ROUTE_PATH}/:id`, async (request, response) => {
  logger.logInfo('client triggered put request for student calling');
  return updateStudentCalling(request, response);
});

app.delete(`${CALLING_ROUTE_PATH}/:id`, async (request, response) => {
  logger.logInfo('client triggered delete request for student calling');
  return deleteStudentCalling(request, response);
});

// Student Incentive Route handlers
app.post(INCENTIVE_ROUTE_PATH, async (request, response) => {
  logger.logInfo('client triggered post request for student incentive');
  return createStudentIncentive(request, response);
});

app.get(INCENTIVE_ROUTE_PATH, async (request, response) => {
  logger.logInfo('client triggered get request for student incentive');
  return getStudentIncentives(request, response);
});

app.get(`${INCENTIVE_ROUTE_PATH}/:id`, async (request, response) => {
  logger.logInfo('client triggered get by id request for student incentive');
  return getStudentIncentiveById(request, response);
});

app.put(`${INCENTIVE_ROUTE_PATH}/:id`, async (request, response) => {
  logger.logInfo('client triggered put request for student incentive');
  return updateStudentIncentive(request, response);
});

app.delete(`${INCENTIVE_ROUTE_PATH}/:id`, async (request, response) => {
  logger.logInfo('client triggered delete request for student incentive');
  return deleteStudentIncentive(request, response);
});

app.get(STUDENT_CALLING_INCENTIVE_ROUTE_PATH, async (request, response) => {
  logger.logInfo('client triggered get request for students with calling and incentives');
  return getStudentsDetailsWithCallingAndIncentives(request, response);
});

const exportName = `http-calling-incentive-${config.env}`;
exports[exportName] = functions.https.onRequest(app);
