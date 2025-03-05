import './ModalContent.scss'
import { Modal } from '@arco-design/web-react'
import { useContextConsumer } from '../../ContextProvider'
import { Repl } from '@electric-sql/pglite-repl'
import { UserLogin } from '../../components/UserLogin/UserLogin'

export const ModalContent = ({ modalType, setModalType }) => {
    const { db } = useContextConsumer()

    return (
        <Modal
            className='modalContent'
            visible={Boolean(modalType)}
            onCancel={() => setModalType('')}
            autoFocus={false}
            focusLock={true}
            unmountOnExit={true}
            title={<></>}
            footer={null}
            closable={true}
            escToExit={true}
            alignCenter={false}
        >
            {modalType === 'repl' && <Repl pg={db} className='repl' />}
            {modalType === 'user-login' && <UserLogin />}
        </Modal>
    )
}
