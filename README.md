# npm-apis

[![Build Status](https://travis-ci.org/vicanso/npm-apis.svg?style=flat-square)](https://travis-ci.org/vicanso/npm-apis)
[![Coverage Status](https://img.shields.io/coveralls/vicanso/npm-apis/master.svg?style=flat)](https://coveralls.io/r/vicanso/npm-apis?branch=master)
[![npm](http://img.shields.io/npm/v/npm-apis.svg?style=flat-square)](https://www.npmjs.org/package/npm-apis)
[![Github Releases](https://img.shields.io/npm/dm/npm-apis.svg?style=flat-square)](https://github.com/vicanso/npm-apis)

The client for api of npmjs

## Installation

```bash
$ npm i npm-apis
```

## API

### getAll

Get all modules of npm

```js
const npmApis = require('npm-apis');
npmApis.getAll().then((modules) => {
  // ["lodash"....]
  console.info(modules);
});
```

### getUser

Get the user informations

- `name` The name of user

```js
const npmApis = require('npm-apis');
npmApis.getUser('tree.xie').then((data) => {
  // { _id: 'org.couchdb.user:tree.xie',
  // email: 'vicansocanbico@gmail.com',
  // name: 'tree.xie' }
  console.info(data);
});
```

### get

Get the informations of module

- `name` The name of module

```js
const npmApis = require('npm-apis');
npmApis.get('express').then((data) => {
  console.info(data);
});
```

### getDownloads

Get the downloads of module

- `name` The name of module

- `start` The start day, 'YYYY-MM-DD'

- `end` The end day, 'YYYY-MM-DD'

```js
const npmApis = require('npm-apis');
npmApis.getDownloads('lodash', '2017-01-01', '2017-01-02').then((data) => {
  // [ { downloads: 398489, day: '2017-01-01' },
  // { downloads: 821577, day: '2017-01-02' } ]
  console.info(data);
});
```

### getYesterdayDownloads

Get the yesterday's downloads of module

- `name` The name of module

```js
const npmApis = require('npm-apis');
npmApis.getYesterdayDownloads('lodash').then((count) => {
  // 1799544
  console.info(count);
});
```

### getTodayUpdates

Get today update modules

```js
const npmApis = require('npm-apis');
npmApis.getTodayUpdates().then((data) => {
  console.info(data);
});
```

### getDependeds

Get the module depended informations

```js
const npmApis = require('npm-apis');
npmApis.getDependeds().then((data) => {
  console.info(data);
});
```

### getScore

Get the score of module (npms.io)

- `name` The name of module

```js
const npmApis = require('npm-apis');
npmApis.getScore('express').then((data) => {
  // { final: 0.966,
  // quality: 0.971,
  // popularity: 0.954,
  // maintenance: 0.974 }
  console.info(data);
});
```

## License

MIT
