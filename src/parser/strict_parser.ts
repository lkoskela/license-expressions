import assert from 'assert'

import * as StrictParser from '../codegen/parser_strict'
import {correctExceptionId, correctLicenseId} from '../licenses'
import { ParsedSpdxExpression, ConjunctionInfo, LicenseRef, LicenseInfo } from './types'


export type StrictParserResult = {
    parse: StrictParser.ParseResult,
    expression?: ParsedSpdxExpression,
    error?: string
}

const extractErrorMessage = (tree: StrictParser.ParseResult): string | undefined => {
    if (tree.errs.length === 0) return undefined
    return tree.errs.map(element => element.toString()).join('\n')
}

export function parse(input: string): StrictParserResult {

    const reduceNode = (node: any): ParsedSpdxExpression | undefined => {
        if (!node) { return undefined }

        const convertLicenseIdExpression = (node: StrictParser.license_id_expression): LicenseInfo => {
            const correctedLicenseId = correctLicenseId(node.license.license)
            if (!!node.exception) {
                const correctedExceptionId = correctExceptionId(node.exception.exception)
                return { license: correctedLicenseId, exception: correctedExceptionId } as LicenseInfo
            } else {
                return { license: correctedLicenseId } as LicenseInfo
            }
        }

        const converLicenseRefExpression = (node: StrictParser.license_ref_expression | StrictParser.license_ref_expression_1): LicenseRef => {
            const extractDocumentRef = (node: StrictParser.license_ref_expression_1): string|undefined => {
                if (node.document_ref && node.document_ref.prefix) {
                    return [node.document_ref.prefix, node.document_ref.value].join('')
                }
                return undefined
            }
            const extractLicenseRef = (node: StrictParser.license_ref_expression): string => {
                return [node.license_ref.prefix, node.license_ref.value].join('')
            }
            return {
                documentRef: extractDocumentRef(node as StrictParser.license_ref_expression_1),
                licenseRef: extractLicenseRef(node),
            } as LicenseRef
        }

        if (node.kind === 'license_id_expression') {
            return convertLicenseIdExpression(node)
        } else if (node.kind === 'wrapped_expression') {
            return reduceNode(node.value)
        } else if (node.kind === 'or_expression') {
            let compound: ConjunctionInfo = {
                conjunction: 'or',
                left: reduceNode(node.left) as ParsedSpdxExpression,
                right: reduceNode(node.right) as ParsedSpdxExpression
            }
            return compound
        } else if (node.kind === 'and_expression') {
            let compound: ConjunctionInfo = {
                conjunction: 'and',
                left: reduceNode(node.left) as ParsedSpdxExpression,
                right: reduceNode(node.right) as ParsedSpdxExpression
            }
            return compound
        } else if (node.kind.startsWith('license_ref_expression')) {
            return converLicenseRefExpression(node)
        }
        /* istanbul ignore next */ assert.fail(`reduceNode() did not recognize input: ${JSON.stringify(node)}`)
    }

    const p = new StrictParser.Parser(input)
    const tree = p.parse()
    const expression = reduceNode(tree.ast?.value)
    return { parse: tree, expression: expression || undefined, error: extractErrorMessage(tree) }
}
