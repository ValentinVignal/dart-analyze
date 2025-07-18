import { FailOnEnum } from '../utils/FailOn.js';
export var DartAnalyzeLogTypeEnum;
(function (DartAnalyzeLogTypeEnum) {
    DartAnalyzeLogTypeEnum[DartAnalyzeLogTypeEnum["Info"] = 1] = "Info";
    DartAnalyzeLogTypeEnum[DartAnalyzeLogTypeEnum["Warning"] = 2] = "Warning";
    DartAnalyzeLogTypeEnum[DartAnalyzeLogTypeEnum["Error"] = 3] = "Error";
})(DartAnalyzeLogTypeEnum || (DartAnalyzeLogTypeEnum = {}));
/**
 * Represents the type of a Dart analyze log.
 */
export class DartAnalyzeLogType {
    static typeFromKey(key) {
        switch (key) {
            case 'ERROR':
                return DartAnalyzeLogTypeEnum.Error;
            case 'WARNING':
                return DartAnalyzeLogTypeEnum.Warning;
            default:
                return DartAnalyzeLogTypeEnum.Info;
        }
    }
    /**
     *
     * @param logType
     * @returns The Github key for the log type.
     */
    static keyFromType(logType) {
        switch (logType) {
            case DartAnalyzeLogTypeEnum.Error:
                return 'ERROR';
            default:
                return 'WARNING';
        }
    }
    /**
     * Checks if the log type should cause the action to fail.
     */
    static isFail(actionOptions, logType) {
        switch (actionOptions.failOn) {
            case FailOnEnum.Nothing:
                return false;
            case FailOnEnum.Format:
                return false;
            case FailOnEnum.Info:
                return true;
            case FailOnEnum.Warning:
                return (logType === DartAnalyzeLogTypeEnum.Error ||
                    logType === DartAnalyzeLogTypeEnum.Warning);
            case FailOnEnum.Error:
            default:
                return logType === DartAnalyzeLogTypeEnum.Error;
        }
    }
    /**
     * Converts the log type to a string.
     */
    static typeToString(logType) {
        switch (logType) {
            case DartAnalyzeLogTypeEnum.Info:
                return 'Info';
            case DartAnalyzeLogTypeEnum.Warning:
                return 'Warning';
            case DartAnalyzeLogTypeEnum.Error:
                return 'Error';
        }
    }
}
//# sourceMappingURL=DartAnalyzeLogType.js.map