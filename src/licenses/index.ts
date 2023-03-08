import spdxCorrect from 'spdx-correct'

import { permutationsOf } from '../utils/permutations'
import { LicenseInfo } from '../parser/types'
import { licenses, Licenses, License, exceptions, Exceptions, Exception } from './data'
export { licenses, Licenses, License, exceptions, Exceptions, Exception }


type MapOfIds = {
    get: (id: string) => string | undefined,
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
    return { get } as MapOfIds
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

    return mapOfAliases
})()

const aliasesForExceptions: Map<string, string> = ((): Map<string, string> => {
    const mapOfAliases = new Map<string, string>()
    mapOfAliases.set('qwt license 1.0', 'Qwt-exception-1.0')
    mapOfAliases.set('cpe', 'Classpath-exception-2.0')
    return mapOfAliases
})()

const mapLicenseAlias = (alias: string): string | undefined => {
    return aliasesForLicenseIds.get(alias.toLowerCase())
}

const mapLicenseId = (id: string): string | undefined => {
    return mapOfKnownLicenses.get(id.toLowerCase())
}

const fixLicenseId = (id: string): string | null => {
    // Don't try to correct license identifiers that are syntactically legit on the
    // surface and have an explicit version number such as "3.0" or "2.1":
    if (id.match(/(\w+(\-\w+)*)\-\d+(\.\d+)+(\-\w+)*/)) {
        return id
    }

    // Use `spdx-correct` to try and correct identifiers that we haven't fixed already:
    return spdxCorrect(id, { upgrade: true })
}

const mapExceptionAlias = (alias: string): string | undefined => {
    return aliasesForExceptions.get(alias.toLowerCase())
}

const mapExceptionId = (id: string): string | undefined => {
    return mapOfKnownExceptions.get(id.toLowerCase())
}

const fixExceptionid = (id: string): string | undefined => {
    type Mutation = (s: string) => string

    const mutations: Mutation[] = [
        (id: string): string => id.replace(/\s+/, '-'),
        (id: string): string => id.replace(/\s+version\s+/i, ' '),
        (id: string): string => id.replace(/([^.])(\d+)$/, '$1$2.0'),   // replace a trailing "3" with "3.0" but don't append another ".0" to e.g. "3.0"
        (id: string): string => id.replace(/^GNU (.*)$/i, '$1')
    ]
    const permutations = permutationsOf<Mutation>(mutations, 3)
    const potentialIdentifiers = permutations.map((combo: Mutation[]): string => {
        const initialValue = combo[0](id)
        return combo.slice(1).reduce((prev, curr) => curr(prev), initialValue)
    })
    const matchedIds = [ ...new Set(potentialIdentifiers.map(mapExceptionId).filter(id => !!id)) ]
    if (matchedIds.length > 1) console.warn(`fixExceptionId(${JSON.stringify(id)}) found ${matchedIds.length} matches through mutations: ${JSON.stringify(matchedIds)}`)
    return matchedIds[0]
}

const mapExceptionIdByAssociatedLicense = (id: string, associatedLicense?: string): string|undefined => {
    const expandLicenses = (identifiers: string[]): string[] => {
        const expandedList = [...identifiers]
        identifiers.forEach(id => {
            if (id.match(/[^\+]\+$/)) {
                expandedList.push(id.replace(/\+$/, '-or-later'))
                expandedList.push(id.replace(/\+$/, ''))
            } else if (id.match(/-or-later$/)) {
                expandedList.push(id.replace(/-or-later$/, ''))
            } else if (id.match(/-only$/)) {
                expandedList.push(id.replace(/-only$/, ''))
            } else if (id.match(/[AL]?GPL\-\d\.\d$/)) {
                expandedList.push(`${id}-only`)
                expandedList.push(`${id}-or-later`)
            }
        })
        return expandedList
    }
    if (associatedLicense) {
        const possibleMatches = exceptions.exceptions.filter(e => {
            const hasRelation = () => {
                const relatedLicenses = expandLicenses(e.relatedLicenses)
                return relatedLicenses.length === 0 || relatedLicenses.includes(associatedLicense)
            }
            const looksSimilar = () => {
                return e.licenseExceptionId.toLowerCase().startsWith(id.toLowerCase())
            }
            return looksSimilar() && hasRelation()
        }).map(e => e.licenseExceptionId).sort()
        if (possibleMatches.length > 0) {
            return possibleMatches[0]
        }
    }
    return undefined
}

/**
 * Fix the given license identifier, if possible, or return it unchanged.
 *
 * @param identifier SPDX license identifier to "fix" if possible
 * @returns A corrected SPDX license identifier or the original, if no suitable "fix" was found
 */
export function correctLicenseId(identifier: string): string {

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
        if (id.toUpperCase() === 'GPL') return mapLicense('GPL-3.0-only') || id
        if (id.toUpperCase() === 'LGPL') return mapLicense('LGPL-3.0-only') || id
        if (id.toUpperCase() === 'AGPL') return mapLicense('AGPL-3.0-only') || id

        // If the id is already a known license, also check if there's a "-only" version
        if (mapLicense(id)) {
            return mapLicense(`${id}-only`) || id
        }

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

    const id = expandPlus(applyGPLFixes(applyAliases(identifier)))

    return mapLicense(id) || fixLicenseId(id) || id
}

/**
 * Fix the given exception identifier, if possible, or return it unchanged.
 *
 * @param identifier SPDX exception identifier to "fix" if possible
 * @returns A corrected SPDX exception identifier or the original, if no suitable "fix" was found
 */
export function correctExceptionId(identifier: string, associatedLicense?: string): string {

    const removeExtras = (id: string): string => {
        return id.replace(/^the\s+/i, '').replace(/\s+/, ' ')
    }

    const applyAliases = (id: string): string => {
        const lowercaseId = id.toLowerCase()
        const lowercaseIdWithoutWordVersion = lowercaseId.replace(/\s+version\s+(\d+)/, ' $1')
        return mapExceptionAlias(lowercaseId) || mapExceptionAlias(lowercaseIdWithoutWordVersion) || id
    }

    const id = applyAliases(removeExtras(identifier))
    return mapExceptionId(id) || fixExceptionid(id) || mapExceptionIdByAssociatedLicense(id, associatedLicense) || id
}

export function isKnownLicenseId(id: string): boolean {
    return !!mapLicenseId(id)
}

export function isKnownExceptionId(id: string): boolean {
    return !!mapExceptionId(id)
}

export function fixDashedLicenseInfo(node: LicenseInfo): LicenseInfo {
    if (!node.exception && node.license.includes('-with-') && !isKnownLicenseId(node.license)) {
        // let's see if we can map the parts to actual known identifiers
        const [splitLicense, splitException] = node.license.split('-with-')
        const fixedLicense = correctLicenseId(splitLicense)
        const fixedException = correctExceptionId(splitException, fixedLicense)
        if (isKnownLicenseId(fixedLicense)) {
            return { license: fixedLicense, exception: fixedException } as LicenseInfo
        }
    }
    return node
}
