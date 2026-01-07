/*
  File: getStudentsDetailsWithCallingAndIncentives.ts
  Description: This module retrieves student(s) from the database.
*/
import { Logger } from '../helpers/logger';
import { Request, Response } from 'express';
import { LogType } from '../helpers/enum';
import { getStudentsDB } from '../services/postgresClient';
import { getIdFromBearerToken } from '../helpers/authHelper';
const logger = new Logger();

/*
  Function: getStudentsDetailsWithCallingAndIncentives
  Description: This function retrieves student(s).
  Parameters:
    request (Request): Request with optional query parameters.
    response (Response): Response with status and data.
  Return:
    returns the response with status code 200 and student data if successful.
    returns the response with status code 404 if no students are found.
    returns the response with status code 500 if there is any error in retrieving the students.
*/
export const getStudentsDetailsWithCallingAndIncentives  = async (
  request: Request,
  response: Response
): Promise<any> => {
  try {
    logger.logInfo('get all students triggered at http');
    const { pageNumber, pageSize, searchField, searchText, academicYearId, branchId, classId, sectionId, admissionStatus, isActive } =
      request.query;
    logger.logInfo('Query parameters received:', {
      pageNumber,
      pageSize,
      searchField,
      searchText,
      academicYearId,
      branchId,
      classId,
      sectionId,
      admissionStatus,
      isActive
    });

    const userId = await getIdFromBearerToken(request, response);

    const parsedAdmissionStatus =
      typeof admissionStatus === 'string'
        ? admissionStatus.toLowerCase() === 'true'
        : null
    const parsedIsActiveStatus =
      typeof isActive === 'string'
        ? isActive.toLowerCase() === 'true'
        : null
    const dbResponse = await getStudentsDB(
      null,
      isNaN(Number(pageNumber)) ? null : Number(pageNumber),
      isNaN(Number(pageSize)) ? null : Number(pageSize),
      searchField as string,
      searchText as string,
      userId,
      academicYearId as string,
      branchId as string,
      classId as string,
      sectionId as string,
      parsedAdmissionStatus,
      parsedIsActiveStatus
    );
    return response.status(200).send(dbResponse);
  } catch (error: any) {
    logger.logError(`error in getstudents: ${error}`);
    response.status(500).json({
      messageType: LogType.ERROR,
      message: `${error}`,
    });
    return;
  }
};
