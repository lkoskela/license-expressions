import spdxCorrect from 'spdx-correct'

import { licenses, Licenses, License, exceptions, Exceptions, Exception } from './data'
export { licenses, Licenses, License, exceptions, Exceptions, Exception }


type MapOfIds = {
    get: (id: string) => string | undefined,
}

const createMapOfIds = (ids: string[]): MapOfIds => {
    const mutilateId = (id: string): string => id.toUpperCase().replace(/[^0-9a-zA-Z\+]/g, '')
    const listOfOfficialIds: string[] = ids
    const mapOfLowercaseIds: Map<string, string> = new Map()
    const mapOfMutilatedIds: Map<string, string> = new Map()
    listOfOfficialIds.forEach(id => {
        mapOfLowercaseIds.set(id.toLowerCase(), id)
        mapOfMutilatedIds.set(mutilateId(id), id)
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
    const get = (id: string): string | undefined => {
        return getExactMatch(id) || getCaseInsensitiveMatch(id) || getFuzzyMatch(id)
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
    if (id.match(/([a-zA-Z_0-9]+(\-[a-zA-Z_0-9]+)*)\-\d+(\.\d+)+(\-[a-zA-Z_0-9]+)*/)) {
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
    const variations: string[] = [
        id.replace(/\s+/, '-'),
        id.replace(/\s+version\s+/i, ' '),
        id.replace(/(\d+)$/, '$1.0')
    ]
    const matchedIds = variations.map(mapExceptionId)
    return matchedIds.filter(matchedId => !!matchedId)[0]
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
        if (mapLicense(id)) {
            return mapLicense(`${id}-only`) || id
        }
        return id
    }

    // Expand the "+" syntax to "-or-later" if one exists:
    const expandPlus = (id: string): string => {
        if (id.endsWith('+')) {
            const orLaterId = id.replace(/\+$/, '-or-later')
            if (mapLicense(orLaterId)) {
                return orLaterId
            }
        }
        return id
    }

    const id = expandPlus(applyGPLFixes(applyAliases(identifier)))

    return mapLicense(id) || fixLicenseId(id) || id
}

/**
 * Fix the given exception identifier, if possible, or return it unchanged.
 *
 * @param identifier SPDX exception identifier to "fix" if possible
 * @returns A corrected SPDX exception identifier or the original, if no suitable "fix" was found
 */
export function correctExceptionId(identifier: string): string {

    const removeExtras = (id: string): string => {
        return id.replace(/^the\s+/i, '').replace(/\s+/, ' ')
    }

    const applyAliases = (id: string): string => {
        const lowercaseId = id.toLowerCase()
        const lowercaseIdWithoutWordVersion = lowercaseId.replace(/\s+version\s+(\d+)/, ' $1')
        return mapExceptionAlias(lowercaseId) || mapExceptionAlias(lowercaseIdWithoutWordVersion) || id
    }

    const id = applyAliases(removeExtras(identifier))
    return mapExceptionId(id) || fixExceptionid(id) || id
}
