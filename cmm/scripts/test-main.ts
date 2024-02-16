import { cwd } from "process";
import { join } from "path";

import { Context } from './test/context';
import { TestResult } from "./test/result";
import { create_test_environment_initializer } from './test/initializer';
import { create_test_case_searcher } from './test/searcher';
import { create_test_case_runner } from "./test/runner";
import { create_test_result_writer } from "./test/writer";

function main() {
    const repos_dir = join(cwd(), '..');
    const ctx = new Context(repos_dir);
    const init = create_test_environment_initializer();
    init.initialize(ctx);
    const searcher = create_test_case_searcher();
    const testcases = searcher.search(ctx);
    const runner = create_test_case_runner();
    let result = { items: {} };
    for (const testcase of testcases) {
        runner.run(ctx, testcase, result);
    }
    const writer = create_test_result_writer();
    writer.write(ctx, result);
}

main();
