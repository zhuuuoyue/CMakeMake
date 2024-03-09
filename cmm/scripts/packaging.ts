import { cwd } from 'process';
import { join } from 'path';
import { writeFileSync, readdirSync, statSync, mkdirSync, createWriteStream, rmSync, readFileSync, PathLike, WriteStream } from 'fs';

import _ from 'lodash';
import archiver from 'archiver';

interface PackageJson {
    name: string;
    version: string;
    description?: string;
    main?: string;
    scripts?: object;
    keywords?: string[];
    author?: string;
    license?: string;
    devDependencies?: object;
    dependencies: object;
}

function simplify_package_json(package_json: PackageJson, dst_path: PathLike): PackageJson {
    package_json = _.pick(package_json, ['name', 'version', 'dependencies']);
    writeFileSync(dst_path, JSON.stringify(package_json, undefined, 4));
    return package_json;
}

function create_destination_filename(package_json: PackageJson): PathLike {
    let archive_filename: string = `${package_json.name}_v_${package_json.version}`;
    archive_filename = archive_filename.replace(new RegExp('\\.', 'g'), '_');
    archive_filename = `${archive_filename}.zip`;
    return archive_filename;
}

function create_archives_folder(working_dir: PathLike): PathLike {
    const children: string[] = readdirSync(working_dir);
    let will_create: boolean = false;
    const archives_folder = 'archives';
    const archives_dir: PathLike = join(working_dir.toLocaleString(), archives_folder);
    if (-1 == children.indexOf(archives_folder)) {
        will_create = true;
    } else {
        const stat = statSync(archives_dir);
        if (!stat.isDirectory()) {
            will_create = true;
        }
    }
    if (will_create) {
        mkdirSync(archives_dir);
    }
    return archives_dir;
}

function create_archive(archive_path: PathLike, package_temp_path: PathLike) {
    const output: WriteStream = createWriteStream(archive_path);
    const archive: archiver.Archiver = archiver('zip', { zlib: { level: 9 } });
    archive.on('end', function () {
        rmSync(package_temp_path);
    });
    archive.pipe(output);
    archive.directory('dist/', 'dist');
    archive.file('package.temp.json', { name: 'package.json' });
    archive.finalize();
}

function main() {
    const working_dir: PathLike = cwd();

    const package_file: PathLike = join(working_dir, 'package.json');
    let package_obj: PackageJson = JSON.parse(readFileSync(package_file).toLocaleString());
    const archive_filename = create_destination_filename(package_obj);

    const package_temp_file: PathLike = join(working_dir, 'package.temp.json');
    package_obj = simplify_package_json(package_obj, package_temp_file);

    const archives_dir: PathLike = create_archives_folder(join(working_dir, '..'));
    const dest_path: PathLike = join(archives_dir.toLocaleString(), archive_filename.toLocaleString());
    create_archive(dest_path, package_temp_file);
}

main();
