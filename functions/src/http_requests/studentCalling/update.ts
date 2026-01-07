import { Request, Response } from 'express';
import { Logger } from '../../helpers/logger';
import { LogType } from '../../helpers/enum';
import { getCurrentUTCDateTime } from '../../helpers/dateTimeFormatters';
import { getIdFromBearerToken } from '../../helpers/authHelper';
import { updateStudentCallingDB } from '../../services/postgresClient';
import { StudentCalling } from '../../models/model';

const logger = new Logger();

export const updateStudentCalling = async (request: Request, response: Response) => {
    try {
        const { id } = request.params;
        const userId = await getIdFromBearerToken(request, response);
        if (!userId) return response.status(401).json({ message: 'Unauthorized' });

        const data: Partial<StudentCalling> = {
            ...request.body,
            updated_by: userId,
            updated_on: getCurrentUTCDateTime()
        };

        const result = await updateStudentCallingDB(id, data);
        if (!result) return response.status(404).json({ message: 'Record not found' });
        return response.status(200).json({
            messageType: LogType.INFO,
            message: 'Student calling record updated successfully.',
            data: result
        });
    } catch (error: any) {
        logger.logError(`Error updating student calling: ${error.message}`);
        return response.status(500).json({ messageType: LogType.ERROR, message: 'Internal server error' });
    }
};
