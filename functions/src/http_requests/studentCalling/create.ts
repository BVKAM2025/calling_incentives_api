import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from '../../helpers/logger';
import { LogType } from '../../helpers/enum';
import { getIdFromBearerToken } from '../../helpers/authHelper';
import { createStudentCallingDB } from '../../services/postgresClient';

const logger = new Logger();


export const createStudentCalling = async (request: Request, response: Response) => {
    try {
        const userId = await getIdFromBearerToken(request, response);
        if (!userId) return response.status(401).json({ message: 'Unauthorized' });

        const body = request.body;
        const items = Array.isArray(body) ? body : [body];

        // Prepare data for Function.
        const dataToInsert = items.map(item => ({
            ...item,
            id: item.id || uuidv4()
        }));

        const results = await createStudentCallingDB(dataToInsert, userId, userId);

        if (results && results.length > 0) {
            return response.status(201).json({
                messageType: LogType.INFO,
                message: `${results.length} student calling record(s) created successfully.`,
                data: results
            });
        } else {
            return response.status(500).json({
                messageType: LogType.ERROR,
                message: 'Failed to create student calling records.',
            });
        }
    } catch (error: any) {
        logger.logError(`Error creating student calling: ${error.message}`);
        return response.status(500).json({ messageType: LogType.ERROR, message: 'Internal server error' });
    }
};



