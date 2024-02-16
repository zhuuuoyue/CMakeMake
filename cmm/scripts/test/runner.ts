import { join, basename, dirname } from "path";
import { PathLike, cpSync, statSync, readdirSync, readFileSync } from "fs";
import { execSync } from "child_process";

import _ from "lodash";

import { Context } from "./context";
import { TestResult } from "./result";

export interface TestCaseRunner {
    run(ctx: Context, testcase: string, result: TestResult): void;
}

interface ComparisonPair {
    answer: PathLike;
    candidate: PathLike;
}

class _TestCaseRunner implements TestCaseRunner {
    run(ctx: Context, testcase: string, result: TestResult): void {
        result.items[testcase] = [];

        const test_case_source_dir = join(ctx.test_case_directory_path.toLocaleString(), testcase);
        const test_case_destination_dir = join(ctx.test_running_directory_path.toLocaleString(), testcase);
        cpSync(test_case_source_dir, test_case_destination_dir, { recursive: true });

        const src_dir = join(test_case_destination_dir, 'src');
        const command = `node dist/main.js --solution_dir ${src_dir.replace(new RegExp('\\\\', 'g'), '/')}`;
        const console_out = execSync(command).toString();
        if (console_out.length != 0) {
            return;
        }

        const pairs = this.find_comparison_candidate_and_answer(test_case_destination_dir);
        if (pairs.length == 0) {
            return;
        }
        let errors: string[] = [];
        for (let pair of pairs) {
            const error = this.compare_cmake_files(pair.answer, pair.candidate);
            if (error.length != 0) {
                result.items[testcase].push({
                    answer: pair.answer,
                    candidate: pair.candidate,
                    message: error
                });
            }
        }
    }

    private find_comparison_candidate_and_answer(test_case_output_dir: PathLike): ComparisonPair[] {
        let directories: PathLike[] = [join(test_case_output_dir.toLocaleString(), 'src')];
        let pairs: ComparisonPair[] = [];
        while (directories.length != 0) {
            const directory = directories.shift();
            if (_.isUndefined(directory)) {
                continue;
            }
            const stat = statSync(directory.toLocaleString());
            if (stat.isDirectory()) {
                const children = readdirSync(directory);
                for (const child of children) {
                    directories.push(join(directory.toLocaleString(), child));
                }
                if (-1 == children.indexOf('CMakeLists.txt') && -1 == children.indexOf('CMakeLists.answer')) {
                    continue;
                }
                pairs.push({
                    answer: join(directory.toLocaleString(), 'CMakeLists.answer'),
                    candidate: join(directory.toLocaleString(), 'CMakeLists.txt')
                });
            }
        }
        return pairs;
    }

    private is_valid_file(file_path: PathLike): boolean {
        const brothers = readdirSync(dirname(file_path.toLocaleString()));
        const filename = basename(file_path.toLocaleString());
        if (-1 == brothers.indexOf(filename)) {
            return false;
        }
        const stat = statSync(file_path);
        return stat.isFile();
    }

    private compare_cmake_files(answer_filename: PathLike, candidate_filename: PathLike): string {
        if (!this.is_valid_file(answer_filename)) {
            return `文件 CMakeLists.answer 不存在`;
        }
        if (!this.is_valid_file(candidate_filename)) {
            return `文件 CMakeLists.txt 不存在`;
        }
        const answer_content = readFileSync(answer_filename).toLocaleString();
        const candidate_content = readFileSync(candidate_filename).toLocaleString();
        if (answer_content != candidate_content) {
            return `内容不一致`;
        }
        return '';
    }
}

export function create_test_case_runner(): TestCaseRunner {
    return new _TestCaseRunner();
}
