import { PathLike, readdirSync, statSync } from 'fs';
import { join } from 'path';

import { cmake_config_filename } from './constants';

function cmake_config_path(dir: PathLike): PathLike {
    return join(dir.toLocaleString(), cmake_config_filename);
}

function search_projects(solution_dir: string) {
    let solution_cmake_config_path = cmake_config_path(solution_dir);
    let projects: PathLike[] = [];
    let directories: PathLike[] = [solution_dir];
    while (directories.length != 0) {
        let current_directory = directories.pop();
        if (current_directory === undefined) {
            continue;
        }
        let children = readdirSync(current_directory);
        for (let index = 0; index < children.length; ++index) {
            let child = children[index];
            if (child == '.' || child == '..') {
                continue;
            }
            let child_path = join(current_directory.toLocaleString(), child);
            if (solution_cmake_config_path === child_path) {
                continue; // ignore solution
            }
            let child_state = statSync(child_path);
            if (child_state.isFile() && child === cmake_config_filename) {
                projects.push(child_path);
                break;
            }
            if (child_state.isDirectory()) {
                directories.push(child_path);
            }
        }
    }
    return projects;
}

export interface SolutionFileSytem {
    solution_cmake_path: PathLike,
    project_cmake_paths: PathLike[]
}

export function search_solution_and_projects(source_dir: string): SolutionFileSytem | undefined {
    let source_dir_state = statSync(source_dir);
    if (!source_dir_state.isDirectory()) {
        return;
    }
    let children = readdirSync(source_dir);
    if (children.indexOf(cmake_config_filename) == -1) {
        return;
    }
    let solution_cmake = cmake_config_path(source_dir);
    let project_cmake_paths = search_projects(source_dir);
    return {
        solution_cmake_path: solution_cmake,
        project_cmake_paths: project_cmake_paths
    }
}
