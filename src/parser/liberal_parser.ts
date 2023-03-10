import assert from 'assert'

import * as LiberalParser from '../codegen/parser_liberal'
import {correctExceptionId, correctLicenseId, fixDashedLicenseInfo, isKnownLicenseId} from '../licenses'
import { ConjunctionInfo, LicenseInfo, LicenseRef, ParsedSpdxExpression } from './types'
export { LiberalParser }

export type LiberalParserResult = {
    parse: LiberalParser.ParseResult,
    expression?: ParsedSpdxExpression,
    error?: string
}

const extractErrorMessage = (tree: LiberalParser.ParseResult): string | undefined => {
    if (tree.errs.length === 0) return undefined
    return tree.errs.map(element => element.toString()).join('\n')
}

export function parse(input: string): LiberalParserResult {

    const convertAnOrLaterOrLaterSpecialCase = (node: ConjunctionInfo): ConjunctionInfo|LicenseInfo => {
        const isLicenseInfo = (node: LicenseInfo|LicenseRef|ConjunctionInfo): boolean => {
            return (node as any).license
        }
        const isALater = (node: LicenseInfo): boolean => {
            return ['later', 'newer', 'greater'].includes(node.license)
        }
        const isADashOrDashLaterLicense = (node: LicenseInfo): boolean => {
            return node.license.endsWith('-or-later')
        }
        if (isLicenseInfo(node.left) && isLicenseInfo(node.right)) {
            const left = node.left as LicenseInfo
            const right = node.right as LicenseInfo
            if (isALater(right) && !isADashOrDashLaterLicense(left)) {
                return { ...left, license: `${left.license} or later` } as LicenseInfo
            } else if (isALater(left) && !isADashOrDashLaterLicense(right)) {
                return { ...right, license: `${right.license} or later` } as LicenseInfo
            } else if (isALater(right) && isADashOrDashLaterLicense(left)) {
                return left
            } else if (isALater(left) && isADashOrDashLaterLicense(right)) {
                return right
            }
        }
        return node
    }

    const reduceNode = (node: any | undefined): any|undefined => {
        if (!node) {
            return undefined
        } else if (node.kind === LiberalParser.ASTKinds.or_expression) {
            const conjunction = {
                conjunction: 'or',
                left: reduceNode(node.left),
                right: reduceNode(node.right)
            } as ConjunctionInfo
            return convertAnOrLaterOrLaterSpecialCase(conjunction)
        } else if (node.kind === LiberalParser.ASTKinds.and_expression) {
            return {
                conjunction: 'and',
                left: reduceNode(node.left),
                right: reduceNode(node.right)
            } as ConjunctionInfo
        } else if (node.kind === LiberalParser.ASTKinds.license_exception) {
            const value = reduceNode(node.value) as string
            return correctExceptionId(value)
        } else if (node.kind === LiberalParser.ASTKinds.simple_expression) {
            if (node.exception) {
                const license = correctLicenseId(reduceNode(node.value) as string)
                const exception = correctExceptionId(reduceNode(node.exception), license)
                return { license: license, exception } as LicenseInfo
            } else {
                const license = correctLicenseId(reduceNode(node.value) as string)
                if (!isKnownLicenseId(license) && license.includes('-with-')) {
                    return fixDashedLicenseInfo({ license: license })
                }
                return { license: license } as LicenseInfo
            }
        } else if (node.kind === LiberalParser.ASTKinds.words_expression) {
            const head = node.value.prefix.head.value
            const tail = node.value.prefix.tail ? reduceNode(node.value.prefix.tail.rest) : ''
            return (head + ' ' + tail).trim()
        } else if (node.kind === LiberalParser.ASTKinds.words) {
            if (node.tail) {
                return (node.head.value + ' ' + reduceNode(node.tail.rest)).trim()
            } else {
                return node.head.value
            }
        } else if (node.kind === LiberalParser.ASTKinds.wrapped_expression) {
            return reduceNode(node.value)
        }
        /* istanbul ignore next */ assert.fail(`convertNodeWithCorrections() did not recognize input: ${JSON.stringify(node)}`)
    }

    const p = new LiberalParser.Parser(input)
    const tree = p.parse()
    const expression = reduceNode(tree.ast?.value)
    return { parse: tree, expression: expression, error: extractErrorMessage(tree) }
}
