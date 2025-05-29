import fs from "fs";
import { generateLicenseData, Licenses, License, Exceptions, Exception } from "licenses-from-spdx";

import { extractLicenseIdentifiersReferredTo } from "./license-data-enrichment";
import { tmpdir } from "os";
import { join } from "path";

type InternalLicense = {
    name: string;
    licenseId: string;
    deprecated: boolean;
};

type InternalException = {
    name: string;
    licenseExceptionId: string;
    relatedLicenses: string[];
    deprecated: boolean;
};

async function updateLicenseFileAt(destinationFilePath: string, licenses: Licenses) {
    const licenseDetailsObjectMapper = (license: License): InternalLicense => {
        return {
            name: license.name,
            licenseId: license.licenseId,
            deprecated: license.isDeprecated || false,
        };
    };
    try {
        const internalLicenses = licenses.licenses.map(licenseDetailsObjectMapper);
        fs.writeFileSync(destinationFilePath, JSON.stringify(internalLicenses, null, 2));
    } catch (err) {
        console.error(`Updating ${destinationFilePath} failed: ${err}`, err);
    }
}

async function updateExceptionsFileAt(destinationFilePath: string, exceptions: Exceptions, licenses: Licenses) {
    const exceptionDetailsObjectMapper = (entry: Exception): InternalException => {
        return {
            name: entry.name,
            licenseExceptionId: entry.licenseExceptionId,
            relatedLicenses: extractLicenseIdentifiersReferredTo(licenses.licenses, entry),
            deprecated: entry.isDeprecated || false,
        };
    };
    try {
        const internalExceptions = exceptions.exceptions.map(exceptionDetailsObjectMapper);
        fs.writeFileSync(destinationFilePath, JSON.stringify(internalExceptions, null, 2));
    } catch (err) {
        console.error(`Updating ${destinationFilePath} failed: ${err}`, err);
    }
}

const counter = (() => {
    let counter = 0;
    return (): number => {
        return counter++;
    };
})();

function tmpfile(): string {
    const maxAttempts = 1000000;
    for (let i = 0; i < maxAttempts; i++) {
        const file = join(tmpdir(), `${Date.now()}${counter()}`);
        if (!fs.existsSync(file)) {
            return file;
        }
    }
    throw new Error(`Failed to create a unique temporary file after ${maxAttempts} attempts`);
}

async function main(licenseFilePath: string, exceptionsFilePath: string) {
    // use licenses-from-spdx to generate the license and exceptions data in temporary files
    const options = {
        excludeHtml: true,
        excludeTemplates: true,
        excludeText: true,
    };
    const { licenses, exceptions } = await generateLicenseData(tmpfile(), tmpfile(), options);

    // Update exceptions file with related licenses
    await updateExceptionsFileAt(exceptionsFilePath, exceptions, licenses);

    // Trim down the license file now that we've updated the exceptions file
    await updateLicenseFileAt(licenseFilePath, licenses);
}

(async () => {
    try {
        const [licenseFilePath, exceptionsFilePath] = process.argv.slice(2);
        await main(licenseFilePath, exceptionsFilePath);
    } catch (e) {
        console.error(e);
    }
})();
