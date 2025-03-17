import { requst } from './config'

/* 提交评论 */
export const postCommentPublish = params => {
    // 创建 FormData 对象
    const formData = new FormData()

    // 添加文字内容到 FormData
    formData.append('content', params.content)
    formData.append('mac', params.mac)
    formData.append('appId', params.appId)
    console.log(12, params)

    // 添加图片数组到 FormData
    params.images.forEach((image, index) => {
        formData.append('files', image, `image-${index}.jpeg`) // 为每个 Blob 文件指定一个文件名
    })
    let url
    if (params.userInfo) {
        url = `/klseis/panel/v1/comment/publish`
    } else {
        url = `/klseis/panel/v1/anocomment/publish`
    }

    return requst({
        url,
        method: 'POST',
        headers: {
            'Content-Type': 'multipart/form-data',
        },
        data: formData,
    })
}

/* 评论分页列表 */
export const postfeedBackList = params => {
    const url = `/klseis/panel/v1/comment/findAppComments`
    return requst.post(url, {
        appId: params.appId,
        pageSize: params.pageSize || 10,
        pageNum: params.pageNum || 1,
    })
}

/* 登录 */
export const postLogin = params => {
    const url = `/klseis/base/v1/login`
    return requst.post(url, {
        username: params.username,
        password: params.password,
    })
}

// 获取用户信息
export const postUserInfo = token => {
    const url = `/klseis/panel/v1/comment/userInfo`
    return requst.post(
        url,
        {},
        {
            headers: {
                Authorization: token, // 将 token 放入 Authorization 头中
            },
        }
    )
}

// 部门树
export const getDepartmentTree = () => {
    const url = `/klseis/panel/v1/appUser/deptTree`
    return requst.get(url)
}

// 注册
export const postRegister = params => {
    const url = `/klseis/panel/v1/appUser/register`
    return requst.post(url, params)
}

// 获取更新资源数据
export const getResourceData = () => {
    const url = `/klseis/panel/v1/dataSync/downloadSql`
    return requst.get(url, {
        responseType: 'blob', // 设置响应类型为 blob 以处理文件下载
    })
}

// 获取更新资源数据
export const getListKlSeisPackage = () => {
    const url = `/klseis/panel/v1/package/listKlSeisPackage`
    return requst.get(url)
}
