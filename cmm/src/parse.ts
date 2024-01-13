import { PathLike, readFileSync, readdirSync, statSync } from 'fs';
import { basename, dirname, extname, join, relative } from 'path';

import _ from 'lodash';

import {
    ProjectConfig,
    SolutionConfig,
    CxxStandard,
    ProjectType,
    console_application,
    desktop_application,
    static_library,
    dynamic_link_library,
    cxx_11,
    cxx_14,
    cxx_17,
    cxx_20,
    QtProjectConfig,
} from './concepts';

function is_array_of_string(data: any): boolean {
    if (!_.isArray(data)) {
        return false;
    }
    for (let item of data) {
        if (!_.isString(item)) {
            return false;
        }
    }
    return true;
}

class ProjectParser {
    public name_key: string = 'name';
    public type_key: string = 'type';
    public target_filename_key: string = 'target_filename';
    public definitions_key: string = 'definitions';
    public include_current_directory_key: string = 'include_current_directory';
    public cxx_standard_key: string = 'cxx_standard';
    public include_directories_key: string = 'include_directory';
    public link_directories_key: string = 'link_directories';
    public link_libraries_key: string = 'link_directories';

    public internal_includes_key: string = 'internal_includes';
    public internal_libraries_key: string = 'internal_libraries';

    public qt_key: string = 'qt';
    public qt_auto_uic_key: string = 'auto_uic';
    public qt_auto_moc_key: string = 'auto_moc';
    public qt_auto_rcc_key: string = 'auto_rcc';
    public qt_packages_key: string = 'packages';
    public qt_console_key: string = 'console';

    public extensions_of_cxx: Set<string>;
    public extensions_of_qt: Set<string>;

    private cmake_path: PathLike;
    private project_path: PathLike;
    private project_name: string;

    constructor(cmake_path: PathLike) {
        this.extensions_of_cxx = new Set<string>();
        this.extensions_of_cxx.add('.h');
        this.extensions_of_cxx.add('.c');
        this.extensions_of_cxx.add('.i');
        this.extensions_of_cxx.add('.hpp');
        this.extensions_of_cxx.add('.cpp');
        this.extensions_of_cxx.add('.cc');
        this.extensions_of_cxx.add('.cxx');
        this.extensions_of_cxx.add('.c++');
        this.extensions_of_cxx.add('.hh');
        this.extensions_of_cxx.add('.hxx');
        this.extensions_of_cxx.add('.h++');
        this.extensions_of_cxx.add('.ii');

        this.extensions_of_qt = new Set<string>();
        this.extensions_of_qt.add('.ui');
        this.extensions_of_qt.add('.qrc');

        this.cmake_path = cmake_path;
        this.project_path = dirname(this.cmake_path.toLocaleString());
        this.project_name = basename(this.project_path);
    }

    parse(): ProjectConfig | undefined {
        let content = readFileSync(this.cmake_path).toLocaleString();
        let data = JSON.parse(content);

        let project_config: ProjectConfig = new ProjectConfig();
        project_config.project_path = this.project_path;
        if (!this.search_files(data, project_config)) {
            return;
        }
        if (!this.parse_name(data, project_config)) {
            return;
        }
        if (!this.parse_type(data, project_config)) {
            return;
        }
        if (!this.parse_target_filename(data, project_config)) {
            return;
        }
        if (!this.parse_definitions(data, project_config)) {
            return;
        }
        if (!this.parse_include_current_directory(data, project_config)) {
            return;
        }
        if (!this.parse_cxx_standard(data, project_config)) {
            return;
        }
        if (!this.parse_include_directories(data, project_config)) {
            return;
        }
        if (!this.parse_link_directories(data, project_config)) {
            return;
        }
        if (!this.parse_link_libraries(data, project_config)) {
            return;
        }
        if (!this.parse_internal_includes(data, project_config)) {
            return;
        }
        if (!this.parse_internal_libraries(data, project_config)) {
            return;
        }
        if (!this.parse_qt_config(data, project_config)) {
            return;
        }
        return project_config;
    }

    private search_files(data: any, project_config: ProjectConfig): boolean {
        let directories: PathLike[] = [this.project_path];
        while (directories.length > 0) {
            let current_directory = directories.pop();
            if (_.isUndefined(current_directory)) {
                continue;
            }
            let children = readdirSync(current_directory.toLocaleString());
            for (let child of children) {
                if (child === '.' || child === '..') {
                    continue;
                }
                let child_path = join(current_directory.toLocaleString(), child);
                let child_state = statSync(child_path);
                if (child_state.isFile()) {
                    let ext = extname(child_path).toLowerCase();
                    if (this.extensions_of_cxx.has(ext)) {
                        let relative_path = relative(this.project_path.toLocaleString(), child_path);
                        project_config.files.push(relative_path);
                    }
                } else if (child_state.isDirectory()) {
                    directories.push(child_path);
                }
            }
        }
        return true;
    }

    private parse_name(data: any, project_config: ProjectConfig): boolean {
        if (_.has(data, this.name_key) && _.isString(data[this.name_key])) {
            project_config.name = data[this.name_key];
        }
        if (project_config.name.length == 0) {
            project_config.name = this.project_name;
        }
        return project_config.name.length !== 0;
    }

    private parse_type(data: any, project_config: ProjectConfig): boolean {
        if (_.has(data, this.type_key)) {
            let project_type = data[this.type_key];
            if (_.isString(project_type)) {
                if (project_type == console_application) {
                    project_config.type = ProjectType.CONSOLE_APPLICATION;
                } else if (project_type == desktop_application) {
                    project_config.type = ProjectType.DESKTOP_APPLICATION;
                } else if (project_type == static_library) {
                    project_config.type = ProjectType.STATIC_LIBRARY;
                } else if (project_type == dynamic_link_library) {
                    project_config.type = ProjectType.DYNAMIC_LINK_LIBRARY;
                }
            }
        }
        return true;
    }

    private parse_target_filename(data: any, project_config: ProjectConfig): boolean {
        if (_.has(data, this.target_filename_key)) {
            project_config['target_filename'] = data[this.target_filename_key];
        } else {
            let t = project_config.type;
            if (t == ProjectType.CONSOLE_APPLICATION || t == ProjectType.DESKTOP_APPLICATION) {
                project_config.target_filename = `${project_config.name}.exe`;
            } else if (t == ProjectType.STATIC_LIBRARY) {
                project_config.target_filename = `${project_config.name}.lib`;
            } else if (t == ProjectType.DYNAMIC_LINK_LIBRARY) {
                project_config.target_filename = `${project_config.name}.dll`;
            }
        }
        return true;
    }

    private parse_definitions(data: any, project_config: ProjectConfig): boolean {
        if (_.has(data, this.definitions_key)) {
            if (is_array_of_string(data[this.definitions_key])) {
                project_config.definitions = data[this.definitions_key];
            }
        }
        return true;
    }

    private parse_include_current_directory(data: any, project_config: ProjectConfig): boolean {
        if (_.has(data, this.include_current_directory_key)) {
            let value = data[this.include_current_directory_key];
            if (_.isBoolean(value)) {
                project_config.include_current_dir = value;
            }
        }
        return true;
    }

    private parse_cxx_standard(data: any, project_config: ProjectConfig): boolean {
        if (_.has(data, this.cxx_standard_key)) {
            let value = data[this.cxx_standard_key];
            if (_.isInteger(value)) {
                if (value == cxx_11) {
                    project_config.cxx_standard = CxxStandard.CXX_11;
                } else if (value == cxx_14) {
                    project_config.cxx_standard = CxxStandard.CXX_14;
                } else if (value == cxx_17) {
                    project_config.cxx_standard = CxxStandard.CXX_17;
                } else if (value == cxx_20) {
                    project_config.cxx_standard = CxxStandard.CXX_20;
                }
            }
        }
        return true;
    }

    private parse_include_directories(data: any, project_config: ProjectConfig): boolean {
        if (_.has(data, this.include_directories_key)) {
            if (is_array_of_string(data[this.include_directories_key])) {
                project_config.include_directories = data[this.include_directories_key];
            }
        }
        return true;
    }

    private parse_link_directories(data: any, project_config: ProjectConfig): boolean {
        if (_.has(data, this.link_directories_key)) {
            if (is_array_of_string(data[this.link_directories_key])) {
                project_config.link_directories = data[this.link_directories_key];
            }
        }
        return true;
    }

    private parse_link_libraries(data: any, project_config: ProjectConfig): boolean {
        if (_.has(data, this.link_libraries_key)) {
            if (is_array_of_string(data[this.link_libraries_key])) {
                project_config.link_libraries = data[this.link_libraries_key];
            }
        }
        return true;
    }

    private parse_internal_includes(data: any, project_config: ProjectConfig): boolean {
        if (_.has(data, this.internal_includes_key)) {
            let value = data[this.internal_includes_key];
            if (is_array_of_string(value)) {
                project_config.internal_includes = value;
            }
        }
        return true;
    }

    private parse_internal_libraries(data: any, project_config: ProjectConfig): boolean {
        if (_.has(data, this.internal_libraries_key)) {
            let value = data[this.internal_libraries_key];
            if (is_array_of_string(value)) {
                project_config.internal_libraries = value;
            }
        }
        return true;
    }

    private parse_qt_config(data: any, project_config: ProjectConfig): boolean {
        if (_.has(data, this.qt_key)) {
            let qt_object: { [key: string]: any } = data[this.qt_key];
            if (_.isObject(qt_object)) {
                let qt_config = new QtProjectConfig();
                if (_.has(qt_object, this.qt_auto_uic_key)) {
                    let value = qt_object[this.qt_auto_uic_key];
                    if (_.isBoolean(value)) {
                        qt_config.auto_uic = value;
                    }
                }
                if (_.has(qt_object, this.qt_auto_moc_key)) {
                    let value = qt_object[this.qt_auto_moc_key];
                    if (_.isBoolean(value)) {
                        qt_config.auto_moc = value;
                    }
                }
                if (_.has(qt_object, this.qt_auto_rcc_key)) {
                    let value = qt_object[this.qt_auto_rcc_key];
                    if (_.isBoolean(value)) {
                        qt_config.auto_rcc = value;
                    }
                }
                if (_.has(qt_object, this.qt_packages_key)) {
                    let value = qt_object[this.qt_packages_key];
                    if (is_array_of_string(value)) {
                        qt_config.packages = value;
                    }
                }
                if (_.has(qt_object, this.qt_console_key)) {
                    let value = qt_object[this.qt_console_key];
                    if (_.isBoolean(value)) {
                        qt_config.console = value;
                    }
                }
                project_config.qt_config = qt_config;
            }
        }
        return true;
    }
}

class SolutionParser {
    public name_key: string = 'name';
    public output_directory_key: string = 'output_directory';
    public startup_project_key: string = 'startup_project';
    public debugger_working_directory_key: string = 'debugger_working_directory';

    private cmake_path: PathLike;
    private solution_path: PathLike;

    constructor(cmake_path: PathLike) {
        this.cmake_path = cmake_path;
        this.solution_path = dirname(this.cmake_path.toLocaleString());
    }

    public parse(): SolutionConfig | undefined {
        let content = readFileSync(this.cmake_path).toLocaleString();
        let data = JSON.parse(content);
        let solution_config: SolutionConfig = new SolutionConfig();
        solution_config.solution_path = this.solution_path;
        if (!this.parse_name(data, solution_config)) {
            return;
        }
        if (!this.parse_output_directory(data, solution_config)) {
            return;
        }
        if (!this.parse_startup_project(data, solution_config)) {
            return;
        }
        if (!this.parse_debugger_working_directory(data, solution_config)) {
            return;
        }
        return solution_config;
    }

    private parse_name(data: any, solution_config: SolutionConfig): boolean {
        if (_.has(data, this.name_key)) {
            let value = data[this.name_key];
            if (_.isString(value)) {
                solution_config.name = value;
            }
        }
        return solution_config.name.length > 0;
    }

    private parse_output_directory(data: any, solution_config: SolutionConfig): boolean {
        if (_.has(data, this.output_directory_key)) {
            let value = data[this.output_directory_key];
            if (_.isString(value) && value.length > 0) {
                solution_config.output_directory = value;
            }
        }
        return true;
    }

    private parse_startup_project(data: any, solution_config: SolutionConfig): boolean {
        if (_.has(data, this.startup_project_key)) {
            let value = data[this.startup_project_key];
            if (_.isString(value) && value.length > 0) {
                solution_config.startup_project = value;
            }
        }
        return true;
    }

    private parse_debugger_working_directory(data: any, solution_config: SolutionConfig): boolean {
        if (_.has(data, this.debugger_working_directory_key)) {
            let value = data[this.debugger_working_directory_key];
            if (_.isString(value)) {
                solution_config.debugger_working_directory = value;
            }
        }
        return true;
    }
}

export interface SolutionAndProjectConfigs {
    solution_config: SolutionConfig;
    project_configs: {
        [key: string]: ProjectConfig;
    };
}

export function parse_solution_and_projects(
    solution_cmake_path: PathLike,
    project_cmake_paths: PathLike[]
): SolutionAndProjectConfigs | undefined {
    let solution_parser = new SolutionParser(solution_cmake_path);
    let solution = solution_parser.parse();
    if (_.isUndefined(solution)) {
        return;
    }

    let projects: { [key: string]: ProjectConfig } = {};
    for (let project_cmake_path of project_cmake_paths) {
        let project_parser = new ProjectParser(project_cmake_path);
        let project_config = project_parser.parse();
        if (!_.isUndefined(project_config)) {
            solution.subdirectories.push(project_config.name);
            projects[project_config.name] = project_config;
        }
    }
    return {
        solution_config: solution,
        project_configs: projects,
    };
}
