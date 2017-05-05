const request = require('superagent');
const _ = require('lodash');
const stream = require('stream');

exports.timeout = 30 * 1000;

class WriteStream extends stream.Writable {
  write(buf) {
    this.emit('data', buf);
  }
}

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
      result[major] = {
        version,
        time: date,
      };
    }
  });
  return result;
}

function getModulesFromStream(writeStream) {
  const divideJSON = (buf) => {
    let foundIndex = 0;
    let endIndex = -1;
    let usedIndex = 0;
    let startIndex = -1;
    const max = buf.length;
    const modules = [];
    while (foundIndex !== -1 && foundIndex < max) {
      if (startIndex === -1) {
        startIndex = buf.indexOf('{', foundIndex);
        if (startIndex === -1) {
          break;
        }
        foundIndex = startIndex + 1;
        /* eslint no-continue:0 */
        continue;
      }
      endIndex = buf.indexOf('}', foundIndex);
      if (endIndex === -1) {
        foundIndex = max;
        /* eslint no-continue:0 */
        continue;
      }
      const str = buf.slice(startIndex, endIndex + 1).toString();
      try {
        const json = JSON.parse(str);
        startIndex = -1;
        usedIndex = endIndex + 1;
        if (json.time && json.time.modified) {
          modules.push(json.name);
        }
      } catch (error) {
        /* eslint no-empty:0 */
      }
      foundIndex = endIndex + 1;
    }
    return {
      buf: buf.slice(usedIndex),
      modules,
    };
  };
  let first = true;
  let restBuffer;
  const npmModules = [];
  return new Promise((resolve, reject) => {
    writeStream.on('data', (buf) => {
      let tmpBuf = buf;
      if (first) {
        first = false;
        tmpBuf = buf.slice(1);
      }
      if (restBuffer && restBuffer.length) {
        tmpBuf = Buffer.concat([restBuffer, tmpBuf]);
      }
      const result = divideJSON(tmpBuf);
      restBuffer = result.buf;
      npmModules.push(...result.modules);
    })
    .on('finish', () => {
      resolve(npmModules.sort());
    })
    .on('error', reject);
  });
}


/**
 * Get all modules
 * @param {url} The all.json url [optional]
 * @return {Array} The name list of module
 */
exports.getAll = (url) => {
  const req = request.get(url || addRegistry('/-/all/static/all.json'));
  const writeStream = new WriteStream();
  req.pipe(writeStream);
  return getModulesFromStream(writeStream);
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
      if (_.isEmpty(res.body) || !res.body['dist-tags']) {
        const err = new Error('Can\'t get the module\'s informations');
        err.code = 'INVALID';
        throw err;
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
  const url = `/downloads/range/${start}:${end}/${name}`;
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
 * Get the downloads of yesterday
 * @param  {String} name The name of module
 * @return {Integer} The downloads of modules
 */
exports.getYesterdayDownloads = (name) => {
  const yesterday = new Date(Date.now() - (24 * 3600 * 1000)).toISOString().substring(0, 10);
  return getDownloadsByDay(name, yesterday);
};

/**
 * Get the update moudles of today
 * @return {Array} The module list
 */
exports.getTodayUpdates = (url) => {
  const requestUrl = url || addRegistry('/-/all/static/today.json');
  return request.get(requestUrl)
    .then(res => _.map(res.body, item => item.name));
};

/**
 * Get the update moudles of yesterday
 * @return {Array} The module list
 */
exports.getYesterdayUpdates = (url) => {
  const requestUrl = url || addRegistry('/-/all/static/yesterday.json');
  return request.get(requestUrl)
    .then(res => _.map(res.body, item => item.name));
};


/**
 * Get the depended count list
 * @return {Array} THe depended count informations list
 */
exports.getDependeds = (url) => {
  const requestUrl = url || addRegistry('/-/_view/dependedUpon?group_level=1');
  return request.get(requestUrl)
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
  const url = `https://api.npms.io/v2/package/${name}`;
  return request.get(url)
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
