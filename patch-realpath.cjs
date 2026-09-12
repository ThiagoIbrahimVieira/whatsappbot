const fs = require('node:fs');
const path = require('node:path');

const patchPath = path.resolve(__dirname, 'patch-realpath.cjs').replace(/\\/g, '/');
if (!process.env.NODE_OPTIONS || !process.env.NODE_OPTIONS.includes('patch-realpath.cjs')) {
  process.env.NODE_OPTIONS = (process.env.NODE_OPTIONS ? process.env.NODE_OPTIONS + ' ' : '') + `-r ${patchPath}`;
}

const origRealpathSync = fs.realpathSync;

fs.realpathSync = function(p, opts) {
  try {
    return origRealpathSync(p, opts);
  } catch (e) {
    return path.resolve(p);
  }
};
fs.realpathSync.native = fs.realpathSync;

const origRealpath = fs.realpath;
fs.realpath = function(p, opts, cb) {
  if (typeof opts === 'function') {
    cb = opts;
    opts = undefined;
  }
  try {
    const res = fs.realpathSync(p, opts);
    if (cb) cb(null, res);
  } catch (e) {
    if (cb) cb(null, path.resolve(p));
  }
};
fs.realpath.native = fs.realpath;

try {
  const fsp = require('node:fs/promises');
  fsp.realpath = async function(p, opts) {
    try {
      return fs.realpathSync(p, opts);
    } catch (e) {
      return path.resolve(p);
    }
  };
  if (fsp.realpath.native) {
    fsp.realpath.native = fsp.realpath;
  }
} catch (e) {}

try {
  const cp = require('node:child_process');
  const origSpawnSync = cp.spawnSync;
  cp.spawnSync = function(cmd, args, opts) {
    if (args && Array.isArray(args) && args.some(a => typeof a === 'string' && a.includes('r.excludeNetwork=true'))) {
      return {
        status: 0,
        stdout: JSON.stringify({ osName: 'Windows_NT' })
      };
    }
    return origSpawnSync.apply(this, arguments);
  };
} catch (e) {}

