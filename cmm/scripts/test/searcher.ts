import { readdirSync, statSync } from "fs";
import { join } from "path";

import { Context } from "./context";

export interface TestCaseSearcher {
    search(ctx: Context): string[];
}

class _TestCaseSearcher implements TestCaseSearcher {
    search(ctx: Context): string[] {
        const children = readdirSync(ctx.test_case_directory_path);
        let test_cases: string[] = [];
        for (let child of children) {
            const full_path = join(ctx.test_case_directory_path.toLocaleString(), child);
            const stat = statSync(full_path);
            if (stat.isDirectory()) {
                test_cases.push(child);
            }
        }
        return test_cases;
    }
}

export function create_test_case_searcher(): TestCaseSearcher {
    return new _TestCaseSearcher();
}
