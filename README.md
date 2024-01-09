# CMakeMake

## 功能简介

根据定义的项目配置，生成 CMake 文件。

## 使用方法

以生成 Windows 平台下 Visual Studio 2022 解决方案为例。

通过以下格式，指定程序的入口文件和解决方案的根目录。

```
node <path-to-main.js> --solution_dir <path-to-root-source-directory>
```

例如，在 `examples/basic-example` 目录下有 `src` 文件夹存放源文件，在 `tools` 文件夹下存放工具，`cmm` 就是其中之一。

将编译后的 `dist` 和 `package.json` 放入 `tools/cmm` 文件夹下，运行 `npm install` 安装依赖。

```
cd tools/cmm
npm install
```

安装完毕后，回去项目的根目录，运行程序，生成 CMake 文件。

```
cd ../..
node tools/cmm/dist/main.js --solution_dir src
```

### 配置解决方案

根据 `cmake.json` 生成 VS 解决方案，参考 [cmake.json](./examples/basic-example/src/cmake.json)。

|字段|设置项|值类型|必选|说明|
|-|-|-|-|-|
|`name`|解决方案名称|`string`|Yes|代码一般在 `src` 文件夹下，取 `src` 作为解决方案名称无意义，故是必选参数|
|`output_directory`|输出目录|`string`|||
|`startup_project`|默认启动项目|`string`||须是项目的名称|

### 配置项目

根据 `cmake.json` 生成 VS 解决方案下的项目，参考 [cmake.json](./examples/basic-example/src/App/cmake.json)。

|字段|设置项|值类型|必选|说明|
|-|-|-|-|-|
|`name`|项目名称|`string`||如果不设置则使用文件夹名称|
|`type`|项目类型|`string`||可以是 `"console-application"`、`"desktop-application"`、`"dynamic-link-library"`、`"static-library"`，默认是 `"console-application"`|
|`include_current_directory`|是否包含当前目录|`boolean`|||
|`cxx_standard`|使用的 C++ 标准|`int`||可以是 `11`、`14`、`17`、`20`|
|`include_directories`|包含目录列表|`string[]`|||
|`link_directories`|链接库目录列表|`string[]`|||
|`link_libraries`|链表库文件名列表|`string[]`|||
|`internal_includes`|内部项目包含列表|`string[]`||只添加到包含目录列表，不添加库依赖|
|`internal_libraries`|内部项目依赖列表|`string[]`||也会将依赖项目的目录添加到包含目录列表中|
|`qt`|QT 配置|`object`||定义见下表|

### 配置 QT

QT 配置是项目 `cmake.json` 中字段 `qt` 的值，参考 [cmake.json](./examples/qt-example/src/App/cmake.json)。

|字段|设置项|值类型|必选|说明|
|-|-|-|-|-|
|`auto_uic`|自动编译界面文件|`boolean`||默认 `true`|
|`auto_moc`|自动编译元对象|`boolean`||默认 `true`|
|`auto_rcc`|自动编译资源文件|`boolean`||默认 `true`|
|`packages`|依赖的 QT 模块|`string[]`|||
|`console`|是否有控制台窗口|`boolean`||默认 `false`，即没有|
