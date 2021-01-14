import axios from 'axios'
const SERVER_CHAN_SCKEY = process.env.SERVER_CHAN_SCKEY;

import v2ex from './scripts/v2ex'
import hifini from './scripts/hifini'

const actionList = [v2ex, hifini]

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

;(async () => {
    const results = await Promise.allSettled(actionList.map(action => action()))

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
})()
