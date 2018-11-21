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

const Win32Compiler = require('./win32'),
    exec = require('../../lib/exec'),
    fs = require('fs-extra'),
    path = require('path'),
    AsmParser = require('../asm-parser.js');

class IL2CPPCompiler extends Win32Compiler {

    constructor(info, env) {
        super(info, env);
        this.asm = new AsmParser(this.compilerProps);
    }

    // optionsForFilter(filters, outputFilename) {
    //     // super.optionsForFilter
    //     filters.preProcessLines = (asmLines) => this.preProcessLines(asmLines);
    //     return [outputFilename];
    // }

    // preProcessLines(asmLines) {
    //     return asmLines;
    // }
    
    prepareArguments(userOptions, filters, backendOptions, inputFilename, outputFilename) {
        const basePath = path.dirname(inputFilename);
        const cppPath = path.join(basePath, 'cpp');
        const cppFileName = 'Bulk_example_0.cpp';
        const cppFilePath = path.join(cppPath, cppFileName);

        var args = super.prepareArguments(userOptions, filters, backendOptions, inputFilename, outputFilename);
        args[args.length - 1] = cppFilePath;
        return args;
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
        const libil2cppPath = execOptions.env['libil2cppPath'];
        const il2cppSearchPath = execOptions.env['il2cppSearchPath'];

        const cscOptions = ['/target:library', `/lib:"${libPath}"`, '/r:mscorlib.dll,System.Core.dll', '/debug:full', inputFilename];
        const dllPath = path.join(basePath, 'example.dll'); // TODO
        const cppPath = path.join(basePath, 'cpp');
        const il2cppOptions = [`--assembly=example.dll`, '--convert-to-cpp', `--generatedcppdir=cpp`, `--search-dir="${il2cppSearchPath}"`];
        const cppFileName = 'Bulk_example_0.cpp';
        const cppFilePath = path.join(cppPath, cppFileName);
        options.unshift(`/I"${libil2cppPath}"`);
        return exec.execute(cscPath, cscOptions, execOptions).
            then(compilerRet => exec.execute(il2cppPath, il2cppOptions, execOptions).
            then(il2cppRet => super.runCompiler(compiler, options, cppFileName, execOptions).
            then(cppCompilerRet => {
                cppCompilerRet.stdout = [{ text: compilerRet.stdout }, { text: il2cppRet.stdout }, ...cppCompilerRet.stdout];
                cppCompilerRet.stderr = [{ text: compilerRet.stderr }, { text: il2cppRet.stderr }, ...cppCompilerRet.stderr];
                return cppCompilerRet;
            })));
    }
}

module.exports = IL2CPPCompiler;
