import { PathLike } from 'fs';

export const console_application: string = 'console-application';
export const desktop_application: string = 'desktop-application';
export const dynamic_link_library: string = 'dynamic-link-library';
export const static_library: string = 'static-library';

export enum ProjectType {
    CONSOLE_APPLICATION,
    DESKTOP_APPLICATION,
    DYNAMIC_LINK_LIBRARY,
    STATIC_LIBRARY,
}

export const cxx_11: number = 11;
export const cxx_14: number = 14;
export const cxx_17: number = 17;
export const cxx_20: number = 20;

export enum CxxStandard {
    CXX_11,
    CXX_14,
    CXX_17,
    CXX_20,
}

export class QtProjectConfig {
    public auto_uic: boolean = true;
    public auto_moc: boolean = true;
    public auto_rcc: boolean = true;
    public packages: string[] = [];
    public console: boolean = false;
}

export class ProjectConfig {
    public name: string = '';
    public project_path: PathLike = '';
    public type: ProjectType = ProjectType.CONSOLE_APPLICATION;
    public target_filename: string = '';
    public files: PathLike[] = [];
    public definitions: string[] = [];
    public include_current_dir: boolean = true;
    public cxx_standard: CxxStandard = CxxStandard.CXX_11;
    public cxx_standard_required: boolean = true;
    public include_directories: string[] = [];
    public link_directories: string[] = [];
    public link_libraries: string[] = [];

    public internal_includes: string[] = [];
    public internal_libraries: string[] = [];

    public qt_config?: QtProjectConfig;
}

export class SolutionConfig {
    public name: string = '';
    public solution_path: PathLike = '';
    public version: string = '0.1';
    public output_directory: PathLike = '';
    public subdirectories: string[] = [];
    public startup_project: string = '';
    public debugger_working_directory: PathLike = '';
}
