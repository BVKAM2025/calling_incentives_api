import { Request, Response } from 'express';
import { Logger } from '../../helpers/logger';
import { LogType } from '../../helpers/enum';
import { getCurrentUTCDateTime } from '../../helpers/dateTimeFormatters';
import { getIdFromBearerToken } from '../../helpers/authHelper';
import { updateStudentIncentiveDB } from '../../services/postgresClient';
import { StudentIncentive } from '../../models/model';

const logger = new Logger();

export const updateStudentIncentive = async (request: Request, response: Response) => {
    try {
        const { id } = request.params;
        const userId = await getIdFromBearerToken(request, response);
        if (!userId) return response.status(401).json({ message: 'Unauthorized' });

        const data: Partial<StudentIncentive> = {
            ...request.body,
            updated_by: userId,
            updated_on: getCurrentUTCDateTime()
        };

        const result = await updateStudentIncentiveDB(id, data);
        if (!result) return response.status(404).json({ message: 'Record not found' });
        return response.status(200).json({
            messageType: LogType.INFO,
            message: 'Student incentive record updated successfully.',
            data: result
        });
    } catch (error: any) {
        logger.logError(`Error updating student incentive: ${error.message}`);
        return response.status(500).json({ messageType: LogType.ERROR, message: 'Internal server error' });
    }
};
