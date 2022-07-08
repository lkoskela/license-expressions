#!/usr/bin/env node

import { parseSpdxExpression } from '../parser'
import { validate } from '../validator'
import { normalize } from '../normalizer'
import { parseCLIOptions, CLIOptions } from './options'

const process = require('process')


const parseCommand = (options: CLIOptions): string => {
    try {
        const strictSyntax = options.options.includes('strict')
        const ast = parseSpdxExpression(options.expression, strictSyntax)
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
    const command = mapOptionsToCommand(cliOptions)
    console.log(command.call(command, cliOptions))
}

export function run(): void {
    cliRunner(process.argv.slice(2) as string[])
}

export function isREPL(): boolean {
    try {
        const repl = __dirname
        return false
    } catch (err) {
        return true
    }
}

export function isTTY(): boolean {
    return require('process').stdin.isTTY
}

export default run
