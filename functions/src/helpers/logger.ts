import {Logging} from '@google-cloud/logging';
import {LogType} from './enum';

class Logger {
  private logging: Logging;
  private logName: string;

  constructor(logName = 'class') {
    this.logging = new Logging();
    this.logName = logName;
  }

  public async logInfo(messageKey: string, variables?: Record<string, any>) {
    const logEntry = this.formatLogEntry(LogType.INFO, messageKey, variables);
    await this.writeLog('INFO', logEntry);
  }

  public async logError(messageKey: string, variables?: Record<string, any>) {
    const logEntry = this.formatLogEntry(LogType.ERROR, messageKey, variables);
    await this.writeLog('ERROR', logEntry);
  }

  public async logWarn(messageKey: string, variables?: Record<string, any>) {
    const logEntry = this.formatLogEntry(LogType.WARN, messageKey, variables);
    await this.writeLog('WARNING', logEntry);
  }

  private formatLogEntry(
    type: LogType,
    messageKey: string,
    variables?: Record<string, any>
  ): string {
    let logEntry = `[${type}] ${this.interpolateLogText(messageKey)}`;

    if (variables) {
      const serializedVariables = JSON.stringify(variables, null, 2);
      logEntry += `\n${serializedVariables}`;
    }

    return logEntry;
  }

  private interpolateLogText(messageKey: string): string {
    return messageKey;
  }

  private async writeLog(severity: string, logMessage: string) {
    try {
      const log = this.logging.log(this.logName);
      const metadata = {
        resource: {
          type: 'cloud_run_revision',
          labels: {
            service_name: process.env.K_SERVICE || 'unknown_service',
            revision_name: process.env.K_REVISION || 'unknown_revision',
            location: process.env.K_REGION || 'unknown_region',
          },
        },
        severity: severity,
      };
      const entry = log.entry(metadata, logMessage);
      await log.write(entry);
    } catch (error) {
      console.error('error while writing log:', error);
    }
  }
}

export {Logger};
