import * as Parser from '../codegen/parser'

export type LicenseInfo = {
    license: string
}

export type LicenseRef = {
    documentRef?: string,
    licenseRef: string
}

export type ConjuctionInfo = {
    left: LicenseInfo | ConjuctionInfo | LicenseRef,
    conjuction: 'or' | 'and',
    right: LicenseInfo | ConjuctionInfo | LicenseRef
}

export type LicenseException = {
    license: string,
    exception: string
}

type Result = ConjuctionInfo | LicenseInfo | LicenseRef | LicenseException

function evaluateAST(ast: Parser.expression) : Result | undefined {
    const convertNode = (node: any): Result | undefined => {
        if (node.kind === 'license_id') {
            return node.license
        } else if (node.kind.startsWith('license_ref')) {
            let licenseRef: LicenseRef = {
                documentRef: node.document_ref || undefined,
                licenseRef: node.license_ref,
            }
            return licenseRef
        } else if (node.kind.startsWith('compound_expression')) {
            let compound: ConjuctionInfo = {
                conjuction: node.conjuction.toLowerCase(),
                left: convertNode(node.left) as Result,
                right: convertNode(node.right) as Result
            }
            return compound
        } else if (node.kind.startsWith('license_exception')) {
            let exception: LicenseException = {
                license: node.license,
                exception: node.exception
            }
            return exception
        } else if (node.kind.startsWith('wrapped_expression')) {
            return convertNode(node.value)
        }
        return undefined
    }
    return convertNode(ast.value)
}

export function parse(input : string) : Result | undefined {
    const p = new Parser.Parser(input.trim())
    const tree = p.parse()
    if ((tree.errs === null || tree.errs.length === 0) && tree.ast) {
        return evaluateAST(tree.ast)
    } else {
        console.error(`Errors:\n${tree.errs.join('\n')}`)
        return undefined
    }
}
