const request = require('superagent');
const _ = require('lodash');
const moment = require('moment');

exports.timeout = 0;

function addRegistry(url) {
  return `https://registry.npmjs.org${url}`;
}

function addNpmjsAPI(url) {
  return `https://api.npmjs.org${url}`;
}

function getPublishedTime(time) {
  const result = {};
  _.forEach(time, (date, version) => {
    const major = version.split('.')[0];
    if (!result[major] || result[major] < date) {
      result[major] = date;
    }
  });
  return result;
}

/**
 * Get all modules
 * @return {Array} The name list of module
 */
exports.getAll = () => {
  return request.get(addRegistry('/-/all/static/all.json'))
    .timeout(exports.timeout)
    .then(res => res.body);
};

/**
 * Get the informations of user
 * @param  {String} name The name of user
 * @return {Object} The informations of user
 */
exports.getUser = (name) => {
  const url = `/-/user/org.couchdb.user:${name}`;
  return request.get(addRegistry(url))
    .timeout(exports.timeout)
    .then(res => res.body);
};

/**
 * Get the informations of module
 * @param  {String} name The name of module
 * @return {Object} The informations of module
 */
exports.get = (name) => {
  const url = `/${name}`;
  return request.get(addRegistry(url))
    .timeout(exports.timeout)
    .then((res) => {
      if (_.isEmpty(res.body)) {
        throw new Error('Can\'t get the module\'s informations');
      }
      const time = res.body.time;
      delete time.modified;
      const createdTime = time.created;
      delete time.created;
      const data = _.pick(res.body, [
        'name',
        'description',
        'readme',
        'maintainers',
        'author',
        'keywords',
        'license',
      ]);
      data.time = time;
      data.createdTime = createdTime;
      data.publishedTime = getPublishedTime(time);
      data.latest = res.body['dist-tags'].latest;
      return data;
    });
};

/**
 * Get the downloads of module
 * @param  {String} name The name of module
 * @param  {String} start The start date, YYYY-MM-DD
 * @param  {String} end The end date, YYYY-MM-DD
 * @return {Array} The downloads list of module
 */
exports.getDownloads = (name, start, end) => {
  const url = `/downloads/range/${start}:${end}`
  return request.get(addNpmjsAPI(url))
    .timeout(exports.timeout)
    .then(res => _.get(res, 'body.downloads', []));
};

function getDownloadsByDay(name, day) {
  return exports.getDownloads(name, day, day).then((data) => {
    if (!data || !data[0] || data[0].day !== day) {
      return null;
    }
    return data[0].downloads;
  });
}

/**
 * Get the downloads of today
 * @param  {String} name The name of module
 * @return {Integer} The downloads of modules
 */
exports.getTodayDownloads = (name) => {
  const today = moment().toISOString().substring(0, 10);
  return getDownloadsByDay(name, today);
};

/**
 * Get the downloads of yesterday
 * @param  {String} name The name of module
 * @return {Integer} The downloads of modules
 */
exports.getYesterdayDownloads = (name) => {
  const yesterday = moment().add(-1, 'day').toISOString().substring(0, 10);
  return getDownloadsByDay(name, yesterday);
};

/**
 * Get the update moudles of today
 * @return {Array} The module list
 */
exports.getTodayUpdates = () => {
  return request.get(addRegistry('/-/all/static/today.json'))
    .timeout(exports.timeout)
    .then(res => _.map(res.body, item => item.name));
};

/**
 * Get the depended count list
 * @return {Array} THe depended count informations list
 */
exports.getDependeds = () => {
  return request.get(addRegistry('/-/_view/dependedUpon?group_level=1'))
    .timeout(exports.timeout)
    .then((res) => {
      const arr = [];
      _.forEach(res.body.rows, (item) => {
        const name = item.key[0].trim();
        if (name) {
          arr.push({
            name,
            count: item.value,
          });
        }
      });
      return arr;
    });
};

/**
 * Get the score informations of module
 * @param  {String} name The name of module
 * @return {Object} The score informations of module
 */
exports.getScore = (name) => {
  return request.get(`https://api.npms.io/v2/package/${name}`)
    .timeout(exports.timeout)
    .then((res) => {
      const data = res.body.score;
      if (!data) {
        return null;
      }
      const result = {};
      const precision = 3;
      result.final = _.round(data.final, precision);
      _.forEach(data.detail, (value, key) => {
        result[key] = _.round(value, precision);
      });
      return result;
    });
};
