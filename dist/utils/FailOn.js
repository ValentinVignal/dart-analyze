export class FailOn {
    /**
     * Create a {@link FailOnEnum} from a string input.
     *
     * Defaults is {@link FailOnEnum.Warning}.
     */
    static fromInput(input) {
        switch (input) {
            case 'nothing':
                return FailOnEnum.Nothing;
            case 'format':
                return FailOnEnum.Format;
            case 'info':
                return FailOnEnum.Info;
            case 'warning':
                return FailOnEnum.Warning;
            default:
                return FailOnEnum.Warning;
        }
    }
}
/**
 * Enum representing the different fail conditions for the action.
 */
export var FailOnEnum;
(function (FailOnEnum) {
    /**
     * Fail on error logs.
     */
    FailOnEnum[FailOnEnum["Error"] = 0] = "Error";
    /**
     * Fail on warning logs.
     *
     * This is the default behavior.
     */
    FailOnEnum[FailOnEnum["Warning"] = 1] = "Warning";
    /**
     * Fail on info logs.
     *
     * This is useful for strict linting policies.
     */
    FailOnEnum[FailOnEnum["Info"] = 2] = "Info";
    /**
     * Fail on format issues.
     */
    FailOnEnum[FailOnEnum["Format"] = 3] = "Format";
    /**
     * Do not fail the action regardless of the logs.
     */
    FailOnEnum[FailOnEnum["Nothing"] = 4] = "Nothing";
})(FailOnEnum || (FailOnEnum = {}));
//# sourceMappingURL=FailOn.js.map