const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const exclusionList = require('metro-config/private/defaults/exclusionList').default || require('metro-config/private/defaults/exclusionList');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  resolver: {
    blockList: exclusionList([
      /.*\/android\/.cxx\/.*/,
      /.*\/node_modules\/.*\/android\/.cxx\/.*/,
    ]),
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
