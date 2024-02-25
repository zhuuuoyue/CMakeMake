import { PathLike, writeFileSync } from 'fs';
import { join } from 'path';

import _ from 'lodash';

import { cmake_lists_filename } from './constants';

export class Document {
    private lines: string[] = [];

    public add(line_or_lines: string[] | string | undefined) {
        if (_.isString(line_or_lines)) {
            this.lines.push(line_or_lines);
        } else if (_.isArray(line_or_lines)) {
            for (let line of line_or_lines) {
                if (_.isString(line)) {
                    this.lines.push(line);
                }
            }
        }
    }

    public save(project_directory: PathLike) {
        let filename = join(project_directory.toLocaleString(), cmake_lists_filename);
        let text = this.lines.join('\r\n');
        writeFileSync(filename.toLocaleString(), text, { flag: 'w' });
    }
}
