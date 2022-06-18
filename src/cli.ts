#!/usr/bin/env node

const process = require('process')
import { parseSpdxExpression } from './parser'

process.argv.slice(2).forEach((arg:string) => {
    try {
        const ast = parseSpdxExpression(arg)
        console.log(JSON.stringify(ast, null, 2))
    } catch (error: any) {
        console.log(JSON.stringify({ error: error.message }, null, 2))
    }
})
