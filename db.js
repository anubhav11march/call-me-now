const low = require('lowdb');
const lodashId = require('lodash-id');
const FileSync = require('lowdb/adapters/FileSync');

const adapter = new FileSync('db.json');
const db = low(adapter);

db._.mixin(lodashId);
db.defaults({ admins: [], records: [], analytics: [], country_video: [], isp_logo: [] }).write();

module.exports = db;
