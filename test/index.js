const assert = require('assert');
const _ = require('lodash');

const npmApis = require('..');

npmApis.timeout = 0;


describe('npm-apis', () => {
  it('getAll', function(done) {
    this.timeout(1800 * 1000);
    npmApis.getAll('http://oidmt881u.bkt.clouddn.com/all.json').then((data) => {
      assert(data.length > 400 * 1000);
      assert(data.indexOf('influxdb-nodejs') !== -1);
      done();
    }).catch(done);
  });

  it('getDependeds', function(done) {
    this.timeout(1800 * 1000);
    npmApis.getDependeds('http://oidmt881u.bkt.clouddn.com/depended.json').then((data) => {
      assert(data.length > 50 * 1000);
      assert(_.find(data, item => item.name === 'lodash'));
      done();
    }).catch(done);
  });
  
  it('getUser', function(done) {
    this.timeout(300 * 1000);
    const name = 'tree.xie';
    npmApis.getUser(name).then((data) => {
      assert.equal(data.name, name);
      assert.equal(data.email, 'vicansocanbico@gmail.com');
      done();
    }).catch(done);
  });

  it('get', function(done) {
    this.timeout(300 * 1000);
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
    this.timeout(300 * 1000);
    npmApis.getDownloads('lodash', '2017-01-01', '2017-01-02').then((counts) => {
      assert.equal(counts.length, 2);
      assert(counts[0].day);
      assert(counts[0].downloads);
      done();
    }).catch(done);
  });

  it('getYesterdayDownloads', function(done) {
    this.timeout(300 * 1000);
    npmApis.getYesterdayDownloads('lodash').then((count) => {
      assert(count);
      done();
    }).catch(done);
  });


  it('getTodayUpdates', function(done) {
    this.timeout(300 * 1000);
    npmApis.getTodayUpdates('http://oidmt881u.bkt.clouddn.com/today.json').then((data) => {
      assert.notEqual(data.length, 0);
      done();
    }).catch(done);
  });

  it('getYesterdayUpdates', function(done) {
    this.timeout(300 * 1000);
    npmApis.getYesterdayUpdates('http://oidmt881u.bkt.clouddn.com/yesterday.json').then((data) => {
      assert.notEqual(data.length, 0);
      done();
    }).catch(done);
  })

  it('getScore', function(done) {
    this.timeout(300 * 1000);
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
