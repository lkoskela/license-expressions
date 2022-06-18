import parse from '../src'

describe('String with a single identifier', () => {

    it('should be returned as-is', () => {
        const result = parse('GPL-3.0')
        expect(result).toBe('GPL-3.0')
    })

    it('should be returned without leading/trailing whitespace', () => {
        expect(parse(' \t \n GPL-3.0')).toBe('GPL-3.0')
        expect(parse('GPL-3.0 \t \n ')).toBe('GPL-3.0')
    })
})
