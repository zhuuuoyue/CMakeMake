import { PathLike } from 'fs';
import { dirname, extname, isAbsolute, join, relative } from 'path';

import _ from 'lodash';

import { CxxStandard, ProjectConfig, ProjectType, SolutionConfig } from './concepts';
import { Context } from './context';
import { Document } from './document';
import * as cm from './cmake';

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

        let doc = new Document();
        doc.add(cm.cmake_minimum_required(context.cmake_minimum_required));
        this.update_cmake_lines(context, solution_config, project_configs, doc);
        doc.save(project_path);
        return true;
    }

    // pure virtual function
    public get_project_path(): PathLike | undefined {
        return;
    }

    // pure virtual function
    public update_cmake_lines(
        context: Context,
        solution_config: SolutionConfig,
        projects: { [key: string]: ProjectConfig },
        doc: Document
    ) {
        return;
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
        doc: Document
    ) {
        doc.add(cm.project(this.data.name));
        doc.add(cm.cmake_include_current_dir(this.data.include_current_dir));
        let qt_config = this.data.qt_config;
        if (!_.isUndefined(qt_config)) {
            doc.add(cm.cmake_autouic(qt_config.auto_uic));
            doc.add(cm.cmake_autouic(qt_config.auto_moc));
            doc.add(cm.cmake_autouic(qt_config.auto_rcc));
        }
        if (this.data.type === ProjectType.DESKTOP_APPLICATION) {
            doc.add(cm.cmake_exe_linker_flags());
        }
        doc.add(cm.cmake_cxx_standard(this.data.cxx_standard));
        doc.add(cm.cmake_cxx_standard_required(this.data.cxx_standard_required));

        // collect including paths
        let include_directories = new Set<PathLike>();
        let project_full_path_str = this.data.project_path.toLocaleString();
        for (let file of this.data.files) {
            let file_path = join(project_full_path_str, file.toLocaleString());
            include_directories.add(dirname(file_path));
        }

        for (let internal_library_name of this.data.internal_libraries) {
            if (_.has(project_configs, internal_library_name)) {
                let internal_library = project_configs[internal_library_name];
                if (
                    internal_library.type == ProjectType.STATIC_LIBRARY ||
                    internal_library.type == ProjectType.DYNAMIC_LINK_LIBRARY
                ) {
                    include_directories.add(internal_library.project_path);
                    for (let file_rel_path of internal_library.files) {
                        let file_full_path = join(project_full_path_str, file_rel_path.toLocaleString());
                        include_directories.add(dirname(file_full_path));
                    }
                    let ext = extname(internal_library.target_filename);
                    let end = internal_library.target_filename.length - ext.length;
                    let lib_name = `${internal_library.target_filename.substring(0, end)}.lib`;
                    doc.add(cm.link_libraries(lib_name));
                }
            }
        }

        for (let include_directory of this.data.include_directories) {
            if (isAbsolute(include_directory)) {
                include_directories.add(include_directory);
            } else {
                let include_directory_path = join(this.data.project_path.toLocaleString(), include_directory);
                include_directories.add(include_directory_path);
            }
        }

        for (let include_directory of include_directories) {
            let include_directory_rel_path = relative(this.data.project_path.toLocaleString(), include_directory.toLocaleString());
            if (include_directory_rel_path.length != 0) {
                doc.add(cm.include_directories(include_directory_rel_path));
            }
        }

        for (let link_dir of this.data.link_directories) {
            let link_dir_path = join(this.data.project_path.toLocaleString(), link_dir);
            let link_dir_rel_path = relative(this.data.project_path.toLocaleString(), link_dir_path);
            if (link_dir_rel_path.length != 0) {
                doc.add(cm.link_directories(link_dir_rel_path));
            }
        }

        for (let link_lib of this.data.link_libraries) {
            doc.add(cm.link_libraries(link_lib));
        }

        if (this.data.internal_libraries.length > 0) {
            let output_directory = join(
                solution_config.solution_path.toLocaleString(),
                solution_config.output_directory.toLocaleString()
            );
            let output_directory_rel_path = relative(this.data.project_path.toLocaleString(), output_directory);
            if (output_directory_rel_path.length != 0) {
                doc.add(cm.link_directories(output_directory_rel_path));
            }
        }

        if (!_.isUndefined(qt_config)) {
            for (let qt_package of qt_config.packages) {
                doc.add(cm.find_package_qt(qt_package));
            }
        }

        let project_sources_variable = 'PROJECT_SOURCES';
        doc.add(cm.set_variable_multi_paths(project_sources_variable, this.data.files));
        if (this.data.type == ProjectType.CONSOLE_APPLICATION || this.data.type == ProjectType.DESKTOP_APPLICATION) {
            doc.add(cm.add_executable(this.data.name, project_sources_variable));
        }
        if (this.data.type == ProjectType.STATIC_LIBRARY) {
            doc.add(cm.add_library(this.data.name, project_sources_variable));
        }
        if (this.data.type == ProjectType.DYNAMIC_LINK_LIBRARY) {
            doc.add(cm.add_library(this.data.name, project_sources_variable, true));
        }
        for (let file_rel_path of this.data.files) {
            doc.add(this.source_group(file_rel_path));
        }
        for (let definition of this.data.definitions) {
            doc.add(cm.target_compile_definitions(this.data.name, definition));
        }
        if (!_.isUndefined(qt_config)) {
            for (let qt_package of qt_config.packages) {
                doc.add(cm.target_link_libraries_qt(this.data.name, qt_package));
            }
        }
    }

    private source_group(file_path: PathLike): string {
        let filter = dirname(file_path.toLocaleString());
        if (filter === '.') {
            filter = '';
        }
        return cm.source_group(filter, file_path);
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
        lines: Document
    ) {
        lines.add(cm.project(this.data.name, this.data.version));
        lines.add(cm.cmake_output_directory(this.data.output_directory));
        for (let subdirectory of this.data.subdirectories) {
            lines.add(cm.add_subdirectory(subdirectory));
        }
        if (this.data.startup_project.length > 0) {
            lines.add(cm.startup_project(this.data.startup_project));
        }
        let debug_directory = this.data.debugger_working_directory.toLocaleString();
        if (debug_directory.length > 0) {
            lines.add(cm.debugger_working_directory(this.data.startup_project, this.data.debugger_working_directory));
        }
        for (let project_name in project_configs) {
            let project_config = project_configs[project_name];
            for (let internal_library of project_config.internal_libraries) {
                lines.add(cm.add_dependencies(project_name, internal_library));
            }
        }
    }
}
