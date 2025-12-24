/*
  Description: Interface defining a dictionary of log message keys and their corresponding log text values.
  Key: string
  Value: string
*/
interface LogText {
  [key: string]: string;
}
/*
  Description: A dictionary object that maps log message keys to their respective log text values. Each log text value represents a specific log message.
  Type: LogText
*/
const logText: LogText = {
  INFO_USER_INDICES_GET_TRIGGER:
    'user data retrieval request received from client.',
  ERROR_MISSING_API_KEY: 'missing API key!',
  ERROR_INVALID_API_KEY: 'invalid API key!',
  INFO_INIT_CLIENT: 'news api is triggered by client',
  /* eslint camelcase: 0 */
};

/*
  Description: Enum representing message definition in the code
*/
enum Messages {
  MISSING_API = 'Missing API key',
  INVALID_API = 'Invalid API key',
}

export {Messages, logText};
