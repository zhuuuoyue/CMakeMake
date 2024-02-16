import { TestResult } from "./result";
import { Context } from "./context";
import { writeFileSync } from "fs";
import { join } from "path";

export interface TestResultWriter {
    write(ctx: Context, result: TestResult): void;
}

class HTMLWriter implements TestResultWriter {
    write(ctx: Context, result: TestResult): void {
        let lines: string[] = ['<h1>Difference List</h1>'];

        let error_index: number = 1;
        for (const testcase in result.items) {
            const diffs = result.items[testcase];
            lines.push(`<h2>${testcase} (${diffs.length})</h2>`);
            for (const diff of diffs) {
                lines.push(`<h3>Diff ${error_index}</h3>`);
                lines.push(`<li>Files: <a href='${diff.answer}' target='_blank'>CMakeLists.answer</a> and <a href='${diff.candidate}' target='_blank'>CMakeLists.txt</a></li>`);
                lines.push(`<li>Message: ${diff.message}</li>`);
                error_index += 1;
            }
        }

        const content = lines.join('\n');
        const filename = join(ctx.test_running_directory_path.toLocaleString(), `${ctx.test_running_result_filename}.html`);
        writeFileSync(filename, content, { flag: 'w' });
    }
}

export function create_test_result_writer() {
    return new HTMLWriter();
}
