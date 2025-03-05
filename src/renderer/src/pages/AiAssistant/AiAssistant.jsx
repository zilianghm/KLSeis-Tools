import './AiAssistant.scss'
import { Welcome } from '@ant-design/x'
import { useTranslation } from 'react-i18next'
import { Sender, Bubble, XStream } from '@ant-design/x'
import { useState, useRef, useEffect, useMemo } from 'react'
import fmtIcon from '../../assets/img/fmt.webp'
import { useContextConsumer } from '../../ContextProvider'
import { v4 as uuidv4 } from 'uuid'
import markdownit from 'markdown-it'
import 'github-markdown-css/github-markdown.css'
import { BulbOutlined, RocketOutlined, SmileOutlined } from '@ant-design/icons'
// import { useEffect } from 'react'
import { Popover } from '@arco-design/web-react'

// markdown 渲染
const md = markdownit({
    html: true,
    breaks: true,
})

// 角色配置
const rolesAsObject = {
    user: {
        placement: 'end',
    },
    ai: {
        placement: 'start',
        typing: {
            step: 5,
            interval: 20,
        },
        style: {
            maxWidth: 600,
        },
    },
}

// 拼接推理回答
const getReasoningContent = (a, b) => {
    if (b === 'null') {
        return a + ''
    } else if (b === 'undefined') {
        return a + ''
    } else if (!b) {
        return a + ''
    } else {
        return a + b
    }
}

// 设置大模型参数，以及请求参数
const getModelParamsOptions = (
    currentAiModelName,
    abortControllerRef,
    aiCurrentSessionList,
    value,
    setAiCurrentSessionList
) => {
    const aiModelList = [
        {
            name: 'deepseekR1',
            token: 'sk-jftgdjnlahvmhnxkdoludzfpmqtyayrkmrhlbozmksjbdzbk',
            modalName: 'Pro/deepseek-ai/DeepSeek-R1',
            userId: '',
            fetchUrl: 'https://api.siliconflow.cn/v1/chat/completions',
        },
        {
            name: 'deepseekV3',
            token: 'sk-jftgdjnlahvmhnxkdoludzfpmqtyayrkmrhlbozmksjbdzbk',
            modalName: 'Pro/deepseek-ai/DeepSeek-V3',
            userId: '',
            fetchUrl: 'https://api.siliconflow.cn/v1/chat/completions',
        },
        {
            name: 'tencentHybrid',
            token: 'ZZRurWb6AikHLqhgo1Ne2YqMy0URPTZd',
            modalName: 'szToVV4NFshA',
            userId: '100003177439',
            fetchUrl: 'https://open.hunyuan.tencent.com/openapi/v1/agent/chat/completions',
        },
    ]
    const currentAiModel = aiModelList.find(item => item.name === currentAiModelName)

    // 将新提问记录进内存，以及新增历史记录，自执行函数
    const newUserCurrentSessionList = (() => {
        const result = aiCurrentSessionList.length === 0 // 判断是否为新会话
        if (result) {
            return [
                {
                    role: 'id',
                    id: uuidv4(),
                    content: value, // 用作 ai 历史会话记录的标题
                },
                {
                    role: 'user',
                    content: value,
                },
            ]
        } else {
            return [
                ...aiCurrentSessionList,
                {
                    role: 'user',
                    content: value,
                },
            ]
        }
    })()
    console.log(109, newUserCurrentSessionList)

    setAiCurrentSessionList(newUserCurrentSessionList) // 更新记录
    if (currentAiModelName === 'deepseekR1' || currentAiModelName === 'deepseekV3') {
        return {
            options: {
                method: 'POST',
                headers: { Authorization: 'Bearer ' + currentAiModel.token, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: currentAiModel.modalName,
                    messages: newUserCurrentSessionList
                        .filter(item => item.role !== 'id')
                        .map(item => {
                            if (item.role === 'ai') {
                                return {
                                    role: 'assistant',
                                    content: item.content,
                                }
                            } else {
                                return {
                                    role: 'user',
                                    content: item.content,
                                }
                            }
                        }),
                    stream: true,
                    max_tokens: currentAiModelName === 'deepseekR1' ? 16380 : 4096,
                    stop: null,
                    temperature: 0.7,
                    top_p: 0.7,
                    top_k: 50,
                    frequency_penalty: 0.5,
                    n: 1,
                    response_format: { type: 'text' },
                }),
                signal: abortControllerRef.current.signal, // 将信号传递给请求
            },
            fetchUrl: currentAiModel.fetchUrl,
        }
    } else if (currentAiModelName === 'tencentHybrid') {
        // 如果是腾讯混元模型，历史会话记录的 content 字段是一个数组，以及不同的请求参数
        return {
            options: {
                method: 'POST',
                headers: {
                    Authorization: 'Bearer ' + currentAiModel.token,
                    'Content-Type': 'application/json',
                    'X-Source': 'openapi',
                },
                body: JSON.stringify({
                    assistant_id: currentAiModel.modalName,
                    user_id: currentAiModel.userId,
                    messages: newUserCurrentSessionList
                        .filter(item => item.role !== 'id')
                        .map(item => {
                            if (item.role === 'ai') {
                                return {
                                    role: 'assistant',
                                    content: [{ type: 'text', text: item.content }],
                                }
                            } else {
                                return {
                                    role: 'user',
                                    content: [{ type: 'text', text: item.content }],
                                }
                            }
                        }),
                    stream: true,
                }),
            },
            fetchUrl: currentAiModel.fetchUrl,
        }
    }
}

// 不同模型回答时 loading 状态
const getloading = item => {
    if (item.role === 'user') {
        return false
    }
    if (item.modelName === 'deepseekR1') {
        return !item.reasoning_content && !item.content ? true : false
    } else if (item.modelName === 'deepseekV3') {
        return !item.content ? true : false
    } else if (item.modelName === 'tencentHybrid') {
        return !item.content ? true : false
    } else {
        return false
    }
}

// 会话气泡渲染不同模型数据，单独处理
const getContentRender = (item, t) => {
    if (item.role === 'ai' && item.reasoning_content) {
        return (
            <div className='ai-assistant-content-message'>
                <div className='ai-assistant-content-message-reasoning'>
                    <div className='ai-assistant-content-message-reasoning-title'>
                        {t('aiAssistant.reasoningTitle')}
                    </div>
                    <div
                        className='ai-assistant-content-message-reasoning-content allow-copy'
                        dangerouslySetInnerHTML={{
                            __html: md.render(item.reasoning_content),
                        }}
                    ></div>
                </div>
                <div className='ai-assistant-content-message-normal'>
                    <div className='ai-assistant-content-message-normal-title allow-copy'>
                        {t('aiAssistant.normalTitle')}
                    </div>
                    <div
                        className='markdown-body allow-copy' // 添加 markdown-body 类
                        dangerouslySetInnerHTML={{
                            __html: md.render(item.content),
                        }}
                    ></div>
                </div>
            </div>
        )
    } else if (item.role === 'user') {
        return (
            <div
                className='markdown-body allow-copy' // 添加 markdown-body 类
                dangerouslySetInnerHTML={{
                    __html: md.render(item.content),
                }}
            ></div>
        )
    } else {
        return (
            <div className='ai-assistant-content-message'>
                <div className='ai-assistant-content-message-normal ai-message'>
                    <div className='ai-assistant-content-message-normal-title allow-copy'>
                        {t('aiAssistant.normalTitle')}
                    </div>
                    <div
                        className='markdown-body allow-copy' // 添加 markdown-body 类
                        dangerouslySetInnerHTML={{
                            __html: md.render(item.content),
                        }}
                    ></div>
                </div>
            </div>
        )
    }
}

// 智能助手组件
export const AiAssistant = () => {
    const { t } = useTranslation()
    const [value, setValue] = useState(t('aiAssistant.placeholder')) // 输入框内容
    const [loading, setLoading] = useState(false) // 流数据传输状态
    const abortControllerRef = useRef(null) // 添加 AbortController 的引用，用于手动停止流传输

    const { aiSessionList, setAiSessionList, db } = useContextConsumer() // 历史会话总列表
    const [aiCurrentSessionList, setAiCurrentSessionList] = useState([]) // 当前会话列表
    const [currentAiModelName, setCurrentAiModelName] = useState('deepseekR1') // 当前使用大模型的前端自定义名称，默认模型为 deepseekR1

    const chatContainerRef = useRef(null) // 添加会话列表的引用，用于手动实现滚动条最底下
    const [userScrolled, setUserScrolled] = useState(false) // 添加用户是否滚动的状态

    // 添加自动滚动效果，当手动操作了滚动条，停止自动
    useEffect(() => {
        if (chatContainerRef.current && !userScrolled) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
        }
    }, [aiCurrentSessionList, userScrolled])

    // 添加滚动事件处理
    useEffect(() => {
        const container = chatContainerRef.current
        const handleScroll = () => {
            if (container) {
                const isScrolledToBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 10
                setUserScrolled(!isScrolledToBottom)
            }
        }

        container?.addEventListener('scroll', handleScroll)
        return () => container?.removeEventListener('scroll', handleScroll)
    }, [])

    // 在组件顶部添加 useMemo 计算哈希值
    const sessionListHash = useMemo(() => {
        return JSON.stringify(aiCurrentSessionList)
    }, [aiCurrentSessionList])

    // 使用 sessionListHash 作为依赖，更新本地存储的 ai 历史会话记录
    useEffect(() => {
        if (aiCurrentSessionList.length === 0 || loading) return

        setAiSessionList(old => {
            // 获取当前会话的 ID
            const currentSessionId = aiCurrentSessionList[0]?.id
            // 如果没有 ID，直接返回原数组
            if (!currentSessionId) return old
            // 移除旧的相同 ID 的会话记录
            const filteredOld = old.filter(session => session[0]?.id !== currentSessionId)
            // 添加新的会话记录
            const result = [...filteredOld, aiCurrentSessionList]
            // 更新数据库
            db.exec(`UPDATE setting
                SET ai_session_list = '${JSON.stringify(result)}'
                WHERE id = 1;`)
            return result
        })
    }, [sessionListHash, loading])

    return (
        <div className='ai-assistant allow-copy' ref={chatContainerRef}>
            <div className='ai-assistant-container'>
                <Welcome
                    icon={<img src={fmtIcon} alt='' />}
                    title={t('aiAssistant.title')}
                    description={t('aiAssistant.description')}
                    className='ai-assistant-welcome allow-copy'
                />
                <div className='ai-assistant-content allow-copy'>
                    <Bubble.List
                        autoScroll={true}
                        roles={rolesAsObject}
                        items={aiCurrentSessionList
                            .filter(item => item.role !== 'id')
                            .map((item, index) => {
                                return {
                                    key: index,
                                    role: item.role,
                                    content: item.content,
                                    loading: getloading(item),
                                    messageRender: () => getContentRender(item, t),
                                }
                            })}
                    />
                </div>
            </div>
            <div className='ai-assistant-sender-container'>
                <div className='contrlSennderBtns'>
                    {/* 切换模型列表 */}
                    <Popover
                        content={
                            <div className='switchModelPopoverContent'>
                                <div
                                    className={`switchModelPopoverContent-item ${
                                        currentAiModelName === 'deepseekR1'
                                            ? 'switchModelPopoverContent-item-actived'
                                            : ''
                                    }
                                        `}
                                    onClick={() => setCurrentAiModelName('deepseekR1')}
                                >
                                    {t('aiAssistant.deepSeeR1kModal')}
                                </div>
                                <div
                                    className={`switchModelPopoverContent-item ${
                                        currentAiModelName === 'deepseekV3'
                                            ? 'switchModelPopoverContent-item-actived'
                                            : ''
                                    }
                                    `}
                                    onClick={() => setCurrentAiModelName('deepseekV3')}
                                >
                                    {t('aiAssistant.deepSeeV3kModal')}
                                </div>
                                <div
                                    className={`switchModelPopoverContent-item ${
                                        currentAiModelName === 'tencentHybrid'
                                            ? 'switchModelPopoverContent-item-actived'
                                            : ''
                                    }
                                    `}
                                    onClick={() => setCurrentAiModelName('tencentHybrid')}
                                >
                                    {t('aiAssistant.tencentHybridModal')}
                                </div>
                            </div>
                        }
                        className='switchModelPopover'
                        position='top'
                        trigger='click'
                    >
                        <div className='switchModel'>
                            <RocketOutlined
                                style={{
                                    color: '#722ED1',
                                }}
                            />
                            <span className='switchModel-text'>{t('aiAssistant.switchModel')}</span>
                        </div>
                    </Popover>

                    {/* 历史会话记录 */}
                    <Popover
                        content={
                            <div className='historySessionPopoverContent'>
                                {aiSessionList.map((arr, index) => (
                                    <div
                                        className='historySessionPopoverContent-item'
                                        key={index}
                                        onClick={() => setAiCurrentSessionList(arr)} // 回显 ai 历史会话
                                    >
                                        {arr[0].content}
                                    </div>
                                ))}
                            </div>
                        }
                        className='historySessionPopover'
                        position='top'
                        trigger='click'
                    >
                        <div className='historySession'>
                            <BulbOutlined
                                style={{
                                    color: '#FFD700',
                                }}
                            />
                            <span className='historySession-text'>{t('aiAssistant.historySession')}</span>
                        </div>
                    </Popover>

                    {/* 新会话，新聊天 */}
                    <div className='newSession' onClick={() => setAiCurrentSessionList([])}>
                        <SmileOutlined
                            style={{
                                color: '#52C41A',
                            }}
                        />
                        <span className='newSession-text'>{t('aiAssistant.newSession')}</span>
                    </div>
                </div>

                <Sender
                    className='ai-assistant-sender'
                    loading={loading}
                    value={value}
                    onChange={v => {
                        setValue(v)
                    }}
                    onFocus={e => {
                        if (e.target.value === t('aiAssistant.placeholder')) {
                            setValue('')
                        }
                    }}
                    onBlur={e => {
                        if (e.target.value === '') {
                            setValue(t('aiAssistant.placeholder'))
                        }
                    }}
                    onSubmit={async () => {
                        if (loading) return // 防抖
                        setLoading(true) // 提交后停止 loading
                        setValue('') // 提交后清空输入框
                        setUserScrolled(false) // 重置滚动条状态
                        abortControllerRef.current = new AbortController() // 初始化 AbortController, 实现中止请求
                        const currentAiSessionId = uuidv4() // 标识同一个提问的同一个 ai 回答，让流字符串，以拼接字符串进行更新渲染
                        let reasoning_content_str = '' // 推理初始文本
                        let content_str = '' // 回答初始文本

                        // 处理不同模型的请求字段
                        const { options, fetchUrl } = getModelParamsOptions(
                            currentAiModelName,
                            abortControllerRef,
                            aiCurrentSessionList,
                            value, // 当前输入的提问字符串
                            setAiCurrentSessionList
                        )

                        try {
                            const response = await fetch(fetchUrl, options)
                            for await (const chunk of XStream({
                                readableStream: response.body,
                            })) {
                                const data = JSON.parse(chunk?.data)
                                if (currentAiModelName === 'tencentHybrid') {
                                    // 腾讯混元模型 - 响应处理
                                    if (data) {
                                        if (data?.choices?.[0]?.delta?.role === 'assistant') {
                                            // 过滤掉 role 为 tool 的信息，腾讯混元独有字段，坑
                                            const content = data?.choices?.[0]?.delta?.content
                                            content_str = getReasoningContent(content_str, content) // 拼接正常回答
                                        }
                                    }
                                } else {
                                    // 硅基流动 deepseek 模型 - 响应处理
                                    if (data) {
                                        const reasoning_content = data?.choices?.[0]?.delta?.reasoning_content
                                        const content = data?.choices?.[0]?.delta?.content
                                        reasoning_content_str = getReasoningContent(
                                            reasoning_content_str,
                                            reasoning_content
                                        ) // 拼接推理回答
                                        content_str = getReasoningContent(content_str, content) // 拼接正常回答
                                    }
                                }
                                setAiCurrentSessionList(old => {
                                    const currentAiSession = old.find(item => item.id === currentAiSessionId) // 查找是否有历史会话
                                    if (currentAiSession) {
                                        // 如果存在，则更新内容
                                        return old.map(item =>
                                            item.id === currentAiSessionId
                                                ? {
                                                      ...item,
                                                      content: content_str,
                                                      reasoning_content: reasoning_content_str,
                                                      modelName: currentAiModelName,
                                                  }
                                                : item
                                        )
                                    } else {
                                        // 如果不存在，则新增一条记录
                                        return [
                                            ...old,
                                            {
                                                id: currentAiSessionId,
                                                role: 'ai',
                                                content: content_str,
                                                reasoning_content: reasoning_content_str,
                                                modelName: currentAiModelName,
                                            },
                                        ]
                                    }
                                })
                            }
                        } catch (error) {
                            console.error(error)
                        }
                        setLoading(false) // 流数据传输结束
                    }}
                    onCancel={() => {
                        // 手动停止 loading
                        setLoading(false)
                        // 停止模型传输数据
                        if (abortControllerRef.current) {
                            abortControllerRef.current.abort() // 取消请求
                        }
                        setLoading(false)
                    }}
                />
            </div>
        </div>
    )
}
