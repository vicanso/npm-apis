const request = require('superagent');
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const _ = require('lodash');

const npmApis = require('..');
const originalEnd = request.Request.prototype.end;

npmApis.timeout = 0;

function getAllJSON(fn) {
  const file = path.join(__dirname, '../assets/all.json');
  fs.readFile(file, (err, buf) => {
    if (err) {
      fn(err);
      return;
    }
    return fn(null, {
      body: JSON.parse(buf),
    });
  });
}

function getDepended(fn) {
  const file = path.join(__dirname, '../assets/depended.json');
  fs.readFile(file, (err, buf) => {
    if (err) {
      fn(err);
      return;
    }
    return fn(null, {
      body: JSON.parse(buf),
    });
  });
}

if (process.env.MOCK) {
  request.Request.prototype.end = function(fn) {
    const url = this.url;
    switch (url) {
      case 'https://registry.npmjs.org/-/all/static/all.json':
        getAllJSON(fn);
        break;
      case 'https://registry.npmjs.org/-/_view/dependedUpon?group_level=1':
        getDepended(fn);
        break;
      default:
        originalEnd.apply(this, [fn]);
    }
  };
}

describe('npm-apis', () => {
  it('getAll', function(done) {
    this.timeout(300 * 1000);
    npmApis.getAll().then((data) => {
      assert(data.length > 400 * 1000);
      assert(data.indexOf('influxdb-nodejs') !== -1);
      done();
    }).catch(done);
  });

  it('getDependeds', function(done) {
    this.timeout(300 * 1000);
    npmApis.getDependeds().then((data) => {
      assert(data.length > 50 * 1000);
      assert(_.find(data, item => item.name === 'lodash'));
      done();
    }).catch(done);
  });

  it('getUser', function(done) {
    this.timeout(10 * 1000);
    const name = 'tree.xie';
    npmApis.getUser(name).then((data) => {
      assert.equal(data.name, name);
      assert.equal(data.email, 'vicansocanbico@gmail.com');
      done();
    }).catch(done);
  });

  it('get', function(done) {
    this.timeout(10 * 1000);
    const pkg = 'influxdb-nodejs';
    npmApis.get(pkg).then((data) => {
      assert.equal(data.name, pkg);
      const keys = [
        'description',
        'readme',
        'maintainers',
        'author',
        'keywords',
        'license',
        'time',
        'createdTime',
        'publishedTime',
        'latest',
      ];
      keys.forEach(key => assert(data[key]));
      done();
    }).catch(done);
  });

  it('getDownloads', function(done) {
    this.timeout(10 * 1000);
    npmApis.getDownloads('lodash', '2017-01-01', '2017-01-02').then((counts) => {
      assert.equal(counts.length, 2);
      assert(counts[0].day);
      assert(counts[0].downloads);
      done();
    }).catch(done);
  });

  it('getYesterdayDownloads', function(done) {
    this.timeout(10 * 1000);
    npmApis.getYesterdayDownloads('lodash').then((count) => {
      assert(count);
      done();
    }).catch(done);
  });


  it('getTodayUpdates', function(done) {
    this.timeout(10 * 1000);
    npmApis.getTodayUpdates().then((data) => {
      assert.notEqual(data.length, 0);
      done();
    }).catch(done);
  });

  it('getScore', function(done) {
    this.timeout(10 * 1000);
    npmApis.getScore('express').then((data) => {
      const keys = [
        'final',
        'quality',
        'popularity',
        'maintenance',
      ];
      keys.forEach(key => assert(data[key]));
      done();
    }).catch(done);
  });

});
