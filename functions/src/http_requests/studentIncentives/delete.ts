import { Request, Response } from 'express';
import { Logger } from '../../helpers/logger';
import { LogType } from '../../helpers/enum';
import { deleteStudentIncentiveDB } from '../../services/postgresClient';

const logger = new Logger();

export const deleteStudentIncentive = async (request: Request, response: Response) => {
    try {
        const { id } = request.params;
        const result = await deleteStudentIncentiveDB(id);
        if (!result) return response.status(404).json({ message: 'Record not found' });
        return response.status(200).json({
            messageType: LogType.INFO,
            message: 'Student incentive record deleted successfully.'
        });
    } catch (error: any) {
        logger.logError(`Error deleting student incentive: ${error.message}`);
        return response.status(500).json({ messageType: LogType.ERROR, message: 'Internal server error' });
    }
};
