import { PathLike } from "fs";
import path from "path";

export class Context {
    private _repository_path: PathLike;
    private _project_path: PathLike;
    private _test_case_directory_path: PathLike;
    private _test_output_directory_path: PathLike;
    private _test_running_name: string;
    private _test_running_directory_path: PathLike;
    private _test_running_result_filename: string;

    constructor(repos_path: PathLike) {
        this._repository_path = repos_path;
        this._project_path = path.join(this._repository_path.toLocaleString(), 'cmm');
        this._test_case_directory_path = path.join(this._repository_path.toLocaleString(), 'testcases');
        this._test_output_directory_path = path.join(this._repository_path.toLocaleString(), 'test-output');
        const now = new Date();
        this._test_running_name = now.toISOString()
            .replace(new RegExp('-', 'g'), '_')
            .replace(new RegExp('T', 'g'), '_')
            .replace(new RegExp(':', 'g'), '_')
            .replace(new RegExp('\\.', 'g'), '_')
            .replace(new RegExp('Z', 'g'), '');
        this._test_running_directory_path = path.join(this._test_output_directory_path.toLocaleString(), this._test_running_name);
        this._test_running_result_filename = 'result';
    }

    public get repository_path(): PathLike {
        return this._repository_path;
    }

    public get project_path(): PathLike {
        return this._project_path;
    }

    public get test_case_directory_path(): PathLike {
        return this._test_case_directory_path;
    }

    public get test_output_directory_path(): PathLike {
        return this._test_output_directory_path;
    }

    public get test_running_name(): string {
        return this._test_running_name;
    }

    public get test_running_directory_path(): PathLike {
        return this._test_running_directory_path;
    }

    public get test_running_result_filename(): string {
        return this._test_running_result_filename;
    }
}
