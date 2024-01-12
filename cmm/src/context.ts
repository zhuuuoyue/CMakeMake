import { PathLike } from 'fs';

export class Context {
    public cmake_minimum_required: string = '3.5';
    public solution_directory?: PathLike;
}
