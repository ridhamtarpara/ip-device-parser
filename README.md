# ip-device-parser

[![NPM Version][npm-image]][npm-url] [![NPM Downloads][downloads-image]][downloads-url] [![Node.js Version][node-version-image]][node-version-url]

Exress middleware to Parse `IP Adress` and `Client Device Information` from the request and it will hold following data.

## Installation

```sh
$ npm install ip-device-parser
```

## API

```js
const express = require('express');
const cookieParser = require('ip-device-parser');

const app = express();
app.use(ip-device-parser());
```

You can fetch ip and device infor form `req.clientInfo` where req is express request object

```js
// req.clientInfo
{
  agent: {
    browser: {
      name: 'Chrome Mobile',
      version: '67.0.3396'
    },
    device: {
      name: 'OnePlus ONEPLUS A5000',
      version: '0.0.0'
    },
    os: {
      name: 'Android',
      version: '8.1.0'
    }
  },
  ip: '2xx5:2x5:1xx6:2xx3:2xxc:dxx3:7xx2:6xxa'
}
```

## How It Works

It looks for specific headers in the request and falls back to some defaults if they do not exist.

The following is the order we use to determine the user ip from the request.

1. `X-Client-IP`  
2. `X-Forwarded-For` (Header may return multiple IP addresses in the format: "client IP, proxy 1 IP, proxy 2 IP", so we take the the first one.)
3. `CF-Connecting-IP` (Cloudflare)
4. `True-Client-Ip` (Akamai and Cloudflare)
5. `X-Real-IP` (Nginx proxy/FastCGI)
6. `X-Cluster-Client-IP` (Rackspace LB, Riverbed Stingray)
7. `X-Forwarded`, `Forwarded-For` and `Forwarded` (Variations of #2)
8. `req.connection.remoteAddress`
9. `req.socket.remoteAddress`
10. `req.connection.socket.remoteAddress`
11. `req.info.remoteAddress`

If an IP address cannot be found, it will return `null`.

## References
http://docs.aws.amazon.com/elasticloadbalancing/latest/classic/x-forwarded-headers.html
http://stackoverflow.com/a/11285650
http://www.squid-cache.org/Doc/config/forwarded_for/
https://support.cloudflare.com/hc/en-us/articles/200170986-How-does-Cloudflare-handle-HTTP-Request-headers-
http://www.rackspace.com/knowledge_center/article/controlling-access-to-linux-cloud-sites-based-on-the-client-ip-address
https://splash.riverbed.com/docs/DOC-1926

## Thanks Note
[~pbojinov](https://twitter.com/pbojinov)'s work on IP address headers and request ip package

[npm-image]: https://img.shields.io/npm/v/ip-device-parser.svg
[npm-url]: https://npmjs.org/package/ip-device-parser
[node-version-image]: https://img.shields.io/node/v/ip-device-parser.svg
[node-version-url]: https://nodejs.org/en/download
[downloads-image]: https://img.shields.io/npm/dm/ip-device-parser.svg
[downloads-url]: https://npmjs.org/package/ip-device-parser