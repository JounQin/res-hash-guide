# res-hash-guide
HTML 资源引入 hashVersion 指南，支持静态页、动态页、requireJs 等多种方式。

#### 注意: 此项目只是为实现资源文件加载版本号 hash 化提供一个参考方案，实际项目中请根据需要进行二次调整。

===

0. 开始使用

    0. 项目结构介绍: 项目源码 - src 目录，实际生产使用代码 - dist 目录。

    1. clone 项目后进入项目根目录，根据实际情况修改 *gulpfile.js* 、 *src/js/index-config.js* 中 `CONTEXT` 的值，(建议先安装 [*cnpm*](http://npm.taobao.org/))随后执行:

        ``` bash
        npm install
        gulp deploy
        ```

    2. 执行完毕后，查看 *dist/html/index.html* 文件，其中引入的资源文件版本号已变为压缩文件的 hash 值。
    3. 在 _IntelliJ IDEA_ 等 IDE 中使用类 Chrome 浏览器打开该文件，再打开 *Chrome Dev Tools* 的 Network Tab 即可以看到使用 *requireJs* 方式引入的资源也均使用 hash 值版本号

1. 具体方案

    0. 查看 *gulpfile.js* 可知，主要使用了 *gulp-json-hash-manifest* 插件生成了文件 hash 值对应关系文件 *hash-manifest.json* (_manifestJson_ 任务) ，然后根据该 json 文件将 html 文件中符合要求的部分(资源文件名 + '?hashVersion'，这部分其实可以直接用正则而不必拼 '?hashVersion' 字符串进行替换，可以自行尝试)进行替换后输出到 dist 目录，此时即完成了静态资源和动态资源的引入。

       ##### 需要说明的是，动态资源部分不同公司会有不同的引入方式，目前个人所在公司使用 *FreeMarker* 模版，通过配置 `${e.hr('resource/path')}` 方式引入，请根据自身需求调整 *gulpfile.js* 中的 _replace_ 任务匹配的正则表达式。

    2. 对于 *requireJs* 引入的资源文件，*requireJs* 本身是支持使用 `urlArgs` 参数配置版本号的，但是默认 `urlArgs` 参数只能是 *string* 类型，这也意味着 *requireJs* 中的版本号默认所有文件均是同一个，这与我们使用 hash 值版本号的要求显然是不相符的。因此需要对 *requireJs* 进行改造，即将以下代码：

        ``` javascript
        return config.urlArgs ? url +
                                ((url.indexOf('?') === -1 ? '?' : '&') +
                                 config.urlArgs) : url;
        ```

        调整为：


        ``` javascript
        var urlArgs = config.urlArgs;

        if (isFunction(urlArgs)) {
            urlArgs = urlArgs.call(config, moduleName, url);
        }

        return urlArgs ? url + (url.indexOf('?') === -1 ? '?' : '&') + urlArgs : url;
        ```

        调整后，我们须在静态页中先引入 *hash-manifest.js* 文件(使用 _manifestJs_ 任务生成)，再在 `require.conifg` 中配置相应的 *urlArgs* 参数值(请根据实际情况进行调整)。
        由于我们在页面中直接引入 *hash-manifest.js* 文件，这也就要求我们为 *hash-manifest.js* 文件引入时添加版本号，查看 _replaceManifestJson_ 任务可知，其实 *hash-manifest.js* 文件的版本号是直接使用时间戳，这是因为实际开发时，_deploy_ 任务一般只在测试或生产环境发布新版本时执行即可。

2. 补充说明：

    以上介绍了在同一个静态资源工程中的 hashVersion 方案，但实际开发时可能还会遇到视图模版文件(View)与静态资源工程不在一块儿的情况，目前我们的方案是使用类似上述动态资源引入的方式，例如 `${e.fr('resource/path')}` 配置，并在后端配置中通过获取静态资源工程中的 *hash-manifest.json* 文件内容(一般通过服务器内部访问)，根据这份『文件-*hash*』对应关系文件动态拼上该文件的版本号。

===

但愿这份指南对你有用，如有问题请直接提交 issue 或 pull request 共同改进，谢谢！