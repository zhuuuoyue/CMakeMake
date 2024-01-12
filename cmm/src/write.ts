import { PathLike, writeFileSync } from 'fs';
import { dirname, join } from 'path';

import _ from 'lodash';

import { CxxStandard, ProjectConfig, ProjectType, SolutionConfig } from './concepts';
import { cmake_lists_filename } from './constants';
import { Context } from './context';

export function str(value: string): string {
    return `"${value}"`;
}

export class CMakeWriter {
    constructor() {}

    public write(
        context: Context,
        solution_config: SolutionConfig,
        project_configs: { [key: string]: ProjectConfig }
    ): boolean {
        let project_path = this.get_project_path();
        if (_.isUndefined(project_path)) {
            return false;
        }
        let cmake_path = this.cmake_file_path(project_path);
        if (_.isUndefined(cmake_path)) {
            return false;
        }

        let lines: string[] = [];
        lines.push(`cmake_minimum_required(VERSION ${context.cmake_minimum_required})`);
        this.update_cmake_lines(context, solution_config, project_configs, lines);

        this.write_cmake_file(lines, cmake_path);
        return true;
    }

    public get_project_path(): PathLike | undefined {
        return;
    }

    public update_cmake_lines(
        context: Context,
        solution_config: SolutionConfig,
        projects: { [key: string]: ProjectConfig },
        lines: string[]
    ) {
        return;
    }

    protected write_cmake_file(lines: string[], cmake_path: PathLike): boolean {
        let text = lines.join('\n');
        writeFileSync(cmake_path.toLocaleString(), text, { flag: 'w' });
        return true;
    }

    protected cmake_file_path(project_directory: PathLike): string | undefined {
        return join(project_directory.toLocaleString(), cmake_lists_filename);
    }
}

export class ProjectWriter extends CMakeWriter {
    private data: ProjectConfig;

    constructor(project_config: ProjectConfig) {
        super();
        this.data = project_config;
    }

    public get_project_path(): PathLike | undefined {
        return this.data.project_path;
    }

    public update_cmake_lines(
        context: Context,
        solution_config: SolutionConfig,
        project_configs: { [key: string]: ProjectConfig },
        lines: string[]
    ) {
        lines.push(`project(${str(this.data.name)} LANGUAGES CXX)`);
        if (this.data.include_current_dir) {
            lines.push(`set(CMAKE_INCLUDE_CURRENT_DIR ON)`);
        }
        let qt_config = this.data.qt_config;
        if (!_.isUndefined(qt_config)) {
            if (qt_config.auto_uic) {
                lines.push(`set(CMAKE_AUTOUIC ON)`);
            }
            if (qt_config.auto_moc) {
                lines.push(`set(CMAKE_AUTOMOC ON)`);
            }
            if (qt_config.auto_rcc) {
                lines.push(`set(CMAKE_AUTORCC ON)`);
            }
        }
        if (this.data.type === ProjectType.DESKTOP_APPLICATION) {
            lines.push(
                `set(CMAKE_EXE_LINKER_FLAGS "\${CMAKE_EXE_LINKER_FLAGS} /SUBSYSTEM:WINDOWS /ENTRY:mainCRTStartup")`
            );
        }
        lines.push(`set(CMAKE_CXX_STANDARD ${this.cxx_standard_to_string(this.data.cxx_standard)})`);
        if (this.data.cxx_standard_required) {
            lines.push(`set(CMAKE_CXX_STANDARD_REQUIRED ON)`);
        }

        for (let i = 0; i < this.data.internal_libraries.length; ++i) {
            let internal_library_name = this.data.internal_libraries[i];
            if (_.has(project_configs, internal_library_name)) {
                let internal_library = project_configs[internal_library_name];
                if (
                    internal_library.type == ProjectType.STATIC_LIBRARY ||
                    internal_library.type == ProjectType.DYNAMIC_LINK_LIBRARY
                ) {
                    let include_directory_str = this.path_to_string(internal_library.project_path);
                    lines.push(`include_directories(${include_directory_str})`);
                    lines.push(`link_libraries("${internal_library.target_filename}")`);
                }
            }
        }

        if (this.data.internal_libraries.length > 0) {
            let output_directory = join(
                solution_config.solution_path.toLocaleString(),
                solution_config.output_directory.toLocaleString()
            );
            let output_directory_str = this.path_to_string(output_directory);
            lines.push(`link_directories(${output_directory_str})`);
        }

        if (!_.isUndefined(qt_config)) {
            for (let i = 0; i < qt_config.packages.length; ++i) {
                let qt_package = qt_config.packages[i];
                lines.push(`find_package(QT NAMES Qt6 Qt5 COMPONENTS ${qt_package} REQUIRED)`);
                lines.push(`find_package(Qt\${QT_VERSION_MAJOR} COMPONENTS ${qt_package} REQUIRED)`);
            }
        }

        let project_sources_variable = 'PROJECT_SOURCES';
        this.set_project_sources(project_sources_variable, lines);
        if (this.data.type == ProjectType.CONSOLE_APPLICATION || this.data.type == ProjectType.DESKTOP_APPLICATION) {
            lines.push(this.add_executable(this.data.name, project_sources_variable));
        }
        if (this.data.type == ProjectType.STATIC_LIBRARY) {
            lines.push(this.add_static_library(this.data.name, project_sources_variable));
        }
        if (this.data.type == ProjectType.DYNAMIC_LINK_LIBRARY) {
            lines.push(this.add_shared_library(this.data.name, project_sources_variable));
        }
        for (let i = 0; i < this.data.files.length; ++i) {
            lines.push(this.source_group(this.data.files[i]));
        }
        for (let i = 0; i < this.data.definitions.length; ++i) {
            let definition = this.data.definitions[i];
            lines.push(`target_compile_definitions(${str(this.data.name)} PRIVATE ${definition})`);
        }
        if (!_.isUndefined(qt_config)) {
            for (let i = 0; i < qt_config.packages.length; ++i) {
                let qt_package = qt_config.packages[i];
                lines.push(`target_link_libraries(${str(this.data.name)} PRIVATE Qt\${QT_VERSION_MAJOR}::${qt_package})`);
            }
        }
    }

    private cxx_standard_to_string(cxx_standard: CxxStandard): string {
        if (CxxStandard.CXX_11 === cxx_standard) {
            return '11';
        } else if (CxxStandard.CXX_14 === cxx_standard) {
            return '14';
        } else if (CxxStandard.CXX_17 === cxx_standard) {
            return '17';
        } else if (CxxStandard.CXX_20 === cxx_standard) {
            return '20';
        }
        return '11';
    }

    private path_to_string(file_path: PathLike): string {
        let file_path_str = file_path.toLocaleString();
        let value = new RegExp('\\\\', 'g');
        return file_path_str.replace(value, '/');
    }

    private set_project_sources(variable_name: string, lines: string[]) {
        lines.push(`set(${variable_name}`);
        for (let i = 0; i < this.data.files.length; ++i) {
            lines.push(this.path_to_string(this.data.files[i]));
        }
        lines.push(`)`);
    }

    private add_static_library(project_name: string, variable_name: string): string {
        return `add_library(${str(project_name)} \${${variable_name}})`;
    }

    private add_shared_library(project_name: string, variable_name: string): string {
        return `add_library(${str(project_name)} SHARED \${${variable_name}})`;
    }

    private add_executable(project_name: string, variable_name: string): string {
        return `add_executable(${str(project_name)} \${${variable_name}})`;
    }

    private source_group(file_path: PathLike): string {
        let filter = dirname(file_path.toLocaleString());
        if (filter === '.') {
            filter = '';
        }
        return `source_group(${str(this.path_to_string(filter))} FILES ${this.path_to_string(file_path)})`;
    }
}

export class SolutionWriter extends CMakeWriter {
    private data: SolutionConfig;

    constructor(solution_config: SolutionConfig) {
        super();
        this.data = solution_config;
    }

    public get_project_path(): PathLike | undefined {
        return this.data.solution_path;
    }

    public update_cmake_lines(
        context: Context,
        solution_config: SolutionConfig,
        project_configs: { [key: string]: ProjectConfig },
        lines: string[]
    ) {
        lines.push(`project(${str(this.data.name)} VERSION ${this.data.version} LANGUAGES CXX)`);
        lines.push(`set(CMAKE_ARCHIVE_OUTPUT_DIRECTORY \${CMAKE_SOURCE_DIR}/${this.data.output_directory})`);
        lines.push(`set(CMAKE_LIBRARY_OUTPUT_DIRECTORY \${CMAKE_SOURCE_DIR}/${this.data.output_directory})`);
        lines.push(`set(CMAKE_RUNTIME_OUTPUT_DIRECTORY \${CMAKE_SOURCE_DIR}/${this.data.output_directory})`);
        for (let project_index = 0; project_index < this.data.subdirectories.length; ++project_index) {
            let project = this.data.subdirectories[project_index];
            lines.push(`add_subdirectory(${str(project)})`);
        }
        if (this.data.startup_project.length > 0) {
            lines.push(`set_property(DIRECTORY PROPERTY VS_STARTUP_PROJECT ${str(this.data.startup_project)})`);
        }
        let debug_directory = this.data.debugger_working_directory.toLocaleString();
        if (debug_directory.length > 0) {
            lines.push(
                `set_property(TARGET ${str(this.data.startup_project)} PROPERTY VS_DEBUGGER_WORKING_DIRECTORY \${CMAKE_SOURCE_DIR}/${debug_directory}/\${CMAKE_CFG_INTDIR})`
            );
        }
        for (let project_name in project_configs) {
            let project_config = project_configs[project_name];
            for (let i = 0; i < project_config.internal_libraries.length; ++i) {
                lines.push(`add_dependencies(${str(project_name)} ${str(project_config.internal_libraries[i])})`);
            }
        }
    }
}
