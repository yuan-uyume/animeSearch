const uAnimeSearchCore = {
    name: "uAnimeSearchCore",
    version: "0.0.2",
    proxy: {
        enable: true,
        host: "localhost",
        port: "12077"
    },
    components: {
        yinghua: {
            protocol: "http",
            proxy: "/yinhua",
            search: "/vch.html?wd={word}",
            source_url: "http://yinhuadm.com",
            source: "樱花动漫(www.yinhuadm.com)",
            page: "/vch{word}/page/{page}.html",
            pageSize: 10,
            getTotal: (html) => {
                return uAnimeSearchCore.$(html).children(".tame").find("em").html()
            },
            getResult: (html) => {
                return uAnimeSearchCore.$(html).children(".fire").find("li")
            },
            getRealResult: (html) => {
                return uAnimeSearchCore.components.yinghua.getResult(html)
            },
            parseResult: (doms) => {
                uAnimeSearchCore.log(false, uAnimeSearchCore.components.yinghua, "开始解析樱花结果..", doms)
                let results = []
                for (let dom of doms) {
                    let img_dom = uAnimeSearchCore.$(dom).children('a')
                    let total = uAnimeSearchCore.$(dom).children('span')[1].innerText
                    let reg = /(\d+)[集|话]/g
                    if (total.match(reg)) {
                        total = RegExp.$1
                    } else {
                        total = '我不知道多少'
                    }
                    let result = {
                        url: uAnimeSearchCore.components.yinghua.source_url + uAnimeSearchCore.$(img_dom).attr('href'),
                        image: uAnimeSearchCore.$(img_dom).children('img').attr('src'),
                        source: uAnimeSearchCore.components.yinghua.source,
                        title: uAnimeSearchCore.$(dom).children('h2').text(),
                        info: uAnimeSearchCore.$(dom).children('p').text(),
                        total: total
                    }
                    results.push(result)
                }
                uAnimeSearchCore.log(false, uAnimeSearchCore.components.yinghua, "获得樱花解析结果：", results)
                return results
            },
        },
        mxdm: {
            protocol: "http",
            proxy: "/mxdm",
            search: "/search/-------------.html?wd={word}",
            source_url: "http://www.mxdm.cc",
            source: "MX动漫(www.mxdm.cc)",
            page: "/search/{word}----------{page}---.html",
            pageSize: 10,
            getTotal: (html) => {
                let total = uAnimeSearchCore.$(html)[78] ? uAnimeSearchCore.$(html)[78].innerText :  uAnimeSearchCore.$(html)[69].innerText
                let reg = /(\d+)/g
                if (total.match(reg)) {
                    total = RegExp.$1
                } else {
                    total = null
                }
                return total

            },
            getResult: (html) => {
                return uAnimeSearchCore.$(uAnimeSearchCore.$(html)[51]).find('.module-search-item')
            },
            getRealResult: (html) => {
                return uAnimeSearchCore.components.mxdm.getResult(html)
            },
            parseResult: (doms) => {
                uAnimeSearchCore.log(false, uAnimeSearchCore.components.mxdm, "开始解析mx结果..", doms)
                let results = []
                for (let dom of doms) {
                    let img_dom = uAnimeSearchCore.$(dom).find('.module-item-pic')
                    let total = uAnimeSearchCore.$(dom).find('.video-serial').text()
                    let reg = /(\d+)[集|话]/g
                    if (total.match(reg)) {
                        total = RegExp.$1
                    } else {
                        if (total === '完结') {
                            total = '更完了的'
                        } else {
                            total = '我不知道多少'
                        }
                    }
                    let result = {
                        url: uAnimeSearchCore.components.mxdm.source_url + uAnimeSearchCore.$(img_dom).children('a').attr('href'),
                        image: uAnimeSearchCore.$(img_dom).children('img').data('src'),
                        source: uAnimeSearchCore.components.mxdm.source,
                        title: uAnimeSearchCore.$(dom).find('h3').text(),
                        info: uAnimeSearchCore.$(dom).find('.video-info-item')[2].innerText,
                        total: total
                    }
                    results.push(result)
                }
                uAnimeSearchCore.log(false, uAnimeSearchCore.components.mxdm, "获得mx解析结果：", results)
                return results
            }
        },
        age: {
            protocol: "http",
            proxy: "/age",
            search: "search?query={word}&page=1",
            source_url: "https://www.agemys.com",
            source: "AGE动漫(www.agemys.com)",
            page: "search?query={word}&page={page}",
            pageSize: 24,
            getTotal: (html) => {
                let total = uAnimeSearchCore.$(html).find("#result_count").text()
                let reg = /(\d+)/g
                if (total.match(reg)) {
                    total = RegExp.$1
                } else {
                    total = null
                }
                return total

            },
            getResult: (html) => {
                return uAnimeSearchCore.$(html).find('.cell')
            },
            getRealResult: (html) => {
                return uAnimeSearchCore.components.age.getResult(html)
            },
            parseResult: (doms) => {
                uAnimeSearchCore.log(false, uAnimeSearchCore.components.age, "开始解析age结果..", doms)
                let results = []
                for (let dom of doms) {
                    let img_dom = uAnimeSearchCore.$(dom).find('.cell_poster')
                    let total = uAnimeSearchCore.$(dom).find('.newname').text()
                    let reg = /(\d+)[集|话]/g
                    if (total.match(reg)) {
                        total = RegExp.$1
                    } else {
                        let reg = /(\d+-(\d+))/g
                        if (total.match(reg)) {
                            total = RegExp.$2
                        } else {
                            total = '我不知道多少'
                        }
                    }
                    let result = {
                        url: uAnimeSearchCore.components.age.source_url + uAnimeSearchCore.$(img_dom).attr('href'),
                        image: uAnimeSearchCore.$(img_dom).children('img').attr('src'),
                        source: uAnimeSearchCore.components.age.source,
                        title: uAnimeSearchCore.$(dom).find('.cell_imform_name').text(),
                        info: uAnimeSearchCore.$(dom).find('.cell_imform_desc').text(),
                        total: total
                    }
                    results.push(result)
                }
                uAnimeSearchCore.log(false, uAnimeSearchCore.components.age, "获得age解析结果：", results)
                return results
            }
        },
        dm530p: {
            protocol: "https",
            proxy: "/dmp",
            search: "s_all?ex=1&kw={word}",
            source_url: "https://www.dm530p.com",
            source: "风车动漫(www.dm530p.com)",
            page: "s_all?kw={word}&pagesize=24&pageindex={page}",
            pageSize: 24,
            getTotal: (html) => {
                let total = uAnimeSearchCore.$(html).find("#gohome").find("h1").text()
                let reg = /(\d+)/g
                if (total.match(reg)) {
                    total = RegExp.$1
                } else {
                    total = null
                }
                return total

            },
            getResult: (html) => {
                return uAnimeSearchCore.$(html).find('.lpic').find("li")
            },
            getRealResult: (html) => {
                return uAnimeSearchCore.components.dm530p.getResult(html)
            },
            parseResult: (doms) => {
                uAnimeSearchCore.log(false, uAnimeSearchCore.components.dm530p, "开始解析风车结果..", doms)
                let results = []
                for (let dom of doms) {
                    let img_dom = uAnimeSearchCore.$(dom).children('a')
                    let total = uAnimeSearchCore.$(dom).find('font').text()
                    let reg = /(\d+)[集|话]/g
                    if (total.match(reg)) {
                        total = RegExp.$1
                    } else {
                        if (total.match(reg)) {
                            total = RegExp.$2
                        } else if (total !== "全集"){
                            total = '我不知道多少'
                        }
                    }
                    let result = {
                        url: uAnimeSearchCore.components.dm530p.source_url + uAnimeSearchCore.$(img_dom).attr('href'),
                        image: uAnimeSearchCore.$(img_dom).children('img').attr('src'),
                        source: uAnimeSearchCore.components.dm530p.source,
                        title: uAnimeSearchCore.$(dom).children('h2').text(),
                        info: uAnimeSearchCore.$(dom).children('p').text(),
                        total: total
                    }
                    results.push(result)
                }
                uAnimeSearchCore.log(false, uAnimeSearchCore.components.dm530p, "获得风车解析结果：", results)
                return results
            }
        },
        zzzfun: {
            protocol: "http",
            proxy: "/zzzfun",
            search: "/vod_search.html?wd={word}",
            source_url: "http://www.zzzfun.com",
            source: "zzzFun(www.zzzfun.com)",
            page: "/vod_search_page_{page}_wd_{word}.html",
            pageSize: 10,
            getTotal: (html) => {
                let total = uAnimeSearchCore.$(html).find("script")[0].innerText
                let reg = /(\d+)/g
                if (total.match(reg)) {
                    total = RegExp.$1
                } else {
                    total = null
                }
                return total

            },
            getResult: (html) => {
                return uAnimeSearchCore.$(html).find('.show-list').find("li")
            },
            getRealResult: (html) => {
                return uAnimeSearchCore.components.zzzfun.getResult(html)
            },
            parseResult: (doms) => {
                uAnimeSearchCore.log(false, uAnimeSearchCore.components.zzzfun, "开始解析zzzFun结果..", doms)
                let results = []
                for (let dom of doms) {
                    let img_dom = uAnimeSearchCore.$(dom).children('a')
                    let total = uAnimeSearchCore.$(dom).find('.color').text()
                    let reg = /(\d+)[集|话]\//g
                    if (total.match(reg)) {
                        total = RegExp.$1
                    } else {
                        if (total.match(reg)) {
                            total = RegExp.$2
                        } else if (total !== "全集"){
                            total = '我不知道多少'
                        }
                    }
                    let result = {
                        url: uAnimeSearchCore.components.zzzfun.source_url + uAnimeSearchCore.$(img_dom).attr('href'),
                        image: uAnimeSearchCore.$(img_dom).children('img').attr('src'),
                        source: uAnimeSearchCore.components.zzzfun.source,
                        title: uAnimeSearchCore.$(dom).children('div').children('h2').text(),
                        info: uAnimeSearchCore.$(dom).find('.juqing').find('p').text(),
                        total: total
                    }
                    results.push(result)
                }
                uAnimeSearchCore.log(false, uAnimeSearchCore.components.zzzfun, "获得zzzFun解析结果：", results)
                return results
            }
        },
    },
    init(jquery, proxy) {
        if (proxy) {
            this.proxy = Object.assign(this.proxy, proxy);
        }
        this.$ = jquery
        this.log = (out, component, ...data) => {
            if (component && component.source) {
                console.log(component.source + " => ", ...data)
                if (out) {
                    let con = this.$("#console").html() + component.source + " => "
                    for (let d of data) {
                        con = con + d
                    }
                    con = con + "<br/>"
                    this.$("#console").html(con)
                }
            } else {
                console.log("uyume- => ", ...data)
            }
        }

        this.http = {
            get: (url, success, error) => {
                this.$.ajax({
                    url: url,
                    type: 'get',
                    timeout: 6000,
                    success: (data) => {
                        success(data)
                    },
                    error: (xhr,errorText,errorType) => {
                        error(errorText)
                    }
                })
            }
        }

        this.kits = {
            getInt: (num, limit) => {
                result = parseInt(num / limit)
                if (num % limit > 0) {
                    result ++
                }
                return result
            },
            getSite: () => {
                return  this.proxy.host + this.proxy.port ? ":" + this.proxy.port : ''
            },
            getProxyUrl: (component) => {
                return (this.proxy.path ? this.proxy.path : component.protocol + "://" + this.kits.getSite()) +  component.proxy
            },
            getUrl: (component) => {
                return component.source_url
            },
            getUrlHeader: (component) => {
                return !(this.proxy && this.proxy.enable) ? this.kits.getUrl(component) : this.kits.getProxyUrl(component)
            },
            getFirstUrl: (component, word) => {
                return this.kits.replaceWord(this.kits.getUrlHeader(component) + component.search , word)
            },
            getPageUrl: (component, word, page) => {
                return this.kits.replacePage(this.kits.getUrlHeader(component) + component.page , word, page)
            },
            replaceWord: (str, word) => {
                return str.replace('{word}', word)
            },
            replacePage: (str, word, page) => {
                return str.replace('{word}', word).replace('{page}', page)
            }
        }
        this.parse = {
            getPages: (total, pageSize, limit) => {
                total = parseInt(total)
                pageSize = parseInt(pageSize)
                limit = parseInt(limit)
                let pages = this.kits.getInt(total, pageSize)
                let end = limit === 0? total : total > limit ? limit : total;
                let endSize = limit === pageSize ? limit : end % pageSize
                end = this.kits.getInt(end, pageSize)
                end = end > total ? total : end
                return {
                    pages: pages,
                    end: end,
                    endSize: endSize
                }
            },
            search: (component, word, limit, callback) => {
                let all_results = []
                let page = 1
                let url = this.kits.getFirstUrl(component, word)
                this.log(true, component, "开始初次获取结果("+limit+")..", url)
                // 获得结果，遍历页码直到达到限制上限
                this.http.get(url, (data) => {
                    this.log(false, component, "初次请求状态：成功")
                    try {
                        let result = component.getResult(data)
                        let total = component.getTotal(data)
                        if (result == null || total == null || total == 0) {
                            if (total == 0) {
                                callback([])
                            } else {
                                this.log(true, component, "未获取到总数，无法继续结束")
                                callback([],"no total")
                            }
                            return;
                        }
                        let pageInfo = this.parse.getPages(total, component.pageSize, limit)
                        this.log(true, component, "获得结果信息 => 总数", total, "页数", pageInfo.pages, "结束页码", pageInfo.end, "结束数量", pageInfo.endSize)
                        let parseResults = component.parseResult(result)
                        this.parse.handleParseResults(component, parseResults, word, page, pageInfo.pages, pageInfo.end, pageInfo.endSize, all_results, callback)
                    } catch (e) {
                        callback(all_results, e)
                    }
                }, (e) => {
                    this.log(true, component, "检测到请求出错("+e+")，返回数据..")
                    callback(all_results, e)
                })
            },
            handleParseResults: (component, parseResults, word, page, total, end, endSize, all_results, callback) => {
                if (parseResults != null && parseResults.length > 0) {
                    all_results.push(...parseResults)
                }

                if (page >= end) {
                    let source = []
                    let distResults = []
                    // 结束，但去重
                    for (let d of all_results) {
                        if (!source.includes(d.url)) {
                            source.push(d.url)
                            distResults.push(d)
                        }
                    }
                    let needCount = (end - 1) * component.pageSize + endSize
                    if (needCount > distResults.length) {
                        // 去重后数量低于限制,获取下一页
                        all_results = distResults
                        end ++
                        endSize = needCount - distResults.length
                    } else {
                        all_results = all_results.slice(0, needCount)
                    }
                }

                if (page >= end || page >= total) {
                    callback(all_results)
                    this.log(false, component, "搜索完毕，返回数据..", all_results)
                    this.log(true, component, "搜索成功..共", all_results.length, "条结果")
                } else {
                    this.parse.realSearch(component, word, page, total, end, endSize, all_results, callback)
                }
            },
            realSearch: (component, word, page, total, end, endSize, all_results, callback) => {
                page ++;
                let url = this.kits.getPageUrl(component, word, page)
                this.log(true, component, "开始第"+ page +"获取结果..", url)
                this.http.get(url, (data) => {
                    try {
                        this.log(false, component, "第"+ page +"次请求状态：成功")
                        let results = component.getRealResult(data)
                        let parseResults = component.parseResult(results)
                        this.parse.handleParseResults(component, parseResults, word, page, total, end, endSize, all_results, callback)
                    } catch (e) {
                        callback(all_results, e)
                    }
                }, (e) => {
                    this.log(true, component, "检测到请求出错("+e+")，返回数据..")
                    callback(all_results, e)
                })
            }
        }
        console.log(this.name ,"已初始化， 当前版本为:", this.version)
    }
}
