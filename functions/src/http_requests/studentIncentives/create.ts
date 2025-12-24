import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from '../../helpers/logger';
import { LogType } from '../../helpers/enum';
import { getIdFromBearerToken } from '../../helpers/authHelper';
import { createStudentIncentiveDB, getStudentsDB } from '../../services/postgresClient';

const logger = new Logger();


export const createStudentIncentive = async (request: Request, response: Response) => {
    try {
        const userId = await getIdFromBearerToken(request, response);
        if (!userId) return response.status(401).json({ message: 'Unauthorized' });

        const body = request.body;
        const items = Array.isArray(body) ? body : [body];

        // Prepare data for Function - always generate new UUID, ignore ID from request
        const dataToInsert = items.map(item => {
            const { id, ...itemWithoutId } = item;
            return {
                ...itemWithoutId,
                id: uuidv4()
            };
        });

        logger.logInfo(`Attempting to create ${dataToInsert.length} student incentive record(s)`);
        const results = await createStudentIncentiveDB(dataToInsert, userId, userId);
        logger.logInfo(`Database returned ${results?.length || 0} records`);

        if (results && results.length > 0) {
            // Get unique student IDs from created records
            const studentIds = [...new Set(results.map(r => r.student_id))];
            
            // Fetch full student details with calling and incentives for all affected students
            const studentDetailsPromises = studentIds.map(studentId => 
                getStudentsDB(studentId, null, null, null, null, userId, null, null, null, null, null, null)
            );
            
            const studentDetailsResults = await Promise.all(studentDetailsPromises);
            const allStudentDetails = studentDetailsResults.flatMap(result => result.data);
            
            return response.status(201).json({
                messageType: LogType.INFO,
                message: `${results.length} student incentive record(s) created successfully.`,
                data: allStudentDetails
            });
        } else {
            logger.logError('Failed to create student incentive records - empty result from database');
            return response.status(500).json({
                messageType: LogType.ERROR,
                message: 'Failed to create student incentive records. Check server logs for details.',
            });
        }
    } catch (error: any) {
        logger.logError(`Error creating student incentive: ${error.message}`);
        return response.status(500).json({ messageType: LogType.ERROR, message: `Internal server error: ${error.message}` });
    }
};



