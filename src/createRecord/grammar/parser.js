export default (function() {
  "use strict";

  function p$subclass(child, parent) {
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor();
  }

  function p$SE(message, expected, found, location) {
    this.message  = message;
    this.expected = expected;
    this.found    = found;
    this.location = location;
    this.name     = "SyntaxError";

    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, p$SE);
    }
  }

  p$subclass(p$SE, Error);

  p$SE.buildMessage = function(expected, found) {
    var DESCRIBE_E_FNS = {
          literal: function(E) {
            return "\"" + literalEscape(E.text) + "\"";
          },

          "class": function(E) {
            var escapedParts = "",
                i;

            for (i = 0; i < E.parts.length; i++) {
              escapedParts += E.parts[i] instanceof Array
                ? classEscape(E.parts[i][0]) + "-" + classEscape(E.parts[i][1])
                : classEscape(E.parts[i]);
            }

            return "[" + (E.inverted ? "^" : "") + escapedParts + "]";
          },

          any: function(E) {
            return "any character";
          },

          end: function(E) {
            return "end of input";
          },

          other: function(E) {
            return E.description;
          }
        };

    function hex(ch) {
      return ch.charCodeAt(0).toString(16).toUpperCase();
    }

    function literalEscape(s) {
      return s
        .replace(/\\/g, '\\\\')
        .replace(/"/g,  '\\"')
        .replace(/\0/g, '\\0')
        .replace(/\t/g, '\\t')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/[\x00-\x0F]/g,          function(ch) { return '\\x0' + hex(ch); })
        .replace(/[\x10-\x1F\x7F-\x9F]/g, function(ch) { return '\\x'  + hex(ch); });
    }

    function classEscape(s) {
      return s
        .replace(/\\/g, '\\\\')
        .replace(/\]/g, '\\]')
        .replace(/\^/g, '\\^')
        .replace(/-/g,  '\\-')
        .replace(/\0/g, '\\0')
        .replace(/\t/g, '\\t')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/[\x00-\x0F]/g,          function(ch) { return '\\x0' + hex(ch); })
        .replace(/[\x10-\x1F\x7F-\x9F]/g, function(ch) { return '\\x'  + hex(ch); });
    }

    function describeE(E) {
      return DESCRIBE_E_FNS[E.type](E);
    }

    function describeExpected(expected) {
      var descriptions = new Array(expected.length),
          i, j;

      for (i = 0; i < expected.length; i++) {
        descriptions[i] = describeE(expected[i]);
      }

      descriptions.sort();

      if (descriptions.length > 0) {
        for (i = 1, j = 1; i < descriptions.length; i++) {
          if (descriptions[i - 1] !== descriptions[i]) {
            descriptions[j] = descriptions[i];
            j++;
          }
        }
        descriptions.length = j;
      }

      switch (descriptions.length) {
        case 1:
          return descriptions[0];

        case 2:
          return descriptions[0] + " or " + descriptions[1];

        default:
          return descriptions.slice(0, -1).join(", ")
            + ", or "
            + descriptions[descriptions.length - 1];
      }
    }

    function describeFound(found) {
      return found ? "\"" + literalEscape(found) + "\"" : "end of input";
    }

    return "Expected " + describeExpected(expected) + " but " + describeFound(found) + " found.";
  };

  function p$parse(input, options) {
    options = options !== void 0 ? options : {};

    var p$FAILED = {},

        p$startRuleIndices = { start: 0 },
        p$startRuleIndex   = 0,

        p$consts = [
          p$otherE("whitespace"),
          /^[ \t\r\n]/,
          p$classE([" ", "\t", "\r", "\n"], false, false),
          p$otherE("number"),
          /^[0-9]/,
          p$classE([["0", "9"]], false, false),
          p$otherE("alpha or underscore character"),
          /^[a-z]/i,
          p$classE([["a", "z"]], false, true),
          /^[_]/,
          p$classE(["_"], false, false),
          p$otherE("word character"),
          function(word) {
                return word
              },
          p$otherE("shape block"),
          "{",
          p$literalE("{", false),
          p$otherE("shape end block"),
          "}",
          p$literalE("}", false),
          p$otherE("field separator"),
          ",",
          p$literalE(",", false),
          /^[ \n]/,
          p$classE([" ", "\n"], false, false),
          function(fields) {
                return fields
              },
          p$otherE("fields"),
          function(field_, field) {return field},
          function(field_, fields) {
               return [field_].concat(fields)
             },
          p$otherE("field"),
          function(name, shape) {
                return {name, shape}
              },
          p$otherE("field name"),
          function(first, rest) {
                return `${first}${rest.join('')}`
              },
          p$otherE("shape"),
          function(fields) {
                return fields || []
              }
        ],

        p$bytecode = [
          p$d(";("),
          p$d("<$4!\"\"5!7\"0)*4!\"\"5!7\"&=.\" 7 "),
          p$d("<4$\"\"5!7%=.\" 7#"),
          p$d("<4'\"\"5!7(.) &4)\"\"5!7*=.\" 7&"),
          p$d("<%;#.# &;\"/' 8!:,!! )=.\" 7+"),
          p$d("<%;!/;#2.\"\"6.7//,$;!/#$+#)(#'#(\"'#&'#=.\" 7-"),
          p$d("<%$;'0#*;'&/;#;!/2$21\"\"6172/#$+#)(#'#(\"'#&'#=.\" 70"),
          p$d("<%;!/;#24\"\"6475/,$;!/#$+#)(#'#(\"'#&'#.< &%46\"\"5!77/,#;!/#$+\")(\"'#&'#=.\" 73"),
          p$d("%;!/:#;)/1$;!/($8#:8#!!)(#'#(\"'#&'#"),
          p$d("<%;*/k#$%;'/2#;*/)$8\"::\"\"$ )(\"'#&'#0<*%;'/2#;*/)$8\"::\"\"$ )(\"'#&'#&/)$8\":;\"\"! )(\"'#&'#=.\" 79"),
          p$d("<%;+/7#;,.\" &\"/)$8\":=\"\"! )(\"'#&'#=.\" 7<"),
          p$d("<%;#/9#$;$0#*;$&/)$8\":?\"\"! )(\"'#&'#=.\" 7>"),
          p$d("<%;%/?#;).\" &\"/1$;&/($8#:A#!!)(#'#(\"'#&'#=.\" 7@")
        ],

        p$currPos          = 0,
        p$savedPos         = 0,
        p$pDC  = [{ line: 1, column: 1 }],
        p$maxFPos       = 0,
        p$mFE  = [],
        p$silentFs      = 0,

        p$resultsCache = {},

        p$result;

    if ("startRule" in options) {
      if (!(options.startRule in p$startRuleIndices)) {
        throw new Error("Can't start parsing from rule \"" + options.startRule + "\".");
      }

      p$startRuleIndex = p$startRuleIndices[options.startRule];
    }

    function text() {
      return input.substring(p$savedPos, p$currPos);
    }

    function location() {
      return cL(p$savedPos, p$currPos);
    }

    function expected(description, location) {
      location = location !== void 0 ? location : cL(p$savedPos, p$currPos)

      throw p$bSE(
        [p$otherE(description)],
        input.substring(p$savedPos, p$currPos),
        location
      );
    }

    function error(message, location) {
      location = location !== void 0 ? location : cL(p$savedPos, p$currPos)

      throw p$buildSimpleError(message, location);
    }

    function p$literalE(text, ignoreCase) {
      return { type: "literal", text: text, ignoreCase: ignoreCase };
    }

    function p$classE(parts, inverted, ignoreCase) {
      return { type: "class", parts: parts, inverted: inverted, ignoreCase: ignoreCase };
    }

    function p$anyE() {
      return { type: "any" };
    }

    function p$endE() {
      return { type: "end" };
    }

    function p$otherE(description) {
      return { type: "other", description: description };
    }

    function cPD(pos) {
      var details = p$pDC[pos], p;

      if (details) {
        return details;
      } else {
        p = pos - 1;
        while (!p$pDC[p]) {
          p--;
        }

        details = p$pDC[p];
        details = {
          line:   details.line,
          column: details.column
        };

        while (p < pos) {
          if (input.charCodeAt(p) === 10) {
            details.line++;
            details.column = 1;
          } else {
            details.column++;
          }

          p++;
        }

        p$pDC[pos] = details;
        return details;
      }
    }

    function cL(startPos, endPos) {
      var startPosDetails = cPD(startPos),
          endPosDetails   = cPD(endPos);

      return {
        start: {
          offset: startPos,
          line:   startPosDetails.line,
          column: startPosDetails.column
        },
        end: {
          offset: endPos,
          line:   endPosDetails.line,
          column: endPosDetails.column
        }
      };
    }

    function p$fail(expected) {
      if (p$currPos < p$maxFPos) { return; }

      if (p$currPos > p$maxFPos) {
        p$maxFPos = p$currPos;
        p$mFE = [];
      }

      p$mFE.push(expected);
    }

    function p$buildSimpleError(message, location) {
      return new p$SE(message, null, null, location);
    }

    function p$bSE(expected, found, location) {
      return new p$SE(
        p$SE.buildMessage(expected, found),
        expected,
        found,
        location
      );
    }

    function p$d(s) {
      var bc = new Array(s.length), i;

      for (i = 0; i < s.length; i++) {
        bc[i] = s.charCodeAt(i) - 32;
      }

      return bc;
    }

    function p$parseRule(index) {
      var bc    = p$bytecode[index],
          ip    = 0,
          ips   = [],
          end   = bc.length,
          ends  = [],
          stack = [],
          params, i;

      var key    = p$currPos * 13 + index,
          cached = p$resultsCache[key];

      if (cached) {
        p$currPos = cached.nextPos;

        return cached.result;
      }

      while (true) {
        while (ip < end) {
          switch (bc[ip]) {
            case 0:
              stack.push(p$consts[bc[ip + 1]]);
              ip += 2;
              break;

            case 1:
              stack.push(void 0);
              ip++;
              break;

            case 2:
              stack.push(null);
              ip++;
              break;

            case 3:
              stack.push(p$FAILED);
              ip++;
              break;

            case 4:
              stack.push([]);
              ip++;
              break;

            case 5:
              stack.push(p$currPos);
              ip++;
              break;

            case 6:
              stack.pop();
              ip++;
              break;

            case 7:
              p$currPos = stack.pop();
              ip++;
              break;

            case 8:
              stack.length -= bc[ip + 1];
              ip += 2;
              break;

            case 9:
              stack.splice(-2, 1);
              ip++;
              break;

            case 10:
              stack[stack.length - 2].push(stack.pop());
              ip++;
              break;

            case 11:
              stack.push(stack.splice(stack.length - bc[ip + 1], bc[ip + 1]));
              ip += 2;
              break;

            case 12:
              stack.push(input.substring(stack.pop(), p$currPos));
              ip++;
              break;

            case 13:
              ends.push(end);
              ips.push(ip + 3 + bc[ip + 1] + bc[ip + 2]);

              if (stack[stack.length - 1]) {
                end = ip + 3 + bc[ip + 1];
                ip += 3;
              } else {
                end = ip + 3 + bc[ip + 1] + bc[ip + 2];
                ip += 3 + bc[ip + 1];
              }

              break;

            case 14:
              ends.push(end);
              ips.push(ip + 3 + bc[ip + 1] + bc[ip + 2]);

              if (stack[stack.length - 1] === p$FAILED) {
                end = ip + 3 + bc[ip + 1];
                ip += 3;
              } else {
                end = ip + 3 + bc[ip + 1] + bc[ip + 2];
                ip += 3 + bc[ip + 1];
              }

              break;

            case 15:
              ends.push(end);
              ips.push(ip + 3 + bc[ip + 1] + bc[ip + 2]);

              if (stack[stack.length - 1] !== p$FAILED) {
                end = ip + 3 + bc[ip + 1];
                ip += 3;
              } else {
                end = ip + 3 + bc[ip + 1] + bc[ip + 2];
                ip += 3 + bc[ip + 1];
              }

              break;

            case 16:
              if (stack[stack.length - 1] !== p$FAILED) {
                ends.push(end);
                ips.push(ip);

                end = ip + 2 + bc[ip + 1];
                ip += 2;
              } else {
                ip += 2 + bc[ip + 1];
              }

              break;

            case 17:
              ends.push(end);
              ips.push(ip + 3 + bc[ip + 1] + bc[ip + 2]);

              if (input.length > p$currPos) {
                end = ip + 3 + bc[ip + 1];
                ip += 3;
              } else {
                end = ip + 3 + bc[ip + 1] + bc[ip + 2];
                ip += 3 + bc[ip + 1];
              }

              break;

            case 18:
              ends.push(end);
              ips.push(ip + 4 + bc[ip + 2] + bc[ip + 3]);

              if (input.substr(p$currPos, p$consts[bc[ip + 1]].length) === p$consts[bc[ip + 1]]) {
                end = ip + 4 + bc[ip + 2];
                ip += 4;
              } else {
                end = ip + 4 + bc[ip + 2] + bc[ip + 3];
                ip += 4 + bc[ip + 2];
              }

              break;

            case 19:
              ends.push(end);
              ips.push(ip + 4 + bc[ip + 2] + bc[ip + 3]);

              if (input.substr(p$currPos, p$consts[bc[ip + 1]].length).toLowerCase() === p$consts[bc[ip + 1]]) {
                end = ip + 4 + bc[ip + 2];
                ip += 4;
              } else {
                end = ip + 4 + bc[ip + 2] + bc[ip + 3];
                ip += 4 + bc[ip + 2];
              }

              break;

            case 20:
              ends.push(end);
              ips.push(ip + 4 + bc[ip + 2] + bc[ip + 3]);

              if (p$consts[bc[ip + 1]].test(input.charAt(p$currPos))) {
                end = ip + 4 + bc[ip + 2];
                ip += 4;
              } else {
                end = ip + 4 + bc[ip + 2] + bc[ip + 3];
                ip += 4 + bc[ip + 2];
              }

              break;

            case 21:
              stack.push(input.substr(p$currPos, bc[ip + 1]));
              p$currPos += bc[ip + 1];
              ip += 2;
              break;

            case 22:
              stack.push(p$consts[bc[ip + 1]]);
              p$currPos += p$consts[bc[ip + 1]].length;
              ip += 2;
              break;

            case 23:
              stack.push(p$FAILED);
              if (p$silentFs === 0) {
                p$fail(p$consts[bc[ip + 1]]);
              }
              ip += 2;
              break;

            case 24:
              p$savedPos = stack[stack.length - 1 - bc[ip + 1]];
              ip += 2;
              break;

            case 25:
              p$savedPos = p$currPos;
              ip++;
              break;

            case 26:
              params = bc.slice(ip + 4, ip + 4 + bc[ip + 3]);
              for (i = 0; i < bc[ip + 3]; i++) {
                params[i] = stack[stack.length - 1 - params[i]];
              }

              stack.splice(
                stack.length - bc[ip + 2],
                bc[ip + 2],
                p$consts[bc[ip + 1]].apply(null, params)
              );

              ip += 4 + bc[ip + 3];
              break;

            case 27:
              stack.push(p$parseRule(bc[ip + 1]));
              ip += 2;
              break;

            case 28:
              p$silentFs++;
              ip++;
              break;

            case 29:
              p$silentFs--;
              ip++;
              break;

            default:
              throw new Error("Invalid opcode: " + bc[ip] + ".");
          }
        }

        if (ends.length > 0) {
          end = ends.pop();
          ip = ips.pop();
        } else {
          break;
        }
      }

      p$resultsCache[key] = { nextPos: p$currPos, result: stack[0] };

      return stack[0];
    }

    p$result = p$parseRule(p$startRuleIndex);

    if (p$result !== p$FAILED && p$currPos === input.length) {
      return p$result;
    } else {
      if (p$result !== p$FAILED && p$currPos < input.length) {
        p$fail(p$endE());
      }

      throw p$bSE(
        p$mFE,
        p$maxFPos < input.length ? input.charAt(p$maxFPos) : null,
        p$maxFPos < input.length
          ? cL(p$maxFPos, p$maxFPos + 1)
          : cL(p$maxFPos, p$maxFPos)
      );
    }
  }

  return {
    SyntaxError: p$SE,
    parse:       p$parse
  };
})();
