const axios = require("axios");

const SERVER_CHAN_SCKEY = process.env.SERVER_CHAN_SCKEY;
const HIFINI_COOKIE = process.env.HIFINI_COOKIE;
const V2EX_COOKIE = process.env.V2EX_COOKIE;

function serverChan(msg) {
    const url = `https://sc.ftqq.com/${SERVER_CHAN_SCKEY}.send`
    axios.post(url, `text=今日签到结果&desp=${msg}`)
        .then(res => {
            if (res.data.errmsg === 'success') {
                return console.log('消息推送成功')
            }
            console.log('消息推送失败')
        })
        .catch(err => console.log('消息推送失败'))
}

const signers = [
    {
        desc: 'hifini音乐磁场',
        action: (name) => {
            // 无cookie跳过
            if (!HIFINI_COOKIE) {
                return Promise.reject({ name, state: 'BYPASS' })
            }

            const REG = {
                SIGN_SUCCESS: /成功签到！/,
                SIGNED: /今天已经签过啦！/,
            }
            const signURL = 'https://www.hifini.com/sg_sign.htm'
            const postData = ''
            const config = {
                headers: {
                    Referer: "https://www.hifini.com",
                    Host: "www.hifini.com",
                    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36",
                    cookie: HIFINI_COOKIE,
                },
            };
            return new Promise((resolve, reject) => {
                axios.post(signURL, postData, config)
                    .then(({ data }) => {
                        if (REG.SIGN_SUCCESS.test(String(data))) {
                            resolve({ name, state: 'SUCCESS' })
                        } else if (REG.SIGNED.test(String(data))) {
                            resolve({ name, state: 'SIGNED' })
                        } else {
                            reject({ name, state: 'FAILED' })
                        }
                    })
                    .catch(err => {
                        reject({ name, state: 'FAILED' })
                    })
            });
        }
    },
    {
        desc: 'V2EX',
        action: (name) => {
            // 无cookie跳过
            if (!V2EX_COOKIE) {
                return Promise.reject({ name, state: 'BYPASS' })
            }

            const REG = {
                SIGN_SUCCESS: /已成功领取每日登录奖励/,
                SIGNED: /每日登录奖励已领取/,
                ONCE_PATTERN: /redeem\?once=(.*?)'/,
            }
            const checkUrl = 'https://www.v2ex.com/mission/daily'
            const config = {
                headers: {
                    Referer: "https://www.v2ex.com/mission",
                    Host: "www.v2ex.com",
                    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36",
                    cookie: V2EX_COOKIE,
                },
            };
            return new Promise((resolve, reject) => {
                axios.get(checkUrl, config)
                    .then(({ data }) => {
                        if (REG.SIGNED.test(String(data))) {
                            resolve({ name, state: 'SIGNED' })
                            return
                        }
                        if (REG.ONCE_PATTERN.test(String(data))) {
                            return data.match(REG.ONCE_PATTERN)[1]
                        }
                        reject({ name, state: 'FAILED' })
                    })
                    .then(once => {
                        if (once) {
                            axios.get(`${checkUrl}/redeem?once=${once}`, config)
                                .then(({ data }) => {
                                    if (REG.SIGN_SUCCESS.test(String(data))) {
                                        resolve({ name, state: 'SUCCESS' })
                                    }
                                    reject({ name, state: 'FAILED' })
                                })
                                .catch(err => {
                                    reject({ name, state: 'FAILED' })
                                })
                        }
                    })
                    .catch(err => {
                        reject({ name, state: 'FAILED' })
                    })
            });
        }
    },
]

function run() {
    const actionList = signers.map(s => s.action(s.desc))
    Promise.allSettled(actionList)
        .then(results => {
            const success = results.filter(v => v.status === 'fulfilled' && v.value.state === 'SUCCESS')
            const signed = results.filter(v => v.status === 'fulfilled' && v.value.state === 'SIGNED')
            const failed = results.filter(v => v.status === 'rejected' && v.reason.state === 'FAILED')
            const bypass = results.filter(v => v.status === 'rejected' && v.reason.state === 'BYPASS')
            const noticeStr = `
            签到成功：${success.map(v => v.value.name).join('，')}
            重复签到：${signed.map(v => v.value.name).join('，')}
            签到失败：${failed.map(v => v.reason.name).join('，')}
            已跳过：${bypass.map(v => v.reason.name).join('，')}
            `
            // 推送消息
            serverChan(noticeStr)
        })
}

run()
