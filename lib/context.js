'use strict';
// Carries "which linked account is this code running for?" through async calls, so the original
// plugins (which only know a global `config` and the `database/` folder) work per user, unchanged.
const { AsyncLocalStorage } = require('async_hooks');
const als = new AsyncLocalStorage();
module.exports = {
    als,
    current: () => als.getStore(),
    run: (ctx, fn) => als.run(ctx, fn)
};
