import https from 'https'
import fs from 'fs'
import os from 'os'
import path from 'path'
import crypto from 'crypto'
import { pipeline } from 'stream'


const LICENSE_FILE_URL = "https://raw.githubusercontent.com/spdx/license-list-data/master/json/licenses.json"
const EXCEPTIONS_FILE_URL = "https://raw.githubusercontent.com/spdx/license-list-data/master/json/exceptions.json"
const EXCEPTION_DETAILS_FILE_BASEURL = "https://raw.githubusercontent.com/spdx/license-list-data/master/json/exceptions/"
const DETAILS_DOWNLOAD_BATCH_SIZE = 10


const hash = (str) => {
    let shasum = crypto.createHash('sha1')
    shasum.update(str)
    return shasum.digest('hex')
}

const downloadJSON = async (url: string): Promise<object> => {
    const rawJson = await new Promise<string>((resolve, _reject) => {
        const tmpFilePath = path.join(os.tmpdir(), hash(url))
        https.get(url, { agent: false }, (response) => {
            const errorHandler = (err) => {
                if (err) {
                    console.warn(`Could not download JSON from ${url} - ${err}`)
                    resolve('{}')
                } else {
                    resolve(fs.readFileSync(tmpFilePath).toString())
                }
            }
            if (response.statusCode === 200) {
                pipeline(response, fs.createWriteStream(tmpFilePath), errorHandler)
            } else {
                errorHandler(`HTTP ${response.statusCode} ${response.statusMessage ? response.statusMessage : ''}`.trimEnd())
            }
        })
    })
    try {
        return JSON.parse(rawJson)
    } catch (err) {
        console.error(`Error parsing JSON from ${url}: ${err}\n\nRaw content:\n${rawJson}`)
        return {
            error: `Error parsing JSON from ${url}: ${err}`,
            details: `Raw content received:\n${rawJson}`
        }
    }
}

function sliceIntoChunks<T>(arr: Array<T>, chunkSize: number): Array<Array<T>> {
    const res: Array<Array<T>> = []
    for (let i = 0; i < arr.length; i += chunkSize) {
        const chunk = arr.slice(i, i + chunkSize)
        res.push(chunk)
    }
    return res
}

const downloadManyJSONFiles = async (arrayOfURLs: string[]): Promise<object[]> => {
    const batches = sliceIntoChunks(arrayOfURLs, DETAILS_DOWNLOAD_BATCH_SIZE)
    const results: object[] = []
    for (let b = 0; b < batches.length; b++) {
        const batch = batches[b]
        console.log(`Downloading batch ${b+1} (${batch.length} entries)`)
        const batchResults = await Promise.all(batch.map(downloadJSON))
        batchResults.forEach(result => results.push(result))
    }
    return results
}

const readLicenseListVersionFromJsonObject = (jsonObj) => {
    return jsonObj.licenseListVersion
}

const readLicensesFromFile = (file_path) => {
    if (fs.existsSync(file_path)) {
        const jsonObj = JSON.parse(fs.readFileSync(file_path).toString())
        return jsonObj.licenses.filter(x => !!x)
    }
    console.warn(`File ${file_path} does not exist - can't read licenses from it`)
    return []
}

const readLicenseListVersionFromFile = (file_path) => {
    if (fs.existsSync(file_path)) {
        const jsonObj = JSON.parse(fs.readFileSync(file_path).toString())
        return readLicenseListVersionFromJsonObject(jsonObj)
    }
    return ''
}

const updateFileFromURL = async (destinationFilePath, sourceUrl, entryListKey, detailsUrlMapper, detailsObjectMapper) => {
    const json = await downloadJSON(sourceUrl)
    const latestVersion = readLicenseListVersionFromJsonObject(json)
    const localVersion = readLicenseListVersionFromFile(destinationFilePath)
    if (!!latestVersion && latestVersion === localVersion) {
        console.log(`${destinationFilePath} already has version ${latestVersion} from ${sourceUrl} --> skip update`)
    } else {
        console.log(`Update available (from ${localVersion} to ${latestVersion}) --> updating ${entryListKey}`)
        const licensesInMainDocument = json[entryListKey]
        const urls = licensesInMainDocument.map(detailsUrlMapper).filter(url => !!url)
        const details = await downloadManyJSONFiles(urls)
        json[entryListKey] = details.filter(x => !!x && !(x as any).error).map(detailsObjectMapper).filter(x => !!x && (!!(x as any).licenseExceptionId || !!(x as any).licenseId))
        fs.writeFileSync(destinationFilePath, JSON.stringify(json, null, 2))
        console.log(`Updated ${destinationFilePath} with version ${latestVersion} from ${sourceUrl}`)
        const entriesWithMissingDetails = licensesInMainDocument.filter(x => !details.find(d => (d as any).licenseId === x.licenseId))
        if (entriesWithMissingDetails.length > 0) {
            console.warn(`Some entries (${entriesWithMissingDetails.length}) were missing from the details files. Got ${json[entryListKey].length} out of ${licensesInMainDocument.length} but failed on the following entries:\n${JSON.stringify(entriesWithMissingDetails, null, 2)}`)
        }
    }
}

const updateLicenseFileAt = async (destinationFilePath) => {
    const licenseDetailsUrlMapper = (license) => license.detailsUrl
    const licenseDetailsObjectMapper = (license) => {
        if (license && license.licenseId) {
            return {
                name: license.name,
                licenseId: license.licenseId,
                isDeprecatedLicenseId: !!license.isDeprecatedLicenseId,
                isOsiApproved: !!license.isOsiApproved,
                isFsfLibre: !!license.isFsfLibre,
                seeAlso: license.seeAlso
            }
        }
        return undefined
    }
    try {
        await updateFileFromURL(destinationFilePath, LICENSE_FILE_URL, 'licenses', licenseDetailsUrlMapper, licenseDetailsObjectMapper)
    } catch (err) {
        console.error(`Updating ${destinationFilePath} failed: ${err}`, err)
    }
}

function unique<T>(items: T[]): T[] {
    return [...new Set(items)]
}

const expandListOfKnownLicenses = (ids) => {
    ids.filter(id => !!id && id.endsWith('+')).forEach(id => {
        ids.push(id.replace(/\+$/, '-or-later'))
        ids.push(id.replace(/\+$/, '-and-later'))
    })
    return ids
}

const expandListOfMentionedLicenses = (words) => {
    words.filter(w => w === 'gpl').forEach(w => {
        words.push('gpl-2.0')
        words.push('gpl-3.0')
    })
    words.filter(w => w === 'lgpl').forEach(w => {
        words.push('lgpl-2.0')
        words.push('lgpl-2.1')
        words.push('lgpl-3.0')
    })
    words.filter(w => w.match(/^[al]?gpl.*\-and\-later$/)).forEach(w => {
        words.push(w.replace(/^([al]?gpl.*)\-and\-later$/, '$1-or-later'))
    })
    return words
}

const sanitizeSpecialCharacters = (text: string): string => {
    return text.replace(/[^a-zA-Z0-9\.\-\+]/g, ' ').replace(/\s+/g, ' ')
}

const findLicensesMentionedInLicenseComments = (licenses, entry, explicitGplVersionsOnly = true) => {
    const knownLicenseIds = expandListOfKnownLicenses(licenses.map(x => x.licenseId)).filter(x => !!x)
    const lowercaseLicenseIds = knownLicenseIds.map(x => x.toLowerCase())
    const textFromLicenseComments = sanitizeSpecialCharacters(entry.licenseComments || '').replace(/[\.,](\s|$)/g, ' ').replace(/(GPL)\s+(\d\.\d)/g, '$1-$2')
    const uniqueWords = unique(textFromLicenseComments.trim().split(/\s+/).map(w => w.toLowerCase()))
    const expandedWords = explicitGplVersionsOnly ? uniqueWords : expandListOfMentionedLicenses(uniqueWords)
    const licensesMentioned = expandedWords.filter(w => lowercaseLicenseIds.includes(w)).map(id => id.replace(/\+$/, '-or-later'))
    return licensesMentioned.map(lc => knownLicenseIds.find(x => x.toLowerCase() === lc))
}

const findLicensesMentionedInExceptionName = (licenses, entry, explicitGplVersionsOnly = true) => {
    const knownLicenseIds = expandListOfKnownLicenses(licenses.map(x => x.licenseId)).filter(x => !!x)
    const lowercaseLicenseIds = knownLicenseIds.map(x => x.toLowerCase())
    const text = sanitizeSpecialCharacters(entry.name || '').replace(/(GPL)\s+(\d\.\d)/g, '$1-$2').split(/\s+/).filter(w => w.startsWith('LGPL') || w.startsWith('GPL') || w.startsWith('AGPL')).join(' ').trim()
    const uniqueWords = unique(text.split(/\s+/).map(w => w.toLowerCase()))
    const expandedWords = explicitGplVersionsOnly ? uniqueWords : expandListOfMentionedLicenses(uniqueWords.map(w => w.replace(/\.$/, '')))
    const licensesMentioned = expandedWords.filter(w => lowercaseLicenseIds.includes(w)).map(id => id.replace(/\+$/, '-or-later'))
    return licensesMentioned.map(lc => knownLicenseIds.find(x => x.toLowerCase() === lc))
}

const extractLicenseIdentifiersReferredTo = (licenses, entry) => {
    const methods = [
        () => findLicensesMentionedInLicenseComments(licenses, entry, true),
        () => findLicensesMentionedInExceptionName(licenses, entry, true),
        () => findLicensesMentionedInLicenseComments(licenses, entry, false),
        () => findLicensesMentionedInExceptionName(licenses, entry, false)
    ]
    let mentions = []
    methods.forEach(method => {
        if (mentions.length === 0) {
            mentions = method()
        }
    })
    // for (let i=0; mentions.length === 0 && i < methods.length; i++) {
    //     mentions.push(methods[i]())
    // }
    return mentions.flat()
}

const updateExceptionsFileAt = async (exceptionsFilePath, licensesFilePath) => {
    const exceptionDetailsUrlMapper = (entry) => {
        if (entry.detailsUrl?.startsWith('http') && entry.detailsUrl?.endsWith('.json')) {
            return entry.detailsUrl
        }
        if (entry.licenseExceptionId) {
            return EXCEPTION_DETAILS_FILE_BASEURL + entry.licenseExceptionId + '.json'
        }
        console.warn(`Unexpected entry structure: ${JSON.stringify(entry, null, 2)}`)
        return undefined
    }
    const exceptionDetailsObjectMapper = (licenses) => {
        return (entry) => {
            let licensesMentionedInComments = extractLicenseIdentifiersReferredTo(licenses, entry)
            return {
                licenseExceptionId: entry.licenseExceptionId,
                isDeprecatedLicenseId: entry.isDeprecatedLicenseId,
                // licenseExceptionText: entry.licenseExceptionText,
                name: entry.name,
                seeAlso: entry.seeAlso,
                licenseComments: entry.licenseComments,
                relatedLicenses: licensesMentionedInComments,
            }
        }
    }
    try {
        const licenses = readLicensesFromFile(licensesFilePath)
        await updateFileFromURL(exceptionsFilePath, EXCEPTIONS_FILE_URL, 'exceptions', exceptionDetailsUrlMapper, exceptionDetailsObjectMapper(licenses))
    } catch (err) {
        console.error(`Updating ${exceptionsFilePath} failed: ${err}`, err)
    }
}

const fileIsOlderThan = (oldestAcceptableTimestamp, filePath) => {
    return fs.statSync(filePath).mtime < oldestAcceptableTimestamp
}

async function updateLicenseFileIfOlderThan(oldestAcceptableTimestamp: Date, licenseFilePath: string) {
    if (!fs.existsSync(licenseFilePath) || fileIsOlderThan(oldestAcceptableTimestamp, licenseFilePath)) {
        return await updateLicenseFileAt(licenseFilePath)
    } else {
        console.log(`Not updating ${licenseFilePath} (it's recent enough)`)
    }
}

async function updateExceptionsFileIfOlderThan(oldestAcceptableTimestamp: Date, exceptionsFilePath: string, licenseFilePath: string) {
    if (!fs.existsSync(exceptionsFilePath) || fileIsOlderThan(oldestAcceptableTimestamp, exceptionsFilePath)) {
        return await updateExceptionsFileAt(exceptionsFilePath, licenseFilePath)
    } else {
        console.log(`Not updating ${exceptionsFilePath} (it's recent enough)`)
    }
}

function dateHoursBeforeNow(hours: number): Date {
    const d = new Date()
    const nowInMillis = d.getTime()
    return new Date(nowInMillis - hours * 60 * 60 * 1000)
}

async function main(licenseFilePath: string, exceptionsFilePath: string) {
    const oldestAcceptableTimestamp = dateHoursBeforeNow(24)
    await updateLicenseFileIfOlderThan(oldestAcceptableTimestamp, licenseFilePath)
    await updateExceptionsFileIfOlderThan(oldestAcceptableTimestamp, exceptionsFilePath, licenseFilePath)
    console.log('Done.')
}

(async () => {
    try {
        const [licenseFilePath, exceptionsFilePath] = process.argv.slice(2)
        await main(licenseFilePath, exceptionsFilePath)
    } catch (e) {
        console.error(e)
    }
})()
