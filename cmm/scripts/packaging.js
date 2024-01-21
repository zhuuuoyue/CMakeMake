const process = require('process');
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');

function simplify_package_json(package_json, dst_path) {
    delete package_json['scripts'];
    delete package_json['devDependencies'];
    fs.writeFileSync(dst_path, JSON.stringify(package_json));
}

function create_destination_filename(package_json) {
    let archive_filename = `${package_json.name}_v_${package_json.version}`;
    archive_filename = archive_filename.replace(new RegExp('\\.', 'g'), '_');
    archive_filename = `${archive_filename}.zip`;
    return archive_filename;
}

function create_archives_folder(working_dir) {
    const children = fs.readdirSync(working_dir);
    let will_create = false;
    const archives_folder = 'archives';
    const archives_dir = path.join(working_dir, archives_folder);
    if (-1 == children.indexOf(archives_folder)) {
        will_create = true;
    } else {
        const stat = fs.statSync(archives_dir);
        if (!stat.isDirectory()) {
            will_create = true;
        }
    }
    if (will_create) {
        fs.mkdirSync(archives_dir);
    }
    return archives_dir;
}

function create_archive(archive_path, package_temp_path) {
    const output = fs.createWriteStream(archive_path);
    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.on('end', function () {
        fs.rmSync(package_temp_path);
    });
    archive.pipe(output);
    archive.directory('dist/', 'dist');
    archive.file('package.temp.json', { name: 'package.json' });
    archive.finalize();
}

const working_dir = process.cwd();

const package_file = path.join(working_dir, 'package.json');
const package_obj = JSON.parse(fs.readFileSync(package_file));
const package_temp_file = path.join(working_dir, 'package.temp.json');
simplify_package_json(package_obj, package_temp_file);

const archive_filename = create_destination_filename(package_obj);
const archives_dir = create_archives_folder(path.join(working_dir, '..'));
const dest_path = path.join(archives_dir, archive_filename);
create_archive(dest_path, package_temp_file);
