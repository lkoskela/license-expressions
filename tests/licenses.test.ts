import assert from 'assert'

import { licenses, findNameBasedMatch, variationsOf } from '../src/licenses'

describe('Find a name-based match for a license', () => {

    describe('all licenses currently in our database', () => {
        const licenseNames = licenses.licenses.map(license => license.name).sort()
        licenseNames.forEach(name => {
            it(name, () => expect(findNameBasedMatch(name)).not.toBeUndefined())
        })
    })

    describe('slight variations do not prevent a match', () => {

        it('trailing ".0" in a version number can be omitted', () => {
            expect(findNameBasedMatch("GNU Affero General Public License v3.0")).not.toBeUndefined()
            expect(findNameBasedMatch("GNU Affero General Public License v3")).not.toBeUndefined()
        })
    })
})

describe('variationsOf', () => {
    it('GPL v3', () => {
        expect(variationsOf('GPL v3'.toLowerCase())).toContain('GPL v3.0'.toLowerCase())
    })

    it('GNU Affero General Public License v3.0', () => {
        const variations = variationsOf('GNU Affero General Public License v3.0'.toLowerCase())
        expect(variations).toContain('Affero General Public License v3.0'.toLowerCase())
        expect(variations).toContain('GNU Affero General Public License v3.0'.toLowerCase())
        expect(variations).toContain('GNU Affero General Public License v3'.toLowerCase())
        expect(variations).toContain('GNU Affero General Public License version 3'.toLowerCase())
        expect(variations).toContain('GNU Affero General Public License version 3.0'.toLowerCase())
    })

    it('GNU Lesser General Public License v3.0', () => {
        const variations = variationsOf('GNU Lesser General Public License v3.0'.toLowerCase())
        expect(variations).toContain('Lesser General Public License v3.0'.toLowerCase())
        expect(variations).toContain('GNU Lesser General Public License v3.0'.toLowerCase())
        expect(variations).toContain('GNU Lesser General Public License v3'.toLowerCase())
        expect(variations).toContain('GNU Lesser General Public License version 3'.toLowerCase())
        expect(variations).toContain('GNU Lesser General Public License version 3.0'.toLowerCase())
    })
})