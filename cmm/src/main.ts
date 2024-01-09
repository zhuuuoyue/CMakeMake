import { cwd } from 'process';
import { isAbsolute, join } from 'path';

import _ from 'lodash';
import { OptionDefinition, ParseOptions } from 'command-line-args';
import commandLineArgs from 'command-line-args';

import { search_solution_and_projects } from './search';
import { parse_solution_and_projects } from './parse';
import { ProjectWriter, SolutionWriter } from './write';
import { Context } from './context';

function main() {
    const SOLUTION_DIR = 'solution_dir';
    const CMAKE_MINIMUM_REQUIRED = 'cmake_minimum_required';
    const argument_definitions: OptionDefinition[] = [
        { name: SOLUTION_DIR, type: String },
        { name: CMAKE_MINIMUM_REQUIRED, type: String, defaultValue: '3.5' },
    ];
    const argument_options: ParseOptions = {
        argv: process.argv,
    };
    const args = commandLineArgs(argument_definitions, argument_options);
    if (!_.has(args, SOLUTION_DIR)) {
        console.log('Argument Error: parameter solution_dir was not set.');
        return;
    }
    let context = new Context();
    if (_.has(args, CMAKE_MINIMUM_REQUIRED)) {
        context.cmake_minimum_required = args[CMAKE_MINIMUM_REQUIRED];
    }

    let solution_dir = args[SOLUTION_DIR];
    if (!isAbsolute(solution_dir)) {
        let workspace = cwd();
        solution_dir = join(workspace, solution_dir);
    }
    let solution = search_solution_and_projects(solution_dir);
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

main();
