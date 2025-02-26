import spdxCorrect from 'spdx-correct'

import { permutationsOf } from '../utils/permutations'
import { LicenseInfo } from '../parser/types'
import { licenses, Licenses, License, exceptions, Exceptions, Exception } from './data'
export { licenses, Licenses, License, exceptions, Exceptions, Exception }


type MapOfIds = {
    get: (id: string) => string | undefined,
    list: () => string[]
}

const idEndsWithVersionNumber = (id: string): boolean => {
    return !!id.match(/^.*\d+(\.\d+)*$/)
}

const removeVersionNumberFromId = (id: string): string => {
    return idEndsWithVersionNumber(id) ? id.replace(/(v|\-)?\d+(\.\d+)*$/, '') : id
}

const countVersionsOf = (ids: string[], id: string): number => {
    let prefix = removeVersionNumberFromId(id)
    return ids.filter(candidateId => candidateId.startsWith(prefix)).length
}

const createMapOfIds = (ids: string[]): MapOfIds => {
    const mutilateId = (id: string): string => id.toUpperCase().replace(/[^0-9a-zA-Z\+]/g, '')
    const listOfOfficialIds: string[] = ids
    const mapOfLowercaseIds: Map<string, string> = new Map()
    const mapOfMutilatedIds: Map<string, string> = new Map()
    const mapOfSingleVersionIdsWithoutExplicitVersion: Map<string, string> = new Map()
    listOfOfficialIds.forEach(id => {
        mapOfLowercaseIds.set(id.toLowerCase(), id)
        mapOfMutilatedIds.set(mutilateId(id), id)
        if (idEndsWithVersionNumber(id) && countVersionsOf(listOfOfficialIds, id) === 1) {
            mapOfSingleVersionIdsWithoutExplicitVersion.set(removeVersionNumberFromId(id.toLowerCase()), id)
        }
    })
    const getExactMatch = (id: string) => listOfOfficialIds.find(x => x === id)
    const getCaseInsensitiveMatch = (id: string) => {
        const lowercaseId: string = id.toLowerCase();
        const variationsToTest: string[] = [
            lowercaseId,
            lowercaseId.replace(/\s+/g, '-').replace(/(\d+)$/, '$1.0')
        ]
        return variationsToTest.map(x => mapOfLowercaseIds.get(x)).filter(m => !!m)[0]
    }
    const getFuzzyMatch = (id: string) => mapOfMutilatedIds.get(mutilateId(id))
    const getSingleVersionMatch = (id: string) => mapOfSingleVersionIdsWithoutExplicitVersion.get(id)
    const get = (id: string): string | undefined => {
        return getExactMatch(id) || getCaseInsensitiveMatch(id) || getFuzzyMatch(id) || getSingleVersionMatch(id)
    }
    const list = (): string[] => listOfOfficialIds
    return { get, list } as MapOfIds
}

const mapOfKnownLicenses: MapOfIds = createMapOfIds(licenses.licenses.map(lic => lic.licenseId))
const mapOfKnownExceptions: MapOfIds = createMapOfIds(exceptions.exceptions.map(e => e.licenseExceptionId))

const aliasesForLicenseIds: Map<string, string> = ((): Map<string, string> => {
    const mapOfAliases = new Map()

    // Aliases for the BSD-2-Clause license:
    mapOfAliases.set('freebsd', 'BSD-2-Clause')
    mapOfAliases.set('freebsd license', 'BSD-2-Clause')
    mapOfAliases.set('freebsd license', 'BSD-2-Clause')
    mapOfAliases.set('simplified bsd license', 'BSD-2-Clause')

    // Aliases for the BSD-3-Clause license:
    mapOfAliases.set('new bsd license', 'BSD-3-Clause')
    mapOfAliases.set('modified bsd license', 'BSD-3-Clause')

    // Aliases for the 0BSD license:
    mapOfAliases.set('zero-clause bsd', '0BSD')
    mapOfAliases.set('free public license', '0BSD')
    mapOfAliases.set('free public license 1.0.0', '0BSD')
    mapOfAliases.set('free public license 1.0', '0BSD')
    mapOfAliases.set('bsd0', '0BSD')

    // Aliases for the Apache-1.1 license:
    mapOfAliases.set('apache1.1', 'Apache-1.1')
    mapOfAliases.set('apache-1.1', 'Apache-1.1')
    mapOfAliases.set('apache software license', 'Apache-1.1')
    mapOfAliases.set('apache software license 1.1', 'Apache-1.1')
    mapOfAliases.set('apache software license version 1.1', 'Apache-1.1')

    // GNU Free Documentation License v1.1
    //mapOfAliases.set('GFDL-1.1', 'GNU Free Documentation License v1.1')

    return mapOfAliases
})()

const aliasesForExceptions: Map<string, string> = ((): Map<string, string> => {
    const mapOfAliases = new Map<string, string>()
    mapOfAliases.set('qwt license 1.0', 'Qwt-exception-1.0')
    mapOfAliases.set('qwt license 1', 'Qwt-exception-1.0')
    mapOfAliases.set('cpe', 'Classpath-exception-2.0')
    mapOfAliases.set('gnu cpe', 'Classpath-exception-2.0')
    return mapOfAliases
})()

const mapLicenseAlias = (alias: string): string | undefined => {
    return aliasesForLicenseIds.get(alias.toLowerCase())
}

const mapLicenseId = (id: string): string | undefined => {
    return mapOfKnownLicenses.get(id.toLowerCase())
}

const shouldIgnoreCorrection = (input: string, output: string): boolean => {
    // known bug in spdx-correcting e.g. "GNU Free Documentation License v1.1" into GPL-3.0-or-later:
    return output?.startsWith('GPL-') && input.includes('Free Documentation License')
}

const fixLicenseId = (id: string, upgradeGPLVariants: boolean): string | null => {
    // Don't try to correct license identifiers that are syntactically legit on the
    // surface and have an explicit version number such as "3.0" or "2.1":
    if (id.match(/(\w+(\-\w+)*)\-\d+(\.\d+)+(\-\w+)*/)) {
        return id
    }

    // Use `spdx-correct` to try and correct identifiers that we haven't fixed already:
    const corrected = spdxCorrect(id, { upgrade: upgradeGPLVariants })
    if (corrected && !shouldIgnoreCorrection(id, corrected)) {
        return corrected
    }
    return null
}

const mapExceptionAlias = (alias: string): string | undefined => {
    return aliasesForExceptions.get(alias.toLowerCase())
}

const mapExceptionId = (id: string): string | undefined => {
    return mapOfKnownExceptions.get(id.toLowerCase())
}

const knownExceptionIdentifiersStartingWith = (prefix: string): string[] => {
    const lowercasedPrefix = prefix.toLowerCase()
    return mapOfKnownExceptions.list()
        .filter(id => id.toLowerCase().startsWith(lowercasedPrefix))                    // Must start with the prefix (ignoring case)
        .filter(id => id.substring(lowercasedPrefix.length).match(/^\-?\d+(\.\d+)*$/))  // The suffix must be strictly a version number like "[prefix]-2.0" or "[prefix]3.0"
}

const fixExceptionid = (id: string, associatedLicense?: string|undefined): string | undefined => {
    type Mutation = (s: string) => string

    const mutations: Mutation[] = [
        (id: string): string => id.replace(/\s+/, '-'),
        (id: string): string => id.replace(/\s+version\s+/i, ' '),
        (id: string): string => id.replace(/([^.])(\d+)$/, '$1$2.0'),   // replace a trailing "3" with "3.0" but don't append another ".0" to e.g. "3.0"
        (id: string): string => id.replace(/^GNU (.*)$/i, '$1'),
        (id: string): string => id.replace(/(.+)\s+\(.+?\)((v|version )?\d\.\d)?/gi, '$1$2'),
    ]
    const permutations = permutationsOf<Mutation>(mutations, 3)
    const potentialIdentifiers = [...new Set(permutations.map((combo: Mutation[]): string => {
        const initialValue = combo[0](id)
        return combo.slice(1).reduce((prev, curr) => curr(prev), initialValue)
    }))]
    const matchedIds = [ ...new Set(potentialIdentifiers.map(mapExceptionId).filter(id => !!id)) ]

    if (matchedIds.length === 0 && !id.match(/\d+(\.\d+)*$/)) {
        // If the identifier to fix looks like "autoconf exception" without a "2.0" or "-2.0" suffix,
        // try to look for partial matches in the list of known exceptions (e.g. "autoconf-exception-2.0" and "autoconf-exception-3.0")
        const prefixMatchedIds = [ ...new Set(potentialIdentifiers.flatMap(knownExceptionIdentifiersStartingWith)) ]
        if (prefixMatchedIds.length > 1 && associatedLicense) {
            return selectBestMatchByAssociation(prefixMatchedIds, associatedLicense)
        } else {
            return prefixMatchedIds[0]
        }
    }

    return matchedIds[0]
}

type PartialExpandLicenseOptions = {
    expandScope?: boolean
}

type FullExpandLicenseOptions = {
    expandScope: boolean
}

export const expandLicenses = (identifiers: string[], providedOptions?: PartialExpandLicenseOptions): string[] => {
    const defaultOptions: FullExpandLicenseOptions = { expandScope: false }
    const effectiveOptions: FullExpandLicenseOptions = { ...defaultOptions, ...providedOptions }
    const expandedList = [...identifiers]
    identifiers.forEach(id => {
        if (id.match(/[^\+]\+$/)) {
            expandedList.push(id.replace(/\+$/, '-or-later'))
            expandedList.push(id.replace(/\+$/, '-and-later'))
            expandedList.push(id.replace(/\+$/, ''))
        } else if (id.match(/-(or|and)-later$/)) {
            expandedList.push(id.replace(/-or-later$/, '-and-later'))
            expandedList.push(id.replace(/-and-later$/, '-or-later'))
            expandedList.push(id.replace(/-(or|and)-later$/, ''))
        } else if (id.match(/-only$/)) {
            if (effectiveOptions.expandScope) {
                expandedList.push(id.replace(/-only$/, ''))
            }
        } else if (id.match(/[AL]?GPL\-\d\.\d$/)) {
            expandedList.push(`${id}-only`)
            expandedList.push(`${id}-or-later`)
            expandedList.push(`${id}-and-later`)
        }
    })
    return [...new Set(expandedList)].sort()
}

const selectBestMatchByAssociation = (candidateExceptionIds: string[], associatedLicense: string): string => {
    type StrengthOfRelation = { strength: number, exception: Exception }

    const strengthOfRelation = (exception: Exception, license?: string): StrengthOfRelation => {
        if (license) {
            const stronglyRelatedLicenses = expandLicenses(exception.relatedLicenses || [], { expandScope: false })
            if (stronglyRelatedLicenses.includes(license)) return { strength: 2, exception }

            const weaklyRelatedLicenses = expandLicenses(exception.relatedLicenses || [], { expandScope: true })
            if (weaklyRelatedLicenses.includes(license)) return { strength: 1, exception }
        }
        return { strength: 0, exception }
    }

    const possibleMatches = candidateExceptionIds
        .map(id => exceptions.exceptions.find(e => e.licenseExceptionId === id))
        .filter(e => !!e).map(e => e as Exception)
        .map(e => strengthOfRelation(e, associatedLicense))
        .sort((a: StrengthOfRelation, b: StrengthOfRelation) => b.strength - a.strength)
        .map(match => match.exception)

    if (possibleMatches.length > 0) {
        // In case there are multiple possible matches - typically because there are multiple
        // versions of a given exception (e.g. "Bison-exception-1.24" and "Bison-exception-2.2")
        // - we'll pick the last one, i.e. the most recent one:
        if (possibleMatches.length > 1) {
            const matchesAssociatedToLicense = possibleMatches.filter(e => expandLicenses(e.relatedLicenses || []).includes(associatedLicense))
            if (matchesAssociatedToLicense.length > 0) {
                return matchesAssociatedToLicense[0]?.licenseExceptionId
            }
        }
        return possibleMatches[0]?.licenseExceptionId
    }
    return candidateExceptionIds[0]
}

/**
 * Fix the given license identifier, if possible, or return it unchanged.
 *
 * @param identifier SPDX license identifier to "fix" if possible
 * @returns A corrected SPDX license identifier or the original, if no suitable "fix" was found
 */
export function correctLicenseId(identifier: string, upgradeGPLVariants: boolean): string {

    const mapLicense = (id: string): string|undefined => mapLicenseId(id) || mapLicenseAlias(id)

    // The `spdx-correct` package does not have fixes for everything (e.g. a common misspelling for the
    // zero-clause variant of the BSD license or for names such as "The Simplified BSD license") so we'll
    // check for a list of known aliases ourselves:
    const applyAliases = (id: string): string => {
        const lowercaseId = id.replace(/^the /i, '')
        return mapLicense(lowercaseId) || mapLicense(`the ${lowercaseId}`) || id
    }

    // The `spdx-correct` package will coerce "GPL-3.0" into "GPL-3.0-or-later", although
    // "GPL-3.0-only" would be more true to the original intent:
    const applyGPLFixes = (id: string): string => {
        const onlySuffix = upgradeGPLVariants ? '-only' : ''
        if (upgradeGPLVariants && mapLicense(id)) return mapLicense(`${id}${onlySuffix}`) || id
        if (id.toUpperCase() === 'GPL') return mapLicense(`GPL-3.0${onlySuffix}`) || id
        if (id.toUpperCase() === 'LGPL') return mapLicense(`LGPL-3.0${onlySuffix}`) || id
        if (id.toUpperCase() === 'AGPL') return mapLicense(`AGPL-3.0${onlySuffix}`) || id

        // Expand a single-digit "GPL2+" or "GPLv3" into a "-2.0+" or "-3.0" with the trailing zero
        if (id.match(/^([AL]?GPL)([\-vV]?)(\d)(\+?)$/)) {
            return applyGPLFixes(id.replace(/^([AL]?GPL)([\-vV]?)(\d)(\+?)$/, '$1-$3.0$4'))
        }

        // Correct the '-and-later' to the canonical '-or-later'
        if (id.match(/^([AL]?GPL.*)(\-and\-later)$/)) {
            const candidateId = id.replace(/([AL]?GPL.*)(\-and\-later)$/, '$1-or-later')
            return applyGPLFixes(candidateId) || id
        }

        // Expand the '+' syntax to the canonical '-or-later'
        if (id.match(/^([AL]?GPL[\-vV]?\d)(\+)$/)) {
            const candidateId = id.replace(/([AL]?GPL[\-vV]?\d)(\+)$/, '$1.0-or-later')
            return mapLicense(candidateId) || id
        }

        return id
    }

    // Expand the "+" syntax to "-or-later" if one exists:
    const expandPlus = (id: string): string => {
        if (id.match(/[^\+]\+$/)) {
            const orLaterId = id.replace(/\+$/, '-or-later')
            return mapLicense(orLaterId) || id
        }
        return id
    }

    // If the license identifier contains a "-with-" substring, it's an expression, not
    // a single identifier so let's not try to "fix" it at this point:
    if (identifier.includes('-with-')) return identifier

    const aliased = applyAliases(identifier)
    if (aliased !== identifier) {
        // the identifier was successfully aliased – let's retry with the alias!
        return correctLicenseId(aliased, upgradeGPLVariants)
    }

    const id = expandPlus(applyGPLFixes(aliased))
    return mapLicense(id) || fixLicenseId(id, upgradeGPLVariants) || id
}

/**
 * Fix the given exception identifier, if possible, or return it unchanged.
 *
 * @param identifier SPDX exception identifier to "fix" if possible
 * @returns A corrected SPDX exception identifier or the original, if no suitable "fix" was found
 */
export function correctExceptionId(identifier: string, associatedLicense?: string): string {

    const removeExtras = (id: string): string => {
        return id.trim()
            .replace(/^the\s+/i, '')
            .replace(/\s+/, ' ')
            .replace(/^gnu/, '')
            .trim()
    }

    const applyAliases = (id: string): string => {
        const lowercaseId = id.toLowerCase()
        const lowercaseIdWithoutWordVersion = lowercaseId.replace(/\s+version\s+(\d+)/, ' $1')
        return mapExceptionAlias(lowercaseId) || mapExceptionAlias(lowercaseIdWithoutWordVersion) || id
    }

    const id = applyAliases(removeExtras(identifier))
    return mapExceptionId(id) || fixExceptionid(id, associatedLicense) || id
}

export function isKnownLicenseId(id: string): boolean {
    return !!mapLicenseId(id)
}

export function isKnownExceptionId(id: string): boolean {
    return !!mapExceptionId(id)
}

export function fixDashedLicenseInfo(node: LicenseInfo, upgradeGPLVariants: boolean): LicenseInfo {
    if (!node.exception && node.license.includes('-with-') && !isKnownLicenseId(node.license)) {
        // let's see if we can map the parts to actual known identifiers
        const [splitLicense, splitException] = node.license.split('-with-')
        const fixedLicense = correctLicenseId(splitLicense, upgradeGPLVariants)
        const fixedException = correctExceptionId(splitException, fixedLicense)
        if (isKnownLicenseId(fixedLicense)) {
            return { license: fixedLicense, exception: fixedException } as LicenseInfo
        }
    }
    return node
}

export const variationsOf = (name: string, upgradeGPLVariants: boolean): string[] => {

    const versionPrefixVariationsOf = (_value: string): string[] => [' version ', ' v', ' ']

    const namePrefixVariationsOf = (value: string): string[] => {
        const namePrefixVariations = [value]
        if (value.startsWith('gnu ')) {
            namePrefixVariations.push(value.substring('gnu '.length))
        } else if (value.match(/^((lesser|affero) )?general public license/)) {
            namePrefixVariations.push(`gnu ${value}`)
        }
        return namePrefixVariations
    }

    const suffixVariationsOf = (value: string|undefined): string[] => {
        const fixedAlternatives = [' or greater', ' or later', ' or newer']
        if (value === undefined) {
            if (upgradeGPLVariants) {
                return ['', ' only']
            } else {
                return ['']
            }
        } else if (fixedAlternatives.includes(value)) {
            return [ value, ...fixedAlternatives.filter(x => x !== value) ]
        } else {
            return [value]
        }
    }

    const versionNumberVariationsOf = (value: string): string[] => {
        const versionNumberVariations = [value]
        if (value.endsWith('.0')) {
            // For "3.1.0", let's also try "3.1"
            versionNumberVariations.push(value.replace(/\.0$/, ''))
            if (value.endsWith('.0.0')) {
                // For "3.0.0", let's also try "3"
                versionNumberVariations.push(value.replace(/\.0\.0$/, ''))
            }
        } else if (!value.includes('.')) {
            // For "3", let's also try "3.0"
            versionNumberVariations.push(`${value}.0`)
        }
        return versionNumberVariations
    }

    const variations: string[] = [name]
    const versionMatch = name.match(/^(.+)(\sversion\s|\sv)(\d+(\.\d+)*)(\+|(\s.*))?$/)
    if (versionMatch) {
        const namePrefixVariations = namePrefixVariationsOf(versionMatch[1])
        const suffixVariations = suffixVariationsOf(versionMatch[5])
        const versionPrefixVariations = versionPrefixVariationsOf(versionMatch[2])
        const versionNumberVariations = versionNumberVariationsOf(versionMatch[3])

        namePrefixVariations.forEach(namePrefix => {
            versionPrefixVariations.forEach(versionPrefix => {
                versionNumberVariations.forEach(versionNumber => {
                    suffixVariations.forEach(suffix => {
                        variations.push(`${namePrefix}${versionPrefix}${versionNumber}${suffix}`)
                    })
                })
            })
        })
    }
    return variations.sort((a, b) => {
        const lengthBasedSort = b.length - a.length
        if (lengthBasedSort !== 0) {
            // string length is the primary sort key
            return lengthBasedSort
        } else {
            // between strings of equal length, sort alphabetically
            // (with uppercase "A" coming before lowercase "a")
            return a.localeCompare(b, undefined, { caseFirst: 'upper' })
        }
    })
}

/**
 * Try to identify the license by comparing the given text with the official names of
 * known licenses in the SPDX data.
 *
 * @param text The text that could be a license name
 * @returns The {@link License}, or `undefined`
 */
export const findNameBasedMatch = (text: string, upgradeGPLVariants: boolean): License|undefined => {
    const normalizeName = (name: string): string => {
        return name.toLowerCase().replace(/,/g, ' ').replace(/\s+/, ' ')
    }
    const lowercaseText = normalizeName(text)
    const variations = variationsOf(lowercaseText, upgradeGPLVariants)
    return licenses.licenses.find(x => variations.includes(normalizeName(x.name)))
}
