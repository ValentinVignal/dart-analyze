import type { ActionOptionsSafe } from '../utils/ActionOptions.js';
export interface FormatResultInterface {
    files: Set<string>;
}
export declare class FormatResult {
    private readonly actionOptions;
    private readonly files;
    constructor(actionOptions: ActionOptionsSafe, params?: FormatResultInterface);
    get success(): boolean;
    get count(): number;
    get commentBody(): string;
}
//# sourceMappingURL=FormatResult.d.ts.map