const process = require('process')
import { parse } from './parser'

process.argv.slice(2).forEach((arg:string) => {
    const ast = parse(arg)
    console.log(`${JSON.stringify(arg)} =>\n${JSON.stringify(ast, null, 2)}`)
})
