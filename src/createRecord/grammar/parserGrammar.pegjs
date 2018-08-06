/**
field1
field2 {
  field3 {
    username
  }
  field4
}
**/


start
  = composition


/////////////////////////
// Grammar Descriptors //
/////////////////////////

_ 'whitespace'
  = [ \t\r\n]*


NUM 'number'
  = [0-9]


ALPHA_ 'alpha or underscore character'
  = [a-z]i / [_]


WORD 'word character'
  = word: (ALPHA_ / NUM) {
      return word
    }


///////////////////////////
// Composition Constants //
///////////////////////////

SHAPE_START 'shape block'
  = _ '{' _


SHAPE_END 'shape end block'
  = FIELD_SEP*
    _ '}'


FIELD_SEP 'field separator'
  =   (_ ',' _)
    / ([ \n]  _)


/////////////////////////
// Composition Grammar //
/////////////////////////

composition
  = _
    fields: fields
    _ {
      return fields
    }


////////////////////
// Fields Grammar //
////////////////////

fields 'fields'
 = field_: field
   fields: (FIELD_SEP field:field {return field})* {
     return [field_].concat(fields)
   }


field 'field'
  = name: fieldName
    shape: shape? {
      return {name, shape}
    }


fieldName 'field name'
  = first: ALPHA_
    rest: WORD* {
      return `${first}${rest.join('')}`
    }


///////////////////
// Shape Grammar //
///////////////////

shape 'shape'
  = SHAPE_START
    fields: fields?
    SHAPE_END {
      return fields || []
    }
