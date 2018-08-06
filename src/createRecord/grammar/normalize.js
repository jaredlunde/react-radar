export const trim = /^\s+|\s+$/g
export const normalizeLeftBracket = /\s*\{\s*/g
export const normalizeRightBracket = /\s*\}/g
export const normalizeWhitespace = /[\s]+/g
export const normalize = fields => fields.replace(normalizeWhitespace,' ')
                                         .replace(normalizeLeftBracket, ' {')
                                         .replace(normalizeRightBracket, '}')
                                         .replace(trim, '')
