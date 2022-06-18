const process = require('process')
import { parseSpdxExpression } from './parser'

process.argv.slice(2).forEach((arg:string) => {
    const ast = parseSpdxExpression(arg)
    console.log(JSON.stringify(ast, null, 2))
})
