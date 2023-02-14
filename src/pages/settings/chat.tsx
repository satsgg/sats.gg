import Chat from '~/components/Settings/Chat'
import type { NextPageWithLayout } from '~/pages/_app'
import getSettingsLayout from '~/components/Settings/Layout'

const ChatPage: NextPageWithLayout = () => <Chat />

ChatPage.getLayout = getSettingsLayout

export default ChatPage
