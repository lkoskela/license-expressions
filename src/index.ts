import { parseSpdxExpression, parseSpdxExpressionWithDetails } from './parser'
import { normalize } from './normalizer'
import { validate } from './validator'
import { run as runCommandLineInterface, isTTY, isREPL } from './cli'

export { parseSpdxExpression, parseSpdxExpressionWithDetails, normalize, validate }
export default parseSpdxExpression

if (isTTY() && !isREPL()) {
    runCommandLineInterface()
}
