module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    'react-native-reanimated/plugin',
    [
      'module-resolver',
      {
        root: ['./src'],
        alias: {
          '@': './src',
          '@components': './src/components',
          '@utils': './src/utils',
          '@types': './src/types',
          '@hooks': './src/hooks',
          '@services': './src/services',
          '@core': './src/core',
          '@optimization': './src/optimization',
        },
      },
    ],
  ],
};