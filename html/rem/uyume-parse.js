let parse = {
    host: "localhost",
    port: "12077",
    ssl_port: "22077",
    getHttp: () => {
        return "http://"+parse.host+":"+parse.port+"/"
    },
    getHttps: () => {
        return "https://"+parse.host+":"+parse.ssl_port+"/"
    },
    log: (out, component,...data) => {
        console.log(component.source + " => ",  ...data)
        if (out) {
            let con = $("#console").html() + component.source + " => "
            for (let d of data) {
                con = con + d
            }
            con = con + "<br/>"
            $("#console").html(con)
        }
    },
    getInt: (num, limit) => {
        result = parseInt(num / limit)
        if (num % limit > 0) {
            result ++
        }
        return result
    },
    getPages: (total, pageSize, limit) => {
        total = parseInt(total)
        pageSize = parseInt(pageSize)
        limit = parseInt(limit)
        let pages = parse.getInt(total, pageSize)
        let end = limit === 0? total : total > limit ? limit : total;
        let endSize = limit === pageSize ? limit : end % pageSize
        end = parse.getInt(end, pageSize)
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
        let url = component.getFirstUrl(word)
        parse.log(true, component, "开始初次获取结果("+limit+")...", url)
        // 获得结果，遍历页码直到达到限制上限
        $.ajax({
            url: url,
            type: 'get',
            timeout: 6000,
            success: (data) => {
                parse.log(false, component, "初次请求状态：成功")
                try {
                    let result = component.getResult(data)
                    let total = component.getTotal(data)
                    if (result == null || total == null || total == 0) {
                        if (total == 0) {
                            callback([])
                        } else {
                            parse.log(true, component, "未获取到总数，无法继续结束")
                            callback([],"no total")
                        }
                        return;
                    }
                    let pageInfo = parse.getPages(total, component.pageSize, limit)
                    parse.log(true, component, "获得结果信息 => 总数", total, "页数", pageInfo.pages, "结束页码", pageInfo.end, "结束数量", pageInfo.endSize)
                    let parseResults = component.parseResult(result)
                    parse.handleParseResults(component, parseResults, word, page, pageInfo.pages, pageInfo.end, pageInfo.endSize, all_results, callback)
                } catch (e) {
                    callback(all_results, e)
                }
            },
            error: (xhr,errorText,errorType) => {
                parse.log(true, component, "检测到请求出错("+errorType+")，返回数据...")
                console.log(errorText, errorType)
                callback(all_results, errorType)
            }
        })
    },
    realSearch: (component, word, page, total, end, endSize, all_results, callback) => {
        page ++;
        let url = component.getPageUrl(word, page)
        parse.log(true, component, "开始第"+ page +"获取结果...", url)
        $.ajax({
            url: url,
            type: 'get',
            timeout: 6000,
            success: (data) => {
                try {
                    parse.log(false, component, "第"+ page +"次请求状态：成功")
                    let results = component.getRealResult(data)
                    let parseResults = component.parseResult(results)
                    parse.handleParseResults(component, parseResults, word, page, total, end, endSize, all_results, callback)
                } catch (e) {
                    callback(all_results, e)
                }
            },
            error: (xhr,errorText,errorType) => {
                parse.log(true, component, "检测到请求出错("+errorType+")，返回数据...")
                console.log(errorText, errorType)
                callback(all_results, errorType)
            }
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
            parse.log(false, component, "搜索完毕，返回数据...", all_results)
            parse.log(true, component, "搜索成功...共", all_results.length, "条结果")
        } else {
            parse.realSearch(component, word, page, total, end, endSize, all_results, callback)
        }
    },
    yinghua: {
        url: "yinhua/vch.html?wd=",
        url_base: "http://yinhuadm.com/",
        source: "樱花动漫(www.yinhuadm.com)",
        page: "yinhua/vch{word}/page/{page}.html",
        pageSize: 10,
        getFirstUrl: (word) => {
            return parse.getHttp() + parse.yinghua.url + word
        },
        getTotal: (html) => {
            return $(html).children(".tame").find("em").html()
        },
        getResult: (html) => {
            return $(html).children(".fire").find("li")
        },
        getRealResult: (html) => {
            return parse.yinghua.getResult(html)
        },
        getPageUrl: (word, page) => {
            return parse.getHttp() + parse.yinghua.page.replace('{word}', word).replace('{page}', page)
        },
        parseResult: (doms) => {
            parse.log(false, parse.yinghua, "开始解析樱花结果...", doms)
            let results = []
            for (let dom of doms) {
                let img_dom = $(dom).children('a')
                let total = $(dom).children('span')[1].innerText
                let reg = /(\d+)[集|话]/g
                if (total.match(reg)) {
                    total = RegExp.$1
                } else {
                    if (total.indexOf('完结') !== -1) {
                        total = '更完了的'
                    } else {
                        total = '我不知道多少'
                    }
                }
                let result = {
                    url: parse.yinghua.url_base + $(img_dom).attr('href'),
                    image: image = $(img_dom).children('img').attr('src'),
                    source: parse.yinghua.source,
                    title: $(dom).children('h2').text(),
                    info: $(dom).children('p').text(),
                    total: total
                }
                results.push(result)
            }
            parse.log(false, parse.yinghua, "获得樱花解析结果：", results)
            return results
        },
    },
    mxdm: {
        url: "mxdm/search/-------------.html?wd=",
        url_base: "http://www.mxdm.cc",
        source: "MX动漫(www.mxdm.cc)",
        page: "mxdm/search/{word}----------{page}---.html",
        pageSize: 10,
        getFirstUrl: (word) => {
            return parse.getHttp() + parse.mxdm.url + word
        },
        getPageUrl: (word, page) => {
          return parse.getHttp() + parse.mxdm.page.replace('{word}', word).replace('{page}', page)
        },
        getTotal: (html) => {
            let total = $(html)[78] ? $(html)[78].innerText :  $(html)[69].innerText
            let reg = /(\d+)/g
            if (total.match(reg)) {
                total = RegExp.$1
            } else {
                total = null
            }
            return total

        },
        getResult: (html) => {
            return $($(html)[51]).find('.module-search-item')
        },
        getRealResult: (html) => {
            return parse.mxdm.getResult(html)
        },
        parseResult: (doms) => {
            parse.log(false, parse.mxdm, "开始解析mx结果...", doms)
            let results = []
            for (let dom of doms) {
                let img_dom = $(dom).find('.module-item-pic')
                let total = $(dom).find('.video-serial').text()
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
                    url: parse.mxdm.url_base + $(img_dom).children('a').attr('href'),
                    image: $(img_dom).children('img').data('src'),
                    source: parse.mxdm.source,
                    title: $(dom).find('h3').text(),
                    info: $(dom).find('.video-info-item')[2].innerText,
                    total: total
                }
                results.push(result)
            }
            parse.log(false, parse.mxdm, "获得mx解析结果：", results)
            return results
        }
    },
    age: {
        url: "agesearch?query={word}&page=1",
        url_base: "https://www.agemys.com",
        source: "AGE动漫(www.agemys.com)",
        page: "agesearch?query={word}&page={page}",
        pageSize: 24,
        getFirstUrl: (word) => {
            return parse.getHttp() + parse.age.url.replace("{word}", word)
        },
        getPageUrl: (word, page) => {
            return parse.getHttp() + parse.age.page.replace('{word}', word).replace('{page}', page)
        },
        getTotal: (html) => {
            let total = $(html).find("#result_count").text()
            let reg = /(\d+)/g
            if (total.match(reg)) {
                total = RegExp.$1
            } else {
                total = null
            }
            return total

        },
        getResult: (html) => {
            return $(html).find('.cell')
        },
        getRealResult: (html) => {
            return parse.age.getResult(html)
        },
        parseResult: (doms) => {
            parse.log(false, parse.age, "开始解析age结果...", doms)
            let results = []
            for (let dom of doms) {
                let img_dom = $(dom).find('.cell_poster')
                let total = $(dom).find('.newname').text()
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
                    url: parse.age.url_base + $(img_dom).attr('href'),
                    image: $(img_dom).children('img').attr('src'),
                    source: parse.age.source,
                    title: $(dom).find('.cell_imform_name').text(),
                    info: $(dom).find('.cell_imform_desc').text(),
                    total: total
                }
                results.push(result)
            }
            parse.log(false, parse.age, "获得age解析结果：", results)
            return results
        }
    },
    dm530p: {
        url: "dmps_all?ex=1&kw=",
        url_base: "https://www.dm530p.com",
        source: "风车动漫(www.dm530p.com)",
        page: "dmps_all?kw={word}&pagesize=24&pageindex={page}",
        pageSize: 24,
        getFirstUrl: (word) => {
            return parse.getHttp() + parse.dm530p.url + word
        },
        getPageUrl: (word, page) => {
            return parse.getHttp() + parse.dm530p.page.replace('{word}', word).replace('{page}', page - 1)
        },
        getTotal: (html) => {
            let total = $(html).find("#gohome").find("h1").text()
            let reg = /(\d+)/g
            if (total.match(reg)) {
                total = RegExp.$1
            } else {
                total = null
            }
            return total

        },
        getResult: (html) => {
            return $(html).find('.lpic').find("li")
        },
        getRealResult: (html) => {
            return parse.dm530p.getResult(html)
        },
        parseResult: (doms) => {
            parse.log(false, parse.dm530p, "开始解析风车结果...", doms)
            let results = []
            for (let dom of doms) {
                let img_dom = $(dom).children('a')
                let total = $(dom).find('font').text()
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
                    url: parse.dm530p.url_base + $(img_dom).attr('href'),
                    image: $(img_dom).children('img').attr('src'),
                    source: parse.dm530p.source,
                    title: $(dom).children('h2').text(),
                    info: $(dom).children('p').text(),
                    total: total
                }
                results.push(result)
            }
            parse.log(false, parse.dm530p, "获得风车解析结果：", results)
            return results
        }
    },
    zzzfun: {
        url: "zzzfun/vod_search.html?wd=",
        url_base: "http://www.zzzfun.com/",
        source: "zzzFun(www.zzzfun.com)",
        page: "zzzfun/vod_search_page_{page}_wd_{word}.html",
        pageSize: 10,
        getFirstUrl: (word) => {
            return parse.getHttp() + parse.zzzfun.url + word
        },
        getPageUrl: (word, page) => {
            return parse.getHttp() + parse.zzzfun.page.replace('{word}', word).replace('{page}', page - 1)
        },
        getTotal: (html) => {
            let total = $(html).find("script")[0].innerText
            let reg = /(\d+)/g
            if (total.match(reg)) {
                total = RegExp.$1
            } else {
                total = null
            }
            return total

        },
        getResult: (html) => {
            return $(html).find('.show-list').find("li")
        },
        getRealResult: (html) => {
            return parse.zzzfun.getResult(html)
        },
        parseResult: (doms) => {
            parse.log(false, parse.dm530p, "开始解析zzzFun结果...", doms)
            let results = []
            for (let dom of doms) {
                let img_dom = $(dom).children('a')
                let total = $(dom).find('.color').text()
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
                    url: parse.zzzfun.url_base + $(img_dom).attr('href'),
                    image: $(img_dom).children('img').attr('src'),
                    source: parse.zzzfun.source,
                    title: $(dom).children('div').children('h2').text(),
                    info: $(dom).find('.juqing').find('p').text(),
                    total: total
                }
                results.push(result)
            }
            parse.log(false, parse.zzzfun, "获得zzzFun解析结果：", results)
            return results
        }
    },
}