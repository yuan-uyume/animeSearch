const uCore = {
    version: "0.0.1",
    proxy: {
        host: "localhost",
        port: "12077"
    },
    init(jquery, fetch, proxy) {
        if (proxy) {
            this.proxy = proxy
        }
        this.$ = jquery
        this.f = fetch
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
        this.proxyCommand = (command, success, fail) => {
            this.$.ajax({
                url: "http://"+this.proxy.host+":"+this.proxy.port+"/ececute?type="+command,
                type: 'get',
                timeout: 10000,
                success: (data) => {
                    success(data)
                },
                error: (xhr,errorText,errorType) => {
                    fail(xhr,errorText,errorType)
                }
            })
        }
        uCore.kits = {
            getInt: (num, limit) => {
                result = parseInt(num / limit)
                if (num % limit > 0) {
                    result ++
                }
                return result
            },
            getSite: () => {
                return this.proxy.host + ":" + this.proxy.port
            },
            getProxyUrl: (component) => {
                return component.protocol + "://" + this.kits.getSite() + component.proxy
            },
            getUrl: (component) => {
                return component.protocol + "://" + component.source_url
            },
            getUrlHeader: (component) => {
                return this.f ? this.kits.getUrl(component) : this.kits.getProxyUrl(component)
            },
            getFirstUrl: (component, word) => {
                return this.kits.replaceWord(this.kits.getUrlHeader(component) + component.search, word)
            },
            getPageUrl: (component, word, page) => {
                return this.kits.replacePage(this.kits.getUrlHeader(component) + component.page, word, page)
            },
            replaceWord: (str, word) => {
                return str.replace('{word}', word)
            },
            replacePage: (str, word, page) => {
                return str.replace('{word}', word).replace('{page}', page)
            }
        }
        uCore.parse = {
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
                console.log(this)
                let all_results = []
                let page = 1
                let url = this.kits.getFirstUrl(component, word)
                this.log(true, component, "开始初次获取结果("+limit+")..", url)
                // 获得结果，遍历页码直到达到限制上限
                if(this.f) {
                    this.parse.proxyFetchSearch(all_results, page, url, component, word, limit, callback)
                } else {
                    this.parse.proxySearch(all_results, page, url, component, word, limit, callback)
                }
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
                    page ++;
                    let url = this.kits.getPageUrl(component, word, page)
                        this.log(true, component, "开始第"+ page +"获取结果..", url)
                    if (this.f) {
                        this.parse.proxyFetchSearch(url, component, word, page, total, end, endSize, all_results, callback)
                    } else {
                        this.parse.proxyRealSearch(url, component, word, page, total, end, endSize, all_results, callback)
                    }
                }
            },
            proxySearch: (all_results, page, url, component, word, limit, callback) => {
            this.$.ajax({
                    url: url,
                    type: 'get',
                    timeout: 6000,
                    success: (data) => {
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
                    },
                    error: (xhr,errorText,errorType) => {
                    this.log(true, component, "检测到请求出错("+errorType+")，返回数据..")
                        console.log(errorText, errorType)
                        callback(all_results, errorType)
                    }
                })
            },
            fetchSearch: (all_results, page, url, component, word, limit, callback) => {},
            proxyRealSearch: (url, component, word, page, total, end, endSize, all_results, callback) => {
                $.ajax({
                    url: url,
                    type: 'get',
                    timeout: 6000,
                    success: (data) => {
                        try {
                        this.log(false, component, "第"+ page +"次请求状态：成功")
                            let results = component.getRealResult(data)
                            let parseResults = component.parseResult(results)
                                this.parse.handleParseResults(component, parseResults, word, page, total, end, endSize, all_results, callback)
                        } catch (e) {
                            callback(all_results, e)
                        }
                    },
                    error: (xhr,errorText,errorType) => {
                    this.log(true, component, "检测到请求出错("+errorType+")，返回数据..")
                        console.log(errorText, errorType)
                        callback(all_results, errorType)
                    }
                })
            },
            proxyFetchSearch: (url, component, word, page, total, end, endSize, all_results, callback) => {}
        }
        uCore.components = {
            yinghua: {
                protocol: "http",
                proxy: "/yinhua",
                search: "/vch.html?wd={word}",
                source_url: "http://yinhuadm.com",
                source: "樱花动漫(www.yinhuadm.com)",
                page: "/vch{word}/page/{page}.html",
                pageSize: 10,
                getTotal: (html) => {
                    return this.$(html).children(".tame").find("em").html()
                },
                getResult: (html) => {
                    return this.$(html).children(".fire").find("li")
                },
                getRealResult: (html) => {
                    return this.components.yinghua.getResult(html)
                },
                parseResult: (doms) => {
                    this.log(false, parse.yinghua, "开始解析樱花结果..", doms)
                    let results = []
                    for (let dom of doms) {
                        let img_dom = this.$(dom).children('a')
                        let total = this.$(dom).children('span')[1].innerText
                        let reg = /(\d+)[集|话]/g
                        if (total.match(reg)) {
                            total = RegExp.$1
                        } else {
                            total = '我不知道多少'
                        }
                        let result = {
                            url: this.components.yinghua.source_url + this.$(img_dom).attr('href'),
                            image: image = this.$(img_dom).children('img').attr('src'),
                            source: this.components.yinghua.source,
                            title: this.$(dom).children('h2').text(),
                            info: this.$(dom).children('p').text(),
                            total: total
                        }
                        results.push(result)
                    }
                    this.log(false, parse.yinghua, "获得樱花解析结果：", results)
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
                    let total = this.$(html)[78] ? this.$(html)[78].innerText :  this.$(html)[69].innerText
                    let reg = /(\d+)/g
                    if (total.match(reg)) {
                        total = RegExp.$1
                    } else {
                        total = null
                    }
                    return total

                },
                getResult: (html) => {
                    return this.$(this.$(html)[51]).find('.module-search-item')
                },
                getRealResult: (html) => {
                    return this.components.mxdm.getResult(html)
                },
                parseResult: (doms) => {
                    parse.log(false, parse.mxdm, "开始解析mx结果..", doms)
                    let results = []
                    for (let dom of doms) {
                        let img_dom = this.$(dom).find('.module-item-pic')
                        let total = this.$(dom).find('.video-serial').text()
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
                            url: this.components.mxdm.source_url + this.$(img_dom).children('a').attr('href'),
                            image: this.$(img_dom).children('img').data('src'),
                            source: this.components.mxdm.source,
                            title: this.$(dom).find('h3').text(),
                            info: this.$(dom).find('.video-info-item')[2].innerText,
                            total: total
                        }
                        results.push(result)
                    }
                    parse.log(false, parse.mxdm, "获得mx解析结果：", results)
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
                    let total = this.$(html).find("#result_count").text()
                    let reg = /(\d+)/g
                    if (total.match(reg)) {
                        total = RegExp.$1
                    } else {
                        total = null
                    }
                    return total

                },
                getResult: (html) => {
                    return this.$(html).find('.cell')
                },
                getRealResult: (html) => {
                    return this.components.age.getResult(html)
                },
                parseResult: (doms) => {
                    parse.log(false, parse.age, "开始解析age结果..", doms)
                    let results = []
                    for (let dom of doms) {
                        let img_dom = this.$(dom).find('.cell_poster')
                        let total = this.$(dom).find('.newname').text()
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
                            url: this.components.age.source_url + this.$(img_dom).attr('href'),
                            image: this.$(img_dom).children('img').attr('src'),
                            source: this.components.age.source,
                            title: this.$(dom).find('.cell_imform_name').text(),
                            info: this.$(dom).find('.cell_imform_desc').text(),
                            total: total
                        }
                        results.push(result)
                    }
                    parse.log(false, parse.age, "获得age解析结果：", results)
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
                    let total = this.$(html).find("#gohome").find("h1").text()
                    let reg = /(\d+)/g
                    if (total.match(reg)) {
                        total = RegExp.$1
                    } else {
                        total = null
                    }
                    return total

                },
                getResult: (html) => {
                    return this.$(html).find('.lpic').find("li")
                },
                getRealResult: (html) => {
                    return this.components.dm530p.getResult(html)
                },
                parseResult: (doms) => {
                    parse.log(false, parse.dm530p, "开始解析风车结果..", doms)
                    let results = []
                    for (let dom of doms) {
                        let img_dom = this.$(dom).children('a')
                        let total = this.$(dom).find('font').text()
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
                            url: this.components.dm530p.source_url + this.$(img_dom).attr('href'),
                            image: this.$(img_dom).children('img').attr('src'),
                            source: this.components.dm530p.source,
                            title: this.$(dom).children('h2').text(),
                            info: this.$(dom).children('p').text(),
                            total: total
                        }
                        results.push(result)
                    }
                    parse.log(false, parse.dm530p, "获得风车解析结果：", results)
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
                    let total = this.$(html).find("script")[0].innerText
                    let reg = /(\d+)/g
                    if (total.match(reg)) {
                        total = RegExp.$1
                    } else {
                        total = null
                    }
                    return total

                },
                getResult: (html) => {
                    return this.$(html).find('.show-list').find("li")
                },
                getRealResult: (html) => {
                    return this.components.zzzfun.getResult(html)
                },
                parseResult: (doms) => {
                    parse.log(false, parse.dm530p, "开始解析zzzFun结果..", doms)
                    let results = []
                    for (let dom of doms) {
                        let img_dom = this.$(dom).children('a')
                        let total = this.$(dom).find('.color').text()
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
                            url: this.components.zzzfun.source_url + this.$(img_dom).attr('href'),
                            image: this.$(img_dom).children('img').attr('src'),
                            source: this.components.zzzfun.source,
                            title: this.$(dom).children('div').children('h2').text(),
                            info: this.$(dom).find('.juqing').find('p').text(),
                            total: total
                        }
                        results.push(result)
                    }
                    parse.log(false, parse.zzzfun, "获得zzzFun解析结果：", results)
                    return results
                }
            },
        }
        console.log("uCore 已初始化， 当前版本为:", this.version)
    }
}