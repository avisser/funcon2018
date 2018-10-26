({
    onHashChange: function (cmp) {
        var hashTest = !window.location.hash || window.location.hash === "" ? "/" : window.location.hash.substring(1);
        var debug = sessionStorage.getItem('fon.log');
        var verbose = debug === "debug";
        if (verbose) console.log('Router.onHashChange for ' + cmp.get('v.parentCmp').getName());
        var route = this.lookupRoute(cmp, hashTest);
        if (route && route.alias === hashTest) {
            //we're at the alias - redirect to the explicit location
            if (debug) console.log('Router redirecting to ' + route.path + ' (alias for ' + route.alias + ')');
            // setTimeout(() => window.location.hash = route.path, 1000);
            window.location.hash = route.pathWithValues;
        }
        else if (route && route.pathWithValues !== cmp.get('v.renderedPath')) {
            var params = {};
            //set all attributes as specified in the `attributes` key
            _.each(route.attributes || [], function (attr) {
                params[attr.substring(2)] = cmp.get('v.parentCmp').getReference(attr);

                //`getReference` in the line above to should make this unnecessary
                //the following should send values from parent to child
                // cmp.get('v.parentCmp').addValueHandler({
                //     value: attr,
                //     event: "change",
                //     globalId: newCmp.getGlobalId(),
                //     method: function (event) {
                //         newCmp.set(attr, event.getParams().value);
                //     }
                // });
            });
            //set all attributes pattern-matched from the url
            _.each(route.params || [], function (keyVal) {
                if (keyVal.val !== undefined) {
                    params[keyVal.name] = keyVal.val;
                }
            });

            // AHV 7/21/18 removing the parentCmp injection for now
            // the oldBody code below is used to work around an Aura bug
            // but it isn't needed at this point so commenting it out
            //inject the parent into the child
            // params['parentCmp'] = cmp.get('v.parentCmp');
            //inject the returnUrl
            params['returnUrl'] = cmp.get('v.renderedPath') ?'#'+cmp.get('v.renderedPath') : null;

            $A.createComponent(route.comp, params, function (newCmp, status, errors) {
                //todo - should we be calling newCmp.autoDestroy(false) and take over reference mgmt?

                if (status !== 'SUCCESS') {
                    console.error('failed to create ' + route.comp);
                    console.error(status);
                    console.error(errors);
                }
                cmp.set('v.renderedPath', route.pathWithValues);
                if (debug) console.log('showing ' + route.comp + ' inside of ' + cmp.get('v.parentCmp').getName());

                // var oldBody = cmp.get('v.parentCmp').get('v.body');
                // if (oldBody.length > 0) {
                //     //if parentCmp is defined when the child component gets destroyed, aura will also destroy parentCmp
                //     //this is bad
                //     //so we set parentCmp to null first which makes it behave
                //
                //     // check to avoid aura warnings
                //     if (oldBody[0].getName && !oldBody[0].getName().includes("markup://siteforce")) {
                //         oldBody[0].set('v.parentCmp', null);
                //     }
                // }
                cmp.get('v.parentCmp').set('v.body', [newCmp]);
                if (cmp.get('v.onRenderCallback')) {
                    route.params = params;
                    cmp.get('v.onRenderCallback')(cmp.get('v.parentCmp'), newCmp, route, cmp.get('v.helper'));
                }
            });
        }
    },
    lookupRoute: function (cmp, hashTest) {
        var self = this;
        //first try full matching
        var route = _.find(cmp.get('v.routesJson'), function (r) {
            var keys = [];
            var re = self.pathToRegEx().compile(r.path, keys);
            var match = re.exec(hashTest);
            if (match) {
                r.params = _.map(keys, function (k, i) {
                    return {name: k.name, val: match[i + 1]};
                });
                r.pathWithValues = r.path;
                _.each(r.params, function (p) {
                    if (p.val) {
                        r.pathWithValues = r.pathWithValues.replace(':' + p.name + '?', p.val); //try the optional one first
                        r.pathWithValues = r.pathWithValues.replace(':' + p.name, p.val);
                    }
                });
                r.pathWithValues = r.pathWithValues.replace(/\/:.*\?$/, ''); //regex removes a trailing, optional path item
                return true;
            }
            return false;
        });

        //if we find nothing, try partial matching
        if (!route) {
            route = _.find(cmp.get('v.routesJson'), function (r) {
                if (hashTest.indexOf(r.path + '/') === 0) {
                    //if this route matches a child route
                    //e.g. hash = /store/item/1 and r.path = /store
                    //we need to match, and render the parent component (/store), so it can render the final cmp (item)

                    r.pathWithValues = r.path;
                    return true;
                }
                return false;
            });
        }

        //if we find nothing again, see if we have an alias and redirect there
        if (!route) {
            route = _.find(cmp.get('v.routesJson'), function (r) {
                if (hashTest === r.alias) {
                    r.pathWithValues = r.path.replace(/\/:.*\?$/, ''); //regex removes a trailing, optional path item
                    return true;
                }
            });
        }

        //if we find nothing again, see if we have a root route (/)
        if (!route) {
            route = _.find(cmp.get('v.routesJson'), function (r) {
                if (r.path === '/') {

                    r.pathWithValues = '/';
                    return true;
                }
                return false;
            });
        }
        return route;
    },
    pathToRegEx: function () {
        //taken from https://github.com/pillarjs/path-to-regexp
        /**
         * Expose `pathToRegexp`.
         */
        // module.exports = pathToRegexp
        // module.exports.parse = parse
        // module.exports.compile = compile
        // module.exports.tokensToFunction = tokensToFunction
        // module.exports.tokensToRegExp = tokensToRegExp

        /**
         * Default configs.
         */
        var DEFAULT_DELIMITER = '/';
        var DEFAULT_DELIMITERS = './';

        /**
         * The main path matching regexp utility.
         *
         * @type {RegExp}
         */
        var PATH_REGEXP = new RegExp([
            // Match escaped characters that would otherwise appear in future matches.
            // This allows the user to escape special characters that won't transform.
            '(\\\\.)',
            // Match Express-style parameters and un-named parameters with a prefix
            // and optional suffixes. Matches appear as:
            //
            // "/:test(\\d+)?" => ["/", "test", "\d+", undefined, "?"]
            // "/route(\\d+)"  => [undefined, undefined, undefined, "\d+", undefined]
            '(?:\\:(\\w+)(?:\\(((?:\\\\.|[^\\\\()])+)\\))?|\\(((?:\\\\.|[^\\\\()])+)\\))([+*?])?'
        ].join('|'), 'g')

        /**
         * Parse a string for the raw tokens.
         *
         * @param  {string}  str
         * @param  {Object=} options
         * @return {!Array}
         */
        function parse(str, options) {
            var tokens = []
            var key = 0
            var index = 0
            var path = ''
            var defaultDelimiter = (options && options.delimiter) || DEFAULT_DELIMITER
            var delimiters = (options && options.delimiters) || DEFAULT_DELIMITERS
            var pathEscaped = false
            var res

            while ((res = PATH_REGEXP.exec(str)) !== null) {
                var m = res[0]
                var escaped = res[1]
                var offset = res.index
                path += str.slice(index, offset)
                index = offset + m.length

                // Ignore already escaped sequences.
                if (escaped) {
                    path += escaped[1]
                    pathEscaped = true
                    continue
                }

                var prev = ''
                var next = str[index]
                var name = res[2]
                var capture = res[3]
                var group = res[4]
                var modifier = res[5]

                if (!pathEscaped && path.length) {
                    var k = path.length - 1

                    if (delimiters.indexOf(path[k]) > -1) {
                        prev = path[k]
                        path = path.slice(0, k)
                    }
                }

                // Push the current path onto the tokens.
                if (path) {
                    tokens.push(path)
                    path = ''
                    pathEscaped = false
                }

                var partial = prev !== '' && next !== undefined && next !== prev
                var repeat = modifier === '+' || modifier === '*'
                var optional = modifier === '?' || modifier === '*'
                var delimiter = prev || defaultDelimiter
                var pattern = capture || group

                tokens.push({
                    name: name || key++,
                    prefix: prev,
                    delimiter: delimiter,
                    optional: optional,
                    repeat: repeat,
                    partial: partial,
                    pattern: pattern ? escapeGroup(pattern) : '[^' + escapeString(delimiter) + ']+?'
                })
            }

            // Push any remaining characters.
            if (path || index < str.length) {
                tokens.push(path + str.substr(index))
            }

            return tokens
        }

        /**
         * Compile a string to a template function for the path.
         *
         * @param  {string}             str
         * @param  {Object=}            options
         * @return {!function(Object=, Object=)}
         */
        function compile(str, options) {
            return tokensToFunction(parse(str, options))
        }

        /**
         * Expose a method for transforming tokens into the path function.
         */
        function tokensToFunction(tokens) {
            // Compile all the tokens into regexps.
            var matches = new Array(tokens.length)

            // Compile all the patterns before compilation.
            for (var i = 0; i < tokens.length; i++) {
                if (typeof tokens[i] === 'object') {
                    matches[i] = new RegExp('^(?:' + tokens[i].pattern + ')$')
                }
            }

            return function (data, options) {
                var path = ''
                var encode = (options && options.encode) || encodeURIComponent

                for (var i = 0; i < tokens.length; i++) {
                    var token = tokens[i]

                    if (typeof token === 'string') {
                        path += token
                        continue
                    }

                    var value = data ? data[token.name] : undefined
                    var segment

                    if (Array.isArray(value)) {
                        if (!token.repeat) {
                            throw new TypeError('Expected "' + token.name + '" to not repeat, but got array')
                        }

                        if (value.length === 0) {
                            if (token.optional) continue

                            throw new TypeError('Expected "' + token.name + '" to not be empty')
                        }

                        for (var j = 0; j < value.length; j++) {
                            segment = encode(value[j], token)

                            if (!matches[i].test(segment)) {
                                throw new TypeError('Expected all "' + token.name + '" to match "' + token.pattern + '"')
                            }

                            path += (j === 0 ? token.prefix : token.delimiter) + segment
                        }

                        continue
                    }

                    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
                        segment = encode(String(value), token)

                        if (!matches[i].test(segment)) {
                            throw new TypeError('Expected "' + token.name + '" to match "' + token.pattern + '", but got "' + segment + '"')
                        }

                        path += token.prefix + segment
                        continue
                    }

                    if (token.optional) {
                        // Prepend partial segment prefixes.
                        if (token.partial) path += token.prefix

                        continue
                    }

                    throw new TypeError('Expected "' + token.name + '" to be ' + (token.repeat ? 'an array' : 'a string'))
                }

                return path
            }
        }

        /**
         * Escape a regular expression string.
         *
         * @param  {string} str
         * @return {string}
         */
        function escapeString(str) {
            return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, '\\$1')
        }

        /**
         * Escape the capturing group by escaping special characters and meaning.
         *
         * @param  {string} group
         * @return {string}
         */
        function escapeGroup(group) {
            return group.replace(/([=!:$/()])/g, '\\$1')
        }

        /**
         * Get the flags for a regexp from the options.
         *
         * @param  {Object} options
         * @return {string}
         */
        function flags(options) {
            return options && options.sensitive ? '' : 'i'
        }

        /**
         * Pull out keys from a regexp.
         *
         * @param  {!RegExp} path
         * @param  {Array=}  keys
         * @return {!RegExp}
         */
        function regexpToRegexp(path, keys) {
            if (!keys) return path

            // Use a negative lookahead to match only capturing groups.
            var groups = path.source.match(/\((?!\?)/g)

            if (groups) {
                for (var i = 0; i < groups.length; i++) {
                    keys.push({
                        name: i,
                        prefix: null,
                        delimiter: null,
                        optional: false,
                        repeat: false,
                        partial: false,
                        pattern: null
                    })
                }
            }

            return path
        }

        /**
         * Transform an array into a regexp.
         *
         * @param  {!Array}  path
         * @param  {Array=}  keys
         * @param  {Object=} options
         * @return {!RegExp}
         */
        function arrayToRegexp(path, keys, options) {
            var parts = []

            for (var i = 0; i < path.length; i++) {
                parts.push(pathToRegexp(path[i], keys, options).source)
            }

            return new RegExp('(?:' + parts.join('|') + ')', flags(options))
        }

        /**
         * Create a path regexp from string input.
         *
         * @param  {string}  path
         * @param  {Array=}  keys
         * @param  {Object=} options
         * @return {!RegExp}
         */
        function stringToRegexp(path, keys, options) {
            return tokensToRegExp(parse(path, options), keys, options)
        }

        /**
         * Expose a function for taking tokens and returning a RegExp.
         *
         * @param  {!Array}  tokens
         * @param  {Array=}  keys
         * @param  {Object=} options
         * @return {!RegExp}
         */
        function tokensToRegExp(tokens, keys, options) {
            options = options || {}

            var strict = options.strict
            var end = options.end !== false
            var delimiter = escapeString(options.delimiter || DEFAULT_DELIMITER)
            var delimiters = options.delimiters || DEFAULT_DELIMITERS
            var endsWith = [].concat(options.endsWith || []).map(escapeString).concat('$').join('|')
            var route = ''
            var isEndDelimited = tokens.length === 0

            // Iterate over the tokens and create our regexp string.
            for (var i = 0; i < tokens.length; i++) {
                var token = tokens[i]

                if (typeof token === 'string') {
                    route += escapeString(token)
                    isEndDelimited = i === tokens.length - 1 && delimiters.indexOf(token[token.length - 1]) > -1
                } else {
                    var prefix = escapeString(token.prefix)
                    var capture = token.repeat
                        ? '(?:' + token.pattern + ')(?:' + prefix + '(?:' + token.pattern + '))*'
                        : token.pattern

                    if (keys) keys.push(token)

                    if (token.optional) {
                        if (token.partial) {
                            route += prefix + '(' + capture + ')?'
                        } else {
                            route += '(?:' + prefix + '(' + capture + '))?'
                        }
                    } else {
                        route += prefix + '(' + capture + ')'
                    }
                }
            }

            if (end) {
                if (!strict) route += '(?:' + delimiter + ')?'

                route += endsWith === '$' ? '$' : '(?=' + endsWith + ')'
            } else {
                if (!strict) route += '(?:' + delimiter + '(?=' + endsWith + '))?'
                if (!isEndDelimited) route += '(?=' + delimiter + '|' + endsWith + ')'
            }

            return new RegExp('^' + route, flags(options))
        }

        /**
         * Normalize the given path string, returning a regular expression.
         *
         * An empty array can be passed in for the keys, which will hold the
         * placeholder key descriptions. For example, using `/user/:id`, `keys` will
         * contain `[{ name: 'id', delimiter: '/', optional: false, repeat: false }]`.
         *
         * @param  {(string|RegExp|Array)} path
         * @param  {Array=}                keys
         * @param  {Object=}               options
         * @return {!RegExp}
         */
        function pathToRegexp(path, keys, options) {
            if (path instanceof RegExp) {
                return regexpToRegexp(path, keys)
            }

            if (Array.isArray(path)) {
                return arrayToRegexp(/** @type {!Array} */ (path), keys, options)
            }

            return stringToRegexp(/** @type {string} */ (path), keys, options)
        }

        return {
            compile: pathToRegexp
        };
    }
})