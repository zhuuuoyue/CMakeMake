import { PathLike } from 'fs';

import _ from 'lodash';

import { CxxStandard } from './concepts';

function str(value: string): string {
    return `"${value}"`;
}

function path_to_string(file_path: PathLike): string {
    let file_path_str = file_path.toLocaleString();
    let old_value = new RegExp('\\\\', 'g');
    return file_path_str.replace(old_value, '/');
}

export function cmake_minimum_required(version: string): string {
    return `cmake_minimum_required(VERSION ${version})`;
}

export function project(name: string, version?: string): string {
    if (_.isUndefined(version)) {
        return `project(${str(name)} LANGUAGES CXX)`;
    } else {
        return `project(${str(name)} VERSION ${version} LANGUAGES CXX)`;
    }
}

export function link_libraries(lib: string): string | undefined {
    if (lib.length > 0) {
        return `link_libraries(${str(lib)})`;
    }
}

export function include_directories(dir: PathLike): string {
    return `include_directories(${path_to_string(dir)})`;
}

export function link_directories(dir: PathLike): string {
    return `link_directories(${path_to_string(dir)})`;
}

export function target_compile_definitions(name: string, definition: string) {
    return `target_compile_definitions(${str(name)} PRIVATE ${definition})`;
}

export function add_library(project_name: string, file_list_var: string, shared?: boolean): string {
    if (!_.isUndefined(shared) && shared) {
        return `add_library(${str(project_name)} SHARED \${${file_list_var}})`;
    } else {
        return `add_library(${str(project_name)} \${${file_list_var}})`;
    }
}

export function add_executable(project_name: string, file_list_var: string): string {
    return `add_executable(${str(project_name)} \${${file_list_var}})`;
}

export function source_group(filter: string, file_path: PathLike): string {
    return `source_group(${str(path_to_string(filter))} FILES ${path_to_string(file_path)})`;
}

export function find_package_qt(pkg: string): string[] {
    return [
        `find_package(QT NAMES Qt6 Qt5 COMPONENTS ${pkg} REQUIRED)`,
        `find_package(Qt\${QT_VERSION_MAJOR} COMPONENTS ${pkg} REQUIRED)`,
    ];
}

export function target_link_libraries_qt(name: string, pkg: string): string {
    return `target_link_libraries(${str(name)} PRIVATE Qt\${QT_VERSION_MAJOR}::${pkg})`;
}

export function add_subdirectory(subdir: PathLike): string {
    return `add_subdirectory(${str(subdir.toLocaleString())})`;
}

// set variables

export function cmake_include_current_dir(value: boolean): string | undefined {
    if (value) {
        return `set(CMAKE_INCLUDE_CURRENT_DIR ON)`;
    }
}

export function cmake_autouic(value: boolean): string | undefined {
    if (value) {
        return `set(CMAKE_AUTOUIC ON)`;
    }
}

export function cmake_automoc(value: boolean): string | undefined {
    if (value) {
        return `set(CMAKE_AUTOMOC ON)`;
    }
}

export function cmake_autorcc(value: boolean): string | undefined {
    if (value) {
        return `set(CMAKE_AUTORCC ON)`;
    }
}

export function cmake_cxx_standard(value: CxxStandard): string | undefined {
    let value_str = '11';
    if (CxxStandard.CXX_11 === value) {
        value_str = '11';
    } else if (CxxStandard.CXX_14 === value) {
        value_str = '14';
    } else if (CxxStandard.CXX_17 === value) {
        value_str = '17';
    } else if (CxxStandard.CXX_20 === value) {
        value_str = '20';
    }
    return `set(CMAKE_CXX_STANDARD ${value_str})`;
}

export function cmake_cxx_standard_required(value: boolean): string | undefined {
    if (value) {
        return `set(CMAKE_CXX_STANDARD_REQUIRED ON)`;
    }
}

export function cmake_output_directory(output_dir: PathLike): string[] {
    let output_dir_str = path_to_string(output_dir);
    return [
        `set(CMAKE_ARCHIVE_OUTPUT_DIRECTORY \${CMAKE_SOURCE_DIR}/${output_dir_str})`,
        `set(CMAKE_LIBRARY_OUTPUT_DIRECTORY \${CMAKE_SOURCE_DIR}/${output_dir_str})`,
        `set(CMAKE_RUNTIME_OUTPUT_DIRECTORY \${CMAKE_SOURCE_DIR}/${output_dir_str})`,
    ];
}

export function cmake_exe_linker_flags(): string {
    return `set(CMAKE_EXE_LINKER_FLAGS "\${CMAKE_EXE_LINKER_FLAGS} /SUBSYSTEM:WINDOWS /ENTRY:mainCRTStartup")`;
}

export function set_variable_multi_paths(var_name: string, paths: PathLike[]): string[] {
    let lines: string[] = [`set(${var_name}`];
    for (let path of paths) {
        lines.push(path_to_string(path));
    }
    lines.push(`)`);
    return lines;
}

// set

export function set_cmake_cxx_flags(flags: string[]): string {
    return `set(CMAKE_CXX_FLAGS "\${CMAKE_CXX_FLAGS} ${flags.join(' ')}")`;
}

// set property

export function startup_project(project_name: string): string {
    return `set_property(DIRECTORY PROPERTY VS_STARTUP_PROJECT ${str(project_name)})`;
}

export function debugger_working_directory(project_name: string, dir: PathLike): string | undefined {
    let proj = str(project_name);
    let dir_str = path_to_string(dir.toLocaleString());
    return `set_property(TARGET ${proj} PROPERTY VS_DEBUGGER_WORKING_DIRECTORY \${CMAKE_SOURCE_DIR}/${dir_str}/\${CMAKE_CFG_INTDIR})`;
}

export function add_dependencies(depending: string, depended: string): string {
    return `add_dependencies(${str(depending)} ${str(depended)})`;
}
