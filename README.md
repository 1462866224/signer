# 基于Github Actions的签到脚本
## 支持站点列表
- [x] hifini音乐磁场
- [x] V2EX
- [] 百度贴吧

## 操作步骤
- Step1 Fork仓库
- Step2 设置Secrets（server酱 & 各种cookie）
- Step3 启用Actions（自己改定时任务执行时间）

## 需要设置的Secrets

| name |  value | 备注 | 
|:----:|:----:|:----:|
| SERVER_CHAN_SCKEY | server酱的sckey | 必须 |
| HIFINI_COOKIE | hifini音乐磁场的cookie | 可选 |
| V2EX_COOKIE | V2EX的cookie | 可选 |
