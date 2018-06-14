/**
 * ip-device-parser
 * Copyright(c) 2018 Ridham Tarpara
 * MIT Licensed
 */

const useragent = require('useragent');
const ipaddr = require('ipaddr.js');

/**
 * Generates device information including browser, device, os
 * @param {Object} reqUserAgent - Express request header object of 'user-agent'
 */
const getDeviceInformation = (reqUserAgent) => {
  const agent = useragent.parse(reqUserAgent);
  const data = {
    browser: {
      name: `${agent.family}`,
      version: `${agent.major}.${agent.minor}.${agent.patch}`,
    },
    device: {
      name: `${agent.device.family}`,
      version: `${agent.device.major}.${agent.device.minor}.${agent.device.patch}`,
    },
    os: {
      name: `${agent.os.family}`,
      version: `${agent.os.major}.${agent.os.minor}.${agent.os.patch}`,
    },
  };
  return data;
};

/**
 * Get client's x-forwarded for ip
 * @param {string} value
 */
const getClientIpFromXForwardedFor = (value) => {
  if (!value) {
    return null;
  }

  if (typeof value !== 'string') {
    return null;
  }

  // x-forwarded-for may return multiple IP addresses in the format:
  // "client IP, proxy 1 IP, proxy 2 IP"
  // Therefore, the right-most IP address is the IP address of the most recent proxy
  // and the left-most IP address is the IP address of the originating client.
  // source: http://docs.aws.amazon.com/elasticloadbalancing/latest/classic/x-forwarded-headers.html
  // Azure Web App's also adds a port for some reason, so we'll only use the first part (the IP)
  const forwardedIps = value.split(',').map((e) => {
    const ip = e.trim();
    if (ip.includes(':')) {
      const splitted = ip.split(':');
      // make sure we only use this if it's ipv4 (ip:port)
      if (splitted.length === 2) {
        return splitted[0];
      }
    }
    return ip;
  });

  // Sometimes IP addresses in this header can be 'unknown' (http://stackoverflow.com/a/11285650).
  // Therefore taking the left-most IP address that is not unknown
  // A Squid configuration directive can also set the value to "unknown" (http://www.squid-cache.org/Doc/config/forwarded_for/)
  return forwardedIps.find(ipaddr.isValid);
};


/**
 * Get client's IP address
 * @param {CircularObject} req - express request object
 */
const getClientIP = (req) => {
  // Server is probably behind a proxy.
  if (req.headers) {
    // Standard headers used by Amazon EC2, Heroku, and others.
    if (ipaddr.isValid(req.headers['x-client-ip'])) {
      return req.headers['x-client-ip'];
    }

    // Load-balancers (AWS ELB) or proxies.
    const xForwardedFor = getClientIpFromXForwardedFor(req.headers['x-forwarded-for']);
    if (ipaddr.isValid(xForwardedFor)) {
      return xForwardedFor;
    }

    // Cloudflare.
    // @see https://support.cloudflare.com/hc/en-us/articles/200170986-How-does-Cloudflare-handle-HTTP-Request-headers-
    // CF-Connecting-IP - applied to every request to the origin.
    if (ipaddr.isValid(req.headers['cf-connecting-ip'])) {
      return req.headers['cf-connecting-ip'];
    }

    // Akamai and Cloudflare: True-Client-IP.
    if (ipaddr.isValid(req.headers['true-client-ip'])) {
      return req.headers['true-client-ip'];
    }

    // Default nginx proxy/fcgi; alternative to x-forwarded-for, used by some proxies.
    if (ipaddr.isValid(req.headers['x-real-ip'])) {
      return req.headers['x-real-ip'];
    }

    // (Rackspace LB and Riverbed's Stingray)
    // http://www.rackspace.com/knowledge_center/article/controlling-access-to-linux-cloud-sites-based-on-the-client-ip-address
    // https://splash.riverbed.com/docs/DOC-1926
    if (ipaddr.isValid(req.headers['x-cluster-client-ip'])) {
      return req.headers['x-cluster-client-ip'];
    }

    if (ipaddr.isValid(req.headers['x-forwarded'])) {
      return req.headers['x-forwarded'];
    }

    if (ipaddr.isValid(req.headers['forwarded-for'])) {
      return req.headers['forwarded-for'];
    }

    if (ipaddr.isValid(req.headers.forwarded)) {
      return req.headers.forwarded;
    }
  }

  // Remote address checks.
  if (req.connection) {
    if (ipaddr.isValid(req.connection.remoteAddress)) {
      return req.connection.remoteAddress;
    }
    if (req.connection.socket && ipaddr.isValid(req.connection.socket.remoteAddress)) {
      return req.connection.socket.remoteAddress;
    }
  }

  if (req.socket && ipaddr.isValid(req.socket.remoteAddress)) {
    return req.socket.remoteAddress;
  }

  if (req.info && ipaddr.isValid(req.info.remoteAddress)) {
    return req.info.remoteAddress;
  }

  return null;
};

const getCallerIP = (req) => {
  const ipString = getClientIP(req);

  if (ipaddr.isValid(ipString)) {
    try {
      const addr = ipaddr.parse(ipString);
      if (ipaddr.IPv6.isValid(ipString) && addr.isIPv4MappedAddress()) {
        return addr.toIPv4Address().toString();
      }
      return addr.toNormalizedString();
    } catch (e) {
      return ipString;
    }
  }
  return null;
};


/**
 * Parse IP address and device info `req.clientInfo`
 *
 * @param {Object} [options]
 * @return {Function}
 * @public
 */
module.exports = () => (req, res, next) => {
  const agent = getDeviceInformation(req.headers['user-agent']);
  const ip = getCallerIP(req);
  req.clientInfo = {
    agent,
    ip,
  };
  next();
};
