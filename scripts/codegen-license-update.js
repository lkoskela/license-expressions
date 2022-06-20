#!/usr/bin/env node

const https = require('https')
const fs = require('fs')
const os = require('os')
const path = require('path')
var crypto = require('crypto')
const { pipeline } = require('stream')

const LICENSE_FILE_URL = "https://raw.githubusercontent.com/spdx/license-list-data/master/json/licenses.json"
const EXCEPTIONS_FILE_URL = "https://raw.githubusercontent.com/spdx/license-list-data/master/json/exceptions.json"

const hash = (str) => {
    var shasum = crypto.createHash('sha1')
    shasum.update(str)
    return shasum.digest('hex')
}

const downloadJSON = async (url) => {
    const rawJson = await new Promise((resolve, reject) => {
        const tmpFilePath = path.join(os.tmpdir(), hash(url))
        https.get(url, (response) => {
            const errorHandler = (err) => {
                if (err) { reject(err) }
                else { resolve(fs.readFileSync(tmpFilePath)) }
            }
            pipeline(response, fs.createWriteStream(tmpFilePath), errorHandler)
        })
    })
    try {
        return JSON.parse(rawJson)
    } catch (err) {
        console.error(`Error parsing JSON from ${url}: ${err}\nJSON: ${rawJson}`)
        return {}
    }
}

const readLicenseListVersionFromJsonObject = (jsonObj) => {
    return jsonObj.licenseListVersion
}

const readLicenseListVersionFromFile = (file_path) => {
    if (fs.existsSync(file_path)) {
        const jsonObj = JSON.parse(fs.readFileSync(file_path))
        return readLicenseListVersionFromJsonObject(jsonObj)
    }
    return ''
}

const updateFileFromURL = async (destinationFilePath, sourceUrl, entryListKey) => {
    const json = await downloadJSON(sourceUrl)
    const latestVersion = readLicenseListVersionFromJsonObject(json)
    const localVersion = readLicenseListVersionFromFile(destinationFilePath)
    if (!!latestVersion && latestVersion === localVersion) {
        console.log(`${destinationFilePath} already has version ${latestVersion} from ${sourceUrl} --> skip update`)
    } else {
        console.log(`Update available (from ${localVersion} to ${latestVersion}) --> updating ${entryListKey}`)
        fs.writeFileSync(destinationFilePath, JSON.stringify(json, null, 2))
        console.log(`Updated ${destinationFilePath} with version ${latestVersion} from ${sourceUrl}`)
    }
}

const updateLicenseFileAt = async (destinationFilePath) => {
    try {
        await updateFileFromURL(destinationFilePath, LICENSE_FILE_URL, 'licenses')
    } catch (err) {
        console.error(`Updating ${destinationFilePath} failed: ${err}`)
    }
}

const updateExceptionsFileAt = async (destinationFilePath) => {
    try {
        await updateFileFromURL(destinationFilePath, EXCEPTIONS_FILE_URL, 'exceptions')
    } catch (err) {
        console.error(`Updating ${destinationFilePath} failed: ${err}`)
    }
}

const main = async (licenseFilePath, exceptionsFilePath) => {
    await updateLicenseFileAt(licenseFilePath)
    await updateExceptionsFileAt(exceptionsFilePath)
}

(async () => {
    try {
        const [licenseFilePath, exceptionsFilePath] = process.argv.slice(2)
        await main(licenseFilePath, exceptionsFilePath)
    } catch (e) {
        console.error(e)
    }
})()
