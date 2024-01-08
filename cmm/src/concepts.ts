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

export interface QtProjectConfig {
    auto_uic: boolean;
    auto_moc: boolean;
    auto_rcc: boolean;
    packages: string[];
}

export class ProjectConfig {
    public name: string;
    public project_path: PathLike;
    public type: ProjectType;
    public target_filename: string;
    public files: PathLike[];
    public definitions: string[];
    public include_current_dir: boolean;
    public cxx_standard: CxxStandard;
    public cxx_standard_required: boolean;
    public include_directories: string[];
    public link_directories: string[];
    public link_libraries: string[];

    public internal_includes: string[];
    public internal_libraries: string[];

    public qt_config?: QtProjectConfig;

    constructor() {
        this.name = '';
        this.project_path = '';
        this.type = ProjectType.CONSOLE_APPLICATION;
        this.target_filename = '';
        this.files = [];
        this.definitions = [];
        this.include_current_dir = true;
        this.cxx_standard = CxxStandard.CXX_11;
        this.cxx_standard_required = true;
        this.include_directories = [];
        this.link_directories = [];
        this.link_libraries = [];

        this.internal_includes = [];
        this.internal_libraries = [];
    }
}

export class SolutionConfig {
    public name: string;
    public solution_path: PathLike;
    public version: string;
    public output_directory: PathLike;
    public subdirectories: string[];
    public startup_project: string;
    public debugger_working_directory: PathLike;

    constructor() {
        this.name = '';
        this.solution_path = '';
        this.version = '0.1';
        this.output_directory = '';
        this.subdirectories = [];
        this.startup_project = '';
        this.debugger_working_directory = '';
    }
}
