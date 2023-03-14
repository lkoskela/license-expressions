#!/usr/bin/env node

import * as process from 'process'

import { parse } from '../parser'
import validate from '../validator'
import normalize from '../normalizer'
import { parseCLIOptions, CLIOptions, usage } from './options'


const parseCommand = (options: CLIOptions): string => {
    try {
        const strictSyntax = options.options.includes('strict')
        const upgradeGPLVariants = options.options.includes('upgrade')
        const ast = parse(options.expression, { strictSyntax, upgradeGPLVariants })
        const result = {
            expression: ast,
            errors: validate(options.expression).errors
        }
        return JSON.stringify(result, null, 2)
    } catch (error: any) {
        return JSON.stringify({ expression: undefined, errors: [error.message] }, null, 2)
    }
}

const validateCommand = (options: CLIOptions): string => {
    return JSON.stringify(validate(options.expression), null, 2)
}

const normalizeCommand = (options: CLIOptions): string => {
    return normalize(options.expression)
}

const mapOptionsToCommand = (options: CLIOptions): Function => {
    if (options.command === 'normalize') {
        return normalizeCommand
    } else if (options.command === 'validate') {
        return validateCommand
    } else {
        return parseCommand
    }
}

const cliRunner = (args: string[]) => {
    const cliOptions = parseCLIOptions(args)
    if (cliOptions.expression.trim().length === 0) {
        console.log(usage('spdx'))
    } else {
        const command = mapOptionsToCommand(cliOptions)
        console.log(command.call(command, cliOptions))
    }
}

function runCLI(): void {
    cliRunner(process.argv.slice(2) as string[])
}

runCLI()
