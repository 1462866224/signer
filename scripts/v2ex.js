/**
 *  @Author  : s0urce <apao@douyu.tv>
 *  @Date    : 2021/1/14
 *  @Declare : v2ex
 *
 */
import axios from 'axios'
const V2EX_COOKIE = process.env.V2EX_COOKIE;

const name = 'V2EX'
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

export default () => {
    // 无cookie跳过
    if (!V2EX_COOKIE) {
        return Promise.reject({ name, state: 'BYPASS' })
    }


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
