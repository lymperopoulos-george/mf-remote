const { container } = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const ESLintPlugin = require('eslint-webpack-plugin');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const { resolve } = require('path');

const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
const ReactRefreshTypeScript = require('react-refresh-typescript');
const deps = require('./package.json').dependencies;

const mfConfig = {
  name: 'MyRemoteApp',
  filename: 'remoteEntry.js',
  exposes: {
    './App': './src/App',
  },
  shared: [
    {
      '@emotion/cache': {
        singleton: true,
        requiredVersion: deps['@emotion/cache'],
      },
      '@emotion/react': {
        singleton: true,
        requiredVersion: deps['@emotion/react'],
      },
      '@emotion/styled': {
        singleton: true,
        requiredVersion: deps['@emotion/styled'],
      },
      '@mui/icons-material/': {
        singleton: true,
        version: '5.5.0',
        requiredVersion: deps['@mui/icons-material'],
      },
      '@mui/lab/': {
        singleton: true,
        version: '5.0.0-alpha.79',
        requiredVersion: deps['@mui/lab'],
      },
      '@mui/material/': {
        singleton: true,
        version: '5.5.0',
        requiredVersion: deps['@mui/material'],
      },
      react: { singleton: true, requiredVersion: deps.react },
      'react-dom': { singleton: true, requiredVersion: deps['react-dom'] },
    },
  ],
};

const factory = (env, argv) => {
  const tsLoaderTransformers = [];

  if (argv.hot) {
    tsLoaderTransformers.push(ReactRefreshTypeScript());
  }
  const config = {
    target: 'web',
    mode: 'development',
    entry: ['./src/index'],
    output: {
      path: resolve(__dirname, 'dist'),
      filename: '[name].[contenthash].js',
      publicPath: 'auto',
      clean: true,
    },
    devServer: {
      port: 8082,
      historyApiFallback: true,
      client: {
        overlay: true,
      },
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js'],
      plugins: [new TsconfigPathsPlugin()],
    },
    module: {
      rules: [
        {
          test: /\.m?js/,
          use: ['source-map-loader'],
        },
        {
          test: /\.(pdf|xml)$/i,
          type: 'asset/inline',
        },
        {
          test: /\.(svg|png|jpg)$/i,
          type: 'asset/resource',
        },
        {
          test: /\.tsx?$/,
          exclude: /node_modules/,
          use: [
            {
              loader: 'ts-loader',
              options: {
                getCustomTransformers() {
                  return {
                    before: tsLoaderTransformers,
                  };
                },
              },
            },
          ],
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './src/index.html',
      }),
      new ESLintPlugin(),
    ],
  };
  return new Promise((resolve) => {
    if (argv.hot) {
      config.output.filename = '[name].[fullhash].js';
      config.plugins.push(new ReactRefreshWebpackPlugin());
    } else {
      config.plugins.push(new container.ModuleFederationPlugin(mfConfig));
    }
    config.devtool = 'inline-source-map';
    config.plugins.push(new CopyPlugin({ patterns: [{ from: 'public' }] }));
    config.entry.unshift('./resources/mocks/index');
    return resolve(config);
  });
};

module.exports = factory;
