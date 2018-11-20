// Copyright (c) 2018, Compiler Explorer Team
// All rights reserved.
//
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are met:
//
//     * Redistributions of source code must retain the above copyright notice,
//       this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above copyright
//       notice, this list of conditions and the following disclaimer in the
//       documentation and/or other materials provided with the distribution.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
// AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
// IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
// ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
// LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
// CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
// SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
// INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
// CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
// ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
// POSSIBILITY OF SUCH DAMAGE.

const
    BaseCompiler = require('../base-compiler'),
    exec = require('../../lib/exec'),
    fs = require('fs-extra'),
    path = require('path'),
    AsmParser = require('../asm-parser.js');

class IL2CPPCompiler extends BaseCompiler {

    constructor(info, env) {
        super(info, env);
        this.asm = new AsmParser(this.compilerProps);
    }

    optionsForFilter(filters, outputFilename) {
        filters.preProcessLines = (asmLines) => this.preProcessLines(asmLines);
        return [outputFilename];
    }

    preProcessLines(asmLines) {
        return asmLines;
    }

    runCompiler(compiler, options, inputFilename, execOptions) {
        if (!execOptions) {
            execOptions = this.getDefaultExecOptions();
        }

        execOptions.env = Object.assign({}, execOptions.env);
        for (const [env, to] of this.compiler.envVars) {
            execOptions.env[env] = to;
        }
        execOptions.timeoutMs = 0;

        const basePath = execOptions.customCwd = path.dirname(inputFilename);

        const cscPath = execOptions.env['CscPath'];
        const libPath = execOptions.env['CscLibPath'];
        const il2cppPath = execOptions.env['il2cppPath'];
        const unityMonoPath = execOptions.env['unityMonoPath'];
        const libil2cppPath = execOptions.env['libil2cppPath'];

        const cscOptions = ['/target:library', `/lib:"${libPath}"`, '/r:mscorlib.dll,System.Core.dll', '/debug:full', inputFilename];
        const dllPath = path.join(basePath, 'example.dll'); // TODO
        const cppPath = path.join(basePath, 'cpp');
        const il2cppOptions = [`--assembly=example.dll`, '--convert-to-cpp', `--generatedcppdir=cpp`, `--search-dir="${unityMonoPath}"`];
        const outputPath = this.filename(options[0]);
        const cppFileName = 'Bulk_example_0.cpp';
        const cppFilePath = path.join(cppPath, cppFileName);
        return exec.execute(cscPath, cscOptions, execOptions).
            then(compilerRet => exec.execute(il2cppPath, il2cppOptions, execOptions).
            then(il2cppRet => super.runCompiler("C:\\Program Files\\Unity\\Hub\\Editor\\2018.3.0b3\\Editor\\Data\\il2cpp\\build\\il2cpp.exe", [`/Fa "${outputPath}"`, '/c', '/Ox', `/I "${libil2cppPath}"`, cppFilePath], cppFileName, execOptions)).
            // then(il2cppRet => fs.copyFile(path.join(cppPath, 'Bulk_example_0.cpp'), outputPath).
            then(clangRet => clangRet));

        // const projectFilePath = path.join(execOptions.customCwd, "Project.csproj");

        // options = ['publish', '-c', BuildConfiguration, '--self-contained'];

        // const coreClrPath = execOptions.env['CoreCLRDebugPath'];
        // const publishPath = path.join(
        //     execOptions.customCwd, 'bin', BuildConfiguration,
        //     TargetFramework, RuntimeIdentifier, 'publish');
        // const crossgenPath = path.join(publishPath, 'crossgen');
        // const dllPath = path.join(publishPath, 'Project.dll');

        // return this.writeFile(projectFilePath, ProjectFileContent).
        //     then(() => super.runCompiler(compiler, options, inputFilename, execOptions).
        //     // copy the debug CoreCLR executables (they need to be in the same directory as the DLL for some reason)
        //         then(compilerRet => fs.copy(coreClrPath, publishPath). 
        //             then(() => this.runCrossgen(execOptions, crossgenPath, publishPath, dllPath, outputPath)).
        //             then(() => compilerRet)));
    }

    // runCrossgen(execOptions, crossgenPath, publishPath, dllPath, outputPath) {
    //     // run crossgen (managed to native)
    //     // set these environment variables to activate the disassembly output
    //     execOptions.env['COMPlus_NgenDisasm'] = '*';
    //     execOptions.env['COMPlus_NgenDiffableDasm'] = '1';
    //     return exec.execute(crossgenPath, ['/Platform_Assemblies_Paths', publishPath, dllPath], execOptions).
    //         then(crossgenRet => this.writeFile(outputPath, `${crossgenRet.stdout}\n\n${crossgenRet.stderr}`));
    // }
}

module.exports = IL2CPPCompiler;
