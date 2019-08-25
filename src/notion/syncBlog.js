const puppeteer = require('puppeteer');
const GitHub = require('../github/api');
const dayjs = require('dayjs');
const config = require('../../config');
const notion = require('./api');
const fs = require("fs")
const path = require("path")

function generateBrief(text, length) {
    return text.replace(/<[^>]*>|/g, "").substr(0, length)
}


syncBlogData = async (url) => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url);
    await page.waitForSelector('#notion-app');
    await page.waitFor(8000);
    const data = await page.evaluate(() => {
        // 图片链接转换
        document.querySelectorAll('div.notion-page-content  img').forEach(item => {
            if (item.src.startsWith("https://s3.us-west")) {
                let [parsedOriginUrl] = item.src.split("?")
                item.src = `https://notion.so/image/${encodeURIComponent(parsedOriginUrl).replace("s3.us-west", "s3-us-west")}`
            } else {
                item.src = item.src
            }
        })

        // TOC 链接转化
        let qs = "#notion-app > div > div.notion-cursor-listener > div > div.notion-scroller.vertical.horizontal > div.notion-page-content > div > div:nth-child(1) > div > a"
        document.querySelectorAll(qs).forEach(item => {
            const getFullBlockId = (blockId) => {
                if (typeof blockId !== 'string') {
                    throw Error(`blockId: ${typeof blockId} must be string`)
                }
                if (blockId.match("^[a-zA-Z0-9]+$")) {
                    return blockId.substr(0, 8) + "-" +
                        blockId.substr(8, 4) + "-" +
                        blockId.substr(12, 4) + "-" +
                        blockId.substr(16, 4) + "-" +
                        blockId.substr(20, 32)
                } else {
                    return blockId
                }
            }
            let hashBlockID = getFullBlockId(item.hash.slice(1))
            item.href = `#${hashBlockID}`

            let block = document.querySelector(`div[data-block-id="${hashBlockID}"]`)
            if (block) {
                block.id = hashBlockID
            }
        });

        // 文章内容
        let content = document.querySelector('#notion-app > div > div.notion-cursor-listener > div > div > div.notion-page-content')

        if (content) {
            return {
                html: content.innerHTML,
                brief: content.innerText.slice(0, 100)
            }
        } else {
            return false
        }
    })

    await browser.close();
    return data
}

uploadBlogData2Github = async (item, blogData) => {
    let blogKey = `${item.slug}.json`
    let now = dayjs()

    let d = {
        'update_time': now.toISOString(),
        'content': blogData
    }
    let res = await GitHub.updateOrCreate(blogKey, JSON.stringify(d))
    if (res) {
        console.log(`>>>${item.name} 更新到github成功`)
    } else {
        console.log(`>>>${item.name} 更新到github失败`)
    }
}


createBlogPostNode = (blogData, item, createNode, createNodeId, createContentDigest) => {
    let data = {
        ...item,
        update_time: item.last_edited_time,
        slug: `posts/${item.slug}`,
        html: blogData.html,
        brief: blogData.brief
    }
    const nodeContent = JSON.stringify(data)
    const nodeMeta = {
        id: createNodeId(data.slug),
        parent: null,
        children: [],
        internal: {
            type: `Post`,
            mediaType: `text/html`,
            content: nodeContent,
            contentDigest: createContentDigest(data)
        }
    }
    const node = Object.assign({}, data, nodeMeta)
    createNode(node)
}


getBlogInfoData = async (item, allBlogInfoFromGithub) => {
    // 文章内容获取策略： 优先从本地缓存获取文章 > [从 github 获取文章]> pupetteer 抓取 > [同步文章到 github]
    let rootPath = path.dirname(path.dirname(__dirname))
    let localPostDataPath = `${rootPath}/public/page-data/posts/${item.slug}/page-data.json`

    if (fs.existsSync(localPostDataPath)) {
        console.log(`从本地获取文章缓存: ${item.name}`)
        let allData = fs.readFileSync(localPostDataPath)
        let postData = JSON.parse(allData)
        const {
            update_time,
            html
        } = postData.result.data.post
        return {
            blogData: {
                brief: generateBrief(html, 100),
                html
            },
            update_time,
            source: 'local'
        }
    } else if (config.blog.openGithubCache && allBlogInfoFromGithub) {
        // 从 github 获取博客内容
        console.log(`从 github 获取文章缓存: ${item.name}`)
        let blogKey = `${item.slug}.json`
        let blogSha = allBlogInfoFromGithub[blogKey]
        if (blogSha) {
            // 存在旧blog数据
            let githubBlogData = await GitHub.getBlogData(blogSha)
            return {
                blogData: githubBlogData.content,
                update_time: githubBlogData.update_time,
                source: 'github'
            }
        } else {
            return {
                source: 'github'
            }
        }
    }
}

exports.syncNotionBlogData = async ({
    createNode,
    createNodeId,
    createContentDigest
}) => {

    if (config.blog.sourceType === 'notion') {
        let url = config.blog.url
        let res = await notion.queryCollection(url)
        let allBlogInfoFromGithub
        res = res.filter(item => item && item.public_date && item.status == '已发布')
        if (config.blog.openGithubCache) {
            // 开启github 文章缓存
            allBlogInfoFromGithub = await GitHub.getAllBlogInfo()
        }
        for (let item of res) {
            let blogData
            let blogInfoData = await getBlogInfoData(item, allBlogInfoFromGithub)
            if (blogInfoData && blogInfoData.blogData && blogInfoData.update_time) {
                // 文章需要更新 & 启用github缓存，需要同步到github
                if (dayjs(item.last_edited_time) > dayjs(blogInfoData.update_time)) {
                    console.log(`>>>${blogInfoData.source} 文章已经过期：${item.name} \n`)
                    console.log(`>>>开始同步文章:${item.name} from notion \n`)
                    blogData = await syncBlogData(item.browseableUrl);
                    if (config.blog.openGithubCache) {
                        console.log(`>>>同步文章:${item.name} 到 github \n`)
                        await uploadBlogData2Github(item, blogData)
                    }
                } else {
                    blogData = blogInfoData.blogData
                }
            } else {
                // 找不到文章, puppetter 抓取
                console.log(`>>>开始同步文章:${item.name} from notion \n`)
                blogData = await syncBlogData(item.browseableUrl);

                if (config.blog.openGithubCache) {
                    console.log(`>>>同步文章:${item.name} 到 github \n`)
                    await uploadBlogData2Github(item, blogData)
                }
            }
            if (blogData) {
                createBlogPostNode(blogData, item, createNode, createNodeId, createContentDigest)
            }
        }
    }
}

exports.syncNotionBookData = async ({
    createNode,
    createNodeId,
    createContentDigest
}) => {
    let url = 'https://www.notion.so/98717bf8ad57434eafd9a65277403c33?v=fa4f00bb9b5b492fb23157f8d5df471f'
    let res = await notion.queryCollection(url)

    for (let data of res) {
        const nodeContent = JSON.stringify(data)
        const nodeMeta = {
            id: createNodeId(data.slug),
            parent: null,
            children: [],
            internal: {
                type: `Book`,
                mediaType: `text/html`,
                content: nodeContent,
                contentDigest: createContentDigest(data)
            }
        }
        const node = Object.assign({}, data, nodeMeta)
        createNode(node)
    }
}