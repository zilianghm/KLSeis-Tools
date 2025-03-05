import { useState } from 'react'
import './UserLogin.scss'
import { Message, Form, Input, Button, Cascader } from '@arco-design/web-react'
import { postLogin, postRegister } from '../../api/index'
import { setStroage } from '../../tools'
import { useContextConsumer } from '../../ContextProvider'
import { useTranslation } from 'react-i18next'
const FormItem = Form.Item

export const UserLogin = () => {
    const { t } = useTranslation()
    const { setModalType, setToken, departmentTree } = useContextConsumer()
    const [active, setActive] = useState('login')
    const [otherDeptName, setOtherDeptName] = useState(false)
    const [form] = Form.useForm()

    const handleLoginSubmit = v => {
        if (!v.username || !v.password) {
            Message.warning(t('pleaseInputUsernameAndPassword'))
            return
        }
        // 提交登录接口
        postLogin({
            username: v.username,
            password: v.password,
        })
            .then(res => {
                if (res?.data?.data?.code === 0) {
                    Message.success(t('loginSuccess'))
                    console.log('登录成功', res)
                    setStroage('token', res?.data?.data?.token)
                    setModalType(false)
                    setToken(res?.data?.data?.token)
                } else {
                    Message.error(t('loginError'))
                }
            })
            .catch(() => {
                Message.error(t('loginError'))
            })
    }

    const handleRegisterSubmit = v => {
        console.log('注册信息', v)
        if (!v.username || !v.password) {
            Message.warning(t('pleaseInputUsernameAndPassword'))
            return
        }
        if (!v.realname) {
            Message.warning(t('pleaseInputRealname'))
            return
        }
        if (!v.deptId) {
            Message.warning(t('pleaseSelectDepartment'))
            return
        }
        if (!v.station) {
            Message.warning(t('pleaseInputStation'))
            return
        }
        const lastDeptId = v.deptId[v.deptId.length - 1]
        postRegister({ ...v, deptId: lastDeptId })
            .then(res => {
                if (res?.data?.data?.code === 0) {
                    Message.success(t('registerSuccess'))
                    setModalType(false)
                } else {
                    Message.error(t('registerError'))
                }
            })
            .catch(() => {
                Message.error(t('registerError'))
            })
    }

    return (
        <div className='userLogin'>
            <div className='title'>
                <h2 onClick={() => setActive('login')} className={active === 'login' ? 'active-h2' : ''}>
                    {t('passwordLogin')}
                </h2>
                <h2 onClick={() => setActive('register')} className={active === 'register' ? 'active-h2' : ''}>
                    {t('register')}
                </h2>
            </div>
            {/* 登录 */}
            {active === 'login' ? (
                <Form
                    form={form}
                    className='userLogin-form'
                    wrapperCol={{ span: 24 }}
                    autoComplete='off'
                    onSubmit={v => handleLoginSubmit(v)}
                >
                    <FormItem field='username'>
                        <Input placeholder={t('pleaseInputUsername')} />
                    </FormItem>
                    <FormItem field='password'>
                        <Input.Password placeholder={t('pleaseInputPassword')} />
                    </FormItem>
                    <FormItem className='submit'>
                        <Button type='primary' htmlType='submit' long>
                            {t('login')}
                        </Button>
                    </FormItem>
                </Form>
            ) : (
                <></>
            )}
            {/* 注册 */}
            {active === 'register' ? (
                <Form
                    form={form}
                    className='userLogin-form'
                    wrapperCol={{ span: 24 }}
                    autoComplete='off'
                    onSubmit={v => handleRegisterSubmit(v)}
                >
                    <FormItem field='username'>
                        <Input placeholder={t('pleaseInputUsername')} />
                    </FormItem>
                    <FormItem field='password'>
                        <Input.Password placeholder={t('pleaseInputPassword')} />
                    </FormItem>
                    <FormItem field='realname'>
                        <Input placeholder={t('pleaseInputRealname')} />
                    </FormItem>
                    <FormItem field='email'>
                        <Input placeholder={t('pleaseInputEmail')} />
                    </FormItem>
                    <FormItem field='phoneNumber'>
                        <Input placeholder={t('pleaseInputPhoneNumber')} />
                    </FormItem>
                    <FormItem field='deptId'>
                        <Cascader
                            showSearch
                            placeholder={t('pleaseSelectDepartment')}
                            allowClear
                            options={departmentTree}
                            fieldNames={{
                                label: 'deptName',
                                value: 'deptId',
                                children: 'children',
                            }}
                            onChange={v => {
                                if (v[0] === 1) {
                                    setOtherDeptName(true)
                                } else {
                                    setOtherDeptName(false)
                                }
                            }}
                        />
                    </FormItem>
                    {otherDeptName ? (
                        <FormItem field='deptName'>
                            <Input placeholder={t('pleaseInputDepartmentName')} />
                        </FormItem>
                    ) : (
                        <></>
                    )}
                    <FormItem field='station'>
                        <Input placeholder={t('pleaseInputStation')} />
                    </FormItem>
                    <FormItem className='submit'>
                        <Button type='primary' htmlType='submit' long>
                            {t('register')}
                        </Button>
                    </FormItem>
                </Form>
            ) : (
                <></>
            )}
        </div>
    )
}
