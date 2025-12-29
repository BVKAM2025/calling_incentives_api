import { Pool } from 'pg';
import { getGCPSecretValue } from './gcpSecretManagerClient';
import { Logger } from '../helpers/logger';
import { StudentCalling, StudentIncentive } from '../models/model';


const logger = new Logger();

interface TenantCredentials {
  user: string;
  host: string;
  database: string;
  password: string;
  port: number;
  ssl: boolean;
}

let tenantCredentials: TenantCredentials | null = null;
let dbCredentials: TenantCredentials | null = null;
let masterPool: Pool | null = null;
let pool: Pool | null = null;

const getTenantCredentials = async (): Promise<TenantCredentials> => {
  if (tenantCredentials) return tenantCredentials;

  tenantCredentials = {
    user: await getGCPSecretValue('pg_user'),
    // host:"34.47.194.219",
    host: await getGCPSecretValue('pg_host'),
    database: await getGCPSecretValue('pg_database'),
    password: await getGCPSecretValue('pg_password'),
    port: 5432,
    ssl: false,
  };

  return tenantCredentials;
};

const initializePool = (credentials: TenantCredentials) => {
  return new Pool(credentials);
};

const getCredentials = async (): Promise<TenantCredentials | null> => {
  return dbCredentials;
};
export const updatedDBCredentials = async (tenantId: string): Promise<void> => {
  const dbTenantCredentials = await getTenantCredentials();
  if (!masterPool) {
    masterPool = initializePool(dbTenantCredentials);
  }
  try {
    logger.logInfo('retrieving database credentials from the database.');
    const query = `
      SELECT db_user, db_host, db_name, db_password, db_port 
      FROM tenant_database_config 
      WHERE id = $1
    `;
    const client = await masterPool.connect();
    try {
      const dbResult = await client.query(query, [tenantId]);
      if (dbResult.rows.length > 0) {
        dbCredentials = {
          user: dbResult.rows[0].db_user,
          // host:"34.47.194.219",
          host: dbResult.rows[0].db_host,
          database: dbResult.rows[0].db_name,
          password: dbResult.rows[0].db_password,
          port: dbResult.rows[0].db_port,
          ssl: false,
        };
      }
    } finally {
      client.release();
    }
  } catch (error: any) {
    logger.logError(
      `error occurred while fetching database credentials: ${error.message}`
    );
  }
};

const ensurePool = async (): Promise<Pool | null> => {
  if (!pool) {
    const credentials = await getCredentials();
    if (!credentials) {
      logger.logError('database credentials are unavailable.');
      return null;
    }
    pool = initializePool(credentials);
  }
  return pool;
};



export const getStudentsDB = async (
  studentId?: string | null,
  pageNumber?: number | null,
  pageSize?: number | null,
  searchField?: string | null,
  searchText?: string | null,
  userId?: string | null,
  academicYearId?: string | null,
  branchId?: string | null,
  classId?: string | null,
  sectionId?: string | null,
  admissionStatus?: boolean | null,
  isActive?: boolean | null
): Promise<{ totalCount: number; data: any[] }> => {
  logger.logInfo('getStudentsDB function triggered with parameters:', {
    studentId,
    pageNumber,
    pageSize,
    searchField,
    searchText,
    userId,
    academicYearId,
    branchId,
    classId,
    sectionId,
    admissionStatus,
    isActive
  });

  const credentials = await getCredentials();
  if (!credentials) {
    logger.logInfo('database credentials not found.');
    return { totalCount: 0, data: [] };
  }

  if (!pool) {
    pool = initializePool(credentials);
  }

  const client = await pool.connect();

  try {
    logger.logInfo('retrieving students from the database based on query parameters.');

    // Query to get the total number of records (without pagination)
    const countQuery = `
      SELECT COUNT(*) AS total_count
      FROM public.fn_get_students_details_based_on_search_with_calling_incentives(
        $1, 
        $2, 
        $3, 
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        $10,
        $11,
        $12
      );
    `;
    logger.logInfo('Executing count query:', { countQuery });
    const countResult = await client.query(countQuery, [
      null,
      null,
      null,
      null,
      null,
      userId,
      academicYearId,
      branchId,
      classId,
      sectionId,
      admissionStatus,
      isActive
    ]);
    logger.logInfo('Count query result:', countResult.rows);
    const totalCount = parseInt(countResult.rows[0].total_count, 10);

    // Query to get the student data with pagination (if pageNumber and pageSize are provided)
    const dataQuery = `
      SELECT * FROM public.fn_get_students_details_based_on_search_with_calling_incentives(
        $1, 
        $2, 
        $3, 
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        $10,
        $11,
        $12
      );
    `;
    logger.logInfo('Executing data query:', { dataQuery });
    const dataResult = await client.query(dataQuery, [
      studentId,
      pageNumber,
      pageSize,
      searchField,
      searchText,
      userId,
      academicYearId,
      branchId,
      classId,
      sectionId,
      admissionStatus,
      isActive
    ]);
    logger.logInfo('Data query result:', dataResult.rows);

    return {
      totalCount,
      data: dataResult.rows,
    };
  } catch (error: any) {
    logger.logInfo(`Error occurred while fetching student entries: ${error.message}`);
    return { totalCount: 0, data: [] };
  } finally {
    client.release();
  }
};



export const createStudentCallingDB = async (
  callingData: StudentCalling | StudentCalling[],
  createdBy: string,
  updatedBy: string
): Promise<StudentCalling[]> => {
  const pool = await ensurePool();
  if (!pool) {
    logger.logError('Pool is not available for student calling insert');
    return [];
  }

  const client = await pool.connect();
  try {
    const data = Array.isArray(callingData) ? callingData : [callingData];
    logger.logInfo(`Calling fn_bulk_insert_student_calling with ${data.length} records`);
    logger.logInfo(`Sample data: ${JSON.stringify(data[0])}`);
    
    const query = 'SELECT * FROM public.fn_bulk_insert_student_calling($1::json, $2::uuid, $3::uuid)';
    const result = await client.query(query, [JSON.stringify(data), createdBy, updatedBy]);
    
    logger.logInfo(`Database function returned ${result.rows.length} rows`);
    return result.rows;
  } catch (error: any) {
    logger.logError(`error in bulk student calling insert: ${error.message}`);
    logger.logError(`error stack: ${error.stack}`);
    logger.logError(`error code: ${error.code}`);
    return [];
  } finally {
    client.release();
  }
};



export const updateStudentCallingDB = async (
  id: string,
  callingData: Partial<StudentCalling>
): Promise<StudentCalling | null> => {
  const pool = await ensurePool();
  if (!pool) return null;

  const client = await pool.connect();
  try {
    const columnNames = Object.keys(callingData);
    const columnValues = Object.values(callingData);
    const setClause = columnNames.map((name, index) => `${name} = $${index + 2}`).join(', ');

    const updateQuery = `
      UPDATE student_calling
      SET ${setClause}
      WHERE id = $1
      RETURNING *
    `;
    const updateValues = [id, ...columnValues];
    const result = await client.query(updateQuery, updateValues);
    return result.rows[0] || null;
  } catch (error: any) {
    logger.logError(`error updating student calling: ${error.message}`);
    return null;
  } finally {
    client.release();
  }
};

export const getStudentCallingsDB = async (
  pageNumber?: number,
  pageSize?: number,
  studentId?: string,
  userId?: string
): Promise<{ totalCount: number; data: StudentCalling[] }> => {
  const pool = await ensurePool();
  if (!pool) return { totalCount: 0, data: [] };

  const client = await pool.connect();
  try {
    const offset = pageNumber && pageSize ? (pageNumber - 1) * pageSize : 0;
    const limitClause = pageSize ? `LIMIT ${pageSize}` : '';
    const offsetClause = pageNumber && pageSize ? `OFFSET ${offset}` : '';

    const whereClauses: string[] = [];
    const queryParams: any[] = [];

    if (studentId) {
      whereClauses.push(`student_id = $${queryParams.length + 1}`);
      queryParams.push(studentId);
    }
    if (userId) {
      whereClauses.push(`user_id = $${queryParams.length + 1}`);
      queryParams.push(userId);
    }

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countQuery = `SELECT COUNT(*) FROM student_calling ${whereClause}`;
    const countResult = await client.query(countQuery, queryParams);
    const totalCount = parseInt(countResult.rows[0].count, 10);

    const dataQuery = `
      SELECT * FROM student_calling
      ${whereClause}
      ORDER BY created_on DESC
      ${limitClause}
      ${offsetClause}
    `;
    const dataResult = await client.query(dataQuery, queryParams);
    return { totalCount, data: dataResult.rows };
  } catch (error: any) {
    logger.logError(`error fetching student callings: ${error.message}`);
    return { totalCount: 0, data: [] };
  } finally {
    client.release();
  }
};

export const getStudentCallingByIdDB = async (id: string): Promise<StudentCalling | null> => {
  const pool = await ensurePool();
  if (!pool) return null;

  const client = await pool.connect();
  try {
    const query = 'SELECT * FROM student_calling WHERE id = $1';
    const result = await client.query(query, [id]);
    return result.rows[0] || null;
  } catch (error: any) {
    logger.logError(`error fetching student calling by id: ${error.message}`);
    return null;
  } finally {
    client.release();
  }
};

export const deleteStudentCallingDB = async (id: string): Promise<boolean> => {
  const pool = await ensurePool();
  if (!pool) return false;

  const client = await pool.connect();
  try {
    const query = 'DELETE FROM student_calling WHERE id = $1';
    const result = await client.query(query, [id]);
    return (result.rowCount ?? 0) > 0;
  } catch (error: any) {
    logger.logError(`error deleting student calling: ${error.message}`);
    return false;
  } finally {
    client.release();
  }
};

export const deleteStudentCallingByStudentIdDB = async (studentId: string): Promise<boolean> => {
  const pool = await ensurePool();
  if (!pool) return false;

  const client = await pool.connect();
  try {
    const query = 'DELETE FROM student_calling WHERE student_id = $1';
    const result = await client.query(query, [studentId]);
    logger.logInfo(`Deleted ${result.rowCount ?? 0} existing calling records for student_id: ${studentId}`);
    return true;
  } catch (error: any) {
    logger.logError(`error deleting student calling by student_id: ${error.message}`);
    return false;
  } finally {
    client.release();
  }
};

// Student Incentives DB Functions
export const createStudentIncentiveDB = async (
  incentiveData: StudentIncentive | StudentIncentive[],
  createdBy: string,
  updatedBy: string
): Promise<StudentIncentive[]> => {
  const pool = await ensurePool();
  if (!pool) {
    logger.logError('Pool is not available for student incentive insert');
    return [];
  }

  const client = await pool.connect();
  try {
    const data = Array.isArray(incentiveData) ? incentiveData : [incentiveData];
    logger.logInfo(`Calling fn_bulk_insert_student_incentives with ${data.length} records`);
    logger.logInfo(`Sample data: ${JSON.stringify(data[0])}`);
    
    const query = 'SELECT * FROM public.fn_bulk_insert_student_incentives($1::json, $2::uuid, $3::uuid)';
    const result = await client.query(query, [JSON.stringify(data), createdBy, updatedBy]);
    
    logger.logInfo(`Database function returned ${result.rows.length} rows`);
    return result.rows;
  } catch (error: any) {
    logger.logError(`error in bulk student incentive insert: ${error.message}`);
    logger.logError(`error stack: ${error.stack}`);
    logger.logError(`error code: ${error.code}`);
    return [];
  } finally {
    client.release();
  }
};



export const updateStudentIncentiveDB = async (
  id: string,
  incentiveData: Partial<StudentIncentive>
): Promise<StudentIncentive | null> => {
  const pool = await ensurePool();
  if (!pool) return null;

  const client = await pool.connect();
  try {
    const columnNames = Object.keys(incentiveData);
    const columnValues = Object.values(incentiveData);
    const setClause = columnNames.map((name, index) => `${name} = $${index + 2}`).join(', ');

    const updateQuery = `
      UPDATE student_incentives
      SET ${setClause}
      WHERE id = $1
      RETURNING *
    `;
    const updateValues = [id, ...columnValues];
    const result = await client.query(updateQuery, updateValues);
    return result.rows[0] || null;
  } catch (error: any) {
    logger.logError(`error updating student incentive: ${error.message}`);
    return null;
  } finally {
    client.release();
  }
};

export const getStudentIncentivesDB = async (
  pageNumber?: number,
  pageSize?: number,
  studentId?: string,
  userId?: string
): Promise<{ totalCount: number; data: StudentIncentive[] }> => {
  const pool = await ensurePool();
  if (!pool) return { totalCount: 0, data: [] };

  const client = await pool.connect();
  try {
    const offset = pageNumber && pageSize ? (pageNumber - 1) * pageSize : 0;
    const limitClause = pageSize ? `LIMIT ${pageSize}` : '';
    const offsetClause = pageNumber && pageSize ? `OFFSET ${offset}` : '';

    const whereClauses: string[] = [];
    const queryParams: any[] = [];

    if (studentId) {
      whereClauses.push(`student_id = $${queryParams.length + 1}`);
      queryParams.push(studentId);
    }
    if (userId) {
      whereClauses.push(`user_id = $${queryParams.length + 1}`);
      queryParams.push(userId);
    }

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countQuery = `SELECT COUNT(*) FROM student_incentives ${whereClause}`;
    const countResult = await client.query(countQuery, queryParams);
    const totalCount = parseInt(countResult.rows[0].count, 10);

    const dataQuery = `
      SELECT * FROM student_incentives
      ${whereClause}
      ORDER BY created_on DESC
      ${limitClause}
      ${offsetClause}
    `;
    const dataResult = await client.query(dataQuery, queryParams);
    return { totalCount, data: dataResult.rows };
  } catch (error: any) {
    logger.logError(`error fetching student incentives: ${error.message}`);
    return { totalCount: 0, data: [] };
  } finally {
    client.release();
  }
};

export const getStudentIncentiveByIdDB = async (id: string): Promise<StudentIncentive | null> => {
  const pool = await ensurePool();
  if (!pool) return null;

  const client = await pool.connect();
  try {
    const query = 'SELECT * FROM student_incentives WHERE id = $1';
    const result = await client.query(query, [id]);
    return result.rows[0] || null;
  } catch (error: any) {
    logger.logError(`error fetching student incentive by id: ${error.message}`);
    return null;
  } finally {
    client.release();
  }
};

export const deleteStudentIncentiveDB = async (id: string): Promise<boolean> => {
  const pool = await ensurePool();
  if (!pool) return false;

  const client = await pool.connect();
  try {
    const query = 'DELETE FROM student_incentives WHERE id = $1';
    const result = await client.query(query, [id]);
    return (result.rowCount ?? 0) > 0;
  } catch (error: any) {
    logger.logError(`error deleting student incentive: ${error.message}`);
    return false;
  } finally {
    client.release();
  }
};

export const deleteStudentIncentiveByStudentIdDB = async (studentId: string): Promise<boolean> => {
  const pool = await ensurePool();
  if (!pool) return false;

  const client = await pool.connect();
  try {
    const query = 'DELETE FROM student_incentives WHERE student_id = $1';
    const result = await client.query(query, [studentId]);
    logger.logInfo(`Deleted ${result.rowCount ?? 0} existing incentive records for student_id: ${studentId}`);
    return true;
  } catch (error: any) {
    logger.logError(`error deleting student incentive by student_id: ${error.message}`);
    return false;
  } finally {
    client.release();
  }
};
