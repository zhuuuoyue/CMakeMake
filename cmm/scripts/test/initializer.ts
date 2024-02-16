import { readdirSync, mkdirSync, statSync } from "fs";
import { basename } from "path";

import { Context } from "./context";

export interface TestEnvironmentInitializer {
    initialize(ctx: Context): void;
}

class _TestEnvironmentInitializer implements TestEnvironmentInitializer {
    initialize(ctx: Context): void {
        const items = readdirSync(ctx.repository_path);
        let will_make_test_output_dir = false;
        if (-1 == items.indexOf(basename(ctx.test_output_directory_path.toLocaleString()))) {
            will_make_test_output_dir = true;
        } else {
            const stat = statSync(ctx.test_output_directory_path);
            if (!stat.isDirectory()) {
                will_make_test_output_dir = true;
            }
        }
        if (will_make_test_output_dir) {
            mkdirSync(ctx.test_output_directory_path);
        }
        mkdirSync(ctx.test_running_directory_path);
    }
}

export function create_test_environment_initializer(): TestEnvironmentInitializer {
    return new _TestEnvironmentInitializer();
}
