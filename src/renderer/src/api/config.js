import axios from 'axios'
import { getStroage } from '../tools.js'

const apiUrl = window.api.getServerUrl() // 接口地址

console.log(6, apiUrl)

// 接口环境
export const requst = axios.create({
    baseURL: apiUrl, // 源地址
})

// 取消请求函数
export let cancelFn = () => {}

// 请求拦截器
requst.interceptors.request.use(config => {
    config.baseURL = apiUrl
    config.headers['Authorization'] = getStroage('token') // 携带 token
    return config
})

// 响应拦截器
requst.interceptors.response.use(
    res => {
        // 注册取消请求函数
        res.cancelToken = new axios.CancelToken(c => {
            cancelFn = c
        })
        // 2xx 范围内的状态码
        if (res.status === 200) {
            if (res.data.code) {
                // 自定义状态码
                switch (res.data.code) {
                    case 0:
                        return res
                    default:
                        return Promise.reject(res)
                }
            } else {
                return res
            }
        } else {
            return Promise.reject(res)
        }
    },
    error => {
        // 超出 2xx 范围状态码
        console.log(47, error)

        if (error.response.status === 401) {
            return Promise.reject({ data: { code: 401, text: '重复登陆' } })
        } else {
            return Promise.reject({ data: { code: 100 } })
        }
    }
)
