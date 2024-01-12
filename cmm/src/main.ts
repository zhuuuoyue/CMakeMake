import { cwd } from 'process';
import { isAbsolute, join } from 'path';
import { readFileSync, readdirSync, statSync } from 'fs';

import _ from 'lodash';
import { OptionDefinition, ParseOptions } from 'command-line-args';
import commandLineArgs from 'command-line-args';

import { search_solution_and_projects } from './search';
import { parse_solution_and_projects } from './parse';
import { ProjectWriter, SolutionWriter } from './write';
import { Context } from './context';

function main(context: Context) {
    if (_.isUndefined(context.solution_directory)) {
        return;
    }
    let solution = search_solution_and_projects(context.solution_directory);
    if (_.isUndefined(solution)) {
        return;
    }
    let configs = parse_solution_and_projects(solution.solution_cmake_path, solution.project_cmake_paths);
    if (_.isUndefined(configs)) {
        return;
    }
    for (let project_name in configs.project_configs) {
        let project_config = configs.project_configs[project_name];
        let writer = new ProjectWriter(project_config);
        writer.write(context, configs.solution_config, configs.project_configs);
    }
    let writer = new SolutionWriter(configs.solution_config);
    writer.write(context, configs.solution_config, configs.project_configs);
}

const SOLUTION_DIR = 'solution_dir';
const CMAKE_MINIMUM_REQUIRED = 'cmake_minimum_required';

let context = new Context();
let current_working_directory = cwd();
let children = readdirSync(current_working_directory);
let debug_config_filename = 'debug.json';
if (children.indexOf(debug_config_filename) != -1) {
    let debug_config_file_state = statSync(join(current_working_directory, debug_config_filename));
    if (debug_config_file_state.isFile()) {
        let data = readFileSync(debug_config_filename).toLocaleString();
        let obj = JSON.parse(data);
        if (_.has(obj, CMAKE_MINIMUM_REQUIRED) && _.isString(obj[CMAKE_MINIMUM_REQUIRED])) {
            context.cmake_minimum_required = obj[CMAKE_MINIMUM_REQUIRED];
        }
        if (_.has(obj, SOLUTION_DIR) && _.isString(obj[SOLUTION_DIR])) {
            context.solution_directory = obj[SOLUTION_DIR];
        }
    }
} else {
    const argument_definitions: OptionDefinition[] = [
        { name: SOLUTION_DIR, type: String },
        { name: CMAKE_MINIMUM_REQUIRED, type: String, defaultValue: '3.5' },
    ];
    const argument_options: ParseOptions = {
        argv: process.argv,
    };
    const args = commandLineArgs(argument_definitions, argument_options);
    if (_.has(args, SOLUTION_DIR) && _.isString(args[SOLUTION_DIR])) {
        let solution_dir = args[SOLUTION_DIR];
        if (!isAbsolute(solution_dir)) {
            let workspace = cwd();
            solution_dir = join(workspace, solution_dir);
        }
        context.solution_directory = solution_dir;
    } else {
        console.log('Argument Error: parameter solution_dir was not set.');
    }
    if (_.has(args, CMAKE_MINIMUM_REQUIRED)) {
        context.cmake_minimum_required = args[CMAKE_MINIMUM_REQUIRED];
    }
}

main(context);
