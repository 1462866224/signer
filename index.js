const axios = require("axios");

const hifiniCookie = process.env.HIFINI_COOKIE;
const sckey = process.env.SERVER_CHAN_SCKEY;

function serverChan(msg) {
    const url = `https://sc.ftqq.com/${sckey}.send`
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
                    cookie: hifiniCookie,
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
    }
]

function runSign() {
    const actionList = signers.map(s => s.action(s.desc))
    Promise.allSettled(actionList)
        .then(results => {
            const success = results.filter(v => v.status === 'fulfilled' && v.value.state === 'SUCCESS')
            const signed = results.filter(v => v.status === 'fulfilled' && v.value.state === 'SIGNED')
            const failed = results.filter(v => v.status === 'rejected' && v.reason.state === 'FAILED')
            const noticeStr = `
            签到成功：${success.map(v => v.value.name).join('，')}
            重复签到：${signed.map(v => v.value.name).join('，')}
            签到失败：${failed.map(v => v.reason.name).join('，')}
            `
            // 推送消息
            serverChan(noticeStr)
        })
}

runSign()
