import { parseSpdxExpression, parseSpdxExpressionWithDetails } from './parser'
import { normalize } from './normalizer'
import { validate } from './validator'
import runCommandLineInterface from './cli'

export { parseSpdxExpression, parseSpdxExpressionWithDetails, normalize, validate }
export default parseSpdxExpression

if (require('process').stdin.isTTY) {
    runCommandLineInterface()
}
