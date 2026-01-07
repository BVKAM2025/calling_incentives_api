import { Request, Response } from 'express';
import { Logger } from '../../helpers/logger';
import { LogType } from '../../helpers/enum';
import { getStudentCallingsDB, getStudentCallingByIdDB } from '../../services/postgresClient';

const logger = new Logger();

export const getStudentCallings = async (request: Request, response: Response) => {
    try {
        const { pageNumber, pageSize, studentId, userId } = request.query;
        const result = await getStudentCallingsDB(
            pageNumber ? parseInt(pageNumber as string) : undefined,
            pageSize ? parseInt(pageSize as string) : undefined,
            studentId as string,
            userId as string
        );
        return response.status(200).json({
            messageType: LogType.INFO,
            data: result.data,
            totalCount: result.totalCount
        });
    } catch (error: any) {
        logger.logError(`Error fetching student callings: ${error.message}`);
        return response.status(500).json({ messageType: LogType.ERROR, message: 'Internal server error' });
    }
};

export const getStudentCallingById = async (request: Request, response: Response) => {
    try {
        const { id } = request.params;
        const result = await getStudentCallingByIdDB(id);
        if (!result) return response.status(404).json({ message: 'Record not found' });
        return response.status(200).json({ messageType: LogType.INFO, data: result });
    } catch (error: any) {
        logger.logError(`Error fetching student calling by id: ${error.message}`);
        return response.status(500).json({ messageType: LogType.ERROR, message: 'Internal server error' });
    }
};
