const path = require("path");
const glob = require("glob");
const Webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlWebpackExcludeAssetsPlugin = require("html-webpack-exclude-assets-plugin");
// const DisableOutputWebpackPlugin = require('disable-output-webpack-plugin');

const TerserJSPlugin = require("terser-webpack-plugin");

const PurgecssPlugin = require("purgecss-webpack-plugin");
const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");
const MiniCSSExtractPlugin = require("mini-css-extract-plugin");
const postcssPresetEnv = require("postcss-preset-env");

const PATHS = {
    src: path.resolve(__dirname, "src"),
    dist: path.resolve(__dirname, "dist")
};

var config = {
    entry: {
        styleVendor: path.resolve(__dirname, 'src/assets/scss/styleVendor.scss'),
        styleLocal: path.resolve(__dirname, 'src/assets/scss/styleLocal.scss'),
        app: path.resolve(__dirname, 'src/assets/js/app.js')
    },
    output: {
        path: path.resolve(__dirname, 'dist/'),
        publicPath: '/dist/',
        filename: 'assets/js/[name].[hash].js'
    },
    module: {
        rules: [{
            test: /\.(woff|woff2|eot|ttf|otf)$/,
            use: [{
                loader: "file-loader",
                options: {
                    outputPath: "assets/fonts/",
                    name: "[name].[contenthash].[ext]",
                    esModule: false
                }
            }]
        }]
    },
    plugins: [
        new HtmlWebpackPlugin({
            filename: 'index.html',
            template: path.resolve(__dirname, 'src/index.pug'),
            excludeAssets: [/styleVendor.*.js/, /styleLocal.*.js/],
            minify: false,
            inject: true
        }),
        new HtmlWebpackPlugin({
            filename: 'about.html',
            template: path.resolve(__dirname, 'src/about.pug'),
            excludeAssets: [/styleVendor.*.js/, /styleLocal.*.js/],
            minify: false,
            inject: true
        }),
        new HtmlWebpackExcludeAssetsPlugin(),
        new MiniCSSExtractPlugin({
            filename: "assets/css/[name].[contenthash].css"
        }),
        new Webpack.ProvidePlugin({
            $: "jquery",
            jQuery: "jquery",
            "window.jQuery": "jquery",
            "window.$": "jquery"
        })
    ]
}

module.exports = (env, argv) => {

    // ***************** *************** *****************    
    // ***************** MODO DESARROLLO *****************
    // ***************** *************** *****************
    if (argv.mode === 'development') {
        config.mode = 'development';
        config.devtool = 'source-map';

        const pug = {
            test: /\.pug$/,
            use: ['html-loader?minimize=false', 'pug-html-loader?pretty=true']
        }

        const sass = {
            test: /\.(css|scss)$/,
            use: [MiniCSSExtractPlugin.loader, "css-loader", "resolve-url-loader", "sass-loader"]
        };

        const images = {
            test: /\.(png|svg|jpg|gif)$/,
            use: [{
                loader: "file-loader",
                options: {
                    outputPath: "assets/images/",
                    name: "[name].[contenthash].[ext]",
                    esModule: false
                }
            }]
        }

        config.module.rules.push(pug, sass, images);

        config.devServer = {
            port: 9000
        }
    }


    // ***************** *************** *****************    
    // ***************** MODO PRODUCCION *****************
    // ***************** *************** *****************
    if (argv.mode === 'production') {
        config.mode = 'production';

        const pug = {
            test: /\.pug$/,
            use: ['html-loader?minimize=true', 'pug-html-loader?pretty=false']
        }

        const sass = {
            test: /\.(css|scss)$/,
            use: [
                MiniCSSExtractPlugin.loader,
                {
                    loader: "css-loader",
                    options: {
                        importLoaders: 1
                    }
                },
                {
                    loader: "postcss-loader",
                    options: {
                        plugins: () => [
                            postcssPresetEnv({
                                stage: 3,
                                browsers: "last 2 versions",
                                autoprefixer: true,
                                preseve: true
                            })
                        ]
                    }
                },
                "resolve-url-loader",
                "sass-loader"
            ]
        }

        const images = {
            test: /\.(png|svg|jpg|gif)$/,
            use: [{
                    loader: "file-loader",
                    options: {
                        outputPath: "assets/images/",
                        name: "[name].[contenthash].[ext]",
                        esModule: false
                    }
                },
                {
                    loader: "image-webpack-loader",
                    options: {
                        mozjpeg: {
                            progressive: true,
                            quality: 65
                        },
                        // optipng.enabled: false will disable optipng
                        optipng: {
                            enabled: false
                        },
                        pngquant: {
                            quality: [0.65, 0.9],
                            speed: 4
                        },
                        gifsicle: {
                            interlaced: false
                        },
                        // the webp option will enable WEBP
                        webp: {
                            quality: 75
                        }
                    }
                }
            ]
        }

        config.module.rules.push(pug, sass, images);

        config.optimization = {
            minimize: true,
            minimizer: [
                new TerserJSPlugin({}),
                new OptimizeCSSAssetsPlugin({
                    cssProcessor: require("cssnano"),
                    cssProcessorPluginOptions: {
                        preset: ["default", {
                            discardComments: {
                                removeAll: true
                            }
                        }]
                    },
                    canPrint: true
                })
            ]
        }

        config.plugins.unshift(new PurgecssPlugin({
            paths: () => glob.sync(`${PATHS.src}/**/*`, {
                nodir: true
            })
        }));

    };

    return config;
};