import assert from 'assert'
import * as Parser from '../codegen/parser'

export type LicenseInfo = {
    license: string,
    exception?: string
}

export type LicenseRef = {
    documentRef?: string,
    licenseRef: string
}

export type ConjunctionInfo = {
    left: LicenseInfo | ConjunctionInfo | LicenseRef,
    conjunction: 'or' | 'and',
    right: LicenseInfo | ConjunctionInfo | LicenseRef
}

type FailedParse = {
    input: string,
    error: string,
    ast: null,
    expression: null
}

type SuccessfulParse = {
    input: string,
    error: null,
    ast: any,
    expression: ParsedSpdxExpression
}

export type FullSpdxParseResult = SuccessfulParse | FailedParse

export type ParsedSpdxExpression = ConjunctionInfo | LicenseInfo | LicenseRef

const converLicenseRefExpression = (node: Parser.license_ref_expression | Parser.license_ref_expression_1): LicenseRef => {
    const extractDocumentRef = (node: Parser.license_ref_expression_1): string|undefined => {
        if (node.document_ref && node.document_ref.prefix) {
            return [node.document_ref.prefix, node.document_ref.value].join('')
        }
        return undefined
    }
    const extractLicenseRef = (node: Parser.license_ref_expression): string => {
        return [node.license_ref.prefix, node.license_ref.value].join('')
    }
    return {
        documentRef: extractDocumentRef(node as Parser.license_ref_expression_1),
        licenseRef: extractLicenseRef(node),
    } as LicenseRef
}

const convertLicenseIdExpression = (node: Parser.license_id_expression): LicenseInfo => {
    if (!!node.exception && !!node.license.license) {
        return {
            license: node.license.license,
            exception: node.exception.exception
        }
    } else {
        return {
            license: node.license.license
        }
    }
}

const convertNode = (node: any): ParsedSpdxExpression | null => {
    if (node.kind === 'license_id_expression') {
        return convertLicenseIdExpression(node)
    } else if (node.kind === 'wrapped_expression') {
        return convertNode(node.value)
    } else if (node.kind === 'or_expression') {
        let compound: ConjunctionInfo = {
            conjunction: 'or',
            left: convertNode(node.left) as ParsedSpdxExpression,
            right: convertNode(node.right) as ParsedSpdxExpression
        }
        return compound
    } else if (node.kind === 'and_expression') {
        let compound: ConjunctionInfo = {
            conjunction: 'and',
            left: convertNode(node.left) as ParsedSpdxExpression,
            right: convertNode(node.right) as ParsedSpdxExpression
        }
        return compound
    } else if (node.kind.startsWith('license_ref_expression')) {
        return converLicenseRefExpression(node)
    }
    /* istanbul ignore next */ assert.fail(`convertNode() did not recognize input: ${JSON.stringify(node)}`)
}

const extractErrorMessage = (input: string, tree: Parser.ParseResult): string => {
    return tree.errs.map(element => element.toString()).join('\n')
}

export function parseSpdxExpression(input: string) : ParsedSpdxExpression | null {
    const p = new Parser.Parser(input.trim())
    const tree = p.parse()
    if (tree.ast && (tree.errs === null || tree.errs.length === 0)) {
        return convertNode(tree.ast.value)
    } else {
        throw new Error(extractErrorMessage(input, tree))
    }
}

export function parseSpdxExpressionWithDetails(input: string) : FullSpdxParseResult {
    const p = new Parser.Parser(input.trim())
    const tree = p.parse()
    if (tree.ast && (tree.errs === null || tree.errs.length === 0)) {
        const result = convertNode(tree.ast.value)
        return {
            input: input,
            ast: tree.ast,
            error: null,
            expression: result,
        } as SuccessfulParse
    } else {
        return {
            input: input,
            ast: tree.ast,
            error: extractErrorMessage(input, tree),
            expression: null,
        } as FailedParse
    }
}
